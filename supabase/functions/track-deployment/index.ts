import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-deployment-secret',
};

interface DeploymentMetric {
  deployment_type: 'production' | 'preview';
  commit_sha: string;
  workflow_run_id: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  status: 'pending' | 'success' | 'failed' | 'rolled_back';
  health_check_status?: 'healthy' | 'unhealthy' | 'skipped';
  deployment_url?: string;
  error_message?: string;
}

interface DeploymentIncident {
  deployment_id: string;
  incident_type: 'health_check_failure' | 'deployment_failure' | 'rollback_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  failed_checks?: string[];
  github_issue_number?: number;
  github_issue_url?: string;
}

/**
 * Validate deployment data schema
 */
function validateDeploymentMetric(data: unknown): data is DeploymentMetric {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  
  const validTypes = ['production', 'preview'];
  const validStatuses = ['pending', 'success', 'failed', 'rolled_back'];
  
  return (
    typeof d.deployment_type === 'string' && validTypes.includes(d.deployment_type) &&
    typeof d.commit_sha === 'string' && d.commit_sha.length >= 7 && d.commit_sha.length <= 40 &&
    typeof d.workflow_run_id === 'string' && d.workflow_run_id.length > 0 &&
    typeof d.started_at === 'string' &&
    typeof d.status === 'string' && validStatuses.includes(d.status)
  );
}

/**
 * Validate incident data schema
 */
function validateIncident(data: unknown): data is DeploymentIncident {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  
  const validTypes = ['health_check_failure', 'deployment_failure', 'rollback_failure'];
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  
  return (
    typeof d.deployment_id === 'string' && d.deployment_id.length > 0 &&
    typeof d.incident_type === 'string' && validTypes.includes(d.incident_type) &&
    typeof d.severity === 'string' && validSeverities.includes(d.severity)
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Validate authentication
    const deploymentSecret = Deno.env.get('DEPLOYMENT_SECRET');
    const providedSecret = req.headers.get('x-deployment-secret');
    const authHeader = req.headers.get('Authorization');
    
    // Allow either deployment secret (for CI/CD) or valid JWT (for admin users)
    let isAuthorized = false;
    
    if (deploymentSecret && providedSecret) {
      // Timing-safe comparison
      if (deploymentSecret.length === providedSecret.length) {
        let result = 0;
        for (let i = 0; i < deploymentSecret.length; i++) {
          result |= deploymentSecret.charCodeAt(i) ^ providedSecret.charCodeAt(i);
        }
        isAuthorized = result === 0;
      }
    }
    
    // If no deployment secret match, check for admin JWT
    if (!isAuthorized && authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
      
      if (!error && user) {
        // Check if user is admin
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: roleData } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        isAuthorized = !!roleData;
      }
    }
    
    if (!isAuthorized) {
      console.warn('Unauthorized deployment tracking attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, data } = body;
    
    // Validate action
    const validActions = ['track_deployment', 'update_deployment', 'track_incident', 'resolve_incident'];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing deployment action: ${action}`);

    switch (action) {
      case 'track_deployment': {
        if (!validateDeploymentMetric(data)) {
          return new Response(
            JSON.stringify({ error: 'Invalid deployment data schema' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: deployment, error } = await supabase
          .from('deployment_metrics')
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        console.log(`Tracked deployment: ${deployment.id}`);
        return new Response(
          JSON.stringify({ success: true, deployment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_deployment': {
        const { id, ...updates } = data;
        
        if (!id || typeof id !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Deployment ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Sanitize updates - only allow specific fields
        const allowedFields = ['completed_at', 'duration_seconds', 'status', 'health_check_status', 'deployment_url', 'error_message'];
        const sanitizedUpdates: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (key in updates) {
            sanitizedUpdates[key] = updates[key];
          }
        }
        
        const { data: deployment, error } = await supabase
          .from('deployment_metrics')
          .update(sanitizedUpdates)
          .eq('workflow_run_id', id)
          .select()
          .maybeSingle();

        if (error) throw error;

        console.log(`Updated deployment: ${id}`);
        return new Response(
          JSON.stringify({ success: true, deployment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'track_incident': {
        if (!validateIncident(data)) {
          return new Response(
            JSON.stringify({ error: 'Invalid incident data schema' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: createdIncident, error } = await supabase
          .from('deployment_incidents')
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        console.log(`Tracked incident: ${createdIncident.id}`);
        return new Response(
          JSON.stringify({ success: true, incident: createdIncident }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'resolve_incident': {
        const { id, resolution_notes } = data;
        
        if (!id || typeof id !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Incident ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const sanitizedNotes = typeof resolution_notes === 'string' 
          ? resolution_notes.slice(0, 5000) // Limit length
          : null;
        
        const { data: incident, error } = await supabase
          .from('deployment_incidents')
          .update({
            resolved_at: new Date().toISOString(),
            resolution_notes: sanitizedNotes,
          })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) throw error;

        console.log(`Resolved incident: ${id}`);
        return new Response(
          JSON.stringify({ success: true, incident }),
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
