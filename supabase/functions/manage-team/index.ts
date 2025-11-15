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
    const requestSchema = z.object({
      action: z.enum(['add_member', 'remove_member', 'update_role', 'share_resource', 'unshare_resource']),
      teamId: z.string().uuid(),
      userId: z.string().uuid().optional(),
      role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
      resourceType: z.enum(['prompt', 'test_run', 'template', 'favorite']).optional(),
      resourceId: z.string().uuid().optional(),
      accessLevel: z.enum(['view', 'edit']).optional()
    });
    
    const body = await req.json();
    const validated = requestSchema.parse(body);
    const { action, teamId, userId, role, resourceType, resourceId, accessLevel } = validated;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    switch (action) {
      case 'add_member':
        // Check if requester is owner or admin
        const { data: membership } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
          throw new Error('Insufficient permissions');
        }

        // Add member
        const { error: addError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: userId,
            role: role || 'member'
          });

        if (addError) throw addError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'remove_member':
        const { data: requesterRole } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();

        if (!requesterRole || !['owner', 'admin'].includes(requesterRole.role)) {
          throw new Error('Insufficient permissions');
        }

        const { error: removeError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId)
          .eq('user_id', userId);

        if (removeError) throw removeError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'update_role':
        const { data: updaterRole } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();

        if (!updaterRole || !['owner', 'admin'].includes(updaterRole.role)) {
          throw new Error('Insufficient permissions');
        }

        const { error: updateError } = await supabase
          .from('team_members')
          .update({ role })
          .eq('team_id', teamId)
          .eq('user_id', userId);

        if (updateError) throw updateError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'share_resource':
        // Verify team membership
        const { data: isMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();

        if (!isMember) {
          throw new Error('Must be a team member to share resources');
        }

        const { error: shareError } = await supabase
          .from('team_shared_resources')
          .insert({
            team_id: teamId,
            resource_type: resourceType,
            resource_id: resourceId,
            shared_by: user.id,
            access_level: accessLevel || 'view'
          });

        if (shareError) throw shareError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'unshare_resource':
        const { error: unshareError } = await supabase
          .from('team_shared_resources')
          .delete()
          .eq('team_id', teamId)
          .eq('resource_type', resourceType)
          .eq('resource_id', resourceId)
          .eq('shared_by', user.id);

        if (unshareError) throw unshareError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in manage-team:', error);
    const errorMessage = error instanceof z.ZodError 
      ? 'Invalid input parameters'
      : error.message === 'Unauthorized'
      ? 'Unauthorized'
      : 'Failed to manage team';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});