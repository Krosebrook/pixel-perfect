// Simple diff utility for comparing prompt versions

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export interface DiffResult {
  oldVersion: number;
  newVersion: number;
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
  };
}

/**
 * Compute a simple line-by-line diff between two texts
 */
export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const result: DiffLine[] = [];
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  
  // Use LCS (Longest Common Subsequence) approach for better diffs
  const lcs = computeLCS(oldLines, newLines);
  
  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;
  
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (lcsIdx < lcs.length && oldIdx < oldLines.length && oldLines[oldIdx] === lcs[lcsIdx]) {
      // Check if this line is also in the new version at current position
      if (newIdx < newLines.length && newLines[newIdx] === lcs[lcsIdx]) {
        result.push({ type: 'unchanged', content: oldLines[oldIdx] });
        oldIdx++;
        newIdx++;
        lcsIdx++;
      } else if (newIdx < newLines.length) {
        // New line added
        result.push({ type: 'added', content: newLines[newIdx] });
        newIdx++;
      } else {
        // Old line removed
        result.push({ type: 'removed', content: oldLines[oldIdx] });
        oldIdx++;
      }
    } else if (oldIdx < oldLines.length && (lcsIdx >= lcs.length || oldLines[oldIdx] !== lcs[lcsIdx])) {
      // Line was removed
      result.push({ type: 'removed', content: oldLines[oldIdx] });
      oldIdx++;
    } else if (newIdx < newLines.length) {
      // Line was added
      result.push({ type: 'added', content: newLines[newIdx] });
      newIdx++;
    }
  }
  
  return result;
}

/**
 * Compute Longest Common Subsequence
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

/**
 * Create a full diff result with stats
 */
export function createDiffResult(
  oldText: string,
  newText: string,
  oldVersion: number,
  newVersion: number
): DiffResult {
  const lines = computeDiff(oldText, newText);
  
  const stats = {
    added: lines.filter(l => l.type === 'added').length,
    removed: lines.filter(l => l.type === 'removed').length,
    unchanged: lines.filter(l => l.type === 'unchanged').length,
  };
  
  return { oldVersion, newVersion, lines, stats };
}

/**
 * Compare two JSON objects and return a human-readable diff
 */
export function compareSpecs(oldSpec: Record<string, any>, newSpec: Record<string, any>): Array<{
  field: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}> {
  const allKeys = new Set([...Object.keys(oldSpec), ...Object.keys(newSpec)]);
  const changes: Array<{ field: string; oldValue: any; newValue: any; changed: boolean }> = [];
  
  for (const key of allKeys) {
    const oldValue = oldSpec[key];
    const newValue = newSpec[key];
    const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
    
    changes.push({ field: key, oldValue, newValue, changed });
  }
  
  return changes;
}
