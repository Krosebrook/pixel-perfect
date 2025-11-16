import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { PromptSpecObject } from "@/types/prompt";

const formSchema = z.object({
  goal_type: z.enum(["writing", "coding", "agent", "analysis", "image", "data", "creative", "research"]),
  problem: z.string().min(10, "Problem definition must be at least 10 characters"),
  precision: z.enum(["B1", "B2", "A1", "A2", "S_TIER", "AGENT"]),
  model_target: z.enum(["gpt", "claude", "gemini", "local"]),
  format: z.enum(["markdown", "json", "yaml", "code", "plain_text"]),
  success_criteria: z.string().min(10, "Success criteria must be at least 10 characters"),
  depth: z.enum(["short", "medium", "long", "exhaustive"]).optional(),
  constraints: z.string().optional(),
  voice_style: z.string().optional(),
  tech_env: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PromptFormProps {
  onGenerate: (spec: PromptSpecObject) => Promise<void>;
  isGenerating: boolean;
}

export function PromptForm({ onGenerate, isGenerating }: PromptFormProps) {
  const [errors, setErrors] = useState<any[]>([]);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal_type: "writing",
      precision: "A1",
      model_target: "gpt",
      format: "markdown",
      depth: "medium",
    },
  });

  const onSubmit = async (data: FormData) => {
    setErrors([]);
    try {
      const spec: PromptSpecObject = {
        goal_type: data.goal_type,
        problem: data.problem,
        precision: data.precision,
        model_target: data.model_target,
        format: data.format,
        success_criteria: data.success_criteria,
        depth: data.depth,
        constraints: data.constraints,
        voice_style: data.voice_style,
        tech_env: data.tech_env,
      };
      await onGenerate(spec);
    } catch (error: any) {
      if (error?.errors) {
        setErrors(error.errors);
      }
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Universal Prompt Generator
        </CardTitle>
        <CardDescription>
          Configure your prompt specifications to generate production-grade prompts optimized for any LLM
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errors.length > 0 && <ErrorMessage errors={errors} className="mb-6" />}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="goal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precision Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="B1">B1 - Beginner</SelectItem>
                        <SelectItem value="B2">B2 - Intermediate</SelectItem>
                        <SelectItem value="A1">A1 - Advanced</SelectItem>
                        <SelectItem value="A2">A2 - Expert</SelectItem>
                        <SelectItem value="S_TIER">S-Tier - Veteran</SelectItem>
                        <SelectItem value="AGENT">AGENT - Multi-Phase</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="problem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Definition</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you want to accomplish, why, and any constraints..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about what + why + constraints
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="model_target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt">GPT (OpenAI)</SelectItem>
                        <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                        <SelectItem value="gemini">Gemini (Google)</SelectItem>
                        <SelectItem value="local">Local LLM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="yaml">YAML</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="plain_text">Plain Text</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depth</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="exhaustive">Exhaustive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="success_criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Criteria</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Define what makes this prompt successful..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="voice_style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice/Style (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Professional, casual, technical..." {...field} />
                    </FormControl>
                    <FormDescription>For writing tasks</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tech_env"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Environment (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React, TypeScript, Node.js..." {...field} />
                    </FormControl>
                    <FormDescription>For coding tasks</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="constraints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Constraints (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Cost limits, policy restrictions, banned content..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Prompt...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Production Prompt
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
