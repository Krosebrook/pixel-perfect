import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewDeviceAlertRequest {
  userId: string;
  email: string;
  deviceInfo: {
    deviceName: string;
    browser: string;
    os: string;
    ipAddress?: string;
    location?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, deviceInfo }: NewDeviceAlertRequest = await req.json();

    console.log(`Sending new device alert to ${email} for user ${userId}`);

    const signInTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const emailResponse = await resend.emails.send({
      from: "Security Alert <onboarding@resend.dev>",
      to: [email],
      subject: "New Sign-in from Unrecognized Device",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #fef2f2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px;">🔐</span>
                </div>
              </div>
              
              <h1 style="color: #18181b; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 20px 0;">
                New Sign-in Detected
              </h1>
              
              <p style="color: #71717a; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 30px 0;">
                We noticed a sign-in to your account from a new device or location. If this was you, no action is needed.
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h2 style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Sign-in Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Device:</td>
                    <td style="color: #18181b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${deviceInfo.deviceName || 'Unknown Device'}</td>
                  </tr>
                  <tr>
                    <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Browser:</td>
                    <td style="color: #18181b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${deviceInfo.browser || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Operating System:</td>
                    <td style="color: #18181b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${deviceInfo.os || 'Unknown'}</td>
                  </tr>
                  ${deviceInfo.location ? `
                  <tr>
                    <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Location:</td>
                    <td style="color: #18181b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${deviceInfo.location}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Time:</td>
                    <td style="color: #18181b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${signInTime}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="color: #dc2626; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>Didn't sign in?</strong><br>
                  If you didn't make this sign-in, please change your password immediately and review your account security settings.
                </p>
              </div>
              
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                This is an automated security notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-new-device-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
