/**
 * History Formatting Utilities
 * 
 * Utilities for formatting change history entries into human-readable text.
 * 
 * @module utils/historyFormatters
 * @enhancement E3 - Human-Readable Change History (T259)
 */

import type { ChangeHistoryEntry, FieldChange } from '../types/entities';
import { formatDateTime } from './formatters';

/**
 * Format a change history entry into a human-readable sentence
 * Returns both plain text and structured data for highlighting
 * 
 * @param entry - The change history entry to format
 * @returns Formatted entry with metadata for highlighting
 */
export interface FormattedHistoryEntry {
  text: string;
  date: string;
  user: string;
  action: string;
  changes?: Array<{ field: string; oldValue: string; newValue: string }>;
}

export function formatChangeEntry(entry: ChangeHistoryEntry): FormattedHistoryEntry {
  const date = formatDateTime(entry.changedAt);
  const user = entry.changedByName;
  
  // Format based on action type
  switch (entry.action) {
    case 'created':
      return {
        text: `${user} created this ${entry.entityType}`,
        date,
        user,
        action: 'created',
      };
      
    case 'deleted':
      return {
        text: `${user} deleted this ${entry.entityType}`,
        date,
        user,
        action: 'deleted',
      };
      
    case 'status-changed':
      if (entry.changes && entry.changes.length > 0) {
        const statusChange = entry.changes.find(c => c.field === 'status');
        if (statusChange) {
          return {
            text: `${user} changed status`,
            date,
            user,
            action: 'status-changed',
            changes: [{ field: 'status', oldValue: statusChange.oldValue, newValue: statusChange.newValue }],
          };
        }
      }
      // Fallback to old format
      return {
        text: `${user} changed status`,
        date,
        user,
        action: 'status-changed',
        changes: [{ field: 'status', oldValue: entry.oldValue || '', newValue: entry.newValue || '' }],
      };
      
    case 'updated':
      if (entry.changes && entry.changes.length > 0) {
        const changeText = formatFieldChangesList(entry.changes);
        return {
          text: `${user} changed ${changeText}`,
          date,
          user,
          action: 'updated',
          changes: entry.changes,
        };
      }
      // Fallback to old format
      if (entry.fieldName) {
        return {
          text: `${user} changed ${entry.fieldName}`,
          date,
          user,
          action: 'updated',
          changes: [{ field: entry.fieldName, oldValue: entry.oldValue || '', newValue: entry.newValue || '' }],
        };
      }
      return {
        text: `${user} updated this ${entry.entityType}`,
        date,
        user,
        action: 'updated',
      };
      
    case 'booked':
      return {
        text: `${user} booked this asset`,
        date,
        user,
        action: 'booked',
      };
      
    case 'checked-out':
      return {
        text: `${user} checked out this asset`,
        date,
        user,
        action: 'checked-out',
      };
      
    case 'checked-in':
      return {
        text: `${user} checked in this asset`,
        date,
        user,
        action: 'checked-in',
      };
      
    case 'maintenance-performed':
      return {
        text: `${user} performed maintenance`,
        date,
        user,
        action: 'maintenance-performed',
      };
      
    case 'scanned':
      return {
        text: `${user} scanned this asset`,
        date,
        user,
        action: 'scanned',
      };
      
    default:
      return {
        text: `${user} ${entry.action} this ${entry.entityType}`,
        date,
        user,
        action: entry.action,
      };
  }
}

/**
 * Format field names for display (without old/new values)
 */
function formatFieldChangesList(changes: FieldChange[]): string {
  if (changes.length === 0) {
    return 'no fields';
  }
  
  const fieldNames = changes.map(change => formatFieldName(change.field));
  
  if (fieldNames.length === 1) {
    return fieldNames[0] || 'unknown field';
  }
  
  if (fieldNames.length === 2) {
    return `${fieldNames[0]} and ${fieldNames[1]}`;
  }
  
  const last = fieldNames.pop();
  return `${fieldNames.join(', ')}, and ${last}`;
}

/**
 * Format a field name into a human-readable label
 * 
 * Examples:
 * - "assetNumber" → "asset number"
 * - "customFieldValues" → "custom fields"
 * - "inUseBy" → "in use by"
 * 
 * @param fieldName - The field name to format
 * @returns A human-readable field label
 */
export function formatFieldName(fieldName: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    assetNumber: 'asset number',
    customFieldValues: 'custom fields',
    inUseBy: 'in use by',
    parentAssetId: 'parent asset',
    isParent: 'parent status',
    qrCode: 'QR code',
  };
  
  if (specialCases[fieldName]) {
    return specialCases[fieldName];
  }
  
  // Convert camelCase to spaced words
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
}

/**
 * Get a short action label for display in tables
 * 
 * @param action - The change action
 * @returns A short label
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'created': 'Created',
    'updated': 'Updated',
    'deleted': 'Deleted',
    'status-changed': 'Status Changed',
    'booked': 'Booked',
    'checked-out': 'Checked Out',
    'checked-in': 'Checked In',
    'maintenance-performed': 'Maintenance',
    'scanned': 'Scanned',
  };
  
  return labels[action] || action.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get a color for an action type
 * 
 * @param action - The change action
 * @returns A Mantine color name
 */
export function getActionColor(action: string): string {
  switch (action) {
    case 'created':
      return 'green';
    case 'updated':
    case 'status-changed':
      return 'blue';
    case 'deleted':
      return 'red';
    case 'booked':
    case 'checked-out':
      return 'cyan';
    case 'checked-in':
      return 'teal';
    case 'maintenance-performed':
      return 'orange';
    case 'scanned':
      return 'violet';
    default:
      return 'gray';
  }
}
