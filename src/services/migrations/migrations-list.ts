import type { Migration } from './types'
import { schemaMigrationV1_0_0_to_v1_1_0 } from './migrations/v1.0.0-to-v1.1.0'

export const registeredMigrations: Migration[] = [schemaMigrationV1_0_0_to_v1_1_0]
