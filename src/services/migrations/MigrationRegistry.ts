import type { Migration } from './types'

/**
 * Registry storing available migrations sorted in the correct execution order.
 */
export class MigrationRegistry {
  private readonly migrations: Migration[] = []

  register(migration: Migration): void {
    if (this.migrations.some(existing => existing.id === migration.id)) {
      throw new Error(`Migration with id ${migration.id} already registered`)
    }
    this.migrations.push(migration)
    this.migrations.sort((a, b) => {
      if (a.runOrder !== undefined && b.runOrder !== undefined && a.runOrder !== b.runOrder) {
        return a.runOrder - b.runOrder
      }
      // fallback to semantic order if provided
      if (a.fromVersion === b.fromVersion) {
        return compareVersions(a.toVersion, b.toVersion)
      }
      return compareVersions(a.fromVersion, b.fromVersion)
    })
  }

  list(): Migration[] {
    return [...this.migrations]
  }
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i += 1) {
    const segA = partsA[i] ?? 0
    const segB = partsB[i] ?? 0
    if (segA > segB) return 1
    if (segA < segB) return -1
  }
  return 0
}
