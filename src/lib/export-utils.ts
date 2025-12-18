import { toast } from 'sonner';

export type ExportFormat = 'json' | 'csv' | 'md';

interface ExportOptions {
  filename: string;
  format: ExportFormat;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJSON(data: unknown, filename: string) {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, `${filename}.json`, 'application/json');
  toast.success('Exported as JSON');
}

export function exportAsCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const escapeCSV = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const content = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  downloadFile(content, `${filename}.csv`, 'text/csv');
  toast.success('Exported as CSV');
}

export function exportAsMarkdown(content: string, filename: string) {
  downloadFile(content, `${filename}.md`, 'text/markdown');
  toast.success('Exported as Markdown');
}

// Prompt export utilities
export interface PromptExportData {
  id: string;
  name: string;
  problem: string;
  generated_prompt: string;
  goal_type: string;
  model_target: string;
  format: string;
  precision: string;
  visibility?: string;
  description?: string;
  constraints?: string;
  success_criteria?: string;
  created_at?: string;
  updated_at?: string;
}

export function exportPromptAsJSON(prompt: PromptExportData) {
  exportAsJSON(prompt, `prompt-${prompt.name || prompt.id}`);
}

export function exportPromptAsCSV(prompt: PromptExportData) {
  const headers = ['Field', 'Value'];
  const rows: [string, string][] = [
    ['Name', prompt.name || ''],
    ['Problem', prompt.problem],
    ['Goal Type', prompt.goal_type],
    ['Model Target', prompt.model_target],
    ['Format', prompt.format],
    ['Precision', prompt.precision],
    ['Visibility', prompt.visibility || 'private'],
    ['Description', prompt.description || ''],
    ['Constraints', prompt.constraints || ''],
    ['Success Criteria', prompt.success_criteria || ''],
    ['Generated Prompt', prompt.generated_prompt],
    ['Created At', prompt.created_at || ''],
  ];
  exportAsCSV(headers, rows, `prompt-${prompt.name || prompt.id}`);
}

export function exportPromptAsMarkdown(prompt: PromptExportData) {
  const md = `# ${prompt.name || 'Prompt'}

## Overview
- **Goal Type:** ${prompt.goal_type}
- **Model Target:** ${prompt.model_target}
- **Format:** ${prompt.format}
- **Precision:** ${prompt.precision}
- **Visibility:** ${prompt.visibility || 'private'}
- **Created:** ${prompt.created_at ? new Date(prompt.created_at).toLocaleDateString() : 'N/A'}

## Problem Statement
${prompt.problem}

${prompt.description ? `## Description\n${prompt.description}\n` : ''}
${prompt.constraints ? `## Constraints\n${prompt.constraints}\n` : ''}
${prompt.success_criteria ? `## Success Criteria\n${prompt.success_criteria}\n` : ''}

## Generated Prompt
\`\`\`
${prompt.generated_prompt}
\`\`\`
`;
  exportAsMarkdown(md, `prompt-${prompt.name || prompt.id}`);
}

// Version export utilities
export interface VersionExportData {
  version_number: number;
  generated_prompt: string;
  spec: Record<string, unknown>;
  quality_scores?: Record<string, number> | null;
  created_at: string;
}

export function exportVersionsAsJSON(promptName: string, versions: VersionExportData[]) {
  exportAsJSON({ promptName, versions }, `${promptName}-versions`);
}

export function exportVersionsAsCSV(promptName: string, versions: VersionExportData[]) {
  const headers = ['Version', 'Created At', 'Quality Score', 'Prompt Preview'];
  const rows = versions.map(v => [
    `v${v.version_number}`,
    new Date(v.created_at).toLocaleString(),
    v.quality_scores ? Object.values(v.quality_scores).reduce((a, b) => a + b, 0) / Object.keys(v.quality_scores).length : 'N/A',
    v.generated_prompt.substring(0, 100) + '...',
  ]);
  exportAsCSV(headers, rows as (string | number)[][], `${promptName}-versions`);
}

