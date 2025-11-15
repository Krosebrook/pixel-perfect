const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, testRuns } = await req.json();

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
      throw new Error(`AI gateway error: ${response.status}`);
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

  } catch (error) {
    console.error('Error in generate-insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
