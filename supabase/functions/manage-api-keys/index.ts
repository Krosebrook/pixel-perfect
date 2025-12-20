import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1).max(10),
  environmentMode: z.enum(['sandbox', 'production']),
  expiresInDays: z.number().min(1).max(365).optional(),
});

// Rate limit check function
async function checkRateLimit(
  supabase: any,
  userId: string,
  endpointName: string,
  environmentMode: string
): Promise<{ allowed: boolean; message: string; remaining?: number; resetInSeconds?: number }> {
  try {
    // Get rate limit config
    const { data: config } = await supabase.rpc('get_rate_limit_config', {
      _environment_mode: environmentMode
    });

    const endpointConfig = config?.find((c: any) => c.endpoint_name === endpointName);
    if (!endpointConfig) {
      return { allowed: true, message: 'No rate limit configured' };
    }

    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

    // Get current usage for this minute
    const { data: usage } = await supabase
      .from('api_rate_limits')
      .select('calls_count')
      .eq('user_id', userId)
      .eq('endpoint_name', endpointName)
      .eq('environment_mode', environmentMode)
      .gte('window_start', windowStart.toISOString())
      .single();

    const currentCalls = usage?.calls_count || 0;

    if (currentCalls >= endpointConfig.max_calls_per_minute) {
      return {
        allowed: false,
        message: `Rate limit exceeded. Maximum ${endpointConfig.max_calls_per_minute} calls per minute.`,
        remaining: 0,
        resetInSeconds: 60 - now.getSeconds()
      };
    }

    // Increment rate limit
    await supabase.rpc('increment_rate_limit', {
      _user_id: userId,
      _endpoint_name: endpointName,
      _window_start: windowStart.toISOString(),
      _environment_mode: environmentMode
    });

    return {
      allowed: true,
      message: 'OK',
      remaining: endpointConfig.max_calls_per_minute - currentCalls - 1
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request if rate limit check fails
    return { allowed: true, message: 'Rate limit check failed, allowing request' };
  }
}

async function generateApiKey(): Promise<{ key: string; hash: string; prefix: string }> {
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  const key = btoa(String.fromCharCode(...keyBytes));
  
  const hashBytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(key)
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(hashBytes)));
  const prefix = `upge_${key.substring(0, 8)}`;
  
  return { key: `upge_${key}`, hash, prefix };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's environment mode
    const { data: profile } = await supabase
      .from('profiles')
      .select('environment_mode')
      .eq('id', user.id)
      .single();

    const environmentMode = profile?.environment_mode || 'sandbox';

    // Check rate limit
    const rateLimitResult = await checkRateLimit(supabase, user.id, 'manage-api-keys', environmentMode);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for user ${user.id} on manage-api-keys`);
      return new Response(
        JSON.stringify({
          error: rateLimitResult.message,
          retryAfterSeconds: rateLimitResult.resetInSeconds
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.resetInSeconds || 60)
          }
        }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const validation = createKeySchema.safeParse(body);
      if (!validation.success) {
        return new Response(
          JSON.stringify({ error: 'Invalid input', details: validation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { name, scopes, environmentMode, expiresInDays } = validation.data;
      const { key, hash, prefix } = await generateApiKey();
      
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name,
          key_prefix: prefix,
          key_hash: hash,
          scopes,
          environment_mode: environmentMode,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          apiKey: key,
          keyId: data.id,
          prefix,
          message: 'Save this key securely - you won\'t see it again!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, environment_mode, is_active, last_used_at, expires_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, keys: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'revoke') {
      const { keyId } = body;
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'API key revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      const { keyId, isActive, scopes } = body;
      const updateData: any = {};
      if (typeof isActive === 'boolean') updateData.is_active = isActive;
      if (scopes) updateData.scopes = scopes;

      const { error } = await supabase
        .from('api_keys')
        .update(updateData)
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'API key updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in manage-api-keys:', error);
    return new Response(
      JSON.stringify({ error: 'Request failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
