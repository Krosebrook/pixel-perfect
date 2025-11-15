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
      templateId: z.string().uuid(),
      variables: z.record(z.any())
    });
    
    const body = await req.json();
    const { templateId, variables } = requestSchema.parse(body);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    });

    // Fetch template
    const { data: template, error: fetchError } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      throw new Error('Template not found');
    }

    // Replace variables in template
    let filledPrompt = template.template_content;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      filledPrompt = filledPrompt.replace(placeholder, String(value));
    }

    // Increment use count
    await supabase
      .from('prompt_templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', templateId);

    return new Response(
      JSON.stringify({ 
        filledPrompt,
        templateName: template.name 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in apply-template:', error);
    const errorMessage = error instanceof z.ZodError 
      ? 'Invalid input parameters'
      : 'Failed to apply template';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});