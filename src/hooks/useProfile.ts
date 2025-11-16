import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/types/profile';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
  });
}

export function useEnvironmentMode(userId: string | undefined) {
  return useQuery({
    queryKey: ['environment-mode', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('environment_mode')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data.environment_mode as string;
    },
    enabled: !!userId,
  });
}
