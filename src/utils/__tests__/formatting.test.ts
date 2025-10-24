/**
 * Unit tests for formatting utilities
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  formatDateTime,
  formatDateOnly,
  formatDistanceToNow,
  formatAssetStatus,
  formatBookingStatus,
  formatPersonName,
  formatCurrency,
  formatFileSize,
} from '../formatters';

// Mock the current date for consistent testing
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-10-21T12:00:00Z'));
});

describe('formatters', () => {
  describe('formatDateTime', () => {
    it('should format Date objects', () => {
      const date = new Date('2025-10-21T14:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/21\.10\.2025/);
    });

    it('should format date strings', () => {
      const formatted = formatDateTime('2025-10-21T14:30:00');
      expect(formatted).toMatch(/21\.10\.2025/);
    });

    it('should return N/A for null', () => {
      expect(formatDateTime(null)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
      expect(formatDateTime(undefined)).toBe('N/A');
    });

    it('should include time', () => {
      const date = new Date('2025-10-21T14:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/14:30/);
    });
  });

  describe('formatDateOnly', () => {
    it('should format Date objects without time', () => {
      const date = new Date('2025-10-21T14:30:00');
      const formatted = formatDateOnly(date);
      expect(formatted).toBe('21.10.2025');
    });

    it('should format date strings', () => {
      const formatted = formatDateOnly('2025-10-21T14:30:00');
      expect(formatted).toBe('21.10.2025');
    });

    it('should return N/A for null', () => {
      expect(formatDateOnly(null)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
      expect(formatDateOnly(undefined)).toBe('N/A');
    });

    it('should not include time', () => {
      const date = new Date('2025-10-21T14:30:00');
      const formatted = formatDateOnly(date);
      expect(formatted).not.toMatch(/14:30/);
    });
  });

  describe('formatDistanceToNow', () => {
    it('should format recent dates', () => {
      const fiveMinutesAgo = new Date('2025-10-21T11:55:00Z');
      const formatted = formatDistanceToNow(fiveMinutesAgo);
      expect(formatted).toContain('5');
      expect(formatted).toContain('Minute');
    });

    it('should return N/A for null', () => {
      expect(formatDistanceToNow(null)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
      expect(formatDistanceToNow(undefined)).toBe('N/A');
    });

    it('should handle Date objects', () => {
      const twoHoursAgo = new Date('2025-10-21T10:00:00Z');
      const formatted = formatDistanceToNow(twoHoursAgo);
      expect(formatted).toContain('2');
      expect(formatted).toContain('Stunde');
    });

    it('should handle date strings', () => {
      const formatted = formatDistanceToNow('2025-10-21T10:00:00Z');
      expect(formatted).toContain('Stunde');
    });
  });

  describe('formatAssetStatus', () => {
    it('should format all asset statuses in German', () => {
      expect(formatAssetStatus('available')).toBe('Verfügbar');
      expect(formatAssetStatus('in-use')).toBe('In Nutzung');
      expect(formatAssetStatus('broken')).toBe('Defekt');
      expect(formatAssetStatus('in-repair')).toBe('In Reparatur');
      expect(formatAssetStatus('installed')).toBe('Installiert');
      expect(formatAssetStatus('sold')).toBe('Verkauft');
      expect(formatAssetStatus('destroyed')).toBe('Zerstört');
    });
  });

  describe('formatBookingStatus', () => {
    it('should format all booking statuses in German', () => {
      expect(formatBookingStatus('pending')).toBe('Ausstehend');
      expect(formatBookingStatus('approved')).toBe('Genehmigt');
      expect(formatBookingStatus('active')).toBe('Aktiv');
      expect(formatBookingStatus('completed')).toBe('Abgeschlossen');
      expect(formatBookingStatus('overdue')).toBe('Überfällig');
      expect(formatBookingStatus('cancelled')).toBe('Storniert');
    });
  });

  describe('formatPersonName', () => {
    it('should format full name', () => {
      expect(formatPersonName('John', 'Doe')).toBe('John Doe');
      expect(formatPersonName('Jane', 'Smith')).toBe('Jane Smith');
    });

    it('should handle first name only', () => {
      expect(formatPersonName('John', null)).toBe('John');
      expect(formatPersonName('Jane', undefined)).toBe('Jane');
    });

    it('should handle last name only', () => {
      expect(formatPersonName(null, 'Doe')).toBe('Doe');
      expect(formatPersonName(undefined, 'Smith')).toBe('Smith');
    });

    it('should return Unbekannt for no names', () => {
      expect(formatPersonName(null, null)).toBe('Unbekannt');
      expect(formatPersonName(undefined, undefined)).toBe('Unbekannt');
      expect(formatPersonName(null, undefined)).toBe('Unbekannt');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive amounts in EUR', () => {
      expect(formatCurrency(100)).toBe('100,00\u00A0€');
      expect(formatCurrency(1000)).toBe('1.000,00\u00A0€');
      expect(formatCurrency(1234.56)).toBe('1.234,56\u00A0€');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('0,00\u00A0€');
    });

    it('should format negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-100,00\u00A0€');
    });

    it('should format decimal amounts', () => {
      expect(formatCurrency(10.99)).toBe('10,99\u00A0€');
      expect(formatCurrency(0.50)).toBe('0,50\u00A0€');
    });

    it('should return N/A for null', () => {
      expect(formatCurrency(null)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
      expect(formatCurrency(undefined)).toBe('N/A');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000)).toBe('1.000.000,00\u00A0€');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 2)).toBe('2 MB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });

    it('should return N/A for null', () => {
      expect(formatFileSize(null)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
      expect(formatFileSize(undefined)).toBe('N/A');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1590)).toBe('1.55 KB');
    });
  });
});
