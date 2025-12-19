/**
 * AI Model-related type definitions
 */

// ============================================================================
// Model Configuration Types
// ============================================================================

/**
 * Supported AI model identifiers
 */
export type ModelId =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'claude-3-5-sonnet'
  | 'claude-3-opus'
  | 'claude-3-haiku'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'llama-3.1-70b'
  | 'llama-3.1-8b'
  | 'mixtral-8x7b';

export interface ModelConfig {
  id: ModelId;
  name: string;
  provider: ModelProvider;
  maxTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  capabilities: ModelCapability[];
  tier: ModelTier;
  isAvailable: boolean;
}

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral';

export type ModelCapability = 
  | 'text-generation'
  | 'code-generation'
  | 'vision'
  | 'function-calling'
  | 'json-mode'
  | 'streaming';

export type ModelTier = 'free' | 'standard' | 'premium' | 'enterprise';

// ============================================================================
// Model Response Types
// ============================================================================

export interface ModelResponse {
  modelId: ModelId;
  content: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  error?: string;
}

export interface StreamingChunk {
  content: string;
  isComplete: boolean;
  tokenCount?: number;
}

// ============================================================================
// Model Comparison Types
// ============================================================================

export interface ModelComparisonRequest {
  promptText: string;
  models: ModelId[];
  options?: ModelComparisonOptions;
}

export interface ModelComparisonOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

export interface ModelComparisonResult {
  id: string;
  promptText: string;
  models: ModelId[];
  responses: Record<ModelId, ModelResponse>;
  totalCost: number;
  totalLatencyMs: number;
  createdAt: string;
  winner?: ModelId;
  analysis?: ComparisonAnalysis;
}

export interface ComparisonAnalysis {
  fastest: ModelId;
  cheapest: ModelId;
  bestQuality?: ModelId;
  recommendations: string[];
}

// ============================================================================
// Batch Testing Types
// ============================================================================

export interface BatchTestItem {
  id: string;
  promptText: string;
  status: BatchTestStatus;
  result?: ModelComparisonResult;
  error?: string;
}

export type BatchTestStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BatchTestRun {
  id: string;
  items: BatchTestItem[];
  models: ModelId[];
  status: BatchTestStatus;
  progress: number;
  totalCost: number;
  startedAt: string;
  completedAt?: string;
}

// ============================================================================
// Model Selection Types
// ============================================================================

export interface ModelSelectionCriteria {
  maxCost?: number;
  maxLatency?: number;
  requiredCapabilities?: ModelCapability[];
  preferredProvider?: ModelProvider;
  preferredTier?: ModelTier;
}

export interface RecommendedModel {
  model: ModelConfig;
  score: number;
  reasons: string[];
}
