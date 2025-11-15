import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles, TrendingDown, Zap, Target, Lightbulb, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INSIGHT_ICONS = {
  cost_optimization: TrendingDown,
  speed_optimization: Zap,
  quality_improvement: Target,
  prompt_suggestion: Lightbulb
};

const INSIGHT_LABELS = {
  cost_optimization: "Cost",
  speed_optimization: "Speed",
  quality_improvement: "Quality",
  prompt_suggestion: "Prompts"
};

export function AIInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      // Get recent test runs
      const { data: testRuns, error: runsError } = await supabase
        .from('model_test_runs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (runsError) throw runsError;

      if (!testRuns || testRuns.length === 0) {
        toast.error("No test runs found. Run some comparisons first.");
        return;
      }

      // Call edge function to generate insights
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { userId: user.id, testRuns }
      });

      if (error) throw error;

      // Save insights to database
      const runIds = testRuns.map((r: any) => r.id);
      const insightsToInsert = data.insights.map((insight: any) => ({
        user_id: user.id,
        insight_type: insight.type,
        content: insight.content,
        based_on_runs: runIds
      }));

      const { error: insertError } = await supabase
        .from('ai_insights')
        .insert(insightsToInsert);

      if (insertError) throw insertError;

      toast.success("AI insights generated successfully");
      loadInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error("Failed to generate insights");
    } finally {
      setGenerating(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      loadInsights();
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  const deleteInsight = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInsights(insights.filter(i => i.id !== id));
      toast.success("Insight deleted");
    } catch (error) {
      console.error('Error deleting insight:', error);
      toast.error("Failed to delete insight");
    }
  };

  const unreadCount = insights.filter(i => !i.is_read).length;
  const groupedInsights: Record<string, any[]> = insights.reduce((acc, insight) => {
    if (!acc[insight.insight_type]) acc[insight.insight_type] = [];
    acc[insight.insight_type].push(insight);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle>AI Insights</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>
          <Button onClick={generateInsights} disabled={generating} size="sm">
            {generating ? "Generating..." : "Generate Insights"}
          </Button>
        </div>
        <CardDescription>
          AI-powered optimization recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No insights yet. Generate insights from your test runs.</p>
        ) : (
          <Tabs defaultValue={Object.keys(groupedInsights)[0] || 'cost_optimization'}>
            <TabsList className="grid w-full grid-cols-4">
              {Object.keys(INSIGHT_LABELS).map(type => {
                const Icon = INSIGHT_ICONS[type as keyof typeof INSIGHT_ICONS];
                const count = groupedInsights[type]?.length || 0;
                return (
                  <TabsTrigger key={type} value={type} disabled={count === 0}>
                    <Icon className="h-4 w-4 mr-1" />
                    {INSIGHT_LABELS[type as keyof typeof INSIGHT_LABELS]}
                    {count > 0 && <Badge variant="secondary" className="ml-1">{count}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {Object.entries(groupedInsights).map(([type, typeInsights]) => (
              <TabsContent key={type} value={type} className="space-y-3">
                {typeInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 border rounded-lg ${!insight.is_read ? 'bg-accent/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm whitespace-pre-wrap flex-1">{insight.content}</p>
                      <div className="flex gap-1">
                        {!insight.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(insight.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInsight(insight.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
