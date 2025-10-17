/**
 * Asset ID generation and management service
 */

import type { InventoryItem, PrefixCounters } from '../types';
import { savePrefixCounters } from './storage.service';

/**
 * Ensure prefix counters reflect the highest numbers in existing items
 */
export function ensurePrefixCountersFromItems(items: InventoryItem[], counters: PrefixCounters): void {
    for (const it of items) {
        if (!it.assetId) continue;
        const parts = it.assetId.split('-');
        if (parts.length < 2) continue;
        const prefix = parts.slice(0, parts.length - 1).join('-');
        const numStr = parts[parts.length - 1];
        const num = parseInt(numStr, 10);
        if (Number.isFinite(num)) {
            counters[prefix] = Math.max(counters[prefix] ?? 0, num);
        }
    }
}

/**
 * Generate the next asset ID for a given prefix
 * @param prefix - The prefix to use (e.g., "CAM", "MIC")
 * @param items - All existing items
 * @param counters - Counter state
 * @returns Formatted asset ID (e.g., "CAM-00042")
 */
export async function nextAssetId(
    prefix: string,
    items: InventoryItem[],
    counters: PrefixCounters
): Promise<string> {
    // Normalize prefix to upper-case, remove whitespace
    const p = (prefix || '').trim();
    if (!p) throw new Error('Prefix required');
    
    // ensure counters reflect items
    ensurePrefixCountersFromItems(items, counters);
    
    let counter = counters[p] ?? 0;
    counter = Math.max(counter, 0) + 1;
    counters[p] = counter;
    
    await savePrefixCounters(counters);
    
    const num = String(counter).padStart(5, '0');
    return `${p}-${num}`;
}
