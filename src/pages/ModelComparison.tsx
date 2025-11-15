import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Clock, DollarSign, Zap, History } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ModelResult {
  model: string;
  output: string | null;
  inputTokens: number;
  outputTokens: number;
  latency: number;
  cost: number;
  error: string | null;
}

const MODEL_OPTIONS = [
  { key: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', description: 'Most capable GPT model' },
  { key: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', description: 'Faster, cost-efficient' },
  { key: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', description: 'Fastest, cheapest' },
  { key: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: 'Superior reasoning' },
  { key: 'claude-opus-4-1', name: 'Claude Opus 4.1', provider: 'Anthropic', description: 'Highly intelligent' },
  { key: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Top-tier reasoning' },
  { key: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Balanced performance' },
  { key: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google', description: 'Fast classification' },
];

export default function ModelComparison() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-5', 'claude-sonnet-4-5', 'gemini-2.5-flash']);
  const [results, setResults] = useState<ModelResult[] | null>(null);

  const { data: history } = useQuery({
    queryKey: ['model-comparison-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_test_runs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const runComparisonMutation = useMutation({
    mutationFn: async () => {
      if (selectedModels.length === 0) {
        throw new Error('Please select at least one model');
      }

      const { data, error } = await supabase.functions.invoke('run-comparison', {
        body: {
          prompt,
          models: selectedModels,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Comparison failed');

      return data;
    },
    onSuccess: async (data) => {
      setResults(data.responses);
      
      // Save to database
      await supabase.from('model_test_runs').insert({
        user_id: user!.id,
        prompt_text: prompt,
        models: selectedModels,
        responses: data.responses,
        total_cost: data.totalCost,
        total_latency_ms: data.totalLatency,
      });

      toast.success('Comparison complete!');
    },
    onError: (error) => {
      console.error('Comparison error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run comparison');
    },
  });

  const toggleModel = (modelKey: string) => {
    setSelectedModels(prev => 
      prev.includes(modelKey) 
        ? prev.filter(m => m !== modelKey)
        : [...prev, modelKey]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Model Comparison</h1>
          <p className="text-muted-foreground">
            Run the same prompt across multiple AI models and compare results, speed, and cost
          </p>
        </div>

        <Tabs defaultValue="compare" className="space-y-6">
          <TabsList>
            <TabsTrigger value="compare">
              <Zap className="h-4 w-4 mr-2" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compare" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              {/* Model Selection Sidebar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Select Models</CardTitle>
                  <CardDescription>Choose models to compare</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MODEL_OPTIONS.map((model) => (
                    <div key={model.key} className="flex items-start space-x-2">
                      <Checkbox
                        id={model.key}
                        checked={selectedModels.includes(model.key)}
                        onCheckedChange={() => toggleModel(model.key)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={model.key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {model.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {model.provider} • {model.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prompt Input</CardTitle>
                    <CardDescription>
                      Enter a prompt to test across selected models
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Enter your prompt here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <Button
                      onClick={() => runComparisonMutation.mutate()}
                      disabled={runComparisonMutation.isPending || !prompt.trim() || selectedModels.length === 0}
                      className="w-full"
                    >
                      {runComparisonMutation.isPending ? (
                        <>Running comparison...</>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Comparison
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Results */}
                {results && (
                  <div className="grid gap-4">
                    {results.map((result) => {
                      const modelInfo = MODEL_OPTIONS.find(m => m.key === result.model);
                      
                      return (
                        <Card key={result.model} className={result.error ? 'border-destructive' : ''}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {modelInfo?.name || result.model}
                                  {result.error && <Badge variant="destructive">Error</Badge>}
                                </CardTitle>
                                <CardDescription>{modelInfo?.provider}</CardDescription>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{result.latency}ms</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span>${result.cost.toFixed(6)}</span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {result.error ? (
                              <div className="text-destructive text-sm">{result.error}</div>
                            ) : (
                              <>
                                <div className="prose prose-sm max-w-none mb-4">
                                  <pre className="whitespace-pre-wrap break-words bg-muted p-4 rounded-lg text-sm">
                                    {result.output}
                                  </pre>
                                </div>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>Input tokens: {result.inputTokens}</span>
                                  <span>Output tokens: {result.outputTokens}</span>
                                  <span>Total tokens: {result.inputTokens + result.outputTokens}</span>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {history?.map((run) => (
              <Card key={run.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardDescription className="mb-2">
                        {new Date(run.created_at).toLocaleString()}
                      </CardDescription>
                      <CardTitle className="text-base line-clamp-2">
                        {run.prompt_text}
                      </CardTitle>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{run.total_latency_ms}ms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${run.total_cost?.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {run.models.map((model: string) => (
                      <Badge key={model} variant="secondary">
                        {MODEL_OPTIONS.find(m => m.key === model)?.name || model}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {history?.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No comparison history yet. Run your first comparison to see results here.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
