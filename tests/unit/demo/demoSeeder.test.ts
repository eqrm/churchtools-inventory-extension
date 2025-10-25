import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { Asset, AssetCategory, AssetCreate } from '../../../src/types/entities';
import type { IStorageProvider } from '../../../src/types/storage';
import { seedDemoData, resetDemoData } from '../../../src/services/demo/demoSeeder';

const initializeOfflineDb = vi.fn();
const loadDemoMetadata = vi.fn();
const saveDemoMetadata = vi.fn();
const tagDemoEntity = vi.fn();
const listDemoEntities = vi.fn();
const untagDemoEntity = vi.fn();

vi.mock('../../../src/utils/environment/flags', () => ({
    ensureDemoToolsEnabled: () => {},
}));

vi.mock('../../../src/state/offline/db', () => ({
    initializeOfflineDb: (...args: unknown[]) => initializeOfflineDb(...args),
    loadDemoMetadata: (...args: unknown[]) => loadDemoMetadata(...args),
    saveDemoMetadata: (...args: unknown[]) => saveDemoMetadata(...args),
    tagDemoEntity: (...args: unknown[]) => tagDemoEntity(...args),
    listDemoEntities: (...args: unknown[]) => listDemoEntities(...args),
    untagDemoEntity: (...args: unknown[]) => untagDemoEntity(...args),
}));

type MockProvider = IStorageProvider & {
    __categories: AssetCategory[];
    __assets: Asset[];
    __deletedCategories: string[];
    __deletedAssets: string[];
};

function createMockProvider(): MockProvider {
    const categories: AssetCategory[] = [];
    const assets: Asset[] = [];
    const deletedCategories: string[] = [];
    const deletedAssets: string[] = [];
    const timestamp = '2025-01-01T00:00:00.000Z';

    const provider: Partial<MockProvider> = {
        __categories: categories,
        __assets: assets,
        __deletedCategories: deletedCategories,
        __deletedAssets: deletedAssets,
        async createCategory({ name, icon, assetNameTemplate, customFields }) {
            const category: AssetCategory = {
                id: `cat-${categories.length + 1}`,
                name,
                icon,
                assetNameTemplate,
                customFields,
                createdBy: 'demo',
                createdByName: 'Demo Seeder',
                createdAt: timestamp,
                lastModifiedBy: 'demo',
                lastModifiedByName: 'Demo Seeder',
                lastModifiedAt: timestamp,
                schemaVersion: 'demo',
            };
            categories.push(category);
            return category;
        },
    async createAsset(payload: AssetCreate) {
            const asset: Asset = {
                id: `asset-${assets.length + 1}`,
                assetNumber: `DEMO-${assets.length + 1}`,
                name: payload.name,
                manufacturer: payload.manufacturer,
                model: payload.model,
                description: payload.description,
                category: payload.category,
                status: payload.status,
                location: payload.location,
                inUseBy: undefined,
                bookable: payload.bookable ?? true,
                photos: [],
                isParent: false,
                parentAssetId: undefined,
                childAssetIds: [],
                barcode: `barcode-${assets.length + 1}`,
                qrCode: `qr-${assets.length + 1}`,
                customFieldValues: payload.customFieldValues,
                createdBy: 'demo',
                createdByName: 'Demo Seeder',
                createdAt: timestamp,
                lastModifiedBy: 'demo',
                lastModifiedByName: 'Demo Seeder',
                lastModifiedAt: timestamp,
                schemaVersion: 'demo',
            };
            assets.push(asset);
            return asset;
        },
        async deleteAsset(id: string) {
            deletedAssets.push(id);
        },
        async deleteCategory(id: string) {
            deletedCategories.push(id);
        },
    };

    return provider as MockProvider;
}

const baseMetadata = {
    id: 'global',
    seededAt: null,
    seedVersion: null,
    seededBy: null,
    lastResetAt: null,
    modalDismissedAt: null,
};

beforeEach(() => {
    vi.clearAllMocks();
    initializeOfflineDb.mockResolvedValue(undefined);
    loadDemoMetadata.mockResolvedValue({ ...baseMetadata });
    saveDemoMetadata.mockResolvedValue(undefined);
    tagDemoEntity.mockResolvedValue(undefined);
    listDemoEntities.mockResolvedValue([]);
    untagDemoEntity.mockResolvedValue(undefined);
});

describe('demoSeeder seedDemoData', () => {
    it('creates demo categories and assets, tagging each entity', async () => {
        const provider = createMockProvider();
        const result = await seedDemoData({ provider, now: () => '2025-03-01T10:00:00.000Z' });

        expect(provider.__categories).toHaveLength(4);
        expect(provider.__assets).toHaveLength(5);
        expect(result.categories).toHaveLength(4);
        expect(result.assets).toHaveLength(5);

        const tagCalls = tagDemoEntity.mock.calls;
        expect(tagCalls.filter(([type]) => type === 'category')).toHaveLength(4);
        expect(tagCalls.filter(([type]) => type === 'asset')).toHaveLength(5);

        expect(saveDemoMetadata).toHaveBeenCalledWith(
            expect.objectContaining({
                seededAt: '2025-03-01T10:00:00.000Z',
                seededBy: null,
            }),
        );
    });
});

describe('demoSeeder resetDemoData', () => {
    it('deletes tagged entities and clears metadata flags', async () => {
        const provider = createMockProvider();
        listDemoEntities.mockResolvedValue([
            { id: 'a', entityId: 'asset-1', entityType: 'asset', taggedAt: '2025-03-01T10:00:00.000Z' },
            { id: 'b', entityId: 'cat-1', entityType: 'category', taggedAt: '2025-03-01T10:00:00.000Z' },
        ]);

        await resetDemoData({ provider, now: () => '2025-04-02T08:30:00.000Z' });

        expect(provider.__deletedAssets).toEqual(['asset-1']);
        expect(provider.__deletedCategories).toEqual(['cat-1']);
        expect(untagDemoEntity).toHaveBeenCalledTimes(2);
        expect(saveDemoMetadata).toHaveBeenCalledWith(
            expect.objectContaining({
                seededAt: null,
                lastResetAt: '2025-04-02T08:30:00.000Z',
            }),
        );
    });
});
