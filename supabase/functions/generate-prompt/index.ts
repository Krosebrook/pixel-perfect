import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spec } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Generating prompt for spec:", spec);

    // Build the system prompt based on the specification
    const systemPrompt = buildSystemPrompt(spec);
    const userPrompt = buildUserPrompt(spec);

    // Call Lovable AI to generate the prompt
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    console.log("Prompt generated successfully");

    return new Response(
      JSON.stringify({ 
        generated_prompt: generatedPrompt,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in generate-prompt function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
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
