/**
 * Analytics-related type definitions
 */

import type { TimeRange } from './common';

// ============================================================================
// Usage Statistics Types
// ============================================================================

export interface UsageStatistics {
  totalRuns: number;
  totalCost: number;
  totalLatency: number;
  averageLatency: number;
  averageCost: number;
  successRate: number;
}

export interface UsageByModel {
  modelName: string;
  runCount: number;
  totalCost: number;
  averageLatency: number;
  successRate: number;
}

export interface UsageByDay {
  date: string;
  runCount: number;
  totalCost: number;
  uniquePrompts: number;
}

// ============================================================================
// Cost Analysis Types
// ============================================================================

export interface CostBreakdown {
  modelName: string;
  totalCost: number;
  percentageOfTotal: number;
  runCount: number;
  averageCostPerRun: number;
}

export interface CostRecommendation {
  id: string;
  type: 'model_switch' | 'usage_optimization' | 'batch_suggestion';
  title: string;
  description: string;
  potentialSavings: number;
  confidence: 'high' | 'medium' | 'low';
  currentModel?: string;
  recommendedModel?: string;
  affectedPrompts?: string[];
}

export interface CostOptimizationReport {
  generatedAt: string;
  timeRange: TimeRange;
  currentMonthlySpend: number;
  projectedSavings: number;
  recommendations: CostRecommendation[];
  usageBreakdown: CostBreakdown[];
}

// ============================================================================
// Model Performance Types
// ============================================================================

export interface ModelPerformanceMetrics {
  modelName: string;
  avgLatencyMs: number;
  avgCost: number;
  totalUsage: number;
  successRate: number;
  costEfficiencyScore: number;
}

export interface ModelLeaderboardEntry extends ModelPerformanceMetrics {
  rank: number;
  trend: 'up' | 'down' | 'stable';
  lastUsed?: string;
}

// ============================================================================
// API Usage Types
// ============================================================================

export interface ApiEndpointUsage {
  endpointName: string;
  totalCalls: number;
  lastCall: string;
  averageResponseTime?: number;
}

export interface RateLimitStatus {
  endpoint: string;
  currentUsage: number;
  limit: number;
  windowStart: string;
  windowEnd: string;
  isNearLimit: boolean;
  isExceeded: boolean;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  fill?: string;
}
