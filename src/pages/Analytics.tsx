import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">Comprehensive insights into your API usage and performance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Coming Soon</CardTitle>
          <CardDescription>Advanced analytics features are being developed</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Track your API usage, costs, model performance, and more. This dashboard will provide detailed insights into your prompt engineering workflow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
