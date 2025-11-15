import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, checkBudgetLimit } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.any())
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
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { templateId, variables } = validationResult.data;

    // 3. Get Environment Mode
    const { data: profile } = await supabase
      .from('profiles')
      .select('environment_mode')
      .eq('id', user.id)
      .single();

    const environmentMode = (profile?.environment_mode || 'production') as 'sandbox' | 'production';

    // 4. Check Rate Limit
    const rateLimitCheck = await checkRateLimit(user.id, 'apply-template', environmentMode);
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

    // 5. Check Budget (minimal cost)
    const estimatedCost = 0.0001;
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

    // 6. Apply Template
    const { data: template, error: fetchError } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let filledPrompt = template.template_content;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      filledPrompt = filledPrompt.replace(placeholder, String(value));
    }

    await supabase
      .from('prompt_templates')
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq('id', templateId);

    return new Response(
      JSON.stringify({ 
        filledPrompt,
        templateName: template.name 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in apply-template:', error);
    return new Response(
      JSON.stringify({ error: 'Request processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});