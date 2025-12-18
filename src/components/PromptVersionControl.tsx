import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, GitCompare, RotateCcw, Plus, Minus, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { createDiffResult, compareSpecs, type DiffLine } from '@/lib/prompt-diff';
import { cn } from '@/lib/utils';

interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  spec: {
    goal_type?: string;
    problem?: string;
    precision?: string;
    model_target?: string;
    constraints?: string;
    success_criteria?: string;
    voice_style?: string;
    tech_env?: string;
    depth?: string;
    format?: string;
    [key: string]: unknown;
  };
  generated_prompt: string;
  quality_scores: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
}

interface PromptVersionControlProps {
  promptId: string;
  currentPrompt: string;
  currentSpec: Record<string, any>;
  versions: PromptVersion[];
  isOwner: boolean;
  onRollback?: () => void;
}

export function PromptVersionControl({
  promptId,
  currentPrompt,
  currentSpec,
  versions,
  isOwner,
  onRollback,
}: PromptVersionControlProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [compareFrom, setCompareFrom] = useState<string>('');
  const [compareTo, setCompareTo] = useState<string>('');
  const queryClient = useQueryClient();

  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async () => {
      const nextVersion = (versions?.[0]?.version_number || 0) + 1;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('prompt_versions').insert({
        prompt_id: promptId,
        version_number: nextVersion,
        spec: currentSpec,
        generated_prompt: currentPrompt,
        created_by: user.id,
      });

      if (error) throw error;
      return nextVersion;
    },
    onSuccess: (version) => {
      toast.success(`Version ${version} created!`);
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', promptId] });
    },
    onError: () => {
      toast.error('Failed to create version');
    },
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const version = versions.find(v => v.id === versionId);
      if (!version) throw new Error('Version not found');

      const { error } = await supabase
        .from('prompts')
        .update({
          generated_prompt: version.generated_prompt,
          goal_type: version.spec.goal_type,
          problem: version.spec.problem,
          precision: version.spec.precision,
          model_target: version.spec.model_target,
          constraints: version.spec.constraints,
          success_criteria: version.spec.success_criteria,
          voice_style: version.spec.voice_style,
          tech_env: version.spec.tech_env,
          depth: version.spec.depth,
          format: version.spec.format,
          quality_scores: version.quality_scores as any,
        })
        .eq('id', promptId);

      if (error) throw error;
      return version.version_number;
    },
    onSuccess: (version) => {
      toast.success(`Rolled back to version ${version}`);
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', promptId] });
      onRollback?.();
    },
    onError: () => {
      toast.error('Failed to rollback');
    },
  });

  const getVersionById = (id: string) => versions.find(v => v.id === id);

  const diffResult = compareFrom && compareTo
    ? createDiffResult(
        getVersionById(compareFrom)?.generated_prompt || '',
        getVersionById(compareTo)?.generated_prompt || '',
        getVersionById(compareFrom)?.version_number || 0,
        getVersionById(compareTo)?.version_number || 0
      )
    : null;

  const specChanges = compareFrom && compareTo
    ? compareSpecs(
        getVersionById(compareFrom)?.spec || {},
        getVersionById(compareTo)?.spec || {}
      )
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Version Control
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => createVersionMutation.mutate()}
              disabled={createVersionMutation.isPending}
            >
              <Plus className="h-3 w-3 mr-1" />
              Save Version
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Version List */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {versions.map((version, idx) => (
              <div
                key={version.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg border text-sm",
                  idx === 0 && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={idx === 0 ? "default" : "secondary"} className="text-xs">
                    v{version.version_number}
                  </Badge>
                  {idx === 0 && (
                    <Badge variant="outline" className="text-xs">Latest</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(version.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {versions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No versions saved yet
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        {versions.length >= 2 && (
          <div className="flex gap-2">
            <Dialog open={showDiff} onOpenChange={setShowDiff}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <GitCompare className="h-3 w-3 mr-1" />
                  Compare
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Compare Versions</DialogTitle>
                  <DialogDescription>
                    View changes between different versions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Version Selectors */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium">From</label>
                      <Select value={compareFrom} onValueChange={setCompareFrom}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              Version {v.version_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">To</label>
                      <Select value={compareTo} onValueChange={setCompareTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              Version {v.version_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Diff View */}
                  {diffResult && (
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">+{diffResult.stats.added} added</span>
                        <span className="text-red-600">-{diffResult.stats.removed} removed</span>
                        <span className="text-muted-foreground">{diffResult.stats.unchanged} unchanged</span>
                      </div>

                      {/* Spec Changes */}
                      {specChanges && specChanges.some(c => c.changed) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Configuration Changes</h4>
                          <div className="grid gap-2">
                            {specChanges.filter(c => c.changed).map((change) => (
                              <div key={change.field} className="flex items-center gap-2 text-sm p-2 rounded bg-muted">
                                <span className="font-medium capitalize">{change.field.replace(/_/g, ' ')}:</span>
                                <span className="text-red-600 line-through">{String(change.oldValue || 'none')}</span>
                                <span>→</span>
                                <span className="text-green-600">{String(change.newValue || 'none')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Line Diff */}
                      <ScrollArea className="h-[300px] border rounded-lg">
                        <div className="font-mono text-xs p-4">
                          {diffResult.lines.map((line, idx) => (
                            <DiffLineComponent key={idx} line={line} />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {isOwner && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rollback to Previous Version</DialogTitle>
                    <DialogDescription>
                      Choose a version to restore. This will update the prompt to that version.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {versions.slice(1).map((version) => (
                      <button
                        key={version.id}
                        className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        onClick={() => rollbackMutation.mutate(version.id)}
                        disabled={rollbackMutation.isPending}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">v{version.version_number}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(version.created_at).toLocaleString()}
                          </span>
                        </div>
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DiffLineComponent({ line }: { line: DiffLine }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 py-0.5 px-2 -mx-2",
        line.type === 'added' && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
        line.type === 'removed' && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
      )}
    >
      <span className="flex-shrink-0 w-4">
        {line.type === 'added' && <Plus className="h-3 w-3" />}
        {line.type === 'removed' && <Minus className="h-3 w-3" />}
      </span>
      <span className="whitespace-pre-wrap break-all">{line.content || ' '}</span>
    </div>
  );
}
