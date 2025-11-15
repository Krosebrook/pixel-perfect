import { useState } from "react";
import { PromptForm } from "@/components/PromptForm";
import { PromptOutput } from "@/components/PromptOutput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { toast } from "sonner";
import type { PromptSpecObject, GeneratedPrompt } from "@/types/prompt";
import { Sparkles, Zap } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (spec: PromptSpecObject) => {
    setIsGenerating(true);
    
    try {

      // Call the generate-prompt edge function
      toast.info("Generating your prompt...");
      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        "generate-prompt",
        { body: { spec } }
      );

      if (generateError) throw generateError;
      if (!generateData.success) throw new Error("Failed to generate prompt");

      const generatedText = generateData.generated_prompt;

      // Validate the quality of the generated prompt
      toast.info("Validating prompt quality...");
      const { data: qualityData, error: qualityError } = await supabase.functions.invoke(
        "validate-quality",
        { body: { prompt: generatedText, spec } }
      );

      let qualityScores = null;
      if (!qualityError && qualityData?.success) {
        qualityScores = qualityData.quality_scores;
      }

      // Save to database
      const { data: savedPrompt, error: saveError } = await supabase
        .from("prompts")
        .insert({
          created_by: user!.id,
          visibility: 'private',
          goal_type: spec.goal_type,
          problem: spec.problem,
          precision: spec.precision,
          model_target: spec.model_target,
          constraints: spec.constraints,
          success_criteria: spec.success_criteria,
          voice_style: spec.voice_style,
          tech_env: spec.tech_env,
          depth: spec.depth,
          format: spec.format,
          generated_prompt: generatedText,
          quality_scores: qualityScores,
        } as any)
        .select()
        .single();

      if (saveError) throw saveError;

      const result: GeneratedPrompt = {
        id: savedPrompt.id,
        spec,
        generated_prompt: generatedText,
        quality_scores: qualityScores,
        created_at: savedPrompt.created_at,
      };

      setGeneratedPrompt(result);
      toast.success("Prompt generated successfully!");
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="relative mb-12">
          <div className="absolute top-0 right-0">
            <UserMenu />
          </div>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Zap className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                UPGE
              </h1>
            </div>
            <h2 className="text-3xl font-bold">Universal Prompt Generator Engine</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Production-grade prompts for any domain, any model, any difficulty level.
              From B1 to AGENT mode, optimized with quality gates and model profiles.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 max-w-6xl mx-auto">
          <PromptForm onGenerate={handleGenerate} isGenerating={isGenerating} />
          
          {generatedPrompt && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PromptOutput prompt={generatedPrompt} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built with Lovable • Powered by Lovable AI</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
