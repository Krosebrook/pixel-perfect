import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatCurrency,
  formatPercentage,
  formatNumber,
  getStatusColor,
  getProgressColor,
  capitalize,
  formatEndpointName,
} from '../formatters';

describe('formatters', () => {
  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(5000)).toBe('5s');
      expect(formatTime(45000)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(65000)).toBe('1m 5s');
      expect(formatTime(125000)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatTime(3665000)).toBe('1h 1m');
      expect(formatTime(7325000)).toBe('2h 2m');
    });

    it('should handle zero', () => {
      expect(formatTime(0)).toBe('0s');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default decimals', () => {
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(10.5)).toBe('$10.50');
    });

    it('should format currency with custom decimals', () => {
      expect(formatCurrency(10.123, 3)).toBe('$10.123');
      expect(formatCurrency(10, 0)).toBe('$10');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234.56)).toBe('$1234.56');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimal', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(75.5)).toBe('75.5%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(50.123, 2)).toBe('50.12%');
      expect(formatPercentage(50, 0)).toBe('50%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(100)).toBe('100.0%');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(10)).toBe('10');
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for high percentage', () => {
      expect(getStatusColor(95)).toBe('text-destructive');
      expect(getStatusColor(90)).toBe('text-destructive');
    });

    it('should return correct color for medium percentage', () => {
      expect(getStatusColor(85)).toBe('text-yellow-600');
      expect(getStatusColor(70)).toBe('text-yellow-600');
    });

    it('should return correct color for low percentage', () => {
      expect(getStatusColor(50)).toBe('text-green-600');
      expect(getStatusColor(0)).toBe('text-green-600');
    });
  });

  describe('getProgressColor', () => {
    it('should return correct color for high percentage', () => {
      expect(getProgressColor(95)).toBe('bg-destructive');
      expect(getProgressColor(90)).toBe('bg-destructive');
    });

    it('should return correct color for medium percentage', () => {
      expect(getProgressColor(85)).toBe('bg-yellow-600');
      expect(getProgressColor(70)).toBe('bg-yellow-600');
    });

    it('should return correct color for low percentage', () => {
      expect(getProgressColor(50)).toBe('bg-primary');
      expect(getProgressColor(0)).toBe('bg-primary');
    });
  });

  describe('capitalize', () => {
    it('should capitalize single word', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should capitalize multiple words', () => {
      expect(capitalize('hello world')).toBe('Hello World');
      expect(capitalize('foo bar baz')).toBe('Foo Bar Baz');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle already capitalized', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('formatEndpointName', () => {
    it('should replace hyphens with spaces', () => {
      expect(formatEndpointName('run-comparison')).toBe('Run Comparison');
      expect(formatEndpointName('generate-prompt')).toBe('Generate Prompt');
    });

    it('should capitalize words', () => {
      expect(formatEndpointName('api-test')).toBe('Api Test');
    });

    it('should handle single word', () => {
      expect(formatEndpointName('test')).toBe('Test');
    });
  });
});
