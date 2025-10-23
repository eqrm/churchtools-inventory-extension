import { SchemaVersioningService } from './SchemaVersioning'
import type { Migration, MigrationRunResult, MigrationContext } from './types'
import { MigrationRegistry } from './MigrationRegistry'

interface RunMigrationsOptions {
  migrations: Migration[]
  schemaVersioning?: SchemaVersioningService
  context: Omit<MigrationContext, 'now'> & { now?: () => string }
  baseVersion?: string
}

export async function runMigrations(options: RunMigrationsOptions): Promise<MigrationRunResult> {
  const { migrations, baseVersion = '1.0.0' } = options
  const schemaVersioning = options.schemaVersioning ?? new SchemaVersioningService()
  const context: MigrationContext = {
    ...options.context,
    now: options.context.now ?? (() => new Date().toISOString()),
  }

  const registry = new MigrationRegistry()
  migrations.forEach(migration => registry.register(migration))
  const orderedMigrations = registry.list()

  const history = schemaVersioning.getHistory()
  const appliedVersions = new Set(history.filter(record => record.status === 'success').map(record => record.version))
  const result: MigrationRunResult = {
    applied: [],
    skipped: [],
  }

  let currentVersion = schemaVersioning.getCurrentVersion() ?? baseVersion

  for (const migration of orderedMigrations) {
    if (appliedVersions.has(migration.toVersion)) {
      result.skipped.push(migration.id)
      currentVersion = migration.toVersion
      continue
    }

    if (compareVersions(currentVersion, migration.fromVersion) < 0) {
      // Can't apply migration yet; mismatch in starting version
      result.skipped.push(migration.id)
      continue
    }

    schemaVersioning.markPending(migration.toVersion)
    try {
      await migration.up(context)
      schemaVersioning.markSuccess(migration.toVersion)
      appliedVersions.add(migration.toVersion)
      currentVersion = migration.toVersion
      result.applied.push(migration.id)
    } catch (error) {
      context.log?.(`[Migration] Failed to apply ${migration.id}: ${String((error as Error).message)}`)
      try {
        await migration.down(context)
        schemaVersioning.markFailure(
          migration.toVersion,
          error instanceof Error ? error.message : String(error),
          true
        )
      } catch (rollbackError) {
        schemaVersioning.markFailure(
          migration.toVersion,
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          false
        )
      }

      return {
        ...result,
        failed: {
          migrationId: migration.id,
          error: error instanceof Error ? error : new Error(String(error)),
        },
      }
    }
  }

  return result
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
