/**
 * @fileoverview GDPR data export component.
 * Allows users to download all their personal data in JSON format.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Loader2, FileJson, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export function DataExportSection() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const exportData = async () => {
    if (!user) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Fetch all user data from various tables
      const [
        profileResult,
        promptsResult,
        testRunsResult,
        favoritePromptsResult,
        budgetResult,
        devicesResult,
        activityResult,
        apiKeysResult,
        scheduledTestsResult,
        teamMembershipsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('prompts').select('*').eq('created_by', user.id),
        supabase.from('model_test_runs').select('*').eq('user_id', user.id),
        supabase.from('favorite_prompts').select('*').eq('user_id', user.id),
        supabase.from('user_budgets').select('*').eq('user_id', user.id),
        supabase.from('user_devices').select('*').eq('user_id', user.id),
        supabase.from('account_activity').select('*').eq('user_id', user.id),
        supabase.from('api_keys').select('id, name, key_prefix, scopes, environment_mode, is_active, created_at, last_used_at, expires_at').eq('user_id', user.id),
        supabase.from('scheduled_tests').select('*').eq('user_id', user.id),
        supabase.from('team_members').select('*, teams(name, description)').eq('user_id', user.id),
      ]);

      // Compile all data
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
          emailConfirmedAt: user.email_confirmed_at,
        },
        profile: profileResult.data,
        prompts: promptsResult.data || [],
        testRuns: testRunsResult.data || [],
        favoritePrompts: favoritePromptsResult.data || [],
        budget: budgetResult.data || [],
        devices: devicesResult.data || [],
        activity: activityResult.data || [],
        apiKeys: apiKeysResult.data || [],
        scheduledTests: scheduledTestsResult.data || [],
        teamMemberships: teamMembershipsResult.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      toast.success('Your data has been exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card role="region" aria-labelledby="data-export-title">
      <CardHeader>
        <CardTitle id="data-export-title" className="flex items-center gap-2">
          <FileJson className="h-5 w-5" aria-hidden="true" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download a copy of all your personal data in JSON format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" aria-hidden="true" />
          <AlertDescription className="text-sm">
            Your export will include: profile information, prompts, test runs, favorites, 
            budget settings, devices, activity logs, API keys (without secrets), scheduled tests, 
            and team memberships.
          </AlertDescription>
        </Alert>

        {exportSuccess && (
          <Alert className="border-green-500/20 bg-green-500/5">
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Your data export has been downloaded successfully.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={exportData}
          disabled={isExporting}
          className="w-full gap-2"
          aria-busy={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download My Data
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This complies with GDPR Article 20 - Right to data portability
        </p>
      </CardContent>
    </Card>
  );
}
