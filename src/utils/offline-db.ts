/**
 * Offline Database Schema
 * Feature: 002-bug-fixes-ux-improvements (FR-077-082)
 * Purpose: IndexedDB schema for offline-first stocktake and sync conflict resolution
 * 
 * Uses Dexie.js for type-safe IndexedDB operations
 */

import Dexie, { type EntityTable } from 'dexie'
import type { UUID, ISOTimestamp } from '../types/entities'
import type { SyncConflict } from '../types/sync'

/**
 * Stocktake session (FR-080)
 * Tracks a complete inventory count session
 */
export interface StockTakeSession {
  id: UUID
  name: string
  description?: string
  startedAt: ISOTimestamp
  completedAt?: ISOTimestamp
  startedBy: string  // Person ID
  startedByName: string
  status: 'in-progress' | 'completed' | 'cancelled'
  totalScans: number
  uniqueAssets: number
}

/**
 * Individual asset scan during stocktake (FR-081)
 * Recorded offline, synced when online
 */
export interface StockTakeScan {
  id: UUID
  sessionId: UUID
  assetId: UUID
  assetNumber: string
  assetName: string
  scannedAt: ISOTimestamp
  scannedBy: string  // Person ID
  scannedByName: string
  location?: string  // Where asset was found
  condition?: string  // Asset condition notes
  synced: boolean  // Whether synced to server
  syncedAt?: ISOTimestamp
}

/**
 * Person cache for offline person search (FR-011)
 * Stores recently used people for offline access
 */
export interface PersonCache {
  id: string  // ChurchTools person ID
  firstName: string
  lastName: string
  email?: string
  avatarUrl?: string
  lastUsed: ISOTimestamp
  searchText: string  // Lowercase concatenation for fast search
}

/**
 * Dexie database instance
 */
export class OfflineDatabase extends Dexie {
  // Typed table declarations
  stockTakeSessions!: EntityTable<StockTakeSession, 'id'>
  stockTakeScans!: EntityTable<StockTakeScan, 'id'>
  syncConflicts!: EntityTable<SyncConflict, 'id'>
  personCache!: EntityTable<PersonCache, 'id'>

  constructor() {
    super('churchtools-inventory-offline')
    
    this.version(1).stores({
      // Schema definition (indexes only, not all fields)
      stockTakeSessions: 'id, status, startedAt, startedBy',
      stockTakeScans: 'id, sessionId, assetId, scannedAt, synced',
      syncConflicts: 'id, entityType, detectedAt, resolvedAt',
      personCache: 'id, lastUsed, searchText'
    })
  }
}

/**
 * Singleton database instance
 * Import this throughout the app to access offline storage
 */
export const offlineDb = new OfflineDatabase()

/**
 * Initialize database and perform any necessary migrations
 * Call this once during app startup
 */
export async function initializeOfflineDb(): Promise<void> {
  try {
    await offlineDb.open()
    // Database initialized successfully
  } catch (error) {
    console.error('❌ Failed to initialize offline database:', error)
    throw error
  }
}

/**
 * Clear all offline data (useful for testing or reset)
 */
export async function clearOfflineDb(): Promise<void> {
  await offlineDb.stockTakeSessions.clear()
  await offlineDb.stockTakeScans.clear()
  await offlineDb.syncConflicts.clear()
  await offlineDb.personCache.clear()
  // Database cleared
}

/**
 * Get database statistics for debugging
 */
export async function getOfflineDbStats() {
  const [sessions, scans, conflicts, people] = await Promise.all([
    offlineDb.stockTakeSessions.count(),
    offlineDb.stockTakeScans.count(),
    offlineDb.syncConflicts.count(),
    offlineDb.personCache.count()
  ])

  return {
    stockTakeSessions: sessions,
    stockTakeScans: scans,
    syncConflicts: conflicts,
    personCache: people
  }
}
