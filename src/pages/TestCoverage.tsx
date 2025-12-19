import React, { useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  FileCode,
  TestTube2,
  Monitor,
  Eye,
  Shield,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Mock data - in production, this would come from CI/CD artifacts
const coverageData = {
  unit: {
    overall: 78.5,
    statements: 82.3,
    branches: 71.2,
    functions: 85.1,
    lines: 79.8,
    trend: 2.3,
    files: 156,
    passing: 342,
    failing: 3,
    skipped: 12,
    duration: '45s',
  },
  integration: {
    overall: 65.2,
    scenarios: 28,
    passing: 26,
    failing: 1,
    skipped: 1,
    duration: '2m 15s',
    trend: -1.2,
  },
  e2e: {
    overall: 72.8,
    tests: 45,
    passing: 43,
    failing: 1,
    skipped: 1,
    browsers: ['chromium', 'firefox', 'webkit'],
    duration: '5m 30s',
    trend: 5.1,
  },
  visual: {
    snapshots: 89,
    changed: 3,
    approved: 86,
    pending: 0,
    chromatic: true,
    percy: true,
  },
};

const coverageByModule = [
  { name: 'Components', coverage: 85, files: 45 },
  { name: 'Hooks', coverage: 92, files: 18 },
  { name: 'Services', coverage: 78, files: 8 },
  { name: 'Pages', coverage: 65, files: 22 },
  { name: 'Utils', coverage: 88, files: 12 },
  { name: 'Contexts', coverage: 72, files: 5 },
];

const coverageHistory = [
  { date: 'Week 1', unit: 65, integration: 55, e2e: 60 },
  { date: 'Week 2', unit: 68, integration: 58, e2e: 62 },
  { date: 'Week 3', unit: 72, integration: 60, e2e: 65 },
  { date: 'Week 4', unit: 75, integration: 62, e2e: 68 },
  { date: 'Week 5', unit: 76, integration: 64, e2e: 70 },
  { date: 'Week 6', unit: 78.5, integration: 65.2, e2e: 72.8 },
];

const testDistribution = [
  { name: 'Unit Tests', value: 342, color: 'hsl(var(--primary))' },
  { name: 'Integration Tests', value: 28, color: 'hsl(var(--secondary))' },
  { name: 'E2E Tests', value: 45, color: 'hsl(var(--accent))' },
  { name: 'Visual Tests', value: 89, color: 'hsl(var(--muted))' },
];

const CoverageCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  trend?: number;
  description?: string;
}) => {
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend && trend > 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}%</div>
          {trend !== undefined && (
            <div className={`flex items-center text-xs ${trendColor}`}>
              <TrendIcon className="h-3 w-3 mr-1" aria-hidden="true" />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <Progress 
          value={value} 
          className="mt-2" 
          aria-label={`${title} progress: ${value}%`}
        />
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
});

CoverageCard.displayName = 'CoverageCard';

