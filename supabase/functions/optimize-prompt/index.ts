const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, spec } = await req.json();

    if (!prompt || !spec) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: prompt and spec' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Optimizing prompt for:', spec.goal_type, spec.precision);

    // Call Lovable AI for prompt optimization
    const optimizationPrompt = `You are an expert prompt engineer. Your task is to optimize the following prompt to make it more effective, clear, and likely to produce better results.

ORIGINAL PROMPT:
${prompt}

SPECIFICATIONS:
- Goal Type: ${spec.goal_type}
- Precision Level: ${spec.precision}
- Model Target: ${spec.model_target}
- Success Criteria: ${spec.success_criteria}

OPTIMIZATION GUIDELINES:
1. Maintain the core intent and requirements
2. Improve clarity and specificity
3. Add relevant constraints or examples where helpful
4. Optimize structure for the target model (${spec.model_target})
5. Ensure alignment with ${spec.precision} precision level

Return ONLY the optimized prompt text, without any explanations or meta-commentary.`;

    const response = await fetch('https://pocnysyzkbluasjwgcqy.supabase.co/functions/v1/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: optimizationPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Optimization complete');

    const optimizedPrompt = data.choices?.[0]?.message?.content;

    if (!optimizedPrompt) {
      throw new Error('No optimized prompt returned from AI');
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimized_prompt: optimizedPrompt.trim(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in optimize-prompt function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
