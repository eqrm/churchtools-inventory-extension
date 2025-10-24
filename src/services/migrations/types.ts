import type { IStorageProvider } from '../../types/storage'
import type { ISOTimestamp, SchemaVersion } from '../../types/entities'

/**
 * Represents the status of a migration execution attempt.
 */
export type MigrationStatus = SchemaVersion['status']

/**
 * Schema version record persisted locally to track migration history.
 */
export type SchemaVersionRecord = SchemaVersion

/**
 * Execution context provided to each migration.
 * Allows migrations to operate on storage provider and log progress.
 */
export interface MigrationContext {
  storageProvider: IStorageProvider
  log?: (message: string) => void
  now: () => ISOTimestamp
}

/**
 * Defines a schema migration from one version to another.
 */
export interface Migration {
  id: string
  description: string
  fromVersion: string
  toVersion: string
  runOrder?: number
  up: (context: MigrationContext) => Promise<void> | void
  down: (context: MigrationContext) => Promise<void> | void
}

/**
 * Result summary for a migration run sequence.
 */
export interface MigrationRunResult {
  applied: string[]
  skipped: string[]
  failed?: {
    migrationId: string
    error: Error
  }
}