const TestStatusCard = React.memo(({ 
  title, 
  passing, 
  failing, 
  skipped, 
  duration 
}: { 
  title: string; 
  passing: number; 
  failing: number; 
  skipped: number; 
  duration: string;
}) => {
  const total = passing + failing + skipped;
  const passRate = ((passing / total) * 100).toFixed(1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {total} tests • {duration}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
              <span className="text-sm">Passing</span>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500">
              {passing}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
              <span className="text-sm">Failing</span>
            </div>
            <Badge variant="outline" className="bg-red-500/10 text-red-500">
              {failing}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" aria-hidden="true" />
              <span className="text-sm">Skipped</span>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
              {skipped}
            </Badge>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pass Rate</span>
              <span className="text-lg font-bold">{passRate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TestStatusCard.displayName = 'TestStatusCard';

export default function TestCoverage() {
  const chartColors = useMemo(() => ({
    unit: 'hsl(var(--primary))',
    integration: 'hsl(var(--secondary))',
    e2e: 'hsl(var(--accent))',
  }), []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8" role="main" aria-label="Test Coverage Dashboard">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Coverage Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor unit, integration, E2E, and visual regression test metrics
          </p>
        </header>

        {/* Overview Cards */}
        <section aria-label="Coverage Overview" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <CoverageCard 
            title="Unit Test Coverage" 
            value={coverageData.unit.overall} 
            icon={TestTube2}
            trend={coverageData.unit.trend}
            description={`${coverageData.unit.files} files tested`}
          />
          <CoverageCard 
            title="Integration Coverage" 
            value={coverageData.integration.overall} 
            icon={FileCode}
            trend={coverageData.integration.trend}
            description={`${coverageData.integration.scenarios} scenarios`}
          />
          <CoverageCard 
            title="E2E Coverage" 
            value={coverageData.e2e.overall} 
            icon={Monitor}
            trend={coverageData.e2e.trend}
            description={`${coverageData.e2e.browsers.length} browsers`}
          />
          <CoverageCard 
            title="Visual Coverage" 
            value={Math.round((coverageData.visual.approved / coverageData.visual.snapshots) * 100)} 
            icon={Eye}
            description={`${coverageData.visual.snapshots} snapshots`}
          />
        </section>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList aria-label="Test coverage sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="unit">Unit Tests</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="e2e">E2E Tests</TabsTrigger>
            <TabsTrigger value="visual">Visual Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Coverage History Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Trend</CardTitle>
                  <CardDescription>Weekly coverage progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]" role="img" aria-label="Coverage trend chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={coverageHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis domain={[50, 100]} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="unit" stroke={chartColors.unit} name="Unit" />
                        <Line type="monotone" dataKey="integration" stroke={chartColors.integration} name="Integration" />
                        <Line type="monotone" dataKey="e2e" stroke={chartColors.e2e} name="E2E" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Test Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Distribution</CardTitle>
                  <CardDescription>Tests by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]" role="img" aria-label="Test distribution chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={testDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {testDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coverage by Module */}
            <Card>
              <CardHeader>
                <CardTitle>Coverage by Module</CardTitle>
                <CardDescription>Code coverage breakdown by source folder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" role="img" aria-label="Coverage by module chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coverageByModule} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                        formatter={(value: number) => [`${value}%`, 'Coverage']}
                      />
                      <Bar 
                        dataKey="coverage" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unit" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Statements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{coverageData.unit.statements}%</div>
                  <Progress value={coverageData.unit.statements} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Branches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{coverageData.unit.branches}%</div>
                  <Progress value={coverageData.unit.branches} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Functions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{coverageData.unit.functions}%</div>
                  <Progress value={coverageData.unit.functions} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Lines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{coverageData.unit.lines}%</div>
                  <Progress value={coverageData.unit.lines} className="mt-2" />
                </CardContent>
              </Card>
            </div>
            
            <TestStatusCard 
              title="Unit Test Results"
              passing={coverageData.unit.passing}
              failing={coverageData.unit.failing}
              skipped={coverageData.unit.skipped}
              duration={coverageData.unit.duration}
            />
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <TestStatusCard 
              title="Integration Test Results"
              passing={coverageData.integration.passing}
              failing={coverageData.integration.failing}
              skipped={coverageData.integration.skipped}
              duration={coverageData.integration.duration}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Test Scenarios</CardTitle>
                <CardDescription>Critical user flows tested</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" role="list">
                  {[
                    { name: 'User Authentication Flow', status: 'pass' },
                    { name: 'Prompt Creation & Save', status: 'pass' },
                    { name: 'Model Comparison Workflow', status: 'pass' },
                    { name: 'Analytics Dashboard Load', status: 'fail' },
                    { name: 'Template Application', status: 'pass' },
                  ].map((scenario) => (
                    <li key={scenario.name} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm">{scenario.name}</span>
                      {scenario.status === 'pass' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Passed" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" aria-label="Failed" />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="e2e" className="space-y-6">
            <TestStatusCard 
              title="E2E Test Results"
              passing={coverageData.e2e.passing}
              failing={coverageData.e2e.failing}
              skipped={coverageData.e2e.skipped}
              duration={coverageData.e2e.duration}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Browser Coverage</CardTitle>
                <CardDescription>Cross-browser test execution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {coverageData.e2e.browsers.map((browser) => (
                    <div key={browser} className="flex items-center gap-3 p-4 rounded-lg border">
                      <Monitor className="h-8 w-8 text-primary" aria-hidden="true" />
                      <div>
                        <div className="font-medium capitalize">{browser}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(coverageData.e2e.passing / coverageData.e2e.browsers.length)} tests
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" aria-label="Active" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visual" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Chromatic
                  </CardTitle>
                  <CardDescription>Storybook visual regression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Snapshots</span>
                      <Badge variant="outline">{coverageData.visual.snapshots}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Changes Detected</span>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        {coverageData.visual.changed}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Approved</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        {coverageData.visual.approved}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Percy
                  </CardTitle>
                  <CardDescription>Cross-browser visual testing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Browsers Tested</span>
                      <Badge variant="outline">4</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Viewport Widths</span>
                      <Badge variant="outline">4</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Comparisons</span>
                      <Badge variant="outline">{coverageData.visual.snapshots * 4}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {coverageData.visual.changed > 0 && (
              <Card className="border-yellow-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="h-5 w-5" />
                    Pending Visual Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {coverageData.visual.changed} visual changes detected and need review.
                  </p>
                  <ul className="space-y-2">
                    {['Button hover state', 'Card shadow update', 'Typography spacing'].map((change) => (
                      <li key={change} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
