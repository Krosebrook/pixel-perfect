import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Key, Copy, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AVAILABLE_SCOPES = [
  { id: 'run-comparison', name: 'Model Comparison' },
  { id: 'run-comparison-stream', name: 'Streaming Comparison' },
  { id: 'generate-insights', name: 'Generate Insights' },
  { id: 'generate-prompt', name: 'Generate Prompts' },
  { id: 'optimize-prompt', name: 'Optimize Prompts' },
  { id: 'validate-quality', name: 'Validate Quality' },
  { id: 'apply-template', name: 'Apply Templates' },
];

export default function ApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    scopes: [] as string[],
    environmentMode: 'sandbox',
    expiresInDays: 90,
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'list' }
      });
      if (error) throw error;
      return data.keys;
    },
    enabled: !!user,
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'create',
          ...newKeyData,
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedKey(data.apiKey);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: "API Key Created",
        description: "Save this key securely - you won't see it again!",
      });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'revoke', keyId }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: "API Key Revoked",
        description: "The key has been permanently deleted.",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8" />
            API Keys
          </h1>
          <p className="text-muted-foreground">Manage your API keys for external access</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for programmatic access to UPGE APIs
              </DialogDescription>
            </DialogHeader>

            {generatedKey ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Save This Key!</AlertTitle>
                <AlertDescription>
                  <p className="mb-4">This is the only time you'll see the full key:</p>
                  <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                    <code className="text-sm">{generatedKey}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    className="mt-4 w-full" 
                    onClick={() => {
                      setGeneratedKey(null);
                      setIsCreateOpen(false);
                      setNewKeyData({ name: '', scopes: [], environmentMode: 'sandbox', expiresInDays: 90 });
                    }}
                  >
                    Done
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    placeholder="My Production Key"
                    value={newKeyData.name}
                    onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Environment</Label>
                  <Select
                    value={newKeyData.environmentMode}
                    onValueChange={(value) => setNewKeyData({ ...newKeyData, environmentMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Permissions (Scopes)</Label>
                  <div className="space-y-2 mt-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <div key={scope.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={scope.id}
                          checked={newKeyData.scopes.includes(scope.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewKeyData({
                                ...newKeyData,
                                scopes: [...newKeyData.scopes, scope.id]
                              });
                            } else {
                              setNewKeyData({
                                ...newKeyData,
                                scopes: newKeyData.scopes.filter(s => s !== scope.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={scope.id} className="text-sm cursor-pointer">
                          {scope.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Expires In (Days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={newKeyData.expiresInDays}
                    onChange={(e) => setNewKeyData({ ...newKeyData, expiresInDays: parseInt(e.target.value) })}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => createKeyMutation.mutate()}
                  disabled={!newKeyData.name || newKeyData.scopes.length === 0 || createKeyMutation.isPending}
                >
                  {createKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {apiKeys?.map((key: any) => (
          <Card key={key.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {key.name}
                    <Badge variant={key.environment_mode === 'production' ? 'default' : 'secondary'}>
                      {key.environment_mode}
                    </Badge>
                    {!key.is_active && <Badge variant="destructive">Inactive</Badge>}
                  </CardTitle>
                  <CardDescription>
                    <code className="text-xs">{key.key_prefix}...</code>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeKeyMutation.mutate(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <strong>Scopes:</strong> {key.scopes.join(', ')}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(key.created_at).toLocaleDateString()}
                </div>
                {key.last_used_at && (
                  <div>
                    <strong>Last used:</strong> {new Date(key.last_used_at).toLocaleDateString()}
                  </div>
                )}
                {key.expires_at && (
                  <div>
                    <strong>Expires:</strong> {new Date(key.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {apiKeys?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No API keys yet. Create one to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
