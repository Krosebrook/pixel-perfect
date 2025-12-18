import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, TrendingDown, ArrowRight, RefreshCw, Lightbulb, Zap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

interface ModelSuggestion {
  currentModel: string;
  suggestedModel: string;
  useCase: string;
  savingsPercent: number;
}

interface CostRecommendations {
  summary: string;
  potentialSavings: string;
  recommendations: Recommendation[];
  modelSuggestions: ModelSuggestion[];
}

interface CostData {
  usageSummary: {
    totalRuns: number;
    totalCost: string;
    modelBreakdown: Array<{
      model: string;
      usageCount: number;
      totalCost: string;
      avgLatency: string;
    }>;
  };
  recommendations: CostRecommendations;
  generatedAt: string;
}

const impactColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const categoryIcons = {
  'model-switch': ArrowRight,
  'batching': Zap,
  'prompt-optimization': Lightbulb,
  'usage-pattern': TrendingDown,
};

export function CostOptimizationPanel() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cost-recommendations'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cost-recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recommendations');
      }

      return response.json() as Promise<CostData>;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    enabled: false, // Don't auto-fetch, require user action
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await refetch();
      toast.success('Recommendations generated!');
    } catch (error) {
      toast.error('Failed to generate recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!data && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Cost Optimization
          </CardTitle>
          <CardDescription>
            Get AI-powered recommendations to reduce your API costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing usage patterns...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Cost Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your usage patterns...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations = data?.recommendations;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Cost Optimization
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
              <DollarSign className="h-6 w-6" />
              {recommendations?.potentialSavings || '0%'}
            </div>
            <span className="text-muted-foreground">potential savings</span>
          </div>
          <p className="text-muted-foreground">{recommendations?.summary}</p>
          <div className="text-xs text-muted-foreground">
            Based on {data?.usageSummary.totalRuns} API calls totaling ${data?.usageSummary.totalCost}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.recommendations.map((rec, idx) => {
              const Icon = categoryIcons[rec.category as keyof typeof categoryIcons] || Lightbulb;
              return (
                <div key={idx} className="flex gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge className={impactColors[rec.impact]}>
                        {rec.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Model Suggestions */}
      {recommendations?.modelSuggestions && recommendations.modelSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Model Alternatives</CardTitle>
            <CardDescription>Switch to these models for specific use cases to save costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.modelSuggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Badge variant="outline">{suggestion.currentModel}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {suggestion.suggestedModel}
                  </Badge>
                  <span className="flex-1 text-sm text-muted-foreground">{suggestion.useCase}</span>
                  <span className="text-sm font-medium text-green-600">
                    Save {suggestion.savingsPercent}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Breakdown */}
      {data?.usageSummary.modelBreakdown && data.usageSummary.modelBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.usageSummary.modelBreakdown.map((model, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="font-medium">{model.model}</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{model.usageCount} calls</span>
                    <span>${model.totalCost}</span>
                    <span>{model.avgLatency}ms avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
