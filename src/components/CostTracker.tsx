import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DollarSign, AlertTriangle, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CostTracker() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState("100");
  const [alertThreshold, setAlertThreshold] = useState("80");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadBudget();
    }
  }, [user]);

  const loadBudget = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBudget(data);
        setMonthlyBudget(data.monthly_budget.toString());
        setAlertThreshold((data.alert_threshold * 100).toString());
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetSettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_budgets')
        .upsert({
          user_id: user.id,
          monthly_budget: parseFloat(monthlyBudget),
          alert_threshold: parseFloat(alertThreshold) / 100,
          period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        });

      if (error) throw error;

      toast.success("Budget settings saved");
      setSettingsOpen(false);
      loadBudget();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error("Failed to save budget settings");
    }
  };

  if (loading) return null;

  const spendingPercent = budget ? (parseFloat(budget.current_spending) / parseFloat(budget.monthly_budget)) * 100 : 0;
  const isOverThreshold = budget && spendingPercent >= (budget.alert_threshold * 100);
  const isOverBudget = spendingPercent >= 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Cost Tracking</CardTitle>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Budget Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthly-budget">Monthly Budget ($)</Label>
                  <Input
                    id="monthly-budget"
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    min="0"
                    step="10"
                  />
                </div>
                <div>
                  <Label htmlFor="alert-threshold">Alert Threshold (%)</Label>
                  <Input
                    id="alert-threshold"
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
                <Button onClick={saveBudgetSettings} className="w-full">
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          This month's API spending
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-medium">
              ${budget ? parseFloat(budget.current_spending).toFixed(4) : '0.00'} / ${budget ? parseFloat(budget.monthly_budget).toFixed(2) : '100.00'}
            </span>
          </div>
          <Progress value={spendingPercent} className={isOverBudget ? "bg-destructive" : isOverThreshold ? "bg-warning" : ""} />
        </div>
        {isOverBudget && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Budget Exceeded</p>
              <p className="text-muted-foreground">You've exceeded your monthly budget. Consider adjusting your usage or increasing your limit.</p>
            </div>
          </div>
        )}
        {!isOverBudget && isOverThreshold && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Approaching Limit</p>
              <p className="text-muted-foreground">You've used {spendingPercent.toFixed(0)}% of your monthly budget.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
