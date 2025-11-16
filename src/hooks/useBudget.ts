import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserBudget } from '@/types/budget';

export function useBudget(userId: string | undefined, environmentMode: string | undefined) {
  return useQuery({
    queryKey: ['user-budget', userId, environmentMode],
    queryFn: async () => {
      if (!userId || !environmentMode) return null;
      
      const { data, error } = await supabase
        .from('user_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('environment_mode', environmentMode)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserBudget | null;
    },
    enabled: !!userId && !!environmentMode,
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetData: Partial<UserBudget> & { user_id: string; environment_mode: string }) => {
      const { error } = await supabase
        .from('user_budgets')
        .upsert(budgetData, {
          onConflict: 'user_id,environment_mode',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-budget'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });
}
