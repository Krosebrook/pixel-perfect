import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestSchema = z.object({
      userId: z.string().uuid(),
      testRuns: z.array(z.any()).max(100)
    });
    
    const body = await req.json();
    const { userId, testRuns } = requestSchema.parse(body);
    
    // Verify user from JWT matches userId
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user || user.id !== userId) {
      throw new Error('Unauthorized');
    }

    if (!userId || !testRuns || !Array.isArray(testRuns)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Analyze test runs and generate insights
    const analysisPrompt = `Analyze the following AI model test results and provide actionable insights for prompt optimization and cost reduction:

Test Run Data:
${JSON.stringify(testRuns, null, 2)}

Please provide insights in the following categories:
1. Cost Optimization: Ways to reduce spending while maintaining quality
2. Speed Optimization: How to get faster responses
3. Quality Improvement: Tips to improve output quality
4. Prompt Suggestions: Specific prompt improvements based on patterns

For each category, provide 1-2 specific, actionable recommendations based on the data.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an AI optimization expert. Analyze test run data and provide specific, actionable insights. Be concise and data-driven.'
          },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      throw new Error('Failed to generate insights');
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    // Parse insights into categories
    const categories = [
      { type: 'cost_optimization', pattern: /Cost Optimization:(.*?)(?=Speed Optimization:|Quality Improvement:|Prompt Suggestions:|$)/s },
      { type: 'speed_optimization', pattern: /Speed Optimization:(.*?)(?=Quality Improvement:|Prompt Suggestions:|$)/s },
      { type: 'quality_improvement', pattern: /Quality Improvement:(.*?)(?=Prompt Suggestions:|$)/s },
      { type: 'prompt_suggestion', pattern: /Prompt Suggestions:(.*?)$/s }
    ];

    const parsedInsights = categories.map(cat => {
      const match = insights.match(cat.pattern);
      return {
        type: cat.type,
        content: match ? match[1].trim() : ''
      };
    }).filter(insight => insight.content);

    return new Response(
      JSON.stringify({ insights: parsedInsights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-insights:', error);
    const errorMessage = error instanceof z.ZodError 
      ? 'Invalid input parameters'
      : error.message === 'Unauthorized' 
      ? 'Unauthorized' 
      : 'Failed to generate insights';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
