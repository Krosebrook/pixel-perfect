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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // SECURITY: Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header for execute-scheduled-test');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid auth token for execute-scheduled-test:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const requestSchema = z.object({
      scheduledTestId: z.string().uuid()
    });
    
    const body = await req.json();
    const { scheduledTestId } = requestSchema.parse(body);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch scheduled test
    const { data: scheduledTest, error: fetchError } = await supabase
      .from('scheduled_tests')
      .select('*')
      .eq('id', scheduledTestId)
      .single();

    if (fetchError || !scheduledTest) {
      throw new Error('Scheduled test not found');
    }
    
    // SECURITY: Verify the user owns this scheduled test
    if (scheduledTest.user_id !== user.id) {
      console.error(`User ${user.id} attempted to execute scheduled test ${scheduledTestId} owned by ${scheduledTest.user_id}`);
      
      // Log unauthorized attempt
      await supabase.from('security_audit_log').insert({
        event_type: 'scheduled_test_unauthorized_access',
        user_id: user.id,
        email: user.email,
        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        metadata: { 
          attempted_test_id: scheduledTestId,
          test_owner_id: scheduledTest.user_id 
        },
      });
      
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get prompt text
    let promptText = scheduledTest.prompt_text;
    if (scheduledTest.prompt_id) {
      const { data: prompt } = await supabase
        .from('prompts')
        .select('generated_prompt')
        .eq('id', scheduledTest.prompt_id)
        .single();
      
      if (prompt) {
        promptText = prompt.generated_prompt;
      }
    }

    // Run comparison by invoking run-comparison function
    const { data: comparisonResult, error: comparisonError } = await supabase.functions.invoke('run-comparison', {
      body: {
        prompt: promptText,
        models: scheduledTest.models,
        userId: scheduledTest.user_id
      }
    });

    if (comparisonError) {
      throw comparisonError;
    }

    // Save result
    const { error: resultError } = await supabase
      .from('scheduled_test_results')
      .insert({
        scheduled_test_id: scheduledTestId,
        test_run_id: comparisonResult.testRunId,
        status: 'success',
        executed_at: new Date().toISOString()
      });

    if (resultError) {
      console.error('Error saving result:', resultError);
    }

    // Calculate next run time
    const now = new Date();
    let nextRun = new Date(now);
    
    switch (scheduledTest.schedule_type) {
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    // Update scheduled test
    await supabase
      .from('scheduled_tests')
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun.toISOString()
      })
      .eq('id', scheduledTestId);

    return new Response(
      JSON.stringify({ 
        success: true,
        testRunId: comparisonResult.testRunId,
        nextRunAt: nextRun.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in execute-scheduled-test:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to execute scheduled test' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});