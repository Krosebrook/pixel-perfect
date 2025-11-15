import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, checkBudgetLimit } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  models: z.array(z.string()).min(1).max(10)
});

interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'lovable';
  model: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models
  'gpt-5': { provider: 'openai', model: 'gpt-5-2025-08-07', costPer1kInput: 0.002, costPer1kOutput: 0.008 },
  'gpt-5-mini': { provider: 'openai', model: 'gpt-5-mini-2025-08-07', costPer1kInput: 0.00015, costPer1kOutput: 0.0006 },
  'gpt-5-nano': { provider: 'openai', model: 'gpt-5-nano-2025-08-07', costPer1kInput: 0.00005, costPer1kOutput: 0.0002 },
  
  // Anthropic Models
  'claude-sonnet-4-5': { provider: 'anthropic', model: 'claude-sonnet-4-5', costPer1kInput: 0.003, costPer1kOutput: 0.015 },
  'claude-opus-4-1': { provider: 'anthropic', model: 'claude-opus-4-1-20250805', costPer1kInput: 0.015, costPer1kOutput: 0.075 },
  
  // Lovable AI (Gemini)
  'gemini-2.5-pro': { provider: 'lovable', model: 'google/gemini-2.5-pro', costPer1kInput: 0.001, costPer1kOutput: 0.005 },
  'gemini-2.5-flash': { provider: 'lovable', model: 'google/gemini-2.5-flash', costPer1kInput: 0.0001, costPer1kOutput: 0.0004 },
  'gemini-2.5-flash-lite': { provider: 'lovable', model: 'google/gemini-2.5-flash-lite', costPer1kInput: 0.00005, costPer1kOutput: 0.0002 },
};

async function callOpenAI(prompt: string, modelConfig: ModelConfig): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  console.log(`Calling OpenAI model: ${modelConfig.model}`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error (${response.status}):`, errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    output: data.choices[0].message.content,
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
  };
}

async function callAnthropic(prompt: string, modelConfig: ModelConfig): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  console.log(`Calling Anthropic model: ${modelConfig.model}`);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Anthropic API error (${response.status}):`, errorText);
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    output: data.content[0].text,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
  };
}

async function callLovableAI(prompt: string, modelConfig: ModelConfig): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  console.log(`Calling Lovable AI model: ${modelConfig.model}`);
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Lovable AI API error (${response.status}):`, errorText);
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    output: data.choices[0].message.content,
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
  };
}

async function runModelComparison(prompt: string, modelKey: string, modelConfig: ModelConfig) {
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (modelConfig.provider) {
      case 'openai':
        result = await callOpenAI(prompt, modelConfig);
        break;
      case 'anthropic':
        result = await callAnthropic(prompt, modelConfig);
        break;
      case 'lovable':
        result = await callLovableAI(prompt, modelConfig);
        break;
      default:
        throw new Error(`Unknown provider: ${modelConfig.provider}`);
    }

    const latency = Date.now() - startTime;
    const cost = (result.inputTokens / 1000 * modelConfig.costPer1kInput) + 
                 (result.outputTokens / 1000 * modelConfig.costPer1kOutput);

    return {
      model: modelKey,
      output: result.output,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latency,
      cost,
      error: null,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`Error calling ${modelKey}:`, error);
    
    return {
      model: modelKey,
      output: null,
      inputTokens: 0,
      outputTokens: 0,
      latency,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT and get user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters', details: validationResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, models } = validationResult.data;

    // Get user's environment mode
    const { data: profile } = await supabase
      .from('profiles')
      .select('environment_mode')
      .eq('id', user.id)
      .single();

    const environmentMode = (profile?.environment_mode || 'production') as 'sandbox' | 'production';

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(user.id, 'run-comparison', environmentMode);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: rateLimitCheck.message,
          resetTime: rateLimitCheck.resetTime,
          remainingCalls: rateLimitCheck.remainingCalls
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Estimate cost (rough estimate: $0.01 per model)
    const estimatedCost = models.length * 0.01;

    // Check budget limit
    const budgetCheck = await checkBudgetLimit(user.id, environmentMode, estimatedCost);
    if (!budgetCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: budgetCheck.message,
          currentSpending: budgetCheck.currentSpending,
          limit: budgetCheck.limit
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Running comparison for ${models.length} models`);

    // Validate all models exist
    const invalidModels = models.filter((m: string) => !MODEL_CONFIGS[m]);
    if (invalidModels.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid models: ${invalidModels.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Run all models concurrently using Promise.allSettled
    const results = await Promise.allSettled(
      models.map((modelKey: string) => 
        runModelComparison(prompt, modelKey, MODEL_CONFIGS[modelKey])
      )
    );

    // Extract results
    const responses = results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        model: 'unknown',
        output: null,
        inputTokens: 0,
        outputTokens: 0,
        latency: 0,
        cost: 0,
        error: 'Promise rejected',
      }
    );

    const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
    const totalLatency = Math.max(...responses.map(r => r.latency));

    console.log(`Comparison complete. Total cost: $${totalCost.toFixed(6)}, Total latency: ${totalLatency}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        responses,
        totalCost,
        totalLatency,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in run-comparison function:', error);
    
    const errorMessage = error instanceof z.ZodError 
      ? 'Invalid input parameters'
      : error.message === 'Unauthorized'
      ? 'Unauthorized'
      : error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
