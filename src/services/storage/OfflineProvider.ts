import type Dexie from 'dexie';

/**
 * Offline Storage Provider
 * Implements storage using Dexie.js (IndexedDB) for offline stock take sessions
 * 
 * NOTE: This is a stub implementation. Full implementation will be done in Phase 9 (User Story 7).
 */
export class OfflineStorageProvider {
    // @ts-expect-error - Will be used in Phase 9 implementation
    private readonly _database: Dexie;
    
    constructor(database: Dexie) {
        this._database = database;
    }

    // Stub method - will be implemented in Phase 9
    getAssets(): Promise<never> {
        throw new Error('Not implemented yet - will be implemented in Phase 9 (User Story 7)');
    }
}
