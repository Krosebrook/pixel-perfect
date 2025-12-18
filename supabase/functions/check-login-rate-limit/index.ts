import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  email: string;
  action: 'check' | 'record_failure' | 'record_success';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, action }: RateLimitRequest = await req.json();

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'Email and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (action === 'check') {
      // Check if account is locked
      const { data, error } = await supabase.rpc('check_login_lockout', {
        _email: email.toLowerCase(),
        _max_attempts: 5,
        _lockout_minutes: 15
      });

      if (error) {
        console.error('Error checking lockout:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to check login status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data?.[0] || { is_locked: false, failed_attempts: 0, lockout_remaining_seconds: 0 };
      
      console.log(`Login check for ${email}: locked=${result.is_locked}, attempts=${result.failed_attempts}`);

      return new Response(
        JSON.stringify({
          isLocked: result.is_locked,
          failedAttempts: result.failed_attempts,
          lockoutRemainingSeconds: result.lockout_remaining_seconds,
          maxAttempts: 5
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_failure') {
      // Record failed attempt
      const { error } = await supabase.rpc('record_login_attempt', {
        _email: email.toLowerCase(),
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _success: false
      });

      if (error) {
        console.error('Error recording failed attempt:', error);
      }

      // Check new lockout status after recording
      const { data: lockoutData } = await supabase.rpc('check_login_lockout', {
        _email: email.toLowerCase(),
        _max_attempts: 5,
        _lockout_minutes: 15
      });

      const result = lockoutData?.[0] || { is_locked: false, failed_attempts: 0, lockout_remaining_seconds: 0 };

      console.log(`Failed login recorded for ${email}: attempts=${result.failed_attempts}, locked=${result.is_locked}`);

      return new Response(
        JSON.stringify({
          isLocked: result.is_locked,
          failedAttempts: result.failed_attempts,
          lockoutRemainingSeconds: result.lockout_remaining_seconds,
          remainingAttempts: Math.max(0, 5 - result.failed_attempts)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_success') {
      // Record successful login and clear failed attempts
      await supabase.rpc('record_login_attempt', {
        _email: email.toLowerCase(),
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _success: true
      });

      await supabase.rpc('clear_failed_attempts', {
        _email: email.toLowerCase()
      });

      console.log(`Successful login recorded for ${email}, failed attempts cleared`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rate limit check error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
