import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DeploymentBudget, DeploymentAlert, PeriodComparison } from '@/types/deployment';

export function useDeploymentBudgets() {
  return useQuery({
    queryKey: ['deployment-budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployment_budgets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DeploymentBudget[];
    },
  });
}

export function useDeploymentAlerts(acknowledged = false) {
  return useQuery({
    queryKey: ['deployment-alerts', acknowledged],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployment_alerts')
        .select('*')
        .eq('is_acknowledged', acknowledged)
        .order('triggered_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as DeploymentAlert[];
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: Omit<DeploymentBudget, 'id' | 'current_value' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('deployment_budgets')
        .insert(budget)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment-budgets'] });
      toast.success('Budget created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create budget');
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeploymentBudget> & { id: string }) => {
      const { data, error } = await supabase
        .from('deployment_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment-budgets'] });
      toast.success('Budget updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget');
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deployment_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment-budgets'] });
      toast.success('Budget deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete budget');
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, acknowledgedBy }: { id: string; acknowledgedBy: string }) => {
      const { error } = await supabase
        .from('deployment_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: acknowledgedBy,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment-alerts'] });
      toast.success('Alert acknowledged');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to acknowledge alert');
    },
  });
}

export function useComparePeriods(
  period1Start: string | null,
  period1End: string | null,
  period2Start: string | null,
  period2End: string | null
) {
  return useQuery({
    queryKey: ['deployment-comparison', period1Start, period1End, period2Start, period2End],
    queryFn: async () => {
      if (!period1Start || !period1End || !period2Start || !period2End) return null;

      const { data, error } = await supabase.rpc('compare_deployment_periods', {
        period1_start: period1Start,
        period1_end: period1End,
        period2_start: period2Start,
        period2_end: period2End,
      });

      if (error) throw error;
      return data as PeriodComparison[];
    },
    enabled: !!(period1Start && period1End && period2Start && period2End),
  });
}
