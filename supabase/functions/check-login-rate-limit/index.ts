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
      // Check account-level lockout
      const { data: accountData, error: accountError } = await supabase.rpc('check_login_lockout', {
        _email: email.toLowerCase(),
        _max_attempts: 5,
        _lockout_minutes: 15
      });

      if (accountError) {
        console.error('Error checking account lockout:', accountError);
      }

      const accountResult = accountData?.[0] || { is_locked: false, failed_attempts: 0, lockout_remaining_seconds: 0 };

      // Check IP-level rate limit
      const { data: ipData, error: ipError } = await supabase.rpc('check_ip_rate_limit', {
        _ip_address: ipAddress,
        _max_attempts: 20,
        _window_minutes: 60,
        _block_minutes: 30
      });

      if (ipError) {
        console.error('Error checking IP rate limit:', ipError);
      }

      const ipResult = ipData?.[0] || { is_blocked: false, failed_attempts: 0, block_remaining_seconds: 0 };

      // If either is blocked, return blocked status
      const isLocked = accountResult.is_locked || ipResult.is_blocked;
      const lockoutSeconds = Math.max(
        accountResult.lockout_remaining_seconds || 0,
        ipResult.block_remaining_seconds || 0
      );

      console.log(`Login check for ${email} from ${ipAddress}: account_locked=${accountResult.is_locked}, ip_blocked=${ipResult.is_blocked}`);

      return new Response(
        JSON.stringify({
          isLocked,
          failedAttempts: accountResult.failed_attempts,
          ipFailedAttempts: ipResult.failed_attempts,
          lockoutRemainingSeconds: lockoutSeconds,
          maxAttempts: 5,
          ipBlocked: ipResult.is_blocked,
          accountLocked: accountResult.is_locked
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_failure') {
      // Record failed attempt for account
      const { error: recordError } = await supabase.rpc('record_login_attempt', {
        _email: email.toLowerCase(),
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _success: false
      });

      if (recordError) {
        console.error('Error recording failed attempt:', recordError);
      }

      // Record IP failed attempt
      const { data: ipData } = await supabase.rpc('record_ip_failed_attempt', {
        _ip_address: ipAddress,
        _max_attempts: 20,
        _block_minutes: 30
      });

      // Log security event
      await supabase.rpc('log_security_event', {
        _email: email.toLowerCase(),
        _event_type: 'login_failed',
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _metadata: {}
      });

      // Check new lockout status after recording
      const { data: lockoutData } = await supabase.rpc('check_login_lockout', {
        _email: email.toLowerCase(),
        _max_attempts: 5,
        _lockout_minutes: 15
      });

      const accountResult = lockoutData?.[0] || { is_locked: false, failed_attempts: 0, lockout_remaining_seconds: 0 };
      const ipResult = ipData?.[0] || { is_blocked: false, failed_attempts: 0, block_remaining_seconds: 0 };

      // Send lockout alert email if just locked
      if (accountResult.is_locked && accountResult.failed_attempts === 5) {
        try {
          await supabase.functions.invoke('send-lockout-alert', {
            body: {
              email: email.toLowerCase(),
              lockoutMinutes: 15,
              failedAttempts: accountResult.failed_attempts,
              ipAddress
            }
          });
          console.log(`Lockout alert sent to ${email}`);
        } catch (alertError) {
          console.error('Failed to send lockout alert:', alertError);
        }
      }

      const isLocked = accountResult.is_locked || ipResult.is_blocked;
      const lockoutSeconds = Math.max(
        accountResult.lockout_remaining_seconds || 0,
        ipResult.block_remaining_seconds || 0
      );

      console.log(`Failed login recorded for ${email} from ${ipAddress}: attempts=${accountResult.failed_attempts}, locked=${isLocked}`);

      return new Response(
        JSON.stringify({
          isLocked,
          failedAttempts: accountResult.failed_attempts,
          lockoutRemainingSeconds: lockoutSeconds,
          remainingAttempts: Math.max(0, 5 - accountResult.failed_attempts),
          ipBlocked: ipResult.is_blocked
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

      // Log security event
      await supabase.rpc('log_security_event', {
        _email: email.toLowerCase(),
        _event_type: 'login_success',
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _metadata: {}
      });

      console.log(`Successful login recorded for ${email} from ${ipAddress}`);

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
