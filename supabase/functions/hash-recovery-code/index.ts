import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Hash a string using SHA-256 with a salt
 */
async function hashWithSalt(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random salt
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Timing-safe comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, codes, code: recoveryCode } = await req.json();

    switch (action) {
      case 'generate': {
        // Generate and hash recovery codes
        if (!codes || !Array.isArray(codes)) {
          return new Response(
            JSON.stringify({ error: 'Codes array required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete old recovery codes
        await supabase
          .from('mfa_recovery_codes')
          .delete()
          .eq('user_id', user.id);

        // Hash and store new codes with salt
        const codeRecords = await Promise.all(codes.map(async (code: string) => {
          const normalizedCode = code.replace(/-/g, '').toUpperCase();
          const salt = generateSalt();
          const hash = await hashWithSalt(normalizedCode, salt);
          return {
            user_id: user.id,
            code_hash: `${salt}:${hash}` // Store salt:hash format
          };
        }));

        const { error: insertError } = await supabase
          .from('mfa_recovery_codes')
          .insert(codeRecords);

        if (insertError) {
          console.error('Error storing recovery codes:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to store recovery codes' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Generated ${codes.length} recovery codes for user ${user.id}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        // Verify a recovery code
        if (!recoveryCode) {
          return new Response(
            JSON.stringify({ error: 'Recovery code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const normalizedCode = recoveryCode.replace(/[-\s]/g, '').toUpperCase();

        // Get unused recovery codes
        const { data: storedCodes, error: fetchError } = await supabase
          .from('mfa_recovery_codes')
          .select('*')
          .eq('user_id', user.id)
          .is('used_at', null);

        if (fetchError || !storedCodes || storedCodes.length === 0) {
          return new Response(
            JSON.stringify({ valid: false, error: 'No recovery codes available' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check each stored code
        let matchingCode = null;
        for (const stored of storedCodes) {
          const [salt, hash] = stored.code_hash.split(':');
          if (salt && hash) {
            const computedHash = await hashWithSalt(normalizedCode, salt);
            if (timingSafeEqual(computedHash, hash)) {
              matchingCode = stored;
              break;
            }
          } else {
            // Legacy plaintext comparison (for migration)
            if (stored.code_hash === normalizedCode) {
              matchingCode = stored;
              break;
            }
          }
        }

        if (!matchingCode) {
          console.log(`Invalid recovery code attempt for user ${user.id}`);
          return new Response(
            JSON.stringify({ valid: false, error: 'Invalid recovery code' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Mark as used
        await supabase
          .from('mfa_recovery_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', matchingCode.id);

        console.log(`Recovery code used for user ${user.id}`);
        return new Response(
          JSON.stringify({ valid: true, codeId: matchingCode.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
