import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { FavoritePromptsDialog } from '@/components/FavoritePromptsDialog';
import { ComparisonChart } from '@/components/ComparisonChart';
import { ABTestDialog } from '@/components/ABTestDialog';
import { CostTracker } from '@/components/CostTracker';
import { ShareDialog } from '@/components/ShareDialog';
import { AIInsights } from '@/components/AIInsights';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Play, Clock, DollarSign, Zap, History, FileJson, FileText } from 'lucide-react';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-5', 'claude-sonnet-4-5', 'gemini-2.5-flash']);
  const [results, setResults] = useState<ModelResult[] | null>(null);
  const [useStreaming, setUseStreaming] = useState(false);
  const [streamingResults, setStreamingResults] = useState<Map<string, Partial<ModelResult>>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const [abTestVariations, setABTestVariations] = useState<any[]>([]);
  const [runningABTest, setRunningABTest] = useState(false);

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
      if (selectedModels.length === 0) throw new Error('Please select at least one model');

      const { data, error } = await supabase.functions.invoke('run-comparison', {
        body: { prompt, models: selectedModels },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Comparison failed');
      return data;
    },
    onSuccess: async (data) => {
      setResults(data.responses);
      
      await supabase.from('model_test_runs').insert({
        user_id: user!.id,
        prompt_text: prompt,
        models: selectedModels,
        responses: data.responses,
        total_cost: data.totalCost,
        total_latency_ms: data.totalLatency,
      } as any);

      queryClient.invalidateQueries({ queryKey: ['model-comparison-history'] });
      toast.success('Comparison complete!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to run comparison');
    },
  });

  const runStreamingComparison = async () => {
    if (selectedModels.length === 0) {
      toast.error('Please select at least one model');
      return;
    }

    setIsStreaming(true);
    const initialResults = new Map<string, Partial<ModelResult>>();
    selectedModels.forEach(model => {
      initialResults.set(model, { model, output: '', inputTokens: 0, outputTokens: 0, latency: 0, cost: 0, error: null });
    });
    setStreamingResults(initialResults);
    setResults(null);

    try {
      const response = await fetch('https://pocnysyzkbluasjwgcqy.supabase.co/functions/v1/run-comparison-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: selectedModels }),
      });

      if (!response.ok) throw new Error('Stream failed');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            setStreamingResults(prev => {
              const updated = new Map(prev);
              const current = updated.get(data.model) || {};

              if (data.type === 'delta') {
                updated.set(data.model, { ...current, output: (current.output || '') + data.content });
              } else if (data.type === 'complete') {
                updated.set(data.model, {
                  model: data.model,
                  output: data.output,
                  inputTokens: data.inputTokens,
                  outputTokens: data.outputTokens,
                  latency: data.latency,
                  cost: data.cost,
                  error: null,
                });
              } else if (data.type === 'error') {
                updated.set(data.model, { ...current, error: data.error, latency: data.latency });
              }

              return updated;
            });
          } catch (e) {
            console.error('Error parsing SSE:', e);
          }
        }
      }

      setStreamingResults(prev => {
        const finalResults = Array.from(prev.values()) as ModelResult[];
        setResults(finalResults);
        
        const totalCost = finalResults.reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalLatency = Math.max(...finalResults.map(r => r.latency || 0));
        
        supabase.from('model_test_runs').insert({
          user_id: user!.id,
          prompt_text: prompt,
          models: selectedModels,
          responses: finalResults,
          total_cost: totalCost,
          total_latency_ms: totalLatency,
        } as any);

        queryClient.invalidateQueries({ queryKey: ['model-comparison-history'] });
        return prev;
      });

      toast.success('Streaming comparison complete!');
    } catch (error) {
      console.error('Streaming error:', error);
      toast.error('Streaming comparison failed');
    } finally {
      setIsStreaming(false);
    }
  };

  const runABTest = async (variations: any[]) => {
    setRunningABTest(true);
    setABTestVariations(variations);
    
    try {
      const parentTestId = crypto.randomUUID();
      
      for (const variation of variations) {
        const { data, error } = await supabase.functions.invoke('run-comparison', {
          body: { prompt: variation.prompt, models: selectedModels },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Comparison failed');

        await supabase.from('model_test_runs').insert({
          user_id: user!.id,
          prompt_text: variation.prompt,
          models: selectedModels,
          responses: data.responses,
          total_cost: data.totalCost,
          total_latency_ms: data.totalLatency,
          test_type: 'ab_test',
          variation_name: variation.name,
          parent_test_id: parentTestId,
        } as any);
      }

      queryClient.invalidateQueries({ queryKey: ['model-comparison-history'] });
      toast.success(`A/B test completed with ${variations.length} variations!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'A/B test failed');
    } finally {
      setRunningABTest(false);
    }
  };

  const exportResults = (format: 'json' | 'csv') => {
    if (!displayResults) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(displayResults, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `model-comparison-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Exported as JSON');
    } else {
      const headers = ['Model', 'Latency (ms)', 'Cost ($)', 'Input Tokens', 'Output Tokens', 'Error'];
      const rows = displayResults.map(r => [
        r.model,
        r.latency,
        r.cost.toFixed(6),
        r.inputTokens,
        r.outputTokens,
        r.error || '',
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `model-comparison-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Exported as CSV');
    }
  };

  const toggleModel = (modelKey: string) => {
    setSelectedModels(prev => prev.includes(modelKey) ? prev.filter(m => m !== modelKey) : [...prev, modelKey]);
  };

  const displayResults = useStreaming && streamingResults.size > 0 
    ? Array.from(streamingResults.values()) as ModelResult[]
    : results;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Model Comparison</h1>
          <p className="text-muted-foreground">
            Compare AI models side-by-side with A/B testing, cost tracking, and AI insights
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px] mb-6">
          <div />
          <div className="space-y-4">
            <CostTracker />
            <AIInsights />
          </div>
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
                        <Label htmlFor={model.key} className="text-sm font-medium cursor-pointer">
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

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Prompt Input</CardTitle>
                        <CardDescription>Test prompt across selected models</CardDescription>
                      </div>
                      <FavoritePromptsDialog
                        onSelectPrompt={(p, m) => {
                          setPrompt(p);
                          if (m.length > 0) setSelectedModels(m);
                        }}
                        currentPrompt={prompt}
                        currentModels={selectedModels}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Enter your prompt here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Switch id="streaming" checked={useStreaming} onCheckedChange={setUseStreaming} />
                      <Label htmlFor="streaming" className="cursor-pointer">
                        Real-time streaming
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => useStreaming ? runStreamingComparison() : runComparisonMutation.mutate()}
                        disabled={runComparisonMutation.isPending || isStreaming || !prompt.trim() || selectedModels.length === 0}
                        className="flex-1"
                      >
                        {(runComparisonMutation.isPending || isStreaming) ? 'Running...' : (
                          <><Play className="h-4 w-4 mr-2" />Run Comparison</>
                        )}
                      </Button>

                      <ABTestDialog onRunTest={runABTest} isRunning={runningABTest} />

                      {displayResults && (
                        <>
                          <Button variant="outline" onClick={() => exportResults('json')}>
                            <FileJson className="h-4 w-4 mr-2" />JSON
                          </Button>
                          <Button variant="outline" onClick={() => exportResults('csv')}>
                            <FileText className="h-4 w-4 mr-2" />CSV
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {displayResults && displayResults.length > 0 && (
                  <ComparisonChart results={displayResults} />
                )}

                {displayResults && (
                  <div className="grid gap-4">
                    {displayResults.map((result) => {
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
                                  <span>Input: {result.inputTokens}</span>
                                  <span>Output: {result.outputTokens}</span>
                                  <span>Total: {result.inputTokens + result.outputTokens}</span>
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
                      <div className="flex items-center gap-2 mb-2">
                        <CardDescription>
                          {new Date(run.created_at).toLocaleString()}
                        </CardDescription>
                        {run.variation_name && (
                          <Badge variant="outline">{run.variation_name}</Badge>
                        )}
                        {run.test_type === 'ab_test' && (
                          <Badge variant="secondary">A/B Test</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {run.prompt_text}
                      </CardTitle>
                    </div>
                    <div className="flex flex-col gap-2">
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
                      <ShareDialog testRunId={run.id} />
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
                  No comparison history yet
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
