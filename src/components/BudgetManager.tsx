import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Bell, Check, Plus, Trash2 } from "lucide-react";
import { useDeploymentBudgets, useDeploymentAlerts, useCreateBudget, useDeleteBudget, useAcknowledgeAlert } from "@/hooks/useDeploymentBudget";
import { formatDistanceToNow } from "date-fns";
import type { DeploymentBudget, DeploymentAlert } from "@/types/deployment";

export function BudgetManager() {
  const { data: budgets } = useDeploymentBudgets();
  const { data: alerts } = useDeploymentAlerts(false);
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();
  const acknowledgeAlert = useAcknowledgeAlert();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    budget_type: 'deployment_count' as const,
    period: 'daily' as const,
    limit_value: 10,
    alert_threshold: 0.8,
    email_notifications_enabled: true,
    notification_email: '',
  });

  const handleSubmit = () => {
    createBudget.mutate({
      ...formData,
      period_start: new Date().toISOString(),
    });
    setShowForm(false);
    setFormData({
      budget_type: 'deployment_count',
      period: 'daily',
      limit_value: 10,
      alert_threshold: 0.8,
      email_notifications_enabled: true,
      notification_email: '',
    });
  };

  const getProgressColor = (current: number, limit: number) => {
    const ratio = current / limit;
    if (ratio >= 1) return 'bg-destructive';
    if (ratio >= 0.8) return 'bg-warning';
    return 'bg-success';
  };

  const getAlertBadge = (alertType: string) => {
    switch (alertType) {
      case 'exceeded':
        return <Badge variant="destructive">Exceeded</Badge>;
      case 'critical':
        return <Badge className="bg-warning text-warning-foreground">Critical</Badge>;
      default:
        return <Badge variant="secondary">Warning</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Active Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {getAlertBadge(alert.alert_type)}
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeAlert.mutate({ id: alert.id, acknowledgedBy: 'user' })}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Acknowledge
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deployment Budgets</CardTitle>
              <CardDescription>Set limits on deployment frequency and costs</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Form */}
          {showForm && (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Type</Label>
                  <Select
                    value={formData.budget_type}
                    onValueChange={(v) => setFormData({ ...formData, budget_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deployment_count">Deployment Count</SelectItem>
                      <SelectItem value="deployment_cost">Deployment Cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(v) => setFormData({ ...formData, period: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limit Value</Label>
                  <Input
                    type="number"
                    value={formData.limit_value}
                    onChange={(e) => setFormData({ ...formData, limit_value: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alert Threshold (%)</Label>
                  <Input
                    type="number"
                    value={formData.alert_threshold * 100}
                    onChange={(e) => setFormData({ ...formData, alert_threshold: Number(e.target.value) / 100 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.email_notifications_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, email_notifications_enabled: checked })}
                  />
                  <Label>Email Notifications</Label>
                </div>
                {formData.email_notifications_enabled && (
                  <Input
                    type="email"
                    placeholder="notification@example.com"
                    value={formData.notification_email}
                    onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                    className="flex-1"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={createBudget.isPending}>
                  Create Budget
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Budget Cards */}
          {budgets?.map((budget) => (
            <div key={budget.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {budget.budget_type === 'deployment_count' ? 'Count' : 'Cost'}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {budget.period}
                  </Badge>
                  {budget.email_notifications_enabled && (
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteBudget.mutate(budget.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {budget.current_value} / {budget.limit_value}
                    {budget.budget_type === 'deployment_count' ? ' deployments' : ' points'}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round((budget.current_value / budget.limit_value) * 100)}%
                  </span>
                </div>
                <Progress
                  value={Math.min((budget.current_value / budget.limit_value) * 100, 100)}
                  className={`h-2 ${getProgressColor(budget.current_value, budget.limit_value)}`}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Alert at {budget.alert_threshold * 100}% • Period started{' '}
                {formatDistanceToNow(new Date(budget.period_start), { addSuffix: true })}
              </p>
            </div>
          ))}

          {!budgets?.length && !showForm && (
            <p className="text-center text-muted-foreground py-8">
              No budgets configured. Create one to start tracking deployment limits.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
