import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Play, Pause, Trash2, Plus, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AVAILABLE_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'gemini-2.0-flash-exp'
];

export default function ScheduledTests() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    promptText: '',
    models: [] as string[],
    scheduleType: 'daily',
    notificationEnabled: false,
    notificationEmail: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: scheduledTests, isLoading } = useQuery({
    queryKey: ['scheduled-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_tests')
        .select('*, scheduled_test_results(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createTestMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      let nextRun = new Date(now);
      
      switch (newTest.scheduleType) {
        case 'hourly':
          nextRun.setHours(nextRun.getHours() + 1);
          break;
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }

      const { error } = await supabase
        .from('scheduled_tests')
        .insert({
          user_id: user?.id,
          name: newTest.name,
          prompt_text: newTest.promptText,
          models: newTest.models,
          schedule_type: newTest.scheduleType,
          next_run_at: nextRun.toISOString(),
          notification_enabled: newTest.notificationEnabled,
          notification_email: newTest.notificationEmail || user?.email
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-tests'] });
      setIsCreateOpen(false);
      setNewTest({
        name: '',
        promptText: '',
        models: [],
        scheduleType: 'daily',
        notificationEnabled: false,
        notificationEmail: ''
      });
      toast({
        title: "Scheduled test created",
        description: "Your test will run automatically according to the schedule."
      });
    }
  });

  const toggleTestMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('scheduled_tests')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-tests'] });
      toast({
        title: "Test updated",
        description: "Schedule status changed successfully."
      });
    }
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_tests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-tests'] });
      toast({
        title: "Test deleted",
        description: "Scheduled test removed successfully."
      });
    }
  });

  const handleModelToggle = (model: string) => {
    setNewTest(prev => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter(m => m !== model)
        : [...prev.models, model]
    }));
  };

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Clock className="h-8 w-8 text-primary" />
              Scheduled Testing
            </h1>
            <p className="text-muted-foreground">
              Automate model comparisons and track performance over time
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Scheduled Test</DialogTitle>
                <DialogDescription>
                  Set up an automated test to run at regular intervals
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Test Name</Label>
                  <Input
                    id="name"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="My automated test"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={newTest.promptText}
                    onChange={(e) => setNewTest({ ...newTest, promptText: e.target.value })}
                    placeholder="Enter the prompt to test..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Models to Compare</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_MODELS.map(model => (
                      <div key={model} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={model}
                          checked={newTest.models.includes(model)}
                          onChange={() => handleModelToggle(model)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={model} className="font-normal cursor-pointer">
                          {model}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule Frequency</Label>
                  <Select value={newTest.scheduleType} onValueChange={(value) => setNewTest({ ...newTest, scheduleType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={newTest.notificationEnabled}
                    onCheckedChange={(checked) => setNewTest({ ...newTest, notificationEnabled: checked })}
                  />
                  <Label htmlFor="notifications">Enable email notifications</Label>
                </div>

                {newTest.notificationEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Notification Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTest.notificationEmail}
                      onChange={(e) => setNewTest({ ...newTest, notificationEmail: e.target.value })}
                      placeholder={user?.email || "your@email.com"}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createTestMutation.mutate()}
                  disabled={!newTest.name || !newTest.promptText || newTest.models.length === 0}
                >
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : scheduledTests && scheduledTests.length > 0 ? (
          <div className="grid gap-4">
            {scheduledTests.map(test => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        <Badge variant={test.is_active ? 'default' : 'secondary'}>
                          {test.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Runs {test.schedule_type} • {test.models.length} models
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleTestMutation.mutate({ id: test.id, isActive: test.is_active })}
                      >
                        {test.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteTestMutation.mutate(test.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Last Run</p>
                      <p className="font-medium">
                        {test.last_run_at 
                          ? new Date(test.last_run_at).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Next Run</p>
                      <p className="font-medium">
                        {new Date(test.next_run_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Total Runs</p>
                      <p className="font-medium flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {test.scheduled_test_results?.[0]?.count || 0}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Prompt:</p>
                    <p className="text-sm mt-1 line-clamp-2">{test.prompt_text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No scheduled tests yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first scheduled test to automate model comparisons
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Schedule
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </AppLayout>
  );
}