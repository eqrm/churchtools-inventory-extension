import type { InventoryDB, SyncQueueItem } from './InventoryDB';
import type {
    StockTakeSession,
    Asset,
    UUID,
    StockTakeSessionCreate,
} from '../../types/entities';

/**
 * Offline Storage Provider
 * Implements storage using Dexie.js (IndexedDB) for offline stock take sessions
 * Supports offline stock take with automatic sync queue
 */
export class OfflineStorageProvider {
    private readonly database: InventoryDB;
    
    constructor(database: InventoryDB) {
        this.database = database;
    }

    /**
     * Download stock take session data to IndexedDB (T162)
     * Called at session start to enable offline scanning
     */
    async downloadSessionData(session: StockTakeSession, expectedAssets: Asset[]): Promise<void> {
        try {
            // Store session
            await this.database.stockTakeSessions.put(session);
            
            // Store expected assets for offline validation
            await this.database.scannedAssets.bulkPut(expectedAssets);
        } catch (error) {
            console.error('Failed to download session data:', error);
            throw new Error('Failed to prepare offline session data');
        }
    }

    /**
     * Get stock take session from IndexedDB
     */
    async getStockTakeSession(sessionId: UUID): Promise<StockTakeSession | undefined> {
        return await this.database.stockTakeSessions.get(sessionId);
    }

    /**
     * Update stock take session in IndexedDB
     */
    async updateStockTakeSession(session: StockTakeSession): Promise<void> {
        await this.database.stockTakeSessions.put(session);
    }

    /**
     * Queue a scan locally when offline (T164)
     * Stores scan in sync queue for later upload
     */
    async queueScan(sessionId: UUID, assetId: UUID, scannedBy: string, location?: string): Promise<void> {
        const queueItem: SyncQueueItem = {
            operation: 'create',
            entity: 'scan',
            entityId: `${sessionId}-${assetId}`,
            data: {
                sessionId,
                assetId,
                scannedBy,
                location,
                timestamp: new Date().toISOString(),
            },
            timestamp: Date.now(),
            retries: 0,
        };

        await this.database.syncQueue.add(queueItem);
    }

    /**
     * Get all queued sync items (T165)
     */
    async getSyncQueue(): Promise<SyncQueueItem[]> {
        return await this.database.syncQueue.toArray();
    }

    /**
     * Remove sync queue item after successful sync
     */
    async removeSyncQueueItem(id: number): Promise<void> {
        await this.database.syncQueue.delete(id);
    }

    /**
     * Update sync queue item retry count
     */
    async updateSyncQueueItem(id: number, retries: number): Promise<void> {
        await this.database.syncQueue.update(id, { retries });
    }

    /**
     * Clear all sync queue items
     */
    async clearSyncQueue(): Promise<void> {
        await this.database.syncQueue.clear();
    }

    /**
     * Get count of pending sync items
     */
    async getSyncQueueCount(): Promise<number> {
        return await this.database.syncQueue.count();
    }

    /**
     * Create stock take session in IndexedDB (for offline creation)
     */
    async createStockTakeSession(data: StockTakeSessionCreate): Promise<StockTakeSession> {
        const now = new Date().toISOString();
        const session: StockTakeSession = {
            id: `temp-${Date.now()}` as UUID, // Temporary ID
            ...data,
            expectedAssets: [],
            scannedAssets: [],
            missingAssets: [],
            unexpectedAssets: [],
            createdAt: now,
            lastModifiedAt: now,
        };

        await this.database.stockTakeSessions.add(session);
        
        // Queue for sync
        await this.database.syncQueue.add({
            operation: 'create',
            entity: 'stocktake',
            entityId: session.id,
            data: session,
            timestamp: Date.now(),
            retries: 0,
        });

        return session;
    }

    /**
     * Get expected assets for a session (for offline validation)
     */
    async getExpectedAssets(sessionId: UUID): Promise<Asset[]> {
        // In offline mode, we need to filter assets based on session scope
        // For simplicity, return all cached assets
        return await this.database.scannedAssets
            .where('stockTakeSessionId')
            .equals(sessionId)
            .toArray();
    }

    /**
     * Add scanned asset to session in IndexedDB
     */
    async addScannedAsset(asset: Asset): Promise<void> {
        await this.database.scannedAssets.put(asset);
    }

    /**
     * Clear session data from IndexedDB
     */
    async clearSessionData(sessionId: UUID): Promise<void> {
        await this.database.stockTakeSessions.delete(sessionId);
        await this.database.scannedAssets
            .where('stockTakeSessionId')
            .equals(sessionId)
            .delete();
    }
}
