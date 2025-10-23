/**
 * Unit tests for asset numbering utilities
 */

import { describe, it, expect } from 'vitest';
import {
  padAssetNumber,
  parseAssetNumber,
  generateNextAssetNumber,
  isAssetNumberInUse,
  suggestAssetNumbers,
} from '../assetNumbers';

describe('assetNumbers', () => {
  describe('padAssetNumber', () => {
    it('should pad single digit with leading zeros', () => {
      expect(padAssetNumber(1)).toBe('00001');
      expect(padAssetNumber(5)).toBe('00005');
      expect(padAssetNumber(9)).toBe('00009');
    });

    it('should pad double digits with leading zeros', () => {
      expect(padAssetNumber(10)).toBe('00010');
      expect(padAssetNumber(42)).toBe('00042');
      expect(padAssetNumber(99)).toBe('00099');
    });

    it('should pad three digits with leading zeros', () => {
      expect(padAssetNumber(100)).toBe('00100');
      expect(padAssetNumber(500)).toBe('00500');
      expect(padAssetNumber(999)).toBe('00999');
    });

    it('should handle four digits', () => {
      expect(padAssetNumber(1000)).toBe('01000');
      expect(padAssetNumber(5000)).toBe('05000');
      expect(padAssetNumber(9999)).toBe('09999');
    });

    it('should handle five digits', () => {
      expect(padAssetNumber(10000)).toBe('10000');
      expect(padAssetNumber(50000)).toBe('50000');
      expect(padAssetNumber(99999)).toBe('99999');
    });

    it('should handle numbers larger than 5 digits', () => {
      expect(padAssetNumber(100000)).toBe('100000');
      expect(padAssetNumber(999999)).toBe('999999');
    });
  });

  describe('parseAssetNumber', () => {
    it('should parse padded numbers correctly', () => {
      expect(parseAssetNumber('00001')).toBe(1);
      expect(parseAssetNumber('00010')).toBe(10);
      expect(parseAssetNumber('00100')).toBe(100);
      expect(parseAssetNumber('01000')).toBe(1000);
      expect(parseAssetNumber('10000')).toBe(10000);
    });

    it('should parse unpadded numbers correctly', () => {
      expect(parseAssetNumber('1')).toBe(1);
      expect(parseAssetNumber('42')).toBe(42);
      expect(parseAssetNumber('999')).toBe(999);
    });

    it('should handle invalid input', () => {
      expect(parseAssetNumber('abc')).toBe(NaN);
      expect(parseAssetNumber('')).toBe(NaN);
    });
  });

  describe('generateNextAssetNumber', () => {
    it('should return 00001 for empty array', () => {
      expect(generateNextAssetNumber([])).toBe('00001');
    });

    it('should return 00002 when only 00001 exists', () => {
      expect(generateNextAssetNumber(['00001'])).toBe('00002');
    });

    it('should find the maximum and add one', () => {
      expect(generateNextAssetNumber(['00001', '00003', '00002'])).toBe('00004');
      expect(generateNextAssetNumber(['00010', '00005', '00015'])).toBe('00016');
    });

    it('should handle gaps in numbering', () => {
      expect(generateNextAssetNumber(['00001', '00005', '00010'])).toBe('00011');
    });

    it('should handle unpadded numbers', () => {
      expect(generateNextAssetNumber(['1', '2', '3'])).toBe('00004');
      expect(generateNextAssetNumber(['42'])).toBe('00043');
    });

    it('should handle mixed padded and unpadded numbers', () => {
      expect(generateNextAssetNumber(['00001', '5', '00003'])).toBe('00006');
    });

    it('should ignore invalid numbers', () => {
      expect(generateNextAssetNumber(['00001', 'abc', '00002'])).toBe('00003');
      expect(generateNextAssetNumber(['abc', 'def'])).toBe('00001');
    });

    it('should handle large numbers', () => {
      expect(generateNextAssetNumber(['09999'])).toBe('10000');
      expect(generateNextAssetNumber(['99999'])).toBe('100000');
    });
  });

  describe('isAssetNumberInUse', () => {
    const existingNumbers = ['00001', '00002', '00005', '00010'];

    it('should return true for existing numbers', () => {
      expect(isAssetNumberInUse('00001', existingNumbers)).toBe(true);
      expect(isAssetNumberInUse('00002', existingNumbers)).toBe(true);
      expect(isAssetNumberInUse('00005', existingNumbers)).toBe(true);
      expect(isAssetNumberInUse('00010', existingNumbers)).toBe(true);
    });

    it('should return false for non-existing numbers', () => {
      expect(isAssetNumberInUse('00003', existingNumbers)).toBe(false);
      expect(isAssetNumberInUse('00004', existingNumbers)).toBe(false);
      expect(isAssetNumberInUse('00011', existingNumbers)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(isAssetNumberInUse('00001', [])).toBe(false);
    });

    it('should handle exact string matching', () => {
      // Should match exactly, not numerically
      expect(isAssetNumberInUse('1', existingNumbers)).toBe(false);
      expect(isAssetNumberInUse('00001', existingNumbers)).toBe(true);
    });
  });

  describe('suggestAssetNumbers', () => {
    it('should suggest 5 numbers by default starting from 1', () => {
      const suggestions = suggestAssetNumbers([]);
      expect(suggestions).toHaveLength(5);
      expect(suggestions).toEqual(['00001', '00002', '00003', '00004', '00005']);
    });

    it('should suggest custom count of numbers', () => {
      const suggestions = suggestAssetNumbers([], 3);
      expect(suggestions).toHaveLength(3);
      expect(suggestions).toEqual(['00001', '00002', '00003']);
    });

    it('should suggest numbers after existing ones', () => {
      const suggestions = suggestAssetNumbers(['00001', '00002'], 3);
      expect(suggestions).toHaveLength(3);
      expect(suggestions).toEqual(['00003', '00004', '00005']);
    });

    it('should skip already used numbers', () => {
      const suggestions = suggestAssetNumbers(['00001', '00003', '00005'], 5);
      expect(suggestions).toHaveLength(5);
      // Should suggest 00006-00010 (skipping used ones)
      expect(suggestions).toEqual(['00006', '00007', '00008', '00009', '00010']);
    });

    it('should handle gaps in numbering', () => {
      const suggestions = suggestAssetNumbers(['00001', '00010'], 3);
      expect(suggestions).toHaveLength(3);
      // Should suggest starting from 00011
      expect(suggestions).toEqual(['00011', '00012', '00013']);
    });

    it('should work with large numbers', () => {
      const suggestions = suggestAssetNumbers(['09998'], 3);
      expect(suggestions).toHaveLength(3);
      expect(suggestions).toEqual(['09999', '10000', '10001']);
    });
  });
});
