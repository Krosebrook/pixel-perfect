import { useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, GitFork, Trash2, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PromptOutput } from '@/components/PromptOutput';
import { PromptVersionControl } from '@/components/PromptVersionControl';
import { ExportMenu, type ExportFormat } from '@/components/ExportMenu';
import {
  exportPromptAsJSON,
  exportPromptAsCSV,
  exportPromptAsMarkdown,
} from '@/lib/export-utils';
import { usePromptDetail, useForkPrompt, useDeletePrompt } from '@/hooks/usePrompts';
import { useClipboard } from '@/hooks/useClipboard';
import type { GeneratedPrompt } from '@/types/prompt';

// ============================================================================
// Types
// ============================================================================

interface StatsCardProps {
  useCount: number;
  forkCount: number;
  createdAt: string;
  authorName?: string | null;
}

// ============================================================================
// Memoized Sub-Components
// ============================================================================

const StatsCard = memo(function StatsCard({ useCount, forkCount, createdAt, authorName }: StatsCardProps) {
  return (
    <Card role="region" aria-labelledby="stats-title">
      <CardHeader>
        <CardTitle id="stats-title" className="text-sm">Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm" role="list" aria-label="Prompt statistics">
        <div className="flex justify-between" role="listitem">
          <span className="text-muted-foreground">Uses</span>
          <span className="font-medium">{useCount}</span>
        </div>
        <div className="flex justify-between" role="listitem">
          <span className="text-muted-foreground">Forks</span>
          <span className="font-medium">{forkCount}</span>
        </div>
        <div className="flex justify-between" role="listitem">
          <span className="text-muted-foreground">Created</span>
          <span className="font-medium">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
        {authorName && (
          <div className="flex justify-between" role="listitem">
            <span className="text-muted-foreground">Author</span>
            <span className="font-medium">{authorName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const PromptHeader = memo(function PromptHeader({
  categoryIcon,
  categoryName,
  visibility,
  problem,
  description,
}: {
  categoryIcon?: string | null;
  categoryName?: string | null;
  visibility: string | null;
  problem: string;
  description?: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap" role="list" aria-label="Prompt badges">
        {categoryName && (
          <Badge variant="outline" role="listitem">
            <span className="mr-1" aria-hidden="true">{categoryIcon}</span>
            {categoryName}
          </Badge>
        )}
        {visibility === 'public' ? (
          <Badge variant="secondary" role="listitem">
            <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
            <span>Public</span>
          </Badge>
        ) : (
          <Badge variant="outline" role="listitem">
            <EyeOff className="h-3 w-3 mr-1" aria-hidden="true" />
            <span>Private</span>
          </Badge>
        )}
      </div>
      <CardTitle className="text-2xl">{problem}</CardTitle>
      {description && (
        <CardDescription>{description}</CardDescription>
      )}
    </div>
  );
});

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4" role="status" aria-live="polite">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <span className="sr-only">Loading prompt details...</span>
      </div>
    </AppLayout>
  );
});

// ============================================================================
// Main Component
// ============================================================================

function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { copy } = useClipboard();

  // Use service layer hooks
  const { data: prompt, isLoading } = usePromptDetail(id || '');
  const forkMutation = useForkPrompt();
  const deleteMutation = useDeletePrompt();

  const versions = prompt?.versions || [];

  const isOwner = useMemo(
    () => prompt?.created_by === user?.id,
    [prompt?.created_by, user?.id]
  );

  // Memoized handlers
  const handleBack = useCallback(() => {
    navigate('/prompts');
  }, [navigate]);

  const trackUsage = useCallback(async () => {
    if (!id || !user) return;
    await supabase.from('prompt_usage').insert({
      prompt_id: id,
      user_id: user.id,
    });
  }, [id, user]);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    await copy(prompt.generated_prompt);
    await trackUsage();
    toast.success('Copied to clipboard!');
  }, [prompt, copy, trackUsage]);

  const handleFork = useCallback(() => {
    if (!prompt || !user) return;
    forkMutation.mutate(
      { originalPromptId: prompt.id, userId: user.id },
      {
        onSuccess: (result) => {
          if (result) {
            toast.success('Prompt forked successfully!');
            navigate(`/prompts/${result.id}`);
          }
        },
        onError: () => {
          toast.error('Failed to fork prompt');
        },
      }
    );
  }, [prompt, user, forkMutation, navigate]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Prompt deleted');
        navigate('/prompts');
      },
      onError: () => {
        toast.error('Failed to delete prompt');
      },
    });
  }, [id, deleteMutation, navigate]);

  const handleExport = useCallback((format: ExportFormat) => {
    if (!prompt) return;
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
  }, [prompt]);

  const handleRollback = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['prompt', id] });
  }, [queryClient, id]);

  // Memoized generated prompt object
  const generatedPrompt = useMemo<GeneratedPrompt | null>(() => {
    if (!prompt) return null;
    return {
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
  }, [prompt]);

  // Memoized versions for version control
  const mappedVersions = useMemo(
    () => versions.map(v => ({
      ...v,
      spec: (v.spec as Record<string, unknown>) || {},
      quality_scores: (v.quality_scores as Record<string, unknown>) || null,
    })),
    [versions]
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!prompt) {
    return (
      <AppLayout>
        <main className="container mx-auto py-8 px-4" role="main">
          <p role="alert">Prompt not found</p>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto py-8 px-4" role="main" aria-label="Prompt Details">
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          className="mb-6"
          aria-label="Back to prompt library"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Library
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card role="region" aria-labelledby="prompt-header-title">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <PromptHeader
                    categoryIcon={(prompt as any).prompt_categories?.icon}
                    categoryName={(prompt as any).prompt_categories?.name}
                    visibility={prompt.visibility}
                    problem={prompt.problem}
                    description={prompt.description}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap" role="group" aria-label="Prompt actions">
                  <Button onClick={handleCopy} aria-label="Copy prompt to clipboard">
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleFork}
                    disabled={forkMutation.isPending}
                    aria-label="Fork this prompt"
                  >
                    {forkMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <GitFork className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    Fork
                  </Button>
                  <ExportMenu onExport={handleExport} />
                  {isOwner && (
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      aria-label="Delete this prompt"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      )}
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {generatedPrompt && <PromptOutput prompt={generatedPrompt} />}
          </div>

          <aside className="space-y-6" aria-label="Prompt sidebar">
            <StatsCard
              useCount={prompt.use_count || 0}
              forkCount={prompt.fork_count || 0}
              createdAt={prompt.created_at || new Date().toISOString()}
              authorName={(prompt as any).profiles?.display_name}
            />

            <PromptVersionControl
              promptId={prompt.id}
              currentPrompt={prompt.generated_prompt}
              currentSpec={generatedPrompt?.spec || {}}
              versions={mappedVersions}
              isOwner={isOwner}
              onRollback={handleRollback}
            />
          </aside>
        </div>
      </main>
    </AppLayout>
  );
}

export default memo(PromptDetail);
