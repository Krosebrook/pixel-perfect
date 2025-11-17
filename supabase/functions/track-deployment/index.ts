import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();

    switch (action) {
      case 'track_deployment': {
        const metric = data as DeploymentMetric;
        
        const { data: deployment, error } = await supabase
          .from('deployment_metrics')
          .insert(metric)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, deployment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_deployment': {
        const { id, ...updates } = data;
        
        const { data: deployment, error } = await supabase
          .from('deployment_metrics')
          .update(updates)
          .eq('workflow_run_id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, deployment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'track_incident': {
        const incident = data as DeploymentIncident;
        
        const { data: createdIncident, error } = await supabase
          .from('deployment_incidents')
          .insert(incident)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, incident: createdIncident }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'resolve_incident': {
        const { id, resolution_notes } = data;
        
        const { data: incident, error } = await supabase
          .from('deployment_incidents')
          .update({
            resolved_at: new Date().toISOString(),
            resolution_notes,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

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
