/**
 * Custom field filtering utilities
 * Support filtering by custom field values with type-aware comparisons
 */
import type { Asset, CustomFieldValue, CustomFieldType } from '../types/entities';
import { evaluateCondition } from './filterEvaluation';

/**
 * Get custom field value from asset
 */
export function getCustomFieldValue(
  asset: Asset,
  fieldName: string
): CustomFieldValue | undefined {
  return asset.customFieldValues[fieldName];
}

/**
 * Evaluate custom field filter condition
 */
export function evaluateCustomFieldCondition(
  fieldValue: CustomFieldValue | undefined,
  fieldType: CustomFieldType,
  operator: string,
  filterValue: unknown
): boolean {
  // Handle empty values
  if (operator === 'is-empty') {
    return fieldValue === undefined || fieldValue === null || fieldValue === '';
  }
  
  if (operator === 'is-not-empty') {
    return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
  }

  // Type-specific comparisons
  switch (fieldType) {
    case 'text':
    case 'url':
      return evaluateCondition(fieldValue, operator as never, filterValue);
    
    case 'number': {
      const numValue = Number(fieldValue);
      const numFilterValue = Number(filterValue);
      if (isNaN(numValue) || isNaN(numFilterValue)) return false;
      
      switch (operator) {
        case 'equals':
          return numValue === numFilterValue;
        case 'not-equals':
          return numValue !== numFilterValue;
        case 'greater-than':
          return numValue > numFilterValue;
        case 'less-than':
          return numValue < numFilterValue;
        default:
          return false;
      }
    }
    
    case 'date': {
      if (typeof fieldValue !== 'string' || typeof filterValue !== 'string') return false;
      
      const dateValue = new Date(fieldValue);
      const dateFilterValue = new Date(filterValue);
      
      if (isNaN(dateValue.getTime()) || isNaN(dateFilterValue.getTime())) return false;
      
      switch (operator) {
        case 'equals':
          return dateValue.getTime() === dateFilterValue.getTime();
        case 'greater-than':
          return dateValue.getTime() > dateFilterValue.getTime();
        case 'less-than':
          return dateValue.getTime() < dateFilterValue.getTime();
        default:
          return false;
      }
    }
    
    case 'checkbox':
      return Boolean(fieldValue) === Boolean(filterValue);
    
    case 'select': {
      const strValue = String(fieldValue ?? '').toLowerCase();
      const strFilterValue = String(filterValue ?? '').toLowerCase();
      
      switch (operator) {
        case 'equals':
          return strValue === strFilterValue;
        case 'not-equals':
          return strValue !== strFilterValue;
        case 'in':
          return String(filterValue).split(',').map(v => v.trim().toLowerCase()).includes(strValue);
        default:
          return false;
      }
    }
    
    case 'multi-select': {
      if (!Array.isArray(fieldValue)) return false;
      const values = fieldValue.map(v => String(v).toLowerCase());
      const filterValues = String(filterValue).split(',').map(v => v.trim().toLowerCase());
      
      switch (operator) {
        case 'contains':
          return filterValues.some(fv => values.includes(fv));
        case 'not-contains':
          return !filterValues.some(fv => values.includes(fv));
        default:
          return false;
      }
    }
    
    case 'person-reference': {
      // Person reference stored as personId string
      const strValue = String(fieldValue ?? '').toLowerCase();
      const strFilterValue = String(filterValue ?? '').toLowerCase();
      return strValue === strFilterValue;
    }
    
    default:
      return evaluateCondition(fieldValue, operator as never, filterValue);
  }
}

/**
 * Get all custom field names from assets
 */
export function getAllCustomFieldNames(assets: Asset[]): string[] {
  const fieldNames = new Set<string>();
  
  for (const asset of assets) {
    Object.keys(asset.customFieldValues).forEach(name => fieldNames.add(name));
  }
  
  return Array.from(fieldNames).sort();
}

/**
 * Build filter options for custom field
 */
export function getCustomFieldFilterOptions(
  assets: Asset[],
  fieldName: string
): string[] {
  const values = new Set<string>();
  
  for (const asset of assets) {
    const fieldValue = getCustomFieldValue(asset, fieldName);
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      if (Array.isArray(fieldValue)) {
        fieldValue.forEach(v => values.add(String(v)));
      } else {
        values.add(String(fieldValue));
      }
    }
  }
  
  return Array.from(values).sort();
}
