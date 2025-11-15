import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ModelResult {
  model: string;
  latency: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  error: string | null;
}

interface ComparisonChartProps {
  results: ModelResult[];
}

export function ComparisonChart({ results }: ComparisonChartProps) {
  const validResults = results.filter(r => !r.error);

  const costData = validResults.map(r => ({
    name: r.model,
    cost: parseFloat((r.cost * 1000).toFixed(4)), // Convert to cost per 1K requests
  }));

  const latencyData = validResults.map(r => ({
    name: r.model,
    latency: r.latency,
  }));

  const tokenData = validResults.map(r => ({
    name: r.model,
    input: r.inputTokens,
    output: r.outputTokens,
    total: r.inputTokens + r.outputTokens,
  }));

  const scatterData = validResults.map(r => ({
    name: r.model,
    cost: r.cost * 1000,
    latency: r.latency,
    tokens: r.inputTokens + r.outputTokens,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analysis</CardTitle>
        <CardDescription>
          Visual comparison of model performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="latency" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="latency">Latency</TabsTrigger>
            <TabsTrigger value="cost">Cost</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="scatter">Cost vs Speed</TabsTrigger>
          </TabsList>

          <TabsContent value="latency" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="latency" fill="hsl(var(--primary))" name="Response Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Cost per 1K requests ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
                <Legend />
                <Bar dataKey="cost" fill="hsl(var(--chart-2))" name="Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tokenData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Token Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="input" fill="hsl(var(--chart-3))" name="Input Tokens" stackId="a" />
                <Bar dataKey="output" fill="hsl(var(--chart-4))" name="Output Tokens" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="scatter" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="latency"
                  name="Latency"
                  unit="ms"
                  label={{ value: 'Response Time (ms)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="cost"
                  name="Cost"
                  label={{ value: 'Cost per 1K ($)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'cost') return `$${value.toFixed(4)}`;
                    return value;
                  }}
                  labelFormatter={(label) => `Model: ${label}`}
                />
                <Legend />
                <Scatter
                  name="Models"
                  data={scatterData}
                  fill="hsl(var(--primary))"
                  label={{ dataKey: 'name', position: 'top' }}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground text-center">
              Lower-left quadrant = Best value (fast and cheap)
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