export function exportVersionsAsMarkdown(promptName: string, versions: VersionExportData[]) {
  const md = `# Version History: ${promptName}

${versions.map(v => `
## Version ${v.version_number}
- **Created:** ${new Date(v.created_at).toLocaleString()}
${v.quality_scores ? `- **Quality Scores:** ${JSON.stringify(v.quality_scores)}` : ''}

### Prompt
\`\`\`
${v.generated_prompt}
\`\`\`

### Specification
\`\`\`json
${JSON.stringify(v.spec, null, 2)}
\`\`\`
`).join('\n---\n')}
`;
  exportAsMarkdown(md, `${promptName}-versions`);
}

// Analytics export utilities
export interface AnalyticsExportData {
  totalRuns: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  dailySpending: { date: string; cost: number; count: number }[];
  costByEndpoint: { name: string; value: number }[];
}

export function exportAnalyticsAsJSON(analytics: AnalyticsExportData, timeRange: string) {
  exportAsJSON({ timeRange, ...analytics }, `analytics-${timeRange}days`);
}

export function exportAnalyticsAsCSV(analytics: AnalyticsExportData, timeRange: string) {
  const headers = ['Date', 'Cost', 'API Calls'];
  const rows = analytics.dailySpending.map(d => [d.date, d.cost.toFixed(6), d.count]);
  exportAsCSV(headers, rows, `analytics-${timeRange}days`);
}

export function exportAnalyticsAsMarkdown(analytics: AnalyticsExportData, timeRange: string) {
  const md = `# Analytics Report (Last ${timeRange} Days)

## Summary
| Metric | Value |
|--------|-------|
| Total API Calls | ${analytics.totalRuns.toLocaleString()} |
| Total Cost | $${analytics.totalCost.toFixed(4)} |
| Avg Latency | ${analytics.avgLatency.toFixed(0)}ms |
| Success Rate | ${(analytics.successRate * 100).toFixed(1)}% |

## Cost by Endpoint
| Endpoint | Cost |
|----------|------|
${analytics.costByEndpoint.map(e => `| ${e.name} | $${e.value.toFixed(4)} |`).join('\n')}

## Daily Spending
| Date | Cost | Calls |
|------|------|-------|
${analytics.dailySpending.map(d => `| ${d.date} | $${d.cost.toFixed(4)} | ${d.count} |`).join('\n')}
`;
  exportAsMarkdown(md, `analytics-${timeRange}days`);
}

// Batch test results export
export interface BatchTestResult {
  prompt: string;
  models: string[];
  results: {
    model: string;
    output: string | null;
    latency: number;
    cost: number;
    error: string | null;
  }[];
  totalCost: number;
  totalLatency: number;
}

export function exportBatchResultsAsJSON(results: BatchTestResult[]) {
  exportAsJSON(results, `batch-test-${Date.now()}`);
}

export function exportBatchResultsAsCSV(results: BatchTestResult[]) {
  const headers = ['Prompt', 'Model', 'Latency (ms)', 'Cost ($)', 'Error', 'Output Preview'];
  const rows: (string | number)[][] = [];
  
  results.forEach(batch => {
    batch.results.forEach(r => {
      rows.push([
        batch.prompt.substring(0, 50) + '...',
        r.model,
        r.latency,
        r.cost.toFixed(6),
        r.error || '',
        r.output?.substring(0, 100) || '',
      ]);
    });
  });
  
  exportAsCSV(headers, rows, `batch-test-${Date.now()}`);
}

export function exportBatchResultsAsMarkdown(results: BatchTestResult[]) {
  const md = `# Batch Test Results

Generated: ${new Date().toLocaleString()}

${results.map((batch, idx) => `
## Test ${idx + 1}

**Prompt:** ${batch.prompt.substring(0, 200)}${batch.prompt.length > 200 ? '...' : ''}

**Models:** ${batch.models.join(', ')}

**Total Cost:** $${batch.totalCost.toFixed(6)} | **Max Latency:** ${batch.totalLatency}ms

### Results

| Model | Latency | Cost | Status |
|-------|---------|------|--------|
${batch.results.map(r => `| ${r.model} | ${r.latency}ms | $${r.cost.toFixed(6)} | ${r.error ? '❌ Error' : '✅ Success'} |`).join('\n')}

${batch.results.map(r => `
#### ${r.model}
${r.error ? `**Error:** ${r.error}` : `\`\`\`\n${r.output}\n\`\`\``}
`).join('\n')}
`).join('\n---\n')}
`;
  exportAsMarkdown(md, `batch-test-${Date.now()}`);
}
