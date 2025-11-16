import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Enum schemas matching src/types/prompt.ts
export const GoalTypeSchema = z.enum([
  "writing",
  "coding",
  "agent",
  "analysis",
  "image",
  "data",
  "creative",
  "research"
]);

export const PrecisionLevelSchema = z.enum([
  "B1",
  "B2",
  "A1",
  "A2",
  "S_TIER",
  "AGENT"
]);

export const ModelTargetSchema = z.enum([
  "gpt",
  "claude",
  "gemini",
  "local"
]);

export const OutputFormatSchema = z.enum([
  "markdown",
  "json",
  "yaml",
  "code",
  "plain_text"
]);

export const DepthLevelSchema = z.enum([
  "short",
  "medium",
  "long",
  "exhaustive"
]);

// Prompt Spec schema
export const PromptSpecSchema = z.object({
  goal_type: GoalTypeSchema,
  problem: z.string().min(1, "Problem description is required").max(1000, "Problem description must be less than 1000 characters"),
  precision: PrecisionLevelSchema,
  model_target: ModelTargetSchema,
  constraints: z.string().max(500, "Constraints must be less than 500 characters").optional(),
  success_criteria: z.string().min(1, "Success criteria is required").max(500, "Success criteria must be less than 500 characters"),
  voice_style: z.string().max(200, "Voice style must be less than 200 characters").optional(),
  tech_env: z.string().max(200, "Technical environment must be less than 200 characters").optional(),
  depth: DepthLevelSchema.optional(),
  format: OutputFormatSchema,
});

// Request schemas for each endpoint
export const GeneratePromptRequestSchema = z.object({
  spec: PromptSpecSchema,
});

export const OptimizePromptRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(5000, "Prompt must be less than 5000 characters"),
  goal: z.string().min(1, "Goal is required").max(500, "Goal must be less than 500 characters"),
  targetModel: ModelTargetSchema.optional(),
});

export const RunComparisonRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(5000, "Prompt must be less than 5000 characters"),
  models: z.array(z.string()).min(1, "At least one model is required").max(10, "Maximum 10 models allowed"),
});

export const ApplyTemplateRequestSchema = z.object({
  templateId: z.string().uuid("Invalid template ID format"),
  variables: z.record(z.any()),
});

export const ValidateQualityRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  spec: z.object({
    model_target: ModelTargetSchema,
    precision: PrecisionLevelSchema,
    problem: z.string().min(1, "Problem description is required"),
  }),
});

export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1, "API key name is required").max(100, "Name must be less than 100 characters"),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
  expiresIn: z.number().positive("Expiration must be positive").optional(),
});

// Type exports
export type GoalType = z.infer<typeof GoalTypeSchema>;
export type PrecisionLevel = z.infer<typeof PrecisionLevelSchema>;
export type ModelTarget = z.infer<typeof ModelTargetSchema>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export type DepthLevel = z.infer<typeof DepthLevelSchema>;
export type PromptSpec = z.infer<typeof PromptSpecSchema>;
