/**
 * @fileoverview Component for viewing deployment changelogs and release notes.
 * Displays auto-generated release notes with commit history.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, GitCommit, Calendar } from "lucide-react";
import { format } from "date-fns";

/**
 * Git commit information structure.
 */
interface Commit {
  /** Full commit SHA */
  sha: string;
  /** Commit message */
  message: string;
  /** Author name */
  author: string;
  /** Commit date as ISO string */
  date: string;
}

/**
 * Changelog data structure from the database.
 */
interface DeploymentChangelog {
  /** Unique changelog ID */
  id: string;
  /** Associated deployment ID */
  deployment_id: string;
  /** Previous deployment ID for commit range */
  previous_deployment_id: string | null;
  /** Commit range string (e.g., "abc123..def456") */
  commit_range: string;
  /** Array of commits in this changelog */
  commits: Commit[];
  /** Generated markdown release notes */
  release_notes: string;
  /** When the changelog was generated */
  generated_at: string;
  /** When the record was created */
  created_at: string;
  /** Related deployment metrics */
  deployment_metrics?: {
    commit_sha: string;
    status: string;
    started_at: string;
  };
}

/**
 * Displays a scrollable list of deployment changelogs with release notes.
 * Fetches changelog data including associated deployment information.
 * 
 * @returns A component showing changelog cards or appropriate loading/empty states
 * 
 * @example
 * // In a tabs layout
 * <TabsContent value="changelog">
 *   <ChangelogViewer />
 * </TabsContent>
 */
export function ChangelogViewer() {
  const { data: changelogs, isLoading } = useQuery({
    queryKey: ['deployment-changelogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployment_changelogs')
        .select(`
          *,
          deployment_metrics!deployment_changelogs_deployment_id_fkey (
            commit_sha,
            status,
            started_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform commits from Json to Commit[]
      return (data || []).map(item => ({
        ...item,
        commits: Array.isArray(item.commits) ? (item.commits as unknown as Commit[]) : []
      })) as DeploymentChangelog[];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!changelogs || changelogs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Changelogs Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Changelogs will be automatically generated when deployments are completed.
            Each changelog includes categorized commits and release notes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {changelogs.map((changelog) => (
          <ChangelogCard key={changelog.id} changelog={changelog} />
        ))}
      </div>
    </ScrollArea>
  );
}

/**
 * Props for ChangelogCard component.
 */
interface ChangelogCardProps {
  /** The changelog data to display */
  changelog: DeploymentChangelog;
}

/**
 * Renders a single changelog entry as a card.
 * Includes deployment info, release notes, and expandable commit list.
 * 
 * @param props - Component props
 * @param props.changelog - The changelog data
 * @returns A card displaying the changelog details
 */
function ChangelogCard({ changelog }: ChangelogCardProps) {
  const commits = Array.isArray(changelog.commits) ? changelog.commits : [];
  const deploymentDate = changelog.deployment_metrics?.started_at 
    ? format(new Date(changelog.deployment_metrics.started_at), 'MMM d, yyyy HH:mm')
    : format(new Date(changelog.created_at), 'MMM d, yyyy HH:mm');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitCommit className="h-5 w-5" />
            {changelog.deployment_metrics?.commit_sha?.substring(0, 7) || 'Unknown'}
          </CardTitle>
          <Badge variant={changelog.deployment_metrics?.status === 'success' ? 'default' : 'destructive'}>
            {changelog.deployment_metrics?.status || 'unknown'}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {deploymentDate}
          </span>
          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
            {changelog.commit_range}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Release Notes */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">
              {formatReleaseNotes(changelog.release_notes)}
            </div>
          </div>

          {/* Commit List */}
          {commits.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                View {commits.length} commit{commits.length !== 1 ? 's' : ''}
              </summary>
              <div className="mt-2 space-y-1">
                {commits.map((commit, idx) => (
                  <div 
                    key={commit.sha || idx} 
                    className="flex items-start gap-2 text-xs p-2 rounded bg-muted/30"
                  >
                    <code className="font-mono text-primary shrink-0">
                      {commit.sha?.substring(0, 7) || '???'}
                    </code>
                    <span className="text-muted-foreground truncate">
                      {commit.message?.split('\n')[0] || 'No message'}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Formats raw release notes text for display.
 * Converts markdown-style headers to styled text.
 * 
 * @param notes - Raw release notes string
 * @returns Formatted string for display
 */
function formatReleaseNotes(notes: string | null): React.ReactNode {
  if (!notes) return 'No release notes available';
  
  // Convert markdown-like headers and emojis to styled text
  return notes
    .replace(/^# (.+)$/gm, '━━━ $1 ━━━\n')
    .replace(/^## (.+)$/gm, '\n▸ $1')
    .replace(/^\*\*(.+?):\*\* (.+)$/gm, '$1: $2');
}
