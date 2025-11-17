import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Library, Settings as SettingsIcon, Shield, Sparkles, Trophy, Clock, Users, Activity, FileText, BarChart, Key, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function Navigation() {
  const { user } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      return !!data;
    },
    enabled: !!user,
  });

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 font-bold">
              <Zap className="h-5 w-5" />
              UPGE
            </NavLink>
            <NavLink to="/prompts">
              <Library className="h-4 w-4 inline mr-2" />
              Library
            </NavLink>
            <NavLink to="/models/compare">
              <Zap className="h-4 w-4 inline mr-2" />
              Compare
            </NavLink>
            <NavLink to="/templates">
              <Sparkles className="h-4 w-4 inline mr-2" />
              Templates
            </NavLink>
            <NavLink to="/leaderboard">
              <Trophy className="h-4 w-4 inline mr-2" />
              Leaderboard
            </NavLink>
            <NavLink to="/scheduled-tests">
              <Clock className="h-4 w-4 inline mr-2" />
              Scheduled
            </NavLink>
            <NavLink to="/teams">
              <Users className="h-4 w-4 inline mr-2" />
              Teams
            </NavLink>
            <NavLink to="/api-usage">
              <Activity className="h-4 w-4 inline mr-2" />
              API Usage
            </NavLink>
            <NavLink to="/api-docs">
              <FileText className="h-4 w-4 inline mr-2" />
              API Docs
            </NavLink>
            <NavLink to="/analytics">
              <BarChart className="h-4 w-4 inline mr-2" />
              Analytics
            </NavLink>
            <NavLink to="/api-keys">
              <Key className="h-4 w-4 inline mr-2" />
              API Keys
            </NavLink>
            <NavLink to="/settings">
              <SettingsIcon className="h-4 w-4 inline mr-2" />
              Settings
            </NavLink>
            {isAdmin && (
              <>
                <NavLink to="/security">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Security
                </NavLink>
                <NavLink to="/deployment-metrics">
                  <TrendingUp className="h-4 w-4 inline mr-2" />
                  Deployments
                </NavLink>
                <NavLink to="/admin">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Admin
                </NavLink>
              </>
            )}
          </div>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
