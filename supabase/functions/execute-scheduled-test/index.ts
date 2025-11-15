import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scheduledTestId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch scheduled test
    const { data: scheduledTest, error: fetchError } = await supabase
      .from('scheduled_tests')
      .select('*')
      .eq('id', scheduledTestId)
      .single();

    if (fetchError || !scheduledTest) {
      throw new Error('Scheduled test not found');
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
    
    // Log failed execution
    const { scheduledTestId } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('scheduled_test_results')
      .insert({
        scheduled_test_id: scheduledTestId,
        status: 'failed',
        error_message: error.message,
        executed_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});