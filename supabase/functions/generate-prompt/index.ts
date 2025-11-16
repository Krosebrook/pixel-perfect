import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, checkBudgetLimit } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const specSchema = z.object({
  goal_type: z.string().min(1),
  precision: z.enum(['B1', 'B2', 'A1', 'A2', 'S_TIER', 'AGENT']),
  model_target: z.enum(['gpt', 'claude', 'gemini', 'local']),
  format: z.string().min(1),
  problem: z.string().min(1).max(1000),
  success_criteria: z.string().optional(),
  constraints: z.string().optional(),
  voice_style: z.string().optional(),
  tech_env: z.string().optional(),
  depth: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
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

    // 2. Validate Input
    const body = await req.json();
    const validationResult = specSchema.safeParse(body.spec);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const spec = validationResult.data;

    // 3. Get Environment Mode
    const { data: profile } = await supabase
      .from('profiles')
      .select('environment_mode')
      .eq('id', user.id)
      .single();

    const environmentMode = (profile?.environment_mode || 'production') as 'sandbox' | 'production';

    // 4. Check Rate Limit
    const rateLimitCheck = await checkRateLimit(user.id, 'generate-prompt', environmentMode);
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

    // 5. Check Budget
    const estimatedCost = 0.01;
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

    // 6. Generate Prompt
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = buildSystemPrompt(spec);
    const userPrompt = buildUserPrompt(spec);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Prompt generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        generated_prompt: generatedPrompt,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-prompt function:', error);
    return new Response(
      JSON.stringify({ error: 'Request processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(spec: any): string {
  return `You are the Universal Meta Prompt Generator (UMPG), an expert system for creating production-grade prompts.

Your task is to generate a ${spec.precision} level prompt optimized for ${spec.model_target.toUpperCase()} models.

PRECISION LEVEL GUIDELINES:

B1 (Beginner):
- Plain English, simple tasks
- No jargon, direct instructions
- Single-step operations

B2 (Intermediate):
- Introduces structure
- Basic instruction hierarchy
- One or two sections

A1 (Advanced):
- Full template with metadata
- Clear roles and goals
- Multi-step outline
- Structured reasoning

A2 (Expert):
- Includes reasoning frameworks
- Domain-specific heuristics
- Strict output schemas
- Edge case handling

S-Tier (Veteran):
- Meta-instructions
- Unknown-unknown detection
- Steelman + adversarial checks
- Response audit logic

AGENT (Multi-Phase):
- Planning phase
- Multi-phase reasoning
- Tool calls specification
- Verification loops
- Final alignment check

MODEL-SPECIFIC FORMATTING:

GPT: Use JSON-first structure, deterministic formatting, curly-braced variables
Claude: Use XML tags, <analysis></analysis> and <final></final> sections, clause-based constraints
Gemini: Use segment-based blocks, "Short reasoning → final answer" style
Local: Lower complexity, strict structure, minimal overhead

OUTPUT FORMAT: ${spec.format.toUpperCase()}

Generate a prompt that:
1. Follows the precision level exactly
2. Uses model-specific formatting conventions
3. Includes all necessary context and constraints
4. Defines clear success criteria
5. Handles edge cases appropriately for the level`;
}

function buildUserPrompt(spec: any): string {
  let prompt = `Generate a ${spec.precision} level prompt for the following specification:

GOAL TYPE: ${spec.goal_type}
PROBLEM DEFINITION: ${spec.problem}
SUCCESS CRITERIA: ${spec.success_criteria}
OUTPUT FORMAT: ${spec.format}
DEPTH: ${spec.depth || "medium"}`;

  if (spec.constraints) {
    prompt += `\nCONSTRAINTS: ${spec.constraints}`;
  }

  if (spec.voice_style) {
    prompt += `\nVOICE/STYLE: ${spec.voice_style}`;
  }

  if (spec.tech_env) {
    prompt += `\nTECHNICAL ENVIRONMENT: ${spec.tech_env}`;
  }

  prompt += `\n\nGenerate the complete prompt now, following all ${spec.model_target.toUpperCase()} formatting conventions and ${spec.precision} level requirements.`;

  return prompt;
}
