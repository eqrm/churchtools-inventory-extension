import Dexie, { type Table } from 'dexie';
import type {
    StockTakeSession,
    Asset,
} from '../../types/entities';

/**
 * Dexie Database Schema for Offline Support
 * Used for stock take sessions when offline
 */
export interface SyncQueueItem {
    id?: number;
    operation: 'create' | 'update' | 'delete';
    entity: 'asset' | 'stocktake' | 'scan';
    entityId: string;
    data: unknown;
    timestamp: number;
    retries: number;
}

/**
 * Inventory Database (IndexedDB via Dexie)
 */
export class InventoryDB extends Dexie {
    stockTakeSessions!: Table<StockTakeSession>;
    scannedAssets!: Table<Asset>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('ChurchToolsInventory');
        
        this.version(1).stores({
            stockTakeSessions: 'id, startDate, status',
            scannedAssets: 'id, assetNumber, stockTakeSessionId',
            syncQueue: '++id, operation, entity, timestamp',
        });
    }
}

/**
 * Singleton instance of the database
 */
export const inventoryDB = new InventoryDB();
