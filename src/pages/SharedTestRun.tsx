import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComparisonChart } from "@/components/ComparisonChart";
import { ArrowLeft } from "lucide-react";

export default function SharedTestRun() {
  const { token } = useParams();
  const [testRun, setTestRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTestRun();
  }, [token]);

  const loadTestRun = async () => {
    if (!token) return;

    try {
      const { data, error } = await supabase
        .from('model_test_runs')
        .select('*')
        .eq('share_token', token)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError("Test run not found or not shared");
        return;
      }

      setTestRun(data);
    } catch (error) {
      console.error('Error loading test run:', error);
      setError("Failed to load test run");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading shared test run...</p>
      </div>
    );
  }

  if (error || !testRun) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button asChild className="mt-4">
              <Link to="/models/compare">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Model Comparison
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const responses = testRun.responses as any;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/models/compare">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Shared Test Run</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(testRun.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{testRun.prompt_text}</p>
          {testRun.variation_name && (
            <Badge variant="secondary" className="mt-2">
              {testRun.variation_name}
            </Badge>
          )}
        </CardContent>
      </Card>

      <ComparisonChart results={responses} />

      <div className="grid gap-4">
        {Object.entries(responses).map(([model, result]: [string, any]) => (
          <Card key={model}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{model}</CardTitle>
                <div className="flex gap-4 text-sm">
                  {result.latency && (
                    <span className="text-muted-foreground">
                      {result.latency}ms
                    </span>
                  )}
                  {result.cost && (
                    <span className="text-muted-foreground">
                      ${result.cost.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>
              {result.error && (
                <CardDescription className="text-destructive">
                  Error: {result.error}
                </CardDescription>
              )}
            </CardHeader>
            {result.output && (
              <CardContent>
                <p className="whitespace-pre-wrap">{result.output}</p>
                {(result.inputTokens || result.outputTokens) && (
                  <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                    {result.inputTokens && <span>Input: {result.inputTokens} tokens</span>}
                    {result.outputTokens && <span>Output: {result.outputTokens} tokens</span>}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
