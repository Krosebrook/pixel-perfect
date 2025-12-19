/**
 * usePrompts Hook
 * Integrates with PromptService for prompt data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService, type PromptFilters } from '@/services/prompt.service';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/constants';

/**
 * Hook for fetching user's prompts with optional filters
 */
export function usePrompts(userId: string | undefined, filters?: PromptFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROMPTS, userId, filters],
    queryFn: async () => {
      if (!userId) return [];
      const result = await promptService.getPrompts(userId, filters);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch prompts');
      return result.data ?? [];
    },
    enabled: !!userId,
  });
}

/**
 * Hook for fetching a single prompt with versions
 */
export function usePromptDetail(promptId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROMPT_DETAIL, promptId],
    queryFn: async () => {
      if (!promptId) return null;
      const result = await promptService.getPromptById(promptId);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch prompt');
      return result.data;
    },
    enabled: !!promptId,
  });
}

/**
 * Hook for creating a new prompt
 */
export function useCreatePrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (prompt: Parameters<typeof promptService.createPrompt>[0]) => {
      const result = await promptService.createPrompt(prompt);
      if (!result.success) throw new Error(result.error ?? 'Failed to create prompt');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPTS] });
      toast({ title: 'Prompt created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Hook for updating a prompt
 */
export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ promptId, updates }: { promptId: string; updates: Parameters<typeof promptService.updatePrompt>[1] }) => {
      const result = await promptService.updatePrompt(promptId, updates);
      if (!result.success) throw new Error(result.error ?? 'Failed to update prompt');
      return { data: result.data, promptId };
    },
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPT_DETAIL, promptId] });
      toast({ title: 'Prompt updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Hook for deleting a prompt
 */
export function useDeletePrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promptId: string) => {
      const result = await promptService.deletePrompt(promptId);
      if (!result.success) throw new Error(result.error ?? 'Failed to delete prompt');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPTS] });
      toast({ title: 'Prompt deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Hook for creating a prompt version
 */
export function useCreatePromptVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      promptId,
      userId,
      spec,
      generatedPrompt,
      qualityScores,
    }: {
      promptId: string;
      userId: string;
      spec: Record<string, unknown>;
      generatedPrompt: string;
      qualityScores?: Record<string, number>;
    }) => {
      const result = await promptService.createVersion(promptId, userId, spec, generatedPrompt, qualityScores);
      if (!result.success) throw new Error(result.error ?? 'Failed to create version');
      return { data: result.data, promptId };
    },
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPT_DETAIL, promptId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPT_VERSIONS, promptId] });
      toast({ title: 'Version saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Hook for rolling back to a prompt version
 */
export function useRollbackPromptVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ promptId, versionId }: { promptId: string; versionId: string }) => {
      const result = await promptService.rollbackToVersion(promptId, versionId);
      if (!result.success) throw new Error(result.error ?? 'Failed to rollback');
      return { data: result.data, promptId };
    },
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPT_DETAIL, promptId] });
      toast({ title: 'Rolled back to selected version' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Hook for forking a prompt
 */
export function useForkPrompt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ originalPromptId, userId, newName }: { originalPromptId: string; userId: string; newName?: string }) => {
      const result = await promptService.forkPrompt(originalPromptId, userId, newName);
      if (!result.success) throw new Error(result.error ?? 'Failed to fork prompt');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROMPTS] });
      toast({ title: 'Prompt forked successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export default usePrompts;
