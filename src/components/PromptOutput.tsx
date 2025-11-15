import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedPrompt } from "@/types/prompt";

interface PromptOutputProps {
  prompt: GeneratedPrompt;
}

export function PromptOutput({ prompt }: PromptOutputProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadPrompt = () => {
    const blob = new Blob([prompt.generated_prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `prompt_${prompt.spec.goal_type}_${prompt.spec.precision}.txt`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Prompt downloaded!");
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-success";
    if (score >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle2 className="h-4 w-4" />;
    if (score >= 0.6) return <Info className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{prompt.spec.problem}</CardTitle>
            <CardDescription>
              Generated for {prompt.spec.model_target.toUpperCase()} • {prompt.spec.precision} Level
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(prompt.generated_prompt)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPrompt}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prompt">Generated Prompt</TabsTrigger>
            <TabsTrigger value="quality">Quality Scores</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4">
            <div className="rounded-lg bg-muted p-4 font-mono text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto">
              {prompt.generated_prompt}
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            {prompt.quality_scores ? (
              <div className="space-y-3">
                {Object.entries(prompt.quality_scores).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <span className={getScoreColor(value as number)}>
                        {getScoreIcon(value as number)}
                      </span>
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                    </div>
                    <Badge variant={value >= 0.8 ? "default" : value >= 0.6 ? "secondary" : "destructive"}>
                      {((value as number) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Quality scores not available</p>
            )}
          </TabsContent>

          <TabsContent value="specs" className="space-y-4">
            <div className="grid gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium text-muted-foreground">Goal Type</span>
                <p className="mt-1 capitalize">{prompt.spec.goal_type}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium text-muted-foreground">Problem Definition</span>
                <p className="mt-1">{prompt.spec.problem}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium text-muted-foreground">Success Criteria</span>
                <p className="mt-1">{prompt.spec.success_criteria}</p>
              </div>
              {prompt.spec.constraints && (
                <div className="p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium text-muted-foreground">Constraints</span>
                  <p className="mt-1">{prompt.spec.constraints}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium text-muted-foreground">Format</span>
                  <p className="mt-1 capitalize">{prompt.spec.format}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium text-muted-foreground">Depth</span>
                  <p className="mt-1 capitalize">{prompt.spec.depth || "Not specified"}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
