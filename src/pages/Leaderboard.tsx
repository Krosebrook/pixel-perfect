import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Zap, DollarSign, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Leaderboard() {
  const [timeRange, setTimeRange] = useState('30');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['model-leaderboard', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_model_leaderboard', {
        time_range_days: parseInt(timeRange)
      });
      if (error) throw error;
      return data;
    }
  });

  const getMedalIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 1) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank + 1}</span>;
  };

  const sortByMetric = (metric: keyof typeof leaderboard[0]) => {
    if (!leaderboard) return [];
    return [...leaderboard].sort((a, b) => {
      const aVal = a[metric] as number || 0;
      const bVal = b[metric] as number || 0;
      return metric === 'avg_latency_ms' ? aVal - bVal : bVal - aVal;
    });
  };

  const renderLeaderboardTable = (data: any[], metric: string) => (
    <div className="space-y-4">
      {data.map((model, index) => (
        <Card key={model.model_name} className={index < 3 ? 'border-primary/20 shadow-lg' : ''}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 flex justify-center">
                {getMedalIcon(index)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{model.model_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {model.total_usage} total runs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {metric === 'speed' && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{model.avg_latency_ms}ms</p>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                </div>
              )}
              {metric === 'cost' && (
                <div className="text-right">
                  <p className="text-2xl font-bold">${model.avg_cost?.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground">Avg Cost</p>
                </div>
              )}
              {metric === 'popularity' && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{model.total_usage}</p>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </div>
              )}
              {metric === 'overall' && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{model.cost_efficiency_score}</p>
                  <p className="text-sm text-muted-foreground">Efficiency Score</p>
                </div>
              )}
              <Badge variant={model.success_rate > 95 ? 'default' : 'secondary'}>
                {model.success_rate}% success
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Award className="h-8 w-8 text-primary" />
              Performance Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Compare model performance across different metrics
            </p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
            </CardContent>
          </Card>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No data yet</h3>
              <p className="text-muted-foreground">
                Run some model comparisons to see the leaderboard
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overall" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overall" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overall
              </TabsTrigger>
              <TabsTrigger value="speed" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Speed
              </TabsTrigger>
              <TabsTrigger value="cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost
              </TabsTrigger>
              <TabsTrigger value="popularity" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Popularity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overall">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Champions</CardTitle>
                  <CardDescription>
                    Best models by cost efficiency score (success rate / cost)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardTable(sortByMetric('cost_efficiency_score'), 'overall')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="speed">
              <Card>
                <CardHeader>
                  <CardTitle>Speed Leaders</CardTitle>
                  <CardDescription>
                    Fastest models by average response latency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardTable(sortByMetric('avg_latency_ms'), 'speed')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cost">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Efficiency</CardTitle>
                  <CardDescription>
                    Most cost-effective models by average cost per request
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardTable(sortByMetric('avg_cost'), 'cost')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="popularity">
              <Card>
                <CardHeader>
                  <CardTitle>Most Popular</CardTitle>
                  <CardDescription>
                    Models with the highest usage count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardTable(sortByMetric('total_usage'), 'popularity')}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppLayout>
  );
}