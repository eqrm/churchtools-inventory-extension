/**
 * Offline Sync API Contract
 * 
 * Addresses: T310 - Offline mode for stock take
 * Related Requirements: FR-079, FR-080, FR-081, FR-081a (Clarification Q3)
 * Conflict Resolution Strategy: Manual resolution with side-by-side comparison
 * 
 * This contract defines the interface for syncing offline data created
 * during stock take sessions when device reconnects to network.
 */

// ==================== Request Types ====================

/**
 * Request to sync offline data to server
 */
export interface SyncRequest {
  /** Entities to sync (from IndexedDB) */
  entities: SyncEntity[];
  
  /** Device/session identifier (for conflict tracking) */
  deviceId: string;
  
  /** When sync was initiated */
  syncStartedAt: Date;
  
  /** Force sync even if conflicts detected (after manual resolution) */
  forceSync?: boolean;
}

/**
 * Single entity to sync (stock take scan, session, etc.)
 */
export interface SyncEntity {
  /** Entity type */
  type: 'stock-take-session' | 'stock-take-scan' | 'asset' | 'booking';
  
  /** Local ID (IndexedDB) */
  localId: string;
  
  /** Server ID (if entity was previously synced) */
  serverId?: string;
  
  /** Entity data */
  data: any;
  
  /** When entity was created offline */
  createdAt: Date;
  
  /** When entity was last modified offline */
  updatedAt: Date;
  
  /** Schema version of entity */
  schemaVersion: string;
}

// ==================== Response Types ====================

/**
 * Response from sync operation
 */
export interface SyncResponse {
  /** Overall sync status */
  status: 'success' | 'partial' | 'failed' | 'conflicts';
  
  /** Successfully synced entities */
  synced: SyncedEntity[];
  
  /** Failed entities (validation errors, etc.) */
  failed: FailedEntity[];
  
  /** Entities with conflicts requiring manual resolution */
  conflicts: ConflictEntity[];
  
  /** Summary statistics */
  summary: {
    totalEntities: number;
    successCount: number;
    failedCount: number;
    conflictCount: number;
  };
  
  /** When sync completed */
  completedAt: Date;
}

/**
 * Successfully synced entity
 */
export interface SyncedEntity {
  type: string;
  localId: string;
  serverId: string;        // Server-assigned ID
  syncedAt: Date;
}

/**
 * Failed entity (validation error, etc.)
 */
export interface FailedEntity {
  type: string;
  localId: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Entity with conflict (Per Clarification Q3: Manual resolution)
 */
export interface ConflictEntity {
  type: string;
  localId: string;
  serverId: string;
  
  /** Offline version of data */
  offlineData: any;
  
  /** Server version of data */
  serverData: any;
  
  /** Differences detected */
  differences: DataDifference[];
  
  /** When conflict was detected */
  detectedAt: Date;
}

/**
 * Difference between offline and server data
 */
export interface DataDifference {
  field: string;
  offlineValue: any;
  serverValue: any;
  diffType: 'value-changed' | 'field-added' | 'field-removed';
}

// ==================== Conflict Resolution Types ====================

/**
 * Request to resolve conflicts (Per Clarification Q3)
 */
export interface ResolveConflictRequest {
  /** Conflict ID to resolve */
  conflictId: string;
  
  /** Resolution strategy */
  resolution: 'keep-offline' | 'keep-server' | 'merge';
  
  /** Merged data (if resolution = 'merge') */
  mergedData?: any;
  
  /** Person resolving conflict */
  resolvedBy: string;
}

/**
 * Response from conflict resolution
 */
export interface ResolveConflictResponse {
  success: boolean;
  
  /** Updated entity after resolution */
  resolvedEntity?: SyncedEntity;
  
  error?: {
    code: string;
    message: string;
  };
}

// ==================== Service Interface ====================

/**
 * Offline sync service interface
 */
export interface IOfflineSyncService {
  /**
   * Sync all offline data to server
   * 
   * Per Clarification Q3: Manual conflict resolution
   * - Detects conflicts by comparing offline vs server data
   * - Returns conflicts requiring user decision
   * - Does NOT automatically resolve conflicts
   * 
   * @param request Sync request with offline entities
   * @returns Promise resolving to sync results
   */
  sync(request: SyncRequest): Promise<SyncResponse>;
  
  /**
   * Get current sync status
   * 
   * @returns Promise resolving to sync status
   */
  getSyncStatus(): Promise<SyncStatus>;
  
  /**
   * Resolve a specific conflict
   * 
   * Per Clarification Q3: Side-by-side comparison UI
   * - User views offline data vs server data
   * - User chooses: keep offline, keep server, or merge
   * - If merge: User manually edits merged version
   * 
   * @param request Conflict resolution request
   * @returns Promise resolving to resolution result
   */
  resolveConflict(request: ResolveConflictRequest): Promise<ResolveConflictResponse>;
  
  /**
   * Get all pending conflicts
   * 
   * @returns Promise resolving to array of conflicts
   */
  getPendingConflicts(): Promise<ConflictEntity[]>;
  
  /**
   * Clear all offline data (after successful sync)
   */
  clearOfflineData(): Promise<void>;
}

// ==================== Sync Status Types ====================

/**
 * Current sync status
 */
export interface SyncStatus {
  /** Is device online? */
  isOnline: boolean;
  
  /** Is sync currently in progress? */
  isSyncing: boolean;
  
  /** Pending entities to sync */
  pendingCount: number;
  
  /** Pending conflicts to resolve */
  conflictCount: number;
  
  /** Last successful sync */
  lastSyncAt?: Date;
  
