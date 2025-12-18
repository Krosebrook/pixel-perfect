import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, GitFork, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { PromptOutput } from '@/components/PromptOutput';
import { PromptVersionControl } from '@/components/PromptVersionControl';
import { ExportMenu, type ExportFormat } from '@/components/ExportMenu';
import {
  exportPromptAsJSON,
  exportPromptAsCSV,
  exportPromptAsMarkdown,
  exportVersionsAsJSON,
  exportVersionsAsCSV,
  exportVersionsAsMarkdown,
} from '@/lib/export-utils';
import type { GeneratedPrompt } from '@/types/prompt';

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          profiles:created_by(display_name, avatar_url),
          prompt_categories(name, icon)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: versions } = useQuery({
    queryKey: ['prompt-versions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', id)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      if (!prompt || !user) throw new Error('Missing data');
      
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          created_by: user.id,
          visibility: 'private',
          fork_of: prompt.id,
          goal_type: prompt.goal_type,
          problem: `${prompt.problem} (Fork)`,
          precision: prompt.precision,
          model_target: prompt.model_target,
          constraints: prompt.constraints,
          success_criteria: prompt.success_criteria,
          voice_style: prompt.voice_style,
          tech_env: prompt.tech_env,
          depth: prompt.depth,
          format: prompt.format,
          generated_prompt: prompt.generated_prompt,
          quality_scores: prompt.quality_scores,
          category_id: prompt.category_id,
          tags: prompt.tags,
          description: prompt.description,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Prompt forked successfully!');
      navigate(`/prompts/${data.id}`);
    },
    onError: () => {
      toast.error('Failed to fork prompt');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Prompt deleted');
      navigate('/prompts');
    },
    onError: () => {
      toast.error('Failed to delete prompt');
    },
  });

  const trackUsage = async () => {
    if (!id || !user) return;
    await supabase.from('prompt_usage').insert({
      prompt_id: id,
      user_id: user.id,
    });
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    await trackUsage();
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <p>Prompt not found</p>
        </div>
      </div>
    );
  }

  const isOwner = prompt.created_by === user?.id;
  const generatedPrompt: GeneratedPrompt = {
    id: prompt.id,
    spec: {
      goal_type: prompt.goal_type as any,
      problem: prompt.problem,
      precision: prompt.precision as any,
      model_target: prompt.model_target as any,
      constraints: prompt.constraints || undefined,
      success_criteria: prompt.success_criteria,
      voice_style: prompt.voice_style || undefined,
      tech_env: prompt.tech_env || undefined,
      depth: prompt.depth as any,
      format: prompt.format as any,
    },
    generated_prompt: prompt.generated_prompt,
    quality_scores: prompt.quality_scores as any,
    created_at: prompt.created_at,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => navigate('/prompts')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {prompt.prompt_categories && (
                        <Badge variant="outline">
                          <span className="mr-1">{prompt.prompt_categories.icon}</span>
                          {prompt.prompt_categories.name}
                        </Badge>
                      )}
                      {prompt.visibility === 'public' ? (
                        <Badge variant="secondary">
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{prompt.problem}</CardTitle>
                    {prompt.description && (
                      <CardDescription>{prompt.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => copyToClipboard(prompt.generated_prompt)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={() => forkMutation.mutate()}>
                    <GitFork className="h-4 w-4 mr-2" />
                    Fork
                  </Button>
                  <ExportMenu
                    onExport={(format: ExportFormat) => {
                      const exportData = {
                        id: prompt.id,
                        name: prompt.name,
                        problem: prompt.problem,
                        generated_prompt: prompt.generated_prompt,
                        goal_type: prompt.goal_type,
                        model_target: prompt.model_target,
                        format: prompt.format,
                        precision: prompt.precision,
                        visibility: prompt.visibility,
                        description: prompt.description,
                        constraints: prompt.constraints,
                        success_criteria: prompt.success_criteria,
                        created_at: prompt.created_at,
                        updated_at: prompt.updated_at,
                      };
                      if (format === 'json') exportPromptAsJSON(exportData);
                      else if (format === 'csv') exportPromptAsCSV(exportData);
                      else exportPromptAsMarkdown(exportData);
                    }}
                  />
                  {isOwner && (
                    <Button variant="destructive" onClick={() => deleteMutation.mutate()}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <PromptOutput prompt={generatedPrompt} />
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uses</span>
                  <span className="font-medium">{prompt.use_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forks</span>
                  <span className="font-medium">{prompt.fork_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </span>
                </div>
                {prompt.profiles && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Author</span>
                    <span className="font-medium">{prompt.profiles.display_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <PromptVersionControl
              promptId={prompt.id}
              currentPrompt={prompt.generated_prompt}
              currentSpec={generatedPrompt.spec}
              versions={(versions || []).map(v => ({
                ...v,
                spec: (v.spec as Record<string, unknown>) || {},
                quality_scores: (v.quality_scores as Record<string, unknown>) || null,
              }))}
              isOwner={isOwner}
              onRollback={() => queryClient.invalidateQueries({ queryKey: ['prompt', id] })}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
