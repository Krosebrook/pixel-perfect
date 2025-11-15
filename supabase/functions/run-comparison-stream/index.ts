const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'lovable';
  model: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-5': { provider: 'openai', model: 'gpt-5-2025-08-07', costPer1kInput: 0.002, costPer1kOutput: 0.008 },
  'gpt-5-mini': { provider: 'openai', model: 'gpt-5-mini-2025-08-07', costPer1kInput: 0.00015, costPer1kOutput: 0.0006 },
  'gpt-5-nano': { provider: 'openai', model: 'gpt-5-nano-2025-08-07', costPer1kInput: 0.00005, costPer1kOutput: 0.0002 },
  'claude-sonnet-4-5': { provider: 'anthropic', model: 'claude-sonnet-4-5', costPer1kInput: 0.003, costPer1kOutput: 0.015 },
  'claude-opus-4-1': { provider: 'anthropic', model: 'claude-opus-4-1-20250805', costPer1kInput: 0.015, costPer1kOutput: 0.075 },
  'gemini-2.5-pro': { provider: 'lovable', model: 'google/gemini-2.5-pro', costPer1kInput: 0.001, costPer1kOutput: 0.005 },
  'gemini-2.5-flash': { provider: 'lovable', model: 'google/gemini-2.5-flash', costPer1kInput: 0.0001, costPer1kOutput: 0.0004 },
  'gemini-2.5-flash-lite': { provider: 'lovable', model: 'google/gemini-2.5-flash-lite', costPer1kInput: 0.00005, costPer1kOutput: 0.0002 },
};

function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

async function streamModelResponse(
  prompt: string,
  modelKey: string,
  modelConfig: ModelConfig,
  controller: ReadableStreamDefaultController
) {
  const startTime = Date.now();
  let output = '';
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    sendSSE(controller, { type: 'start', model: modelKey });

    let apiKey: string | undefined;
    let endpoint: string;
    let requestBody: any;
    let headers: any;

    switch (modelConfig.provider) {
      case 'openai':
        apiKey = Deno.env.get('OPENAI_API_KEY');
        endpoint = 'https://api.openai.com/v1/chat/completions';
        requestBody = {
          model: modelConfig.model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          max_completion_tokens: 1000,
        };
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        };
        break;

      case 'anthropic':
        apiKey = Deno.env.get('ANTHROPIC_API_KEY');
        endpoint = 'https://api.anthropic.com/v1/messages';
        requestBody = {
          model: modelConfig.model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        };
        headers = {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        };
        break;

      case 'lovable':
        apiKey = Deno.env.get('LOVABLE_API_KEY');
        endpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions';
        requestBody = {
          model: modelConfig.model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          max_tokens: 1000,
        };
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        };
        break;

      default:
        throw new Error(`Unknown provider: ${modelConfig.provider}`);
    }

    if (!apiKey) {
      throw new Error(`API key not configured for ${modelConfig.provider}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);

          if (modelConfig.provider === 'anthropic') {
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              output += parsed.delta.text;
              sendSSE(controller, {
                type: 'delta',
                model: modelKey,
                content: parsed.delta.text,
              });
            } else if (parsed.type === 'message_start') {
              inputTokens = parsed.message?.usage?.input_tokens || 0;
            } else if (parsed.type === 'message_delta') {
              outputTokens = parsed.usage?.output_tokens || 0;
            }
          } else {
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              output += content;
              sendSSE(controller, {
                type: 'delta',
                model: modelKey,
                content,
              });
            }
            if (parsed.usage) {
              inputTokens = parsed.usage.prompt_tokens || inputTokens;
              outputTokens = parsed.usage.completion_tokens || outputTokens;
            }
          }
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
      }
    }

    const latency = Date.now() - startTime;
    const cost = (inputTokens / 1000 * modelConfig.costPer1kInput) + 
                 (outputTokens / 1000 * modelConfig.costPer1kOutput);

    sendSSE(controller, {
      type: 'complete',
      model: modelKey,
      output,
      inputTokens,
      outputTokens,
      latency,
      cost,
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`Error streaming ${modelKey}:`, error);
    
    sendSSE(controller, {
      type: 'error',
      model: modelKey,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, models } = await req.json();

    if (!prompt || !models || !Array.isArray(models) || models.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invalidModels = models.filter((m: string) => !MODEL_CONFIGS[m]);
    if (invalidModels.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid models: ${invalidModels.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        await Promise.all(
          models.map((modelKey: string) =>
            streamModelResponse(prompt, modelKey, MODEL_CONFIGS[modelKey], controller)
          )
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in run-comparison-stream:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
