import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PromptForm } from "@/components/PromptForm";
import { PromptOutput } from "@/components/PromptOutput";
import { ErrorMessage } from "@/components/ErrorMessage";
import { supabase } from "@/integrations/supabase/client";
import type { PromptSpecObject, GeneratedPrompt } from "@/types/prompt";
import { Zap } from "lucide-react";

const Index = () => {
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiErrors, setApiErrors] = useState<{ error: string; code: string }[]>([]);

  const handleGenerate = async (spec: PromptSpecObject) => {
    setIsGenerating(true);
    setGeneratedPrompt(null);
    setApiErrors([]);

    try {
      // 1. Generate the prompt
      const { data: generateData, error: generateError } = await supabase.functions.invoke('generate-prompt', {
        body: { spec }
      });

      if (generateError || !generateData?.prompt) {
        throw generateError || new Error('Failed to generate prompt');
      }

      const generatedText = generateData.prompt;

      // 2. Validate quality
      const { data: qualityData, error: qualityError } = await supabase.functions.invoke('validate-quality', {
        body: { prompt: generatedText }
      });

      if (qualityError) {
        console.warn('Quality validation failed:', qualityError);
      }

      const qualityScores = qualityData?.scores || null;

      // 3. Save to database
      const { data: savedPrompt, error: saveError } = await supabase
        .from('prompts')
        .insert([{
          problem: spec.problem,
          goal_type: spec.goal_type,
          format: spec.format,
          precision: spec.precision,
          depth: spec.depth || null,
          voice_style: spec.voice_style || null,
          tech_env: spec.tech_env || null,
          constraints: spec.constraints || null,
          success_criteria: spec.success_criteria || null,
          model_target: spec.model_target,
          generated_prompt: generatedText,
          quality_scores: qualityScores,
          created_by: '00000000-0000-0000-0000-000000000000', // Internal app - no auth
          name: spec.problem.slice(0, 100), // Required field
        }])
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save prompt:', saveError);
      }

      setGeneratedPrompt({
        id: savedPrompt?.id || crypto.randomUUID(),
        spec,
        generated_prompt: generatedText,
        quality_scores: qualityScores,
        created_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating prompt:', error);
      setApiErrors([{ error: error?.message || 'An error occurred', code: 'GENERATION_FAILED' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">UPGE</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Universal Prompt Generation Engine
            </p>
          </div>

          {apiErrors.length > 0 && (
            <div className="mb-6">
              <ErrorMessage errors={apiErrors} />
            </div>
          )}

          <PromptForm onGenerate={handleGenerate} isGenerating={isGenerating} />

          {generatedPrompt && (
            <div className="mt-8">
              <PromptOutput prompt={generatedPrompt} />
            </div>
          )}
        </div>
      </div>

      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} UPGE. Internal Tool.</p>
      </footer>
    </AppLayout>
  );
};

export default Index;
