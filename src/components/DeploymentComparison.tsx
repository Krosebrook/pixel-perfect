/**
 * @fileoverview Component for comparing deployment metrics between two time periods.
 * Provides visual comparison through charts and metric cards.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowRight, ArrowUp, TrendingDown, TrendingUp } from "lucide-react";
import { useComparePeriods } from "@/hooks/useDeploymentBudget";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, subWeeks } from "date-fns";
import type { PeriodComparison } from "@/types/deployment";

/**
 * Metrics where an increase is considered negative (bad).
 */
const BAD_WHEN_UP_METRICS = ['Rollbacks', 'Total Incidents', 'Avg Duration (s)', 'Avg Resolution (min)'];

/**
 * Interactive comparison tool for deployment metrics across time periods.
 * Features date range selectors, metric cards, bar chart visualization,
 * and an overall performance summary.
 * 
 * @returns A comprehensive comparison interface with multiple visualization types
 * 
 * @example
 * // In a deployment analytics page
 * <DeploymentComparison />
 */
export function DeploymentComparison() {
  const [period1, setPeriod1] = useState({
    start: format(subWeeks(new Date(), 2), 'yyyy-MM-dd'),
    end: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
  });
  const [period2, setPeriod2] = useState({
    start: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: comparison, isLoading } = useComparePeriods(
    period1.start,
    period1.end,
    period2.start,
    period2.end
  );

  /**
   * Sets predefined date ranges for quick comparison.
   * @param range - 'week' for last 2 weeks, 'month' for last 2 months
   */
  const setQuickRange = (range: 'week' | 'month') => {
    const now = new Date();
    if (range === 'week') {
      setPeriod1({ start: format(subWeeks(now, 2), 'yyyy-MM-dd'), end: format(subWeeks(now, 1), 'yyyy-MM-dd') });
      setPeriod2({ start: format(subWeeks(now, 1), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') });
    } else {
      setPeriod1({ start: format(subDays(now, 60), 'yyyy-MM-dd'), end: format(subDays(now, 30), 'yyyy-MM-dd') });
      setPeriod2({ start: format(subDays(now, 30), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') });
    }
  };

  /**
   * Returns the appropriate directional icon for a change.
   * @param direction - 'up', 'down', or 'same'
   */
  const getChangeIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />;
      case 'down':
        return <ArrowDown className="h-4 w-4" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  /**
   * Returns the appropriate color class for a metric change.
   * Accounts for metrics where increases are bad (like rollbacks).
   * @param metric - The metric name
   * @param direction - 'up', 'down', or 'same'
   */
  const getChangeColor = (metric: string, direction: string) => {
    if (direction === 'same') return 'text-muted-foreground';
    if (BAD_WHEN_UP_METRICS.includes(metric)) {
      return direction === 'up' ? 'text-destructive' : 'text-success';
    }
    return direction === 'up' ? 'text-success' : 'text-destructive';
  };

  const chartData = comparison?.map((c) => ({
    name: c.metric_name,
    'Period 1': c.period1_value,
    'Period 2': c.period2_value,
  }));

  return (
    <div className="space-y-6">
      {/* Date Range Selectors */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Time Periods</CardTitle>
          <CardDescription>Select two time periods to compare deployment metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setQuickRange('week')}>
              Last 2 Weeks
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('month')}>
              Last 2 Months
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Period 1 (Baseline) */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="secondary">Period 1</Badge>
                Baseline
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={period1.start}
                    onChange={(e) => setPeriod1({ ...period1, start: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={period1.end}
                    onChange={(e) => setPeriod1({ ...period1, end: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Period 2 (Comparison) */}
            <div className="space-y-3 p-4 border rounded-lg bg-primary/5">
              <h4 className="font-medium flex items-center gap-2">
                <Badge>Period 2</Badge>
                Comparison
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={period2.start}
                    onChange={(e) => setPeriod2({ ...period2, start: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={period2.end}
                    onChange={(e) => setPeriod2({ ...period2, end: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading comparison data...
          </CardContent>
        </Card>
      ) : comparison && comparison.length > 0 ? (
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {comparison.map((metric) => (
              <Card key={metric.metric_name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{metric.metric_name}</p>
                    <div className={`flex items-center gap-1 ${getChangeColor(metric.metric_name, metric.change_direction)}`}>
                      {getChangeIcon(metric.change_direction)}
                      <span className="text-sm font-medium">
                        {metric.change_percentage > 0 ? '+' : ''}{metric.change_percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold">{metric.period2_value}</span>
                    <span className="text-sm text-muted-foreground">
                      vs {metric.period1_value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Period 1" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="Period 2" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {comparison.find((c) => c.metric_name === 'Success Rate')?.change_direction === 'up' ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-success" />
                    Overall Improvement
                  </>
                ) : comparison.find((c) => c.metric_name === 'Success Rate')?.change_direction === 'down' ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    Needs Attention
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    Stable Performance
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {comparison.map((metric) => {
                  if (metric.change_direction === 'same') return null;
                  const isGood = 
                    (metric.change_direction === 'up' && !BAD_WHEN_UP_METRICS.includes(metric.metric_name)) ||
                    (metric.change_direction === 'down' && BAD_WHEN_UP_METRICS.includes(metric.metric_name));
                  
                  return (
                    <li key={metric.metric_name} className="flex items-center gap-2">
                      <span className={isGood ? 'text-success' : 'text-destructive'}>
                        {isGood ? '✓' : '✗'}
                      </span>
                      <span>
                        {metric.metric_name} {metric.change_direction === 'up' ? 'increased' : 'decreased'} by{' '}
                        {Math.abs(metric.change_percentage)}%
                      </span>
                    </li>
                  );
                }).filter(Boolean)}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No deployment data available for the selected periods
          </CardContent>
        </Card>
      )}
    </div>
  );
}
