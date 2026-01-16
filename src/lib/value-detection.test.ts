/**
 * Value Detection Tests
 * 
 * Tests for the core odds conversion and value detection utilities.
 */

import { describe, it, expect } from 'vitest';
import {
    oddsToImpliedProb,
    probToFairOdds,
    americanToDecimal,
    calculateMargin,
    removeVig,
    getBookmakerQuality,
    BOOKMAKER_QUALITY,
} from '@/lib/value-detection';

describe('oddsToImpliedProb', () => {
    it('converts decimal odds 2.0 to 50% probability', () => {
        // Implementation returns percentage (0-100)
        expect(oddsToImpliedProb(2.0)).toBe(50);
    });

    it('converts decimal odds 1.5 to 66.67% probability', () => {
        expect(oddsToImpliedProb(1.5)).toBeCloseTo(66.67, 1);
    });

    it('converts decimal odds 4.0 to 25% probability', () => {
        expect(oddsToImpliedProb(4.0)).toBe(25);
    });

    it('handles edge case of odds 1.0 (100%)', () => {
        expect(oddsToImpliedProb(1.0)).toBe(100);
    });

    it('handles high odds correctly', () => {
        expect(oddsToImpliedProb(10.0)).toBeCloseTo(10, 1);
    });
});

describe('probToFairOdds', () => {
    it('converts 50% probability to 2.0 odds', () => {
        // Implementation expects percentage (0-100)
        expect(probToFairOdds(50)).toBe(2.0);
    });

    it('converts 25% probability to 4.0 odds', () => {
        expect(probToFairOdds(25)).toBe(4.0);
    });

    it('converts 80% probability to 1.25 odds', () => {
        expect(probToFairOdds(80)).toBe(1.25);
    });

    it('clamps very low probability to max odds', () => {
        const result = probToFairOdds(0.1);
        expect(result).toBeLessThanOrEqual(1000); // Should be clamped
    });

    it('clamps very high probability to min odds', () => {
        const result = probToFairOdds(0.99);
        expect(result).toBeGreaterThanOrEqual(1.01); // Should be above 1
    });
});

describe('americanToDecimal', () => {
    it('converts +200 to 3.0 decimal', () => {
        expect(americanToDecimal(200)).toBe(3.0);
    });

    it('converts +100 to 2.0 decimal', () => {
        expect(americanToDecimal(100)).toBe(2.0);
    });

    it('converts -200 to 1.5 decimal', () => {
        expect(americanToDecimal(-200)).toBe(1.5);
    });

    it('converts -100 to 2.0 decimal', () => {
        expect(americanToDecimal(-100)).toBe(2.0);
    });

    it('converts +150 to 2.5 decimal', () => {
        expect(americanToDecimal(150)).toBe(2.5);
    });
});

describe('calculateMargin', () => {
    it('calculates margin for 2-way market', () => {
        // Odds 1.9 and 1.9 = 52.63% + 52.63% = 105.26% margin = 5.26%
        // Implementation returns percentage (0-100)
        const margin = calculateMargin(1.9, 1.9);
        expect(margin).toBeCloseTo(5.26, 1);
    });

    it('calculates margin for 3-way market with draw', () => {
        // Standard soccer odds with margin - returns percentage
        const margin = calculateMargin(2.0, 3.2, 3.5);
        expect(margin).toBeGreaterThan(0);
        expect(margin).toBeLessThan(15); // Typical range in percentage
    });

    it('returns 0 for perfectly fair odds (no margin)', () => {
        // 2.0 + 2.0 = 100% = 0% margin
        const margin = calculateMargin(2.0, 2.0);
        expect(margin).toBeCloseTo(0, 2);
    });
});

describe('removeVig', () => {
    it('normalizes 2-way market to sum to 100%', () => {
        const result = removeVig(1.9, 1.9);
        // Implementation returns percentages (0-100)
        expect(result.home + result.away).toBeCloseTo(100, 1);
        expect(result.draw).toBeUndefined();
    });

    it('normalizes 3-way market to sum to 100%', () => {
        const result = removeVig(2.0, 3.2, 3.5);
        expect(result.home! + result.away! + result.draw!).toBeCloseTo(100, 1);
    });

    it('gives equal probability for equal odds', () => {
        const result = removeVig(2.0, 2.0);
        expect(result.home).toBeCloseTo(50, 1);
        expect(result.away).toBeCloseTo(50, 1);
    });
});

describe('getBookmakerQuality', () => {
    it('returns 1.0 for Pinnacle (sharpest book)', () => {
        expect(getBookmakerQuality('pinnacle')).toBe(1.0);
    });

    it('returns quality for known bookmakers', () => {
        expect(getBookmakerQuality('bet365')).toBeGreaterThan(0.7);
        expect(getBookmakerQuality('draftkings')).toBeGreaterThan(0.7);
    });

    it('returns default 0.7 for unknown bookmakers', () => {
        expect(getBookmakerQuality('unknown_bookie')).toBe(0.7);
    });

    it('handles undefined bookmaker', () => {
        expect(getBookmakerQuality(undefined)).toBe(0.7);
    });
});

describe('BOOKMAKER_QUALITY constant', () => {
    it('has Pinnacle as the highest rated (1.0)', () => {
        expect(BOOKMAKER_QUALITY['pinnacle']).toBe(1.0);
    });

    it('has values between 0 and 1 for all bookmakers', () => {
        Object.values(BOOKMAKER_QUALITY).forEach(quality => {
            expect(quality).toBeGreaterThan(0);
            expect(quality).toBeLessThanOrEqual(1);
        });
    });

    it('includes major bookmakers', () => {
        expect(BOOKMAKER_QUALITY).toHaveProperty('bet365');
        expect(BOOKMAKER_QUALITY).toHaveProperty('draftkings');
        expect(BOOKMAKER_QUALITY).toHaveProperty('fanduel');
    });
});
