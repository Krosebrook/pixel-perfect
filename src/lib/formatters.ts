/**
 * Format milliseconds to human-readable time string
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `$${value.toFixed(decimals)}`;
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with locale
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Get status color class based on percentage
 */
export function getStatusColor(percentage: number): string {
  if (percentage >= 90) return 'text-destructive';
  if (percentage >= 70) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get progress bar color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-destructive';
  if (percentage >= 70) return 'bg-yellow-600';
  return 'bg-primary';
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Replace hyphens with spaces and capitalize
 */
export function formatEndpointName(name: string): string {
  return capitalize(name.replace(/-/g, ' '));
}
