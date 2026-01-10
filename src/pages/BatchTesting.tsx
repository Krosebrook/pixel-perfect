import { useState, useCallback, useMemo, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
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
import { MODEL_OPTIONS } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

interface PromptItem {
  id: string;
  text: string;
}

interface ModelResultProps {
  result: {
    model: string;
    output: string | null;
    latency: number;
    cost: number;
    error?: string;
  };
}

interface BatchResultCardProps {
  batch: BatchTestResult;
  batchIndex: number;
}

interface ModelSelectorProps {
  selectedModels: string[];
  onToggle: (modelKey: string) => void;
}

interface PromptInputProps {
  prompt: PromptItem;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

// ============================================================================
// Memoized Sub-Components
// ============================================================================

const ModelResult = memo(function ModelResult({ result }: ModelResultProps) {
  const modelInfo = useMemo(
    () => MODEL_OPTIONS.find(m => m.key === result.model),
    [result.model]
  );

  return (
    <Card 
      className={result.error ? 'border-destructive' : ''}
      role="article"
      aria-label={`Result for ${modelInfo?.name || result.model}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{modelInfo?.name || result.model}</CardTitle>
          {result.error ? (
            <XCircle className="h-4 w-4 text-destructive" aria-label="Error" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Success" />
          )}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground" aria-label="Metrics">
          <span aria-label={`Latency: ${result.latency} milliseconds`}>{result.latency}ms</span>
          <span aria-label={`Cost: $${result.cost.toFixed(6)}`}>${result.cost.toFixed(6)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {result.error ? (
          <p className="text-sm text-destructive" role="alert">{result.error}</p>
        ) : (
          <p className="text-sm line-clamp-4">{result.output}</p>
        )}
      </CardContent>
    </Card>
  );
});

const BatchResultCard = memo(function BatchResultCard({ batch, batchIndex }: BatchResultCardProps) {
  return (
    <Card role="region" aria-labelledby={`batch-result-${batchIndex}`}>
      <CardHeader>
        <CardTitle id={`batch-result-${batchIndex}`} className="text-sm flex items-center gap-2">
          <Badge variant="outline">Test {batchIndex + 1}</Badge>
          <span className="text-muted-foreground font-normal truncate max-w-md">
            {batch.prompt.substring(0, 60)}...
          </span>
        </CardTitle>
        <CardDescription className="flex gap-4">
          <span className="flex items-center gap-1" aria-label={`Cost: $${batch.totalCost.toFixed(6)}`}>
            <DollarSign className="h-3 w-3" aria-hidden="true" />${batch.totalCost.toFixed(6)}
          </span>
          <span className="flex items-center gap-1" aria-label={`Latency: ${batch.totalLatency} milliseconds`}>
            <Clock className="h-3 w-3" aria-hidden="true" />{batch.totalLatency}ms
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Model results">
          {batch.results.map((result) => (
            <ModelResult key={result.model} result={result} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const ModelSelector = memo(function ModelSelector({ selectedModels, onToggle }: ModelSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm" id="model-selection-title">Select Models</CardTitle>
        <CardDescription>Models to test each prompt against</CardDescription>
      </CardHeader>
      <CardContent 
        className="space-y-3" 
        role="group" 
        aria-labelledby="model-selection-title"
      >
        {MODEL_OPTIONS.map((model) => (
          <div key={model.key} className="flex items-center space-x-2">
            <Checkbox
              id={model.key}
              checked={selectedModels.includes(model.key)}
              onCheckedChange={() => onToggle(model.key)}
              aria-describedby={`${model.key}-provider`}
            />
            <Label htmlFor={model.key} className="text-sm cursor-pointer">
              {model.name}
              <span id={`${model.key}-provider`} className="text-xs text-muted-foreground ml-1">
                ({model.provider})
              </span>
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

const PromptInput = memo(function PromptInput({ 
  prompt, 
  index, 
  canRemove, 
  onUpdate, 
  onRemove 
}: PromptInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(prompt.id, e.target.value);
    },
    [prompt.id, onUpdate]
  );

  const handleRemove = useCallback(() => {
    onRemove(prompt.id);
  }, [prompt.id, onRemove]);

  return (
    <div className="space-y-2" role="group" aria-labelledby={`prompt-label-${prompt.id}`}>
      <div className="flex items-center justify-between">
        <Label id={`prompt-label-${prompt.id}`} className="text-sm font-medium">
          Prompt {index + 1}
        </Label>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            aria-label={`Remove prompt ${index + 1}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
          </Button>
        )}
      </div>
      <Textarea
        placeholder="Enter your prompt..."
        value={prompt.text}
        onChange={handleChange}
        rows={3}
        aria-labelledby={`prompt-label-${prompt.id}`}
      />
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

function BatchTesting() {
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

  // Memoized callbacks
  const addPrompt = useCallback(() => {
    setPrompts(prev => [...prev, { id: crypto.randomUUID(), text: '' }]);
  }, []);

  const removePrompt = useCallback((id: string) => {
    setPrompts(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev);
  }, []);

  const updatePrompt = useCallback((id: string, text: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, text } : p));
  }, []);

  const loadSavedPrompt = useCallback((promptText: string) => {
    setPrompts(prev => {
      const emptyPrompt = prev.find(p => !p.text.trim());
      if (emptyPrompt) {
        return prev.map(p => p.id === emptyPrompt.id ? { ...p, text: promptText } : p);
      }
      return [...prev, { id: crypto.randomUUID(), text: promptText }];
    });
    toast.success('Prompt loaded');
  }, []);

  const toggleModel = useCallback((modelKey: string) => {
    setSelectedModels(prev =>
      prev.includes(modelKey) ? prev.filter(m => m !== modelKey) : [...prev, modelKey]
    );
  }, []);

  const runBatchTest = useCallback(async () => {
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
  }, [prompts, selectedModels, user, queryClient]);

  // Memoized computed values
  const totalCost = useMemo(
    () => results.reduce((sum, r) => sum + r.totalCost, 0),
    [results]
  );

  const maxLatency = useMemo(
    () => Math.max(...results.map(r => r.totalLatency), 0),
    [results]
  );

  const validPromptCount = useMemo(
    () => prompts.filter(p => p.text.trim()).length,
    [prompts]
  );

  const canRun = useMemo(
    () => !isRunning && validPromptCount > 0 && selectedModels.length > 0,
    [isRunning, validPromptCount, selectedModels.length]
  );

  const savedPromptsList = useMemo(
    () => savedPrompts?.slice(0, 5) || [],
    [savedPrompts]
  );

  return (
    <AppLayout>
      <main className="container mx-auto py-8 px-4" role="main" aria-label="Batch Prompt Testing">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Batch Prompt Testing</h1>
          <p className="text-muted-foreground">
            Run multiple prompts across models simultaneously and compare results
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar - Model Selection */}
          <aside className="space-y-4" aria-label="Testing configuration">
            <ModelSelector selectedModels={selectedModels} onToggle={toggleModel} />

            {savedPromptsList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" id="saved-prompts-title">Saved Prompts</CardTitle>
                </CardHeader>
                <CardContent 
                  className="space-y-2" 
                  role="list" 
                  aria-labelledby="saved-prompts-title"
                >
                  {savedPromptsList.map((saved) => (
                    <Button
                      key={saved.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs truncate"
                      onClick={() => loadSavedPrompt(saved.prompt_text)}
                      aria-label={`Load saved prompt: ${saved.name}`}
                    >
                      {saved.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Prompt Inputs */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle id="prompts-section-title">Prompts to Test</CardTitle>
                    <CardDescription>Add multiple prompts to test in batch</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addPrompt}
                    aria-label="Add new prompt"
                  >
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add Prompt
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4" aria-labelledby="prompts-section-title">
                {prompts.map((prompt, idx) => (
                  <PromptInput
                    key={prompt.id}
                    prompt={prompt}
                    index={idx}
                    canRemove={prompts.length > 1}
                    onUpdate={updatePrompt}
                    onRemove={removePrompt}
                  />
                ))}

                <Separator />

                <div className="flex gap-2" role="group" aria-label="Test actions">
                  <Button
                    onClick={runBatchTest}
                    disabled={!canRun}
                    className="flex-1"
                    aria-live="polite"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                        Testing ({progress.current}/{progress.total})
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                        Run Batch Test ({validPromptCount} prompts × {selectedModels.length} models)
                      </>
                    )}
                  </Button>

                  {results.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" aria-label="Export results">
                          <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => exportBatchResultsAsJSON(results)}>
                          <FileJson className="h-4 w-4 mr-2" aria-hidden="true" />
                          Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportBatchResultsAsCSV(results)}>
                          <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportBatchResultsAsMarkdown(results)}>
                          <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
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
              <Card role="status" aria-live="polite" aria-label="Test progress">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Testing prompts...</span>
                      <span aria-label={`${progress.current} of ${progress.total} complete`}>
                        {progress.current} / {progress.total}
                      </span>
                    </div>
                    <Progress 
                      value={(progress.current / progress.total) * 100} 
                      aria-label="Test progress"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Summary */}
            {results.length > 0 && (
              <Card role="region" aria-labelledby="results-summary-title">
                <CardHeader>
                  <CardTitle id="results-summary-title" className="flex items-center gap-2">
                    Results Summary
                    <Badge variant="secondary" aria-label={`${results.length} tests completed`}>
                      {results.length} tests
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm" role="list" aria-label="Summary metrics">
                    <div className="flex items-center gap-2" role="listitem">
                      <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>Total Cost: <strong>${totalCost.toFixed(6)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2" role="listitem">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>Max Latency: <strong>{maxLatency}ms</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Results */}
            <section aria-label="Test results">
              {results.map((batch, batchIdx) => (
                <BatchResultCard key={batchIdx} batch={batch} batchIndex={batchIdx} />
              ))}
            </section>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

export default memo(BatchTesting);
