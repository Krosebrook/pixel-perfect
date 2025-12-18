import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's usage data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: testRuns, error: runsError } = await supabase
      .from("model_test_runs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (runsError) {
      console.error("Error fetching test runs:", runsError);
      return new Response(JSON.stringify({ error: "Failed to fetch usage data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Analyze usage patterns
    const modelUsage: Record<string, { count: number; totalCost: number; avgLatency: number; prompts: string[] }> = {};
    let totalCost = 0;
    let totalRuns = testRuns?.length || 0;

    for (const run of testRuns || []) {
      totalCost += run.total_cost || 0;
      
      for (const model of run.models || []) {
        if (!modelUsage[model]) {
          modelUsage[model] = { count: 0, totalCost: 0, avgLatency: 0, prompts: [] };
        }
        modelUsage[model].count++;
        modelUsage[model].totalCost += (run.total_cost || 0) / (run.models?.length || 1);
        modelUsage[model].avgLatency += (run.total_latency_ms || 0) / (run.models?.length || 1);
        if (modelUsage[model].prompts.length < 5) {
          modelUsage[model].prompts.push(run.prompt_text.substring(0, 100));
        }
      }
    }

    // Calculate averages
    for (const model of Object.keys(modelUsage)) {
      modelUsage[model].avgLatency = modelUsage[model].avgLatency / modelUsage[model].count;
    }

    // Prepare data summary for AI
    const usageSummary = {
      totalRuns,
      totalCost: totalCost.toFixed(4),
      modelBreakdown: Object.entries(modelUsage).map(([model, stats]) => ({
        model,
        usageCount: stats.count,
        totalCost: stats.totalCost.toFixed(4),
        avgLatency: stats.avgLatency.toFixed(0),
        samplePrompts: stats.prompts,
      })),
    };

    // Call Lovable AI for recommendations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI cost optimization expert. Analyze the user's AI model usage patterns and provide actionable recommendations to reduce costs while maintaining quality. Consider:
1. Which models are being overused for simple tasks that cheaper models could handle
2. Which prompts could benefit from model switching
3. Batching opportunities
4. Latency vs cost tradeoffs

Available models and their relative costs (cheapest to most expensive):
- gpt-4o-mini: Fastest, cheapest, good for simple tasks
- gemini-1.5-flash: Fast, affordable, good for most tasks
- claude-3-haiku: Fast, affordable, good for analysis
- gpt-4o: More expensive, better for complex reasoning
- claude-3-sonnet: More expensive, excellent for complex tasks
- gemini-1.5-pro: Premium, best for complex multi-step tasks
- claude-3-opus: Most expensive, best for hardest tasks

Respond with JSON in this exact format:
{
  "summary": "Brief 1-2 sentence summary of the analysis",
  "potentialSavings": "Estimated percentage or dollar savings possible",
  "recommendations": [
    {
      "title": "Short recommendation title",
      "description": "Detailed explanation",
      "impact": "high|medium|low",
      "category": "model-switch|batching|prompt-optimization|usage-pattern"
    }
  ],
  "modelSuggestions": [
    {
      "currentModel": "model being used",
      "suggestedModel": "cheaper alternative",
      "useCase": "when to use the cheaper model",
      "savingsPercent": number
    }
  ]
}`
          },
          {
            role: "user",
            content: `Here's my AI usage data from the last 30 days:\n\n${JSON.stringify(usageSummary, null, 2)}\n\nPlease analyze this data and provide cost optimization recommendations.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate recommendations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    // Parse the AI response
    let recommendations;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      recommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      recommendations = {
        summary: "Unable to parse recommendations",
        potentialSavings: "Unknown",
        recommendations: [],
        modelSuggestions: [],
      };
    }

    return new Response(JSON.stringify({
      usageSummary,
      recommendations,
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating recommendations:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
