import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LockoutAlertRequest {
  email: string;
  lockoutMinutes: number;
  failedAttempts: number;
  ipAddress?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, lockoutMinutes, failedAttempts, ipAddress }: LockoutAlertRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending lockout alert to ${email}`);

    // Log the security event
    await supabase.rpc('log_security_event', {
      _email: email,
      _event_type: 'account_locked',
      _ip_address: ipAddress || 'unknown',
      _metadata: { failed_attempts: failedAttempts, lockout_minutes: lockoutMinutes }
    });

    const unlockTime = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    const formattedUnlockTime = unlockTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const emailResponse = await resend.emails.send({
      from: 'UPGE Security <onboarding@resend.dev>',
      to: [email],
      subject: '🔒 Account Security Alert - Temporary Lockout',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Security Alert</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc2626; margin-top: 0;">Your Account Has Been Temporarily Locked</h2>
            
            <p>We detected <strong>${failedAttempts} failed login attempts</strong> on your UPGE account. To protect your account from unauthorized access, we've temporarily locked it.</p>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #dc2626;"><strong>⏰ Your account will be unlocked at:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 18px; color: #1f2937;">${formattedUnlockTime}</p>
            </div>
            
            ${ipAddress && ipAddress !== 'unknown' ? `
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #c2410c;"><strong>📍 Login attempts from IP:</strong></p>
              <p style="margin: 5px 0 0 0; font-family: monospace; color: #1f2937;">${ipAddress}</p>
            </div>
            ` : ''}
            
            <h3 style="color: #1f2937;">What should you do?</h3>
            <ul style="color: #4b5563;">
              <li><strong>If this was you:</strong> Wait for the lockout period to end, then try logging in again with the correct password.</li>
              <li><strong>If this wasn't you:</strong> Someone may be trying to access your account. We recommend changing your password immediately once you regain access.</li>
            </ul>
            
            <h3 style="color: #1f2937;">Security Recommendations</h3>
            <ul style="color: #4b5563;">
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication (2FA)</li>
              <li>Never share your password with anyone</li>
              <li>Check your account activity regularly</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated security notification from UPGE. If you have any questions or concerns, please contact our support team.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Lockout alert email sent:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending lockout alert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
