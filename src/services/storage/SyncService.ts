/**
 * Sync Service for Offline Stock Take
 * Handles automatic synchronization of queued scans when network is available (T165)
 */

import type { OfflineStorageProvider } from './OfflineProvider';
import type { IStorageProvider } from '../../types/storage';
import type { SyncQueueItem } from './InventoryDB';

export interface SyncProgress {
    total: number;
    completed: number;
    failed: number;
    isSyncing: boolean;
}

export class SyncService {
    private readonly offlineProvider: OfflineStorageProvider;
    private readonly onlineProvider: IStorageProvider;
    private isSyncing = false;
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private readonly MAX_RETRIES = 3;
    private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

    constructor(
        offlineProvider: OfflineStorageProvider,
        onlineProvider: IStorageProvider
    ) {
        this.offlineProvider = offlineProvider;
        this.onlineProvider = onlineProvider;
    }

    /**
     * Start automatic sync on network reconnection
     * Sets up periodic checks for queued items
     */
    startAutoSync(): void {
        if (this.syncInterval) {
            return; // Already running
        }

        // Check every 30 seconds if online and there are items to sync
        this.syncInterval = setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                void this.syncQueuedItems();
            }
        }, this.SYNC_INTERVAL_MS);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Synchronize all queued items (T165)
     * Returns sync progress information
     */
    async syncQueuedItems(): Promise<SyncProgress> {
        if (this.isSyncing) {
            throw new Error('Sync already in progress');
        }

        if (!navigator.onLine) {
            throw new Error('Cannot sync while offline');
        }

        this.isSyncing = true;

        try {
            const queueItems = await this.offlineProvider.getSyncQueue();
            const progress: SyncProgress = {
                total: queueItems.length,
                completed: 0,
                failed: 0,
                isSyncing: true,
            };

            for (const item of queueItems) {
                if (!item.id) {
                    console.error('Sync item missing ID, skipping');
                    progress.failed++;
                    continue;
                }

                try {
                    await this.syncItem(item);
                    await this.offlineProvider.removeSyncQueueItem(item.id);
                    progress.completed++;
                } catch (error) {
                    console.error(`Failed to sync item ${item.id}:`, error);
                    
                    // Increment retry count
                    const newRetries = item.retries + 1;
                    
                    if (newRetries >= this.MAX_RETRIES) {
                        // Remove item after max retries
                        console.error(`Item ${item.id} exceeded max retries, removing from queue`);
                        await this.offlineProvider.removeSyncQueueItem(item.id);
                        progress.failed++;
                    } else {
                        // Update retry count
                        await this.offlineProvider.updateSyncQueueItem(item.id, newRetries);
                        progress.failed++;
                    }
                }
            }

            progress.isSyncing = false;
            return progress;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Sync a single queue item
     */
    private async syncItem(item: SyncQueueItem): Promise<void> {
        switch (item.entity) {
            case 'scan':
                await this.syncScan(item);
                break;
            case 'stocktake':
                await this.syncStockTake(item);
                break;
            default:
                throw new Error(`Unknown entity type: ${item.entity}`);
        }
    }

    /**
     * Sync a scanned asset to the online provider
     */
    private async syncScan(item: SyncQueueItem): Promise<void> {
        const scanData = item.data as {
            sessionId: string;
            assetId: string;
            scannedBy: string;
            location?: string;
        };

        await this.onlineProvider.addStockTakeScan(
            scanData.sessionId,
            scanData.assetId,
            scanData.scannedBy,
            scanData.location
        );
    }

    /**
     * Sync a stock take session to the online provider
     */
    private async syncStockTake(item: SyncQueueItem): Promise<void> {
        // For now, just log - full implementation would sync session data
        console.warn('Stock take session sync not yet implemented:', item.entityId);
    }

    /**
     * Get current sync progress
     */
    async getSyncProgress(): Promise<SyncProgress> {
        const count = await this.offlineProvider.getSyncQueueCount();
        return {
            total: count,
            completed: 0,
            failed: 0,
            isSyncing: this.isSyncing,
        };
    }

    /**
     * Check if there are items waiting to sync
     */
    async hasPendingSync(): Promise<boolean> {
        const count = await this.offlineProvider.getSyncQueueCount();
        return count > 0;
    }
}
