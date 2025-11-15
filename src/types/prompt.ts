export type GoalType = 
  | "writing"
  | "coding"
  | "agent"
  | "analysis"
  | "image"
  | "data"
  | "creative"
  | "research";

export type PrecisionLevel = "B1" | "B2" | "A1" | "A2" | "S_TIER" | "AGENT";

export type ModelTarget = "gpt" | "claude" | "gemini" | "local";

export type OutputFormat = 
  | "markdown"
  | "json"
  | "yaml"
  | "code"
  | "plain_text";

export type DepthLevel = "short" | "medium" | "long" | "exhaustive";

export interface PromptSpecObject {
  goal_type: GoalType;
  problem: string;
  precision: PrecisionLevel;
  model_target: ModelTarget;
  constraints?: string;
  success_criteria: string;
  voice_style?: string;
  tech_env?: string;
  depth?: DepthLevel;
  format: OutputFormat;
}

export interface AbstractPromptTemplate {
  name: string;
  domain: string;
  difficulty: string;
  risk_level: "low" | "med" | "high";
  description: string;
  input_parameters: string[];
  output_contract: string;
  structure: string;
  quality_gates: string[];
  failure_modes: string[];
  model_profiles: {
    gpt: Record<string, any>;
    claude: Record<string, any>;
    gemini: Record<string, any>;
    local: Record<string, any>;
  };
  notes: string;
}

export interface QualityScores {
  structural_integrity: number;
  ambiguity_score: number;
  hallucination_risk: number;
  cost_efficiency: number;
  model_compatibility: number;
  goal_alignment: number;
}

export interface GeneratedPrompt {
  id?: string;
  name: string;
  spec: PromptSpecObject;
  generated_prompt: string;
  abstract_template?: AbstractPromptTemplate;
  quality_scores?: QualityScores;
  created_at?: string;
}
