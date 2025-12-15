import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

interface ChangelogRequest {
  deployment_id: string;
  current_sha: string;
  previous_sha?: string;
  commits: Commit[];
  repo_owner: string;
  repo_name: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: ChangelogRequest = await req.json();
    const { deployment_id, current_sha, previous_sha, commits, repo_owner, repo_name } = body;

    console.log(`Generating changelog for deployment ${deployment_id}`);
    console.log(`Commit range: ${previous_sha || 'initial'}..${current_sha}`);
    console.log(`Processing ${commits.length} commits`);

    // Find the previous successful deployment
    let previousDeploymentId = null;
    if (previous_sha) {
      const { data: prevDeployment } = await supabase
        .from('deployment_metrics')
        .select('id')
        .eq('commit_sha', previous_sha)
        .eq('status', 'success')
        .single();
      
      previousDeploymentId = prevDeployment?.id;
    }

    // Categorize commits
    const features: string[] = [];
    const fixes: string[] = [];
    const chores: string[] = [];
    const breaking: string[] = [];
    const other: string[] = [];

    for (const commit of commits) {
      const msg = commit.message.toLowerCase();
      const firstLine = commit.message.split('\n')[0];

      if (msg.startsWith('feat') || msg.includes('feature') || msg.includes('add')) {
        features.push(firstLine);
      } else if (msg.startsWith('fix') || msg.includes('bug') || msg.includes('patch')) {
        fixes.push(firstLine);
      } else if (msg.startsWith('chore') || msg.startsWith('docs') || msg.startsWith('style') || msg.startsWith('refactor') || msg.startsWith('test') || msg.startsWith('ci')) {
        chores.push(firstLine);
      } else if (msg.includes('breaking') || msg.includes('!:')) {
        breaking.push(firstLine);
      } else {
        other.push(firstLine);
      }
    }

    // Generate release notes
    let releaseNotes = `# Release Notes\n\n`;
    releaseNotes += `**Deployment:** ${current_sha.substring(0, 7)}\n`;
    releaseNotes += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
    releaseNotes += `**Commits:** ${commits.length}\n\n`;

    if (breaking.length > 0) {
      releaseNotes += `## ⚠️ Breaking Changes\n\n`;
      breaking.forEach(c => releaseNotes += `- ${c}\n`);
      releaseNotes += '\n';
    }

    if (features.length > 0) {
      releaseNotes += `## ✨ New Features\n\n`;
      features.forEach(c => releaseNotes += `- ${c}\n`);
      releaseNotes += '\n';
    }

    if (fixes.length > 0) {
      releaseNotes += `## 🐛 Bug Fixes\n\n`;
      fixes.forEach(c => releaseNotes += `- ${c}\n`);
      releaseNotes += '\n';
    }

    if (chores.length > 0) {
      releaseNotes += `## 🔧 Maintenance\n\n`;
      chores.forEach(c => releaseNotes += `- ${c}\n`);
      releaseNotes += '\n';
    }

    if (other.length > 0) {
      releaseNotes += `## 📝 Other Changes\n\n`;
      other.forEach(c => releaseNotes += `- ${c}\n`);
      releaseNotes += '\n';
    }

    // Store the changelog
    const { data: changelog, error } = await supabase
      .from('deployment_changelogs')
      .insert({
        deployment_id,
        previous_deployment_id: previousDeploymentId,
        commit_range: `${previous_sha || 'initial'}..${current_sha}`,
        commits,
        release_notes: releaseNotes,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing changelog:', error);
      throw error;
    }

    console.log(`Changelog generated successfully: ${changelog.id}`);

    return new Response(
      JSON.stringify({ success: true, changelog }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating changelog:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
