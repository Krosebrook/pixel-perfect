import { useState } from "react";
import { PromptForm } from "@/components/PromptForm";
import { PromptOutput } from "@/components/PromptOutput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { ErrorMessage } from "@/components/ErrorMessage";
import { toast } from "sonner";
import type { PromptSpecObject, GeneratedPrompt } from "@/types/prompt";
import { Sparkles, Zap } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiErrors, setApiErrors] = useState<any[]>([]);

  const handleGenerate = async (spec: PromptSpecObject) => {
    setIsGenerating(true);
    setApiErrors([]);
    
    try {

      // Call the generate-prompt edge function
      toast.info("Generating your prompt...");
      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        "generate-prompt",
        { body: { spec } }
      );

      if (generateError) {
        if (generateError.context?.body) {
          const errorBody = JSON.parse(generateError.context.body);
          if (errorBody.errors) {
            setApiErrors(errorBody.errors);
            return;
          }
        }
        throw generateError;
      }
      
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
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

        {/* API Errors */}
        {apiErrors.length > 0 && <ErrorMessage errors={apiErrors} className="mb-6 max-w-4xl mx-auto" />}

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
