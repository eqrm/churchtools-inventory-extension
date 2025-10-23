/**
 * Hook for sync service access and automatic synchronization (T165)
 */

import { useEffect, useState } from 'react';
import { SyncService, type SyncProgress } from '../services/storage/SyncService';
import { inventoryDB } from '../services/storage/InventoryDB';
import { OfflineStorageProvider } from '../services/storage/OfflineProvider';
import { useStorageProvider } from './useStorageProvider';
import { useOnlineStatus } from './useOnlineStatus';

let syncServiceInstance: SyncService | null = null;

/**
 * Get or create singleton sync service instance
 */
function getSyncService(onlineProvider: unknown): SyncService {
    if (!syncServiceInstance) {
        const offlineProvider = new OfflineStorageProvider(inventoryDB);
        syncServiceInstance = new SyncService(offlineProvider, onlineProvider as never);
    }
    return syncServiceInstance;
}

/**
 * Hook to access sync service and monitor sync progress (T165, T166)
 * Automatically starts sync when network reconnects
 * 
 * @example
 * ```tsx
 * const { syncProgress, hasPending, triggerSync } = useSyncService();
 * 
 * {hasPending && (
 *   <Alert>
 *     {syncProgress.completed}/{syncProgress.total} items synced
 *   </Alert>
 * )}
 * ```
 */
export function useSyncService() {
    const onlineProvider = useStorageProvider();
    const isOnline = useOnlineStatus();
    const [syncProgress, setSyncProgress] = useState<SyncProgress>({
        total: 0,
        completed: 0,
        failed: 0,
        isSyncing: false,
    });
    const [hasPending, setHasPending] = useState(false);

    useEffect(() => {
        if (!onlineProvider) {
            return;
        }

        const syncService = getSyncService(onlineProvider);

        // Check for pending items
        void syncService.hasPendingSync().then(setHasPending);

        // Start auto-sync
        syncService.startAutoSync();

        // Monitor online status and trigger sync when reconnected
        if (isOnline && hasPending) {
            void syncService.syncQueuedItems()
                .then(progress => {
                    setSyncProgress(progress);
                    setHasPending(false);
                })
                .catch(error => {
                    console.error('Auto-sync failed:', error);
                });
        }

        return () => {
            syncService.stopAutoSync();
        };
    }, [onlineProvider, isOnline, hasPending]);

    /**
     * Manually trigger sync
     */
    const triggerSync = async (): Promise<void> => {
        if (!onlineProvider) {
            throw new Error('Storage provider not available');
        }

        const syncService = getSyncService(onlineProvider);
        const progress = await syncService.syncQueuedItems();
        setSyncProgress(progress);
        
        if (progress.completed === progress.total) {
            setHasPending(false);
        }
    };

    return {
        syncProgress,
        hasPending,
        triggerSync,
        isOnline,
    };
}
