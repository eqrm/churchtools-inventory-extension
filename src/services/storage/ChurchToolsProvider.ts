import type { ChurchToolsAPIClient } from '../api/ChurchToolsAPIClient';
import type { IStorageProvider } from '../../types/storage';
import type {
  Asset,
  AssetCreate,
  AssetUpdate,
  AssetFilters,
  AssetCategory,
  CategoryCreate,
  CategoryUpdate,
  CustomFieldDefinition,
  ChangeHistoryEntry,
  Booking,
  BookingCreate,
  BookingUpdate,
  BookingFilters,
  Kit,
  KitCreate,
  KitUpdate,
  MaintenanceRecord,
  MaintenanceRecordCreate,
  MaintenanceSchedule,
  MaintenanceScheduleCreate,
  StockTakeSession,
  StockTakeSessionCreate,
  SavedView,
  SavedViewCreate,
  PersonInfo,
} from '../../types/entities';
import { generateNextAssetNumber } from '../../utils/assetNumbers';

/**
 * ChurchTools Storage Provider
 * Implements storage using ChurchTools Custom Modules API
 * 
 * This implementation stores all data in ChurchTools Custom Module data categories.
 * Categories = Custom Data Categories in ChurchTools
 * Assets = Custom Data Values in those categories
 */
export class ChurchToolsStorageProvider implements IStorageProvider {
  private readonly moduleId: string;
  private readonly apiClient: ChurchToolsAPIClient;
  private readonly globalPrefix: string = 'CHT'; // Global asset number prefix (FR-002, FR-007)

  constructor(moduleId: string, apiClient: ChurchToolsAPIClient) {
    this.moduleId = moduleId;
    this.apiClient = apiClient;
  }

  // ============================================================================
  // Asset Categories
  // ============================================================================

  private async getAllCategoriesIncludingHistory(): Promise<AssetCategory[]> {
    const categories = await this.apiClient.getDataCategories(this.moduleId);
    return categories.map((cat: unknown) => this.mapToAssetCategory(cat));
  }

  async getCategories(): Promise<AssetCategory[]> {
    const allCategories = await this.getAllCategoriesIncludingHistory();
    return allCategories.filter(cat => cat.name !== '__ChangeHistory__'); // Exclude internal change history category
  }

  async getCategory(id: string): Promise<AssetCategory> {
    // ChurchTools API doesn't support getting a single category by ID
    // We need to fetch all categories and find the one we want
    const categories = await this.getCategories();
    const category = categories.find(cat => cat.id === id);
    
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    return category;
  }

  async createCategory(data: CategoryCreate): Promise<AssetCategory> {
    const user = await this.apiClient.getCurrentUser();
    
    // Generate a unique shorty from the name (lowercase, no spaces, max 20 chars)
    const shorty = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) + '_' + Date.now().toString().substring(-4);
    
    const categoryData = {
      customModuleId: Number(this.moduleId),
      name: data.name,
      shorty,
      description: data.icon || null,
      // Store customFields in the data field as a JSON string
      data: data.customFields.length > 0 ? JSON.stringify(data.customFields) : null,
    };
    
    const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
    const category = this.mapToAssetCategory(created);
    
    // Record change history
    await this.recordChange({
      entityType: 'category',
      entityId: category.id,
      action: 'created',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return category;
  }

  async updateCategory(id: string, data: CategoryUpdate): Promise<AssetCategory> {
    const user = await this.apiClient.getCurrentUser();
    
    // Get the existing category to preserve immutable fields
    const existing = await this.getCategory(id);
    
    // ChurchTools requires ALL fields in the update, including id, customModuleId, and shorty
    const updateData: Record<string, unknown> = {
      id: Number(id),
      customModuleId: Number(this.moduleId),
      name: data.name ?? existing.name,
      shorty: existing.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20),
      description: data.icon ?? existing.icon ?? null,
    };
    
    // Store custom fields in the data field as a JSON string
    if (data.customFields !== undefined) {
      updateData['data'] = data.customFields.length > 0 ? JSON.stringify(data.customFields) : null;
    } else {
      updateData['data'] = existing.customFields.length > 0 ? JSON.stringify(existing.customFields) : null;
    }
    
    const updated = await this.apiClient.updateDataCategory(this.moduleId, id, updateData);
    const category = this.mapToAssetCategory(updated);
    
    // Record change history for each field
    for (const [field, value] of Object.entries(data)) {
      await this.recordChange({
        entityType: 'category',
        entityId: id,
        action: 'updated',
        fieldName: field,
        newValue: JSON.stringify(value),
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
    }
    
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const user = await this.apiClient.getCurrentUser();
    
    // Record change history before deletion
    await this.recordChange({
      entityType: 'category',
      entityId: id,
      action: 'deleted',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    await this.apiClient.deleteDataCategory(this.moduleId, id);
  }

  // ============================================================================
  // Assets
  // ============================================================================

  async getAssets(filters?: AssetFilters): Promise<Asset[]> {
    // Get all categories first
    const categories = await this.getCategories();
    
    // Get assets from all categories
    const allAssets: Asset[] = [];
    for (const category of categories) {
      // Skip system categories
      if (category.name.startsWith('__')) continue;
      
      const values = await this.apiClient.getDataValues(this.moduleId, category.id);
      const assets = values.map((val: unknown) => this.mapToAsset(val, category));
      allAssets.push(...assets);
    }
    
    // Apply filters
    if (filters) {
      return this.applyAssetFilters(allAssets, filters);
    }
    
    return allAssets;
  }

  async getAsset(id: string): Promise<Asset> {
    // We need to search across all categories since we don't know which one contains this asset
    const categories = await this.getCategories();
    
    for (const category of categories) {
      try {
        const value = await this.apiClient.getDataValue(this.moduleId, category.id, id);
        return this.mapToAsset(value, category);
      } catch {
        // Asset not in this category, continue searching
        continue;
      }
    }
    
    throw new Error(`Asset with ID ${id} not found`);
  }

  async getAssetByNumber(assetNumber: string): Promise<Asset> {
    const assets = await this.getAssets();
    const asset = assets.find(a => a.assetNumber === assetNumber);
    if (!asset) {
      throw new Error(`Asset with number ${assetNumber} not found`);
    }
    return asset;
  }

  async createAsset(data: AssetCreate): Promise<Asset> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getCategory(data.category.id);
    
    // Generate asset number using global prefix (FR-002)
    const assets = await this.getAssets();
    const existingNumbers = assets.map(a => a.assetNumber.replace(`${this.globalPrefix}-`, ''));
    const nextNumber = generateNextAssetNumber(existingNumbers);
    const assetNumber = `${this.globalPrefix}-${nextNumber}`;
    
    const assetData = {
      assetNumber,
      name: data.name,
      description: data.description,
      manufacturer: data.manufacturer,
      model: data.model,
      status: data.status,
      location: data.location,
      inUseBy: data.inUseBy,
      barcode: assetNumber, // Use asset number as barcode
      qrCode: assetNumber,  // Use asset number as QR code
      customFieldValues: data.customFieldValues,
      parentAssetId: data.parentAssetId,
      isParent: data.isParent,
      childAssetIds: data.childAssetIds || [],
      createdBy: user.id,
      createdByName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date().toISOString(),
      lastModifiedBy: user.id,
      lastModifiedByName: `${user.firstName} ${user.lastName}`,
      lastModifiedAt: new Date().toISOString(),
    };
    
    // ChurchTools expects: { dataCategoryId: number, value: string }
    const dataValue = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(assetData),
    };
    
    const created = await this.apiClient.createDataValue(this.moduleId, category.id, dataValue);
    const asset = this.mapToAsset(created, category);
    
    // Record change history
    await this.recordChange({
      entityType: 'asset',
      entityId: asset.id,
      entityName: asset.name,
      action: 'created',
      newValue: asset.assetNumber,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return asset;
  }

  async updateAsset(id: string, data: AssetUpdate): Promise<Asset> {
    const user = await this.apiClient.getCurrentUser();
    const previous = await this.getAsset(id);
    
    const assetData = {
      ...data,
      lastModifiedBy: user.id,
      lastModifiedByName: `${user.firstName} ${user.lastName}`,
      lastModifiedAt: new Date().toISOString(),
    };
    
    // Get full category for mapping
    const fullCategory = await this.getCategory(previous.category.id);
    const updated = await this.apiClient.updateDataValue(
      this.moduleId,
      previous.category.id,
      id,
      assetData
    );
    const asset = this.mapToAsset(updated, fullCategory);
    
    // Record change history with specific field changes
    for (const [field, newValue] of Object.entries(data)) {
      const oldValue = previous[field as keyof Asset];
      if (oldValue !== newValue) {
        await this.recordChange({
          entityType: 'asset',
          entityId: id,
          entityName: asset.name,
          action: 'updated',
          fieldName: field,
          oldValue: JSON.stringify(oldValue),
          newValue: JSON.stringify(newValue),
          changedBy: user.id,
          changedByName: `${user.firstName} ${user.lastName}`,
        });
      }
    }
    
    return asset;
  }

  async deleteAsset(id: string): Promise<void> {
    const user = await this.apiClient.getCurrentUser();
    const asset = await this.getAsset(id);
    
    // Record change history before deletion
    await this.recordChange({
      entityType: 'asset',
      entityId: id,
      entityName: asset.name,
      action: 'deleted',
      oldValue: asset.assetNumber,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    await this.apiClient.deleteDataValue(this.moduleId, asset.category.id, id);
  }

  // ============================================================================
  // Change History
  // ============================================================================

  async getChangeHistory(
    entityType: 'asset' | 'category' | 'booking' | 'kit' | 'maintenance' | 'stocktake',
    entityId: string,
    limit?: number
  ): Promise<ChangeHistoryEntry[]> {
    // Get all history entries from a dedicated history category
    const historyCategory = await this.getOrCreateHistoryCategory();
    const entries = await this.apiClient.getDataValues(this.moduleId, historyCategory.id);
    
    // Filter by entity type and ID
    let history = entries
      .filter((e: unknown) => {
        const entry = e as Record<string, unknown>;
        return entry['entityType'] === entityType && entry['entityId'] === entityId;
      })
      .map((e: unknown) => this.mapToChangeHistoryEntry(e));
    
    // Sort by date descending
    history.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    
    // Apply limit if specified
    if (limit) {
      history = history.slice(0, limit);
    }
    
    return history;
  }

  async recordChange(entry: Omit<ChangeHistoryEntry, 'id' | 'changedAt'>): Promise<void> {
    const historyCategory = await this.getOrCreateHistoryCategory();
    const changeData = {
      ...entry,
      changedAt: new Date().toISOString(),
    };
    
    // ChurchTools expects: { dataCategoryId: number, value: string }
    const dataValue = {
      dataCategoryId: Number(historyCategory.id),
      value: JSON.stringify(changeData),
    };
    
    await this.apiClient.createDataValue(this.moduleId, historyCategory.id, dataValue);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapToAssetCategory(data: unknown): AssetCategory {
    const raw = data as Record<string, unknown>;
    // ChurchTools returns: { id, name, shorty, description, data, customModuleId }
    // Custom fields are stored directly in the 'data' field as a JSON string
    const cat = raw;
    
    // Parse data if it contains custom fields
    let customFields: CustomFieldDefinition[] = [];
    if (cat['data'] && typeof cat['data'] === 'string') {
      try {
        customFields = JSON.parse(cat['data']) as CustomFieldDefinition[];
      } catch (error) {
        console.error('Error parsing category data:', error);
        customFields = [];
      }
    }
    
    return {
      id: String(cat['id']),
      name: cat['name'] as string,
      icon: cat['description'] as string | undefined, // We stored icon in description
      customFields,
      createdBy: (cat['createdBy'] || 'system') as string,
      createdByName: (cat['createdByName'] || 'System') as string,
      createdAt: (cat['createdAt'] || new Date().toISOString()) as string,
      lastModifiedBy: (cat['lastModifiedBy'] || 'system') as string,
      lastModifiedByName: (cat['lastModifiedByName'] || 'System') as string,
      lastModifiedAt: (cat['lastModifiedAt'] || new Date().toISOString()) as string,
    };
  }

  private mapToAsset(data: unknown, category: AssetCategory): Asset {
    const raw = data as Record<string, unknown>;
    // ChurchTools returns: { id, dataCategoryId, value: "JSON string", ... }
    let asset: Record<string, unknown>;
    
    if (raw['value'] && typeof raw['value'] === 'string') {
      try {
        asset = JSON.parse(raw['value']) as Record<string, unknown>;
        asset['id'] = String(raw['id']); // Use the ChurchTools data value ID
      } catch {
        asset = raw;
      }
    } else {
      asset = raw;
    }
    
    return {
      id: String(asset['id']),
      assetNumber: asset['assetNumber'] as string,
      name: asset['name'] as string,
      description: asset['description'] as string | undefined,
      category: {
        id: category.id,
        name: category.name,
      },
      manufacturer: asset['manufacturer'] as string | undefined,
      model: asset['model'] as string | undefined,
      status: asset['status'] as Asset['status'],
      location: asset['location'] as string | undefined,
      inUseBy: asset['inUseBy'] as Asset['inUseBy'],
      barcode: asset['barcode'] as string,
      qrCode: asset['qrCode'] as string,
      customFieldValues: (asset['customFieldValues'] || {}) as Record<string, string | number | boolean | string[]>,
      parentAssetId: asset['parentAssetId'] as string | undefined,
      isParent: ((asset['isParent'] as boolean | undefined) !== undefined ? asset['isParent'] as boolean : false),
      createdBy: asset['createdBy'] as string,
      createdByName: asset['createdByName'] as string,
      createdAt: asset['createdAt'] as string,
      lastModifiedBy: asset['lastModifiedBy'] as string,
      lastModifiedByName: asset['lastModifiedByName'] as string,
      lastModifiedAt: asset['lastModifiedAt'] as string,
    };
  }

  private mapToChangeHistoryEntry(data: unknown): ChangeHistoryEntry {
    const entry = data as Record<string, unknown>;
    return {
      id: entry['id'] as string,
      entityType: entry['entityType'] as ChangeHistoryEntry['entityType'],
      entityId: entry['entityId'] as string,
      entityName: entry['entityName'] as string | undefined,
      action: entry['action'] as ChangeHistoryEntry['action'],
      fieldName: entry['fieldName'] as string | undefined,
      oldValue: entry['oldValue'] as string | undefined,
      newValue: entry['newValue'] as string | undefined,
      changedBy: entry['changedBy'] as string,
      changedByName: entry['changedByName'] as string,
      changedAt: entry['changedAt'] as string,
      ipAddress: entry['ipAddress'] as string | undefined,
      userAgent: entry['userAgent'] as string | undefined,
    };
  }

  private applyAssetFilters(assets: Asset[], filters: AssetFilters): Asset[] {
    let filtered = assets;

    if (filters.categoryId) {
      filtered = filtered.filter(a => a.category.id === filters.categoryId);
    }

    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    if (filters.location) {
      filtered = filtered.filter(a => a.location === filters.location);
    }

    // inUseBy filtering (if needed in future)
    // Note: AssetFilters doesn't have assignedToId yet

    if (filters.parentAssetId) {
      filtered = filtered.filter(a => a.parentAssetId === filters.parentAssetId);
    }

    if (filters.isParent !== undefined) {
      filtered = filtered.filter(a => a.isParent === filters.isParent);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        a.assetNumber.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  private async getOrCreateHistoryCategory(): Promise<AssetCategory> {
    const categories = await this.getAllCategoriesIncludingHistory();
    let historyCategory = categories.find(c => c.name === '__ChangeHistory__');
    
    if (!historyCategory) {
      // Create without recording change history to avoid infinite recursion
      const shorty = '__changehistory__' + '_' + Date.now().toString().substring(-4);
      
      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__ChangeHistory__',
        shorty,
        description: 'history',
        data: null,
      };
      
      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      historyCategory = this.mapToAssetCategory(created);
    }
    
    return historyCategory;
  }

  // ============================================================================
  // Stub Methods (Phase 4+) - Required by IStorageProvider interface
  // All stub methods intentionally throw errors and don't use await
  // ============================================================================

  /* eslint-disable @typescript-eslint/require-await */
  async createMultiAsset(_parentData: AssetCreate, _quantity: number): Promise<Asset[]> {
    throw new Error('Multi-asset creation not implemented - Phase 4 (US4)');
  }

  async searchAssets(_query: string): Promise<Asset[]> {
    throw new Error('Asset search not implemented - Phase 4 (US4)');
  }

  async getBookings(_filters?: BookingFilters): Promise<Booking[]> {
    throw new Error('Bookings not implemented - Phase 5 (US5)');
  }

  async getBooking(_id: string): Promise<Booking> {
    throw new Error('Bookings not implemented - Phase 5 (US5)');
  }

  async getBookingsForAsset(_assetId: string, _dateRange?: { start: string; end: string }): Promise<Booking[]> {
    throw new Error('Bookings not implemented - Phase 5 (US5)');
  }

  async createBooking(_data: BookingCreate): Promise<Booking> {
    throw new Error('Bookings not implemented - Phase 5 (US5)');
  }

  async updateBooking(_id: string, _data: BookingUpdate): Promise<Booking> {
    throw new Error('Bookings not implemented - Phase 5 (US5)');
  }

  async cancelBooking(_id: string, _reason?: string): Promise<void> {
    throw new Error('Bookings not implemented - Phase 5 (US5)');
  }

  async isAssetAvailable(_assetId: string, _startDate: string, _endDate: string): Promise<boolean> {
    throw new Error('Availability checking not implemented - Phase 5 (US5)');
  }

  async checkOut(_bookingId: string, _conditionAssessment?: unknown): Promise<Booking> {
    throw new Error('Check-out not implemented - Phase 5 (US5)');
  }

  async checkIn(_bookingId: string, _conditionAssessment: unknown): Promise<Booking> {
    throw new Error('Check-in not implemented - Phase 5 (US5)');
  }

  async getKits(): Promise<Kit[]> {
    throw new Error('Kits not implemented - Phase 6 (US6)');
  }

  async getKit(_id: string): Promise<Kit> {
    throw new Error('Kits not implemented - Phase 6 (US6)');
  }

  async createKit(_data: KitCreate): Promise<Kit> {
    throw new Error('Kits not implemented - Phase 6 (US6)');
  }

  async updateKit(_id: string, _data: KitUpdate): Promise<Kit> {
    throw new Error('Kits not implemented - Phase 6 (US6)');
  }

  async deleteKit(_id: string): Promise<void> {
    throw new Error('Kits not implemented - Phase 6 (US6)');
  }

  async getMaintenanceRecords(_assetId: string): Promise<MaintenanceRecord[]> {
    throw new Error('Maintenance not implemented - Phase 7 (US7)');
  }

  async getMaintenanceRecord(_id: string): Promise<MaintenanceRecord> {
    throw new Error('Maintenance not implemented - Phase 7 (US7)');
  }

  async createMaintenanceRecord(_data: MaintenanceRecordCreate): Promise<MaintenanceRecord> {
    throw new Error('Maintenance not implemented - Phase 7 (US7)');
  }

  async isKitAvailable(_kitId: string, _startDate: string, _endDate: string): Promise<{ available: boolean; unavailableAssets?: string[]; reason?: string }> {
    throw new Error('Kits not implemented - Phase 6 (US6)');
  }

  async getMaintenanceSchedule(_assetId: string): Promise<MaintenanceSchedule | null> {
    throw new Error('Maintenance not implemented - Phase 7 (US7)');
  }

  async setMaintenanceSchedule(_schedule: MaintenanceScheduleCreate): Promise<MaintenanceSchedule> {
    throw new Error('Maintenance not implemented - Phase 7 (US7)');
  }

  async getOverdueMaintenance(): Promise<Asset[]> {
    throw new Error('Maintenance not implemented - Phase 7 (US7)');
  }

  async getUpcomingMaintenance(_daysAhead: number): Promise<Asset[]> {
    throw new Error('Maintenance not implemented - Phase 7 (US7)');
  }

  async createStockTakeSession(_data: StockTakeSessionCreate): Promise<StockTakeSession> {
    throw new Error('Stock take not implemented - Phase 8 (US8)');
  }

  async getStockTakeSession(_id: string): Promise<StockTakeSession> {
    throw new Error('Stock take not implemented - Phase 8 (US8)');
  }

  async addStockTakeScan(_sessionId: string, _assetId: string, _scannedBy: string, _location?: string): Promise<StockTakeSession> {
    throw new Error('Stock take not implemented - Phase 8 (US8)');
  }

  async completeStockTakeSession(_sessionId: string): Promise<StockTakeSession> {
    throw new Error('Stock take not implemented - Phase 8 (US8)');
  }

  async cancelStockTakeSession(_sessionId: string): Promise<void> {
    throw new Error('Stock take not implemented - Phase 8 (US8)');
  }

  async getSavedViews(_userId: string): Promise<SavedView[]> {
    throw new Error('Saved views not implemented - Phase 10 (US10)');
  }

  async getSavedView(_id: string): Promise<SavedView> {
    throw new Error('Saved views not implemented - Phase 10 (US10)');
  }

  async createSavedView(_data: SavedViewCreate): Promise<SavedView> {
    throw new Error('Saved views not implemented - Phase 10 (US10)');
  }

  async updateSavedView(_id: string, _data: Partial<SavedView>): Promise<SavedView> {
    throw new Error('Saved views not implemented - Phase 10 (US10)');
  }

  async deleteSavedView(_id: string): Promise<void> {
    throw new Error('Saved views not implemented - Phase 10 (US10)');
  }

  async getCurrentUser(): Promise<PersonInfo> {
    const user = await this.apiClient.getCurrentUser();
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
  }

  async getPersonInfo(_personId: string): Promise<PersonInfo> {
    throw new Error('Person info not implemented - Phase 9 (US9)');
  }

  async searchPeople(_query: string): Promise<PersonInfo[]> {
    throw new Error('Person search not implemented - Phase 9 (US9)');
  }
  /* eslint-enable @typescript-eslint/require-await */
}
