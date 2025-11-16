import { describe, it, expect } from 'vitest';
import {
  TIME_RANGES,
  TIME_RANGE_LABELS,
  ENVIRONMENT_MODES,
  DEFAULT_ALERT_THRESHOLD,
  DEFAULT_MONTHLY_BUDGET,
  CHART_COLORS,
  REFETCH_INTERVALS,
} from '../constants';

describe('constants', () => {
  describe('TIME_RANGES', () => {
    it('should have all expected time ranges', () => {
      expect(TIME_RANGES.SEVEN_DAYS).toBe('7');
      expect(TIME_RANGES.THIRTY_DAYS).toBe('30');
      expect(TIME_RANGES.SIXTY_DAYS).toBe('60');
      expect(TIME_RANGES.NINETY_DAYS).toBe('90');
    });
  });

  describe('TIME_RANGE_LABELS', () => {
    it('should have labels for all time ranges', () => {
      expect(TIME_RANGE_LABELS['7']).toBe('Last 7 Days');
      expect(TIME_RANGE_LABELS['30']).toBe('Last 30 Days');
      expect(TIME_RANGE_LABELS['60']).toBe('Last 60 Days');
      expect(TIME_RANGE_LABELS['90']).toBe('Last 90 Days');
    });
  });

  describe('ENVIRONMENT_MODES', () => {
    it('should have sandbox and production modes', () => {
      expect(ENVIRONMENT_MODES.SANDBOX).toBe('sandbox');
      expect(ENVIRONMENT_MODES.PRODUCTION).toBe('production');
    });
  });

  describe('DEFAULT_ALERT_THRESHOLD', () => {
    it('should be 0.8', () => {
      expect(DEFAULT_ALERT_THRESHOLD).toBe(0.8);
    });
  });

  describe('DEFAULT_MONTHLY_BUDGET', () => {
    it('should be 100', () => {
      expect(DEFAULT_MONTHLY_BUDGET).toBe(100);
    });
  });

  describe('CHART_COLORS', () => {
    it('should be an array of colors', () => {
      expect(Array.isArray(CHART_COLORS)).toBe(true);
      expect(CHART_COLORS.length).toBeGreaterThan(0);
    });

    it('should have valid HSL color format', () => {
      CHART_COLORS.forEach((color) => {
        expect(
          color.startsWith('hsl(') || color.startsWith('#')
        ).toBe(true);
      });
    });
  });

  describe('REFETCH_INTERVALS', () => {
    it('should have all expected intervals', () => {
      expect(REFETCH_INTERVALS.FAST).toBe(5000);
      expect(REFETCH_INTERVALS.NORMAL).toBe(10000);
      expect(REFETCH_INTERVALS.SLOW).toBe(30000);
    });
  });
});
