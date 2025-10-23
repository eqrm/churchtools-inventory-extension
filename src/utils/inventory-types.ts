/**
 * Custom Module Type Definitions for Inventory Management
 * 
 * These types define the data structures for the inventory management custom module.
 * They will be used throughout the application and in tests.
 */

import type { Person } from './ct-types';

/**
 * Status of an inventory item
 */
export type InventoryItemStatus = 'available' | 'in-use' | 'maintenance' | 'retired';

/**
 * Basic inventory item (list view)
 */
export interface InventoryItem {
    id: number;
    templateId: number;
    name: string;
    status: InventoryItemStatus;
    createdAt: string;
    updatedAt: string;
}

/**
 * Detailed inventory item (single item view)
 */
export interface InventoryItemDetail extends InventoryItem {
    templateName: string;
    fields: Record<string, unknown>;
    assignments: Array<{
        personId: number;
        person?: Person;
        assignedAt: string;
        notes?: string;
    }>;
}

/**
 * Field type for item templates
 */
export type ItemFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

/**
 * Field definition in a template
 */
export interface ItemField {
    id: number;
    name: string;
    type: ItemFieldType;
    required: boolean;
    sortKey: number;
    options?: string[]; // For select fields
}

/**
 * Item template (category/type of items)
 */
export interface ItemTemplate {
    id: number;
    name: string;
    namePattern: string; // Pattern for auto-generating item names, e.g., "{name}-{id}"
    fields: ItemField[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Assignment of an item to a person
 */
export interface ItemAssignment {
    id: number;
    itemId: number;
    personId: number;
    assignedAt: string;
    returnedAt?: string;
    notes?: string;
}
