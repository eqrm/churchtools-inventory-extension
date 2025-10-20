/**
 * Test Data Factory
 * 
 * Factory functions for creating test data with sensible defaults.
 * Makes tests more readable and maintainable.
 */

import type { Person, Campus } from '../../utils/ct-types';
import type {
    InventoryItem,
    InventoryItemDetail,
    ItemTemplate,
    ItemField,
} from '../../utils/inventory-types';

/**
 * Safe test user IDs that can be used for testing without spamming real users
 */
export const TEST_USER_IDS = [4618, 6465, 11672, 6462] as const;

/**
 * Create a mock inventory item
 */
export function createMockInventoryItem(
    overrides?: Partial<InventoryItem>
): InventoryItem {
    const id = overrides?.id ?? Math.floor(Math.random() * 10000);
    const idStr = String(id);
    return {
        id,
        templateId: 1,
        name: `Test Item ${idStr}`,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock inventory item with full details
 */
export function createMockInventoryItemDetail(
    overrides?: Partial<InventoryItemDetail>
): InventoryItemDetail {
    const id = overrides?.id ?? Math.floor(Math.random() * 10000);
    const idStr = String(id);
    return {
        id,
        templateId: 1,
        templateName: 'Test Template',
        name: `Test Item ${idStr}`,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: {},
        assignments: [],
        ...overrides,
    };
}

/**
 * Create a mock item template
 */
export function createMockItemTemplate(
    overrides?: Partial<ItemTemplate>
): ItemTemplate {
    const id = overrides?.id ?? Math.floor(Math.random() * 10000);
    const idStr = String(id);
    return {
        id,
        name: `Test Template ${idStr}`,
        namePattern: '{name}',
        fields: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock item field
 */
export function createMockItemField(
    overrides?: Partial<ItemField>
): ItemField {
    const id = overrides?.id ?? Math.floor(Math.random() * 10000);
    const idStr = String(id);
    return {
        id,
        name: `Test Field ${idStr}`,
        type: 'text',
        required: false,
        sortKey: 0,
        ...overrides,
    };
}

/**
 * Create a mock person (ChurchTools user)
 */
export function createMockPerson(overrides?: Partial<Person>): Person {
    const id = overrides?.id ?? TEST_USER_IDS[0];
    const idStr = String(id);
    return {
        id,
        firstName: 'Test',
        lastName: `User ${idStr}`,
        email: `test.user.${idStr}@example.com`,
        editSecurityLevelForPerson: 1,
        ...overrides,
    } as Person;
}

/**
 * Create a mock campus
 */
export function createMockCampus(overrides?: Partial<Campus>): Campus {
    const id = overrides?.id ?? Math.floor(Math.random() * 10000);
    const idStr = String(id);
    return {
        id,
        guid: `test-campus-${idStr}`,
        name: `Test Campus ${idStr}`,
        nameTranslated: `Test Campus ${idStr}`,
        shortName: `TC${idStr}`,
        shorty: `tc${idStr}`,
        sortKey: 0,
        ...overrides,
    } as Campus;
}

/**
 * Create multiple mock items
 */
export function createMockInventoryItems(
    count: number,
    overrides?: Partial<InventoryItem>
): InventoryItem[] {
    return Array.from({ length: count }, (_, i) =>
        createMockInventoryItem({ ...overrides, id: i + 1 })
    );
}

/**
 * Create a mock barcode value
 */
export function createMockBarcode(prefix = 'TEST'): string {
    const random = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
    return `${prefix}-${random}`;
}

/**
 * Create a mock QR code value
 */
export function createMockQRCode(itemId: number): string {
    const itemIdStr = String(itemId);
    const timestampStr = String(Date.now());
    return `INV-${itemIdStr}-${timestampStr}`;
}
