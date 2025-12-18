import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Plus,
  Trash2,
  Clock,
  DollarSign,
  Download,
  FileJson,
  FileText,
  FileDown,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  exportBatchResultsAsJSON,
  exportBatchResultsAsCSV,
  exportBatchResultsAsMarkdown,
  BatchTestResult,
} from '@/lib/export-utils';

const MODEL_OPTIONS = [
  { key: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { key: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI' },
  { key: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI' },
  { key: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { key: 'claude-opus-4-1', name: 'Claude Opus 4.1', provider: 'Anthropic' },
  { key: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { key: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { key: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google' },
];

interface PromptItem {
  id: string;
  text: string;
}

export default function BatchTesting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prompts, setPrompts] = useState<PromptItem[]>([{ id: crypto.randomUUID(), text: '' }]);
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-5-mini', 'gemini-2.5-flash']);
  const [results, setResults] = useState<BatchTestResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isRunning, setIsRunning] = useState(false);

  const { data: savedPrompts } = useQuery({
    queryKey: ['favorite-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorite_prompts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addPrompt = () => {
    setPrompts(prev => [...prev, { id: crypto.randomUUID(), text: '' }]);
  };

  const removePrompt = (id: string) => {
    if (prompts.length > 1) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const updatePrompt = (id: string, text: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, text } : p));
  };

  const loadSavedPrompt = (promptText: string) => {
    const emptyPrompt = prompts.find(p => !p.text.trim());
    if (emptyPrompt) {
      updatePrompt(emptyPrompt.id, promptText);
    } else {
      setPrompts(prev => [...prev, { id: crypto.randomUUID(), text: promptText }]);
    }
    toast.success('Prompt loaded');
  };

  const toggleModel = (modelKey: string) => {
    setSelectedModels(prev =>
      prev.includes(modelKey) ? prev.filter(m => m !== modelKey) : [...prev, modelKey]
    );
  };

  const runBatchTest = async () => {
    const validPrompts = prompts.filter(p => p.text.trim());
    if (validPrompts.length === 0) {
      toast.error('Please add at least one prompt');
      return;
    }
    if (selectedModels.length === 0) {
      toast.error('Please select at least one model');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setProgress({ current: 0, total: validPrompts.length });

    const batchResults: BatchTestResult[] = [];

    for (let i = 0; i < validPrompts.length; i++) {
      const prompt = validPrompts[i];
      setProgress({ current: i + 1, total: validPrompts.length });

      try {
        const { data, error } = await supabase.functions.invoke('run-comparison', {
          body: { prompt: prompt.text, models: selectedModels },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Comparison failed');

        const result: BatchTestResult = {
          prompt: prompt.text,
          models: selectedModels,
          results: data.responses,
          totalCost: data.totalCost,
          totalLatency: data.totalLatency,
        };

        batchResults.push(result);
        setResults([...batchResults]);

        // Save to database
        await supabase.from('model_test_runs').insert({
          user_id: user!.id,
          prompt_text: prompt.text,
          models: selectedModels,
          responses: data.responses,
          total_cost: data.totalCost,
          total_latency_ms: data.totalLatency,
          test_type: 'batch',
        } as any);
      } catch (error) {
        console.error('Batch test error:', error);
        batchResults.push({
          prompt: prompt.text,
          models: selectedModels,
          results: selectedModels.map(m => ({
            model: m,
            output: null,
            latency: 0,
            cost: 0,
            error: error instanceof Error ? error.message : 'Failed',
          })),
          totalCost: 0,
          totalLatency: 0,
        });
        setResults([...batchResults]);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['model-comparison-history'] });
    setIsRunning(false);
    toast.success(`Batch test complete: ${batchResults.length} prompts tested`);
  };

  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
  const maxLatency = Math.max(...results.map(r => r.totalLatency), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Batch Prompt Testing</h1>
          <p className="text-muted-foreground">
            Run multiple prompts across models simultaneously and compare results
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar - Model Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Select Models</CardTitle>
                <CardDescription>Models to test each prompt against</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MODEL_OPTIONS.map((model) => (
                  <div key={model.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={model.key}
                      checked={selectedModels.includes(model.key)}
                      onCheckedChange={() => toggleModel(model.key)}
                    />
                    <Label htmlFor={model.key} className="text-sm cursor-pointer">
                      {model.name}
                      <span className="text-xs text-muted-foreground ml-1">({model.provider})</span>
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {savedPrompts && savedPrompts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Saved Prompts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedPrompts.slice(0, 5).map((saved) => (
                    <Button
                      key={saved.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs truncate"
                      onClick={() => loadSavedPrompt(saved.prompt_text)}
                    >
                      {saved.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Prompt Inputs */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Prompts to Test</CardTitle>
                    <CardDescription>Add multiple prompts to test in batch</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addPrompt}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prompt
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {prompts.map((prompt, idx) => (
                  <div key={prompt.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Prompt {idx + 1}</Label>
                      {prompts.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrompt(prompt.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder="Enter your prompt..."
                      value={prompt.text}
                      onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                      rows={3}
                    />
                  </div>
                ))}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={runBatchTest}
                    disabled={isRunning || prompts.every(p => !p.text.trim()) || selectedModels.length === 0}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing ({progress.current}/{progress.total})
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Batch Test ({prompts.filter(p => p.text.trim()).length} prompts × {selectedModels.length} models)
                      </>
                    )}
                  </Button>

                  {results.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => exportBatchResultsAsJSON(results)}>
                          <FileJson className="h-4 w-4 mr-2" />
                          Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportBatchResultsAsCSV(results)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportBatchResultsAsMarkdown(results)}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Export as Markdown
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            {isRunning && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Testing prompts...</span>
                      <span>{progress.current} / {progress.total}</span>
                    </div>
                    <Progress value={(progress.current / progress.total) * 100} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Summary */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Results Summary
                    <Badge variant="secondary">{results.length} tests</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Total Cost: <strong>${totalCost.toFixed(6)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Max Latency: <strong>{maxLatency}ms</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Results */}
            {results.map((batch, batchIdx) => (
              <Card key={batchIdx}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="outline">Test {batchIdx + 1}</Badge>
                    <span className="text-muted-foreground font-normal truncate max-w-md">
                      {batch.prompt.substring(0, 60)}...
                    </span>
                  </CardTitle>
                  <CardDescription className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />${batch.totalCost.toFixed(6)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{batch.totalLatency}ms
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {batch.results.map((result) => {
                      const modelInfo = MODEL_OPTIONS.find(m => m.key === result.model);
                      return (
                        <Card key={result.model} className={result.error ? 'border-destructive' : ''}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{modelInfo?.name || result.model}</CardTitle>
                              {result.error ? (
                                <XCircle className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>{result.latency}ms</span>
                              <span>${result.cost.toFixed(6)}</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {result.error ? (
                              <p className="text-sm text-destructive">{result.error}</p>
                            ) : (
                              <p className="text-sm line-clamp-4">{result.output}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