  /** Last sync error */
  lastSyncError?: {
    message: string;
    occurredAt: Date;
  };
}

// ==================== Conflict Detection Algorithm ====================

/**
 * CONFLICT DETECTION ALGORITHM (Per Clarification Q3):
 * 
 * For each offline entity:
 * 
 * 1. Check if entity exists on server (by serverId)
 * 2. If not exists on server: No conflict, create new
 * 3. If exists on server:
 *    a. Compare updatedAt timestamps
 *    b. If offline updatedAt > server updatedAt: No conflict, update
 *    c. If offline updatedAt < server updatedAt: CONFLICT
 *    d. Compare data fields for differences
 *    e. Create ConflictEntity with differences
 * 
 * Example Conflict:
 * 
 * Offline StockTakeScan:
 * {
 *   localId: 'local-scan-123',
 *   serverId: 'scan-456',
 *   assetId: 'asset-789',
 *   location: 'Storage Room A',
 *   condition: 'Good',
 *   updatedAt: '2025-01-15T10:00:00Z'
 * }
 * 
 * Server StockTakeScan:
 * {
 *   id: 'scan-456',
 *   assetId: 'asset-789',
 *   location: 'Main Hall',        // Changed!
 *   condition: 'Good',
 *   updatedAt: '2025-01-15T10:05:00Z'  // Later timestamp
 * }
 * 
 * → CONFLICT DETECTED:
 * - Field 'location' differs: 'Storage Room A' (offline) vs 'Main Hall' (server)
 * - Server timestamp is later (modified after offline scan)
 * - Requires manual resolution
 */

// ==================== Implementation Notes ====================

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Offline Data Storage (Dexie.js + IndexedDB):
 *    - StockTakeSessions: Stored with syncStatus='offline'
 *    - StockTakeScans: Stored with localId, syncStatus='offline'
 *    - Conflicts: Stored separately for resolution UI
 * 
 * 2. Sync Trigger Conditions:
 *    - Manual: User clicks "Sync Now" button
 *    - Automatic: On network reconnection (navigator.onLine)
 *    - Automatic: On stock take session completion
 * 
 * 3. Sync Flow (Per Clarification Q3):
 *    a. Gather all offline entities (syncStatus='offline')
 *    b. Send to server in batch
 *    c. Server validates each entity
 *    d. Server compares with existing data (conflict detection)
 *    e. Server returns: synced[], failed[], conflicts[]
 *    f. Frontend stores conflicts in IndexedDB
 *    g. Frontend shows conflict notification
 *    h. User opens conflict resolution UI
 *    i. User resolves each conflict (keep offline / keep server / merge)
 *    j. Frontend sends resolution back to server
 *    k. Server applies resolution, updates entity
 *    l. Frontend marks entity as synced, removes from conflicts
 * 
 * 4. Conflict Resolution UI (Clarification Q3):
 *    - Side-by-side comparison:
 *      ┌─────────────────────┬─────────────────────┐
 *      │ Offline Data        │ Server Data         │
 *      ├─────────────────────┼─────────────────────┤
 *      │ Location:           │ Location:           │
 *      │ Storage Room A ✓    │ Main Hall           │
 *      ├─────────────────────┼─────────────────────┤
 *      │ Condition: Good     │ Condition: Good     │
 *      └─────────────────────┴─────────────────────┘
 *      [Keep Offline] [Keep Server] [Merge Manually]
 *    - Highlight differences in red/green
 *    - Show timestamps for context
 *    - Allow field-by-field selection in merge mode
 * 
 * 5. Error Handling:
 *    - Network errors: Retry with exponential backoff
 *    - Validation errors: Mark as failed, show error to user
 *    - Conflicts: Store for manual resolution, do not retry
 *    - Server errors (5xx): Retry later
 * 
 * 6. Performance:
 *    - Batch sync: Max 100 entities per request
 *    - Progress indicator: Show "X of Y synced"
 *    - Background sync: Use Web Worker for large batches
 *    - Debounce sync triggers: Wait 5 seconds after last offline change
 * 
 * 7. Data Integrity:
 *    - Transaction-based sync: All-or-nothing per entity
 *    - Preserve offline data until explicitly cleared
 *    - Log all sync operations for audit trail
 *    - Allow re-sync if user cancels conflict resolution
 * 
 * 8. Testing:
 *    - Test conflict detection algorithm (timestamp comparison)
 *    - Test all resolution strategies (keep offline, keep server, merge)
 *    - Test network reconnection (online event)
 *    - Test batch sync with large datasets (1000+ scans)
 *    - Test sync interruption (network loss during sync)
 */

// ==================== Example Usage ====================

/**
 * Example: Sync offline stock take data
 * 
 * ```typescript
 * const service: IOfflineSyncService = new OfflineSyncService();
 * 
 * // Check if there's offline data to sync
 * const status = await service.getSyncStatus();
 * console.log(`Pending entities: ${status.pendingCount}`);
 * console.log(`Conflicts: ${status.conflictCount}`);
 * 
 * if (status.pendingCount > 0) {
 *   // Gather offline entities
 *   const offlineScans = await db.stockTakeScans
 *     .where('syncStatus').equals('offline')
 *     .toArray();
 *   
 *   const entities: SyncEntity[] = offlineScans.map(scan => ({
 *     type: 'stock-take-scan',
 *     localId: scan.localId,
 *     serverId: scan.serverId,
 *     data: scan,
 *     createdAt: scan.createdAt,
 *     updatedAt: scan.updatedAt,
 *     schemaVersion: scan.schemaVersion
 *   }));
 *   
 *   // Sync to server
 *   const result = await service.sync({
 *     entities,
 *     deviceId: 'device-abc-123',
 *     syncStartedAt: new Date()
 *   });
 *   
 *   console.log(`Synced: ${result.summary.successCount}`);
 *   console.log(`Failed: ${result.summary.failedCount}`);
 *   console.log(`Conflicts: ${result.summary.conflictCount}`);
 *   
 *   // Handle conflicts
 *   if (result.conflicts.length > 0) {
 *     console.log('Conflicts detected, user resolution required');
 *     // Show conflict resolution UI
 *   }
 * }
 * ```
 * 
 * Example: Resolve a conflict (Clarification Q3)
 * 
 * ```typescript
 * // User views conflict in side-by-side UI
 * const conflicts = await service.getPendingConflicts();
 * const conflict = conflicts[0];
 * 
 * console.log('Offline data:', conflict.offlineData);
 * console.log('Server data:', conflict.serverData);
 * console.log('Differences:', conflict.differences);
 * 
 * // User chooses to keep offline version
 * const resolution = await service.resolveConflict({
 *   conflictId: conflict.localId,
 *   resolution: 'keep-offline',
 *   resolvedBy: 'person-123'
 * });
 * 
 * if (resolution.success) {
 *   console.log('Conflict resolved, entity synced');
 * }
 * ```
 * 
 * Example: Manual merge conflict
 * 
 * ```typescript
 * // User manually edits merged version
 * const mergedData = {
 *   ...conflict.offlineData,
 *   location: conflict.serverData.location,  // Take server location
 *   condition: conflict.offlineData.condition // Keep offline condition
 * };
 * 
 * const resolution = await service.resolveConflict({
 *   conflictId: conflict.localId,
 *   resolution: 'merge',
 *   mergedData,
 *   resolvedBy: 'person-123'
 * });
 * ```
 */
