import type { SchemaVersionRecord, MigrationStatus } from './types'

const STORAGE_KEY = 'ct_inventory_schema_versions'

function resolveStorage(provided?: Storage): Storage {
  if (provided) return provided
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  throw new Error('SchemaVersioningService requires a storage implementation')
}

/**
 * Manages persistence of schema version history using localStorage.
 * The implementation is intentionally simple but can be replaced with
 * server-backed storage in the future without changing the consumer API.
 */
export class SchemaVersioningService {
  private readonly storage: Storage

  constructor(storage?: Storage) {
    this.storage = resolveStorage(storage)
  }

  getHistory(): SchemaVersionRecord[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as SchemaVersionRecord[]
      return parsed
    } catch (error) {
      console.warn('[SchemaVersioning] Failed to load history, resetting cache.', error)
      this.storage.removeItem(STORAGE_KEY)
      return []
    }
  }

  getCurrentVersion(): string | null {
    const history = this.getHistory()
    const successful = history
      .filter(record => record.status === 'success')
      .sort((a, b) => new Date(b.completedAt ?? b.appliedAt).getTime() - new Date(a.completedAt ?? a.appliedAt).getTime())
    return successful[0]?.version ?? null
  }

  record(version: string, status: MigrationStatus, update: Partial<SchemaVersionRecord>): void {
    const history = this.getHistory()
    const index = history.findIndex(record => record.version === version)
    const now = new Date().toISOString()

    if (index >= 0) {
      const existing = history[index]
      if (!existing) {
        history[index] = {
          version,
          status,
          appliedAt: update.appliedAt ?? now,
          completedAt: status === 'pending' ? undefined : update.completedAt ?? now,
          errorMessage: update.errorMessage,
          rolledBackAt: update.rolledBackAt,
        }
      } else {
      history[index] = {
        version,
        status,
        appliedAt: update.appliedAt ?? existing.appliedAt ?? now,
        completedAt:
          status === 'pending'
            ? undefined
            : update.completedAt ?? existing.completedAt ?? now,
        errorMessage: update.errorMessage ?? existing.errorMessage,
        rolledBackAt: update.rolledBackAt ?? existing.rolledBackAt,
      }
      }
    } else {
      history.push({
        version,
        status,
        appliedAt: update.appliedAt ?? now,
        completedAt: update.completedAt,
        errorMessage: update.errorMessage,
        rolledBackAt: update.rolledBackAt,
      })
    }

    this.storage.setItem(STORAGE_KEY, JSON.stringify(history))
  }

  markPending(version: string): void {
    this.record(version, 'pending', { appliedAt: new Date().toISOString(), completedAt: undefined, errorMessage: undefined, rolledBackAt: undefined })
  }

  markSuccess(version: string): void {
    this.record(version, 'success', { completedAt: new Date().toISOString(), errorMessage: undefined, rolledBackAt: undefined })
  }

  markFailure(version: string, errorMessage: string, rolledBack: boolean): void {
    this.record(version, 'failed', {
      completedAt: new Date().toISOString(),
      errorMessage,
      rolledBackAt: rolledBack ? new Date().toISOString() : undefined,
    })
  }

  clearHistory(): void {
    this.storage.removeItem(STORAGE_KEY)
  }
}
