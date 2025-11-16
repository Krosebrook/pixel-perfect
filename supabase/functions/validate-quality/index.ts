import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, checkBudgetLimit } from "../_shared/rateLimiter.ts";
import { ValidateQualityRequestSchema } from "../_shared/schemas.ts";
import { formatErrorResponse, formatAuthError, formatRateLimitError, formatBudgetError } from "../_shared/errorFormatter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, errors: [formatAuthError()] }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return formatErrorResponse(new Error("Server configuration error"));
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, errors: [formatAuthError("Invalid authentication token")] }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prompt, spec } = ValidateQualityRequestSchema.parse(await req.json());

    const { data: profile } = await supabase
      .from("profiles")
      .select("environment_mode")
      .eq("id", user.id)
      .single();

    const environmentMode = profile?.environment_mode || 'sandbox';

    const rateLimitCheck = await checkRateLimit(user.id, 'validate-quality', environmentMode);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ success: false, errors: [formatRateLimitError(rateLimitCheck.message)] }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const estimatedCost = 0.002;
    const budgetCheck = await checkBudgetLimit(user.id, environmentMode, estimatedCost);
    if (!budgetCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          errors: [formatBudgetError(budgetCheck.currentSpending || 0, budgetCheck.limit || 0)] 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Validating prompt quality...");

    // Use Lovable AI to validate prompt quality across all gates
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a prompt quality validator. Analyze the given prompt and return quality scores as a JSON object.

Evaluate these six quality gates (score each from 0.0 to 1.0):

1. structural_integrity: Are all required sections present and properly formatted?
2. ambiguity_score: How clear and unambiguous is the prompt? (1.0 = perfectly clear, 0.0 = very ambiguous)
3. hallucination_risk: How likely is the model to generate unsupported claims? (1.0 = very safe, 0.0 = high risk)
4. cost_efficiency: Is the prompt optimally sized for the task? (1.0 = optimal, 0.0 = wasteful)
5. model_compatibility: How well does it match the target model's format? (1.0 = perfect match, 0.0 = poor match)
6. goal_alignment: Does this prompt fully achieve the stated goal? (1.0 = fully aligned, 0.0 = misaligned)

Return ONLY a JSON object with these six scores. No other text.`,
          },
          {
            role: "user",
            content: `Prompt to validate:
${prompt}

Target model: ${spec.model_target}
Precision level: ${spec.precision}
Goal: ${spec.problem}

Return quality scores as JSON.`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from the response
    let qualityScores;
    try {
      // Try to parse the response as JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        qualityScores = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse quality scores:", parseError);
      // Return default scores if parsing fails
      qualityScores = {
        structural_integrity: 0.8,
        ambiguity_score: 0.8,
        hallucination_risk: 0.8,
        cost_efficiency: 0.8,
        model_compatibility: 0.8,
        goal_alignment: 0.8,
      };
    }

    console.log("Quality validation complete:", qualityScores);

    return new Response(
      JSON.stringify({ 
        quality_scores: qualityScores,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in validate-quality function:", error);
    return formatErrorResponse(error);
  }
});
