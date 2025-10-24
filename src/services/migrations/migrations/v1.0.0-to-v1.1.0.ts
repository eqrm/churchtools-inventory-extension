import type { Migration } from '../types'
import type { AssetUpdate } from '../../../types/entities'
import { BASE_SCHEMA_VERSION, TARGET_SCHEMA_VERSION } from '../constants'

export const schemaMigrationV1_0_0_to_v1_1_0: Migration = {
  id: 'schema-1.0.0-1.1.0',
  description: 'Ensure all assets include the bookable flag and upgrade schema metadata to v1.1.0',
  fromVersion: BASE_SCHEMA_VERSION,
  toVersion: TARGET_SCHEMA_VERSION,
  async up({ storageProvider, log }) {
    const assets = await storageProvider.getAssets()

    for (const asset of assets) {
      const needsBookable = asset.bookable === undefined
      const needsVersionUpdate = asset.schemaVersion !== TARGET_SCHEMA_VERSION

      if (!needsBookable && !needsVersionUpdate) {
        continue
      }

  const payload: AssetUpdate = {}
      if (needsBookable) {
        payload.bookable = true
      }
      if (needsVersionUpdate) {
        payload.schemaVersion = TARGET_SCHEMA_VERSION
      }

      await storageProvider.updateAsset(asset.id, payload)
      log?.(`[Migration] Asset ${asset.assetNumber} updated to schema ${TARGET_SCHEMA_VERSION}`)
    }
  },
  async down({ storageProvider, log }) {
    const assets = await storageProvider.getAssets()

    for (const asset of assets) {
      if (asset.schemaVersion !== TARGET_SCHEMA_VERSION) {
        continue
      }

      await storageProvider.updateAsset(asset.id, {
        schemaVersion: BASE_SCHEMA_VERSION,
        bookable: asset.bookable ?? true,
      })
      log?.(`[Migration] Asset ${asset.assetNumber} reverted to schema ${BASE_SCHEMA_VERSION}`)
    }
  },
}
