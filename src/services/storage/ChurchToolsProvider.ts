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
  StockTakeStatus,
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
    
    // Check if category has any assets
    const assets = await this.getAssets({ categoryId: id });
    if (assets.length > 0) {
      throw new Error(
        `Cannot delete category: ${assets.length.toString()} asset(s) are still using this category. ` +
        `Please delete or reassign these assets first.`
      );
    }
    
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
    // ChurchTools API doesn't support getting individual data values by ID
    // We need to fetch all assets and find the one we want
    const assets = await this.getAssets();
    const asset = assets.find(a => a.id === id);
    
    if (!asset) {
      throw new Error(`Asset with ID ${id} not found`);
    }
    
    return asset;
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
    
    // Merge update data with previous asset data
    const updatedAssetData = this.mergeAssetData(previous, data, user);
    
    // ChurchTools API requires: { id, dataCategoryId, value: string }
    const dataValue = {
      id: Number(id),
      dataCategoryId: Number(previous.category.id),
      value: JSON.stringify(updatedAssetData),
    };
    
    // Get full category for mapping
    const fullCategory = await this.getCategory(previous.category.id);
    const updated = await this.apiClient.updateDataValue(
      this.moduleId,
      previous.category.id,
      id,
      dataValue
    );
    const asset = this.mapToAsset(updated, fullCategory);
    
    // Record change history with specific field changes
    await this.recordAssetChanges(asset, previous, data, user);
    
    return asset;
  }

  private mergeAssetData(previous: Asset, data: AssetUpdate, user: { id: string; firstName: string; lastName: string }): Record<string, unknown> {
    return {
      assetNumber: previous.assetNumber,
      name: data.name ?? previous.name,
      description: data.description ?? previous.description,
      manufacturer: data.manufacturer ?? previous.manufacturer,
      model: data.model ?? previous.model,
      status: data.status ?? previous.status,
      location: data.location ?? previous.location,
      inUseBy: data.inUseBy ?? previous.inUseBy,
      barcode: data.barcode ?? previous.barcode,
      qrCode: data.qrCode ?? previous.qrCode,
      customFieldValues: data.customFieldValues ?? previous.customFieldValues,
      parentAssetId: data.parentAssetId ?? previous.parentAssetId,
      isParent: data.isParent ?? previous.isParent,
      createdBy: previous.createdBy,
      createdByName: previous.createdByName,
      createdAt: previous.createdAt,
      lastModifiedBy: user.id,
      lastModifiedByName: `${user.firstName} ${user.lastName}`,
      lastModifiedAt: new Date().toISOString(),
    };
  }

  private async recordAssetChanges(
    asset: Asset,
    previous: Asset,
    data: AssetUpdate,
    user: { id: string; firstName: string; lastName: string }
  ): Promise<void> {
    for (const [field, newValue] of Object.entries(data)) {
      const oldValue = previous[field as keyof Asset];
      if (oldValue !== newValue) {
        await this.recordChange({
          entityType: 'asset',
          entityId: asset.id,
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
    
    // Parse and filter by entity type and ID
    let history: ChangeHistoryEntry[] = [];
    
    for (const e of entries) {
      const raw = e as Record<string, unknown>;
      // The actual change data is stored in the 'value' field as JSON
      if (raw['value'] && typeof raw['value'] === 'string') {
        try {
          const parsed = JSON.parse(raw['value']) as Record<string, unknown>;
          if (parsed['entityType'] === entityType && String(parsed['entityId']) === entityId) {
            history.push({
              id: String(raw['id']),
              entityType: parsed['entityType'] as ChangeHistoryEntry['entityType'],
              entityId: entityId,
              entityName: parsed['entityName'] as string | undefined,
              action: parsed['action'] as ChangeHistoryEntry['action'],
              fieldName: parsed['fieldName'] as string | undefined,
              oldValue: parsed['oldValue'] as string | undefined,
              newValue: parsed['newValue'] as string | undefined,
              changedBy: parsed['changedBy'] as string,
              changedByName: parsed['changedByName'] as string,
              changedAt: parsed['changedAt'] as string,
              ipAddress: parsed['ipAddress'] as string | undefined,
              userAgent: parsed['userAgent'] as string | undefined,
            });
          }
        } catch (error) {
          console.error('Error parsing change history entry:', error);
          continue;
        }
      }
    }
    
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
        icon: category.icon,
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

    if (filters.customFields) {
      filtered = filtered.filter(asset => 
        this.matchesCustomFieldFilters(asset, filters.customFields as Record<string, unknown>)
      );
    }

    return filtered;
  }

  private matchesCustomFieldFilters(
    asset: Asset, 
    customFieldFilters: Record<string, unknown>
  ): boolean {
    // Check if all custom field filters match
    for (const [fieldId, filterValue] of Object.entries(customFieldFilters)) {
      const assetValue = asset.customFieldValues[fieldId];
      
      // If filter value is null/undefined, skip this filter
      if (filterValue === null || filterValue === undefined) {
        continue;
      }
      
      // If asset doesn't have this field, exclude it
      if (!assetValue) {
        return false;
      }
      
      // Handle array values (multi-select)
      if (Array.isArray(filterValue)) {
        if (!Array.isArray(assetValue)) {
          return false;
        }
        // Check if at least one filter value is present in asset value
        const hasMatch = filterValue.some(fv => 
          (assetValue as unknown[]).includes(fv)
        );
        if (!hasMatch) {
          return false;
        }
      } else if (Array.isArray(assetValue)) {
        // Asset has array, filter is single value
        if (!(assetValue as unknown[]).includes(filterValue)) {
          return false;
        }
      } else if (typeof filterValue === 'string' || typeof filterValue === 'number' || typeof filterValue === 'boolean') {
        // Both are primitives - compare as strings for partial matching
        const assetStr = String(assetValue).toLowerCase();
        const filterStr = String(filterValue).toLowerCase();
        if (!assetStr.includes(filterStr)) {
          return false;
        }
      }
    }
    return true;
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

  // ============================================================================
  // Stock Take
  // ============================================================================

  private async getStockTakeCategory(): Promise<AssetCategory> {
    const categories = await this.getAllCategoriesIncludingHistory();
    let stockTakeCategory = categories.find(cat => cat.name === '__StockTakeSessions__');
    
    if (!stockTakeCategory) {
      // Create the stock take sessions category
      const user = await this.apiClient.getCurrentUser();
      const shorty = 'stocktake_' + Date.now().toString().substring(-4);
      
      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__StockTakeSessions__',
        shorty,
        description: 'Internal category for stock take sessions',
        data: null,
      };
      
      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      stockTakeCategory = this.mapToAssetCategory(created);
      
      // Record change history
      await this.recordChange({
        entityType: 'category',
        entityId: stockTakeCategory.id,
        action: 'created',
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
    }
    
    return stockTakeCategory;
  }

  async getStockTakeSessions(filters?: { status?: StockTakeStatus }): Promise<StockTakeSession[]> {
    const category = await this.getStockTakeCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);
    
    let sessions: StockTakeSession[] = values.map((val: unknown) => {
      const record = val as { id: string; value: string };
      const data = JSON.parse(record.value) as StockTakeSession;
      return { ...data, id: record.id };
    });
    
    // Apply status filter if provided
    if (filters?.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    }
    
    return sessions;
  }

  async getStockTakeSession(id: string): Promise<StockTakeSession> {
    const sessions = await this.getStockTakeSessions();
    const session = sessions.find(s => s.id === id);
    
    if (!session) {
      throw new Error(`Stock take session with ID ${id} not found`);
    }
    
    return session;
  }

  private async loadExpectedAssetsForScope(scope: StockTakeSessionCreate['scope']): Promise<Asset[]> {
    let expectedAssets: Asset[] = [];
    
    switch (scope.type) {
      case 'all':
        expectedAssets = await this.getAssets();
        break;
      
      case 'category':
        // Load assets from specified categories
        for (const categoryId of scope.categoryIds || []) {
          const assets = await this.getAssets({ categoryId });
          expectedAssets.push(...assets);
        }
        break;
      
      case 'location':
        // Load assets from specified locations
        for (const location of scope.locations || []) {
          const assets = await this.getAssets({ location });
          expectedAssets.push(...assets);
        }
        break;
      
      case 'custom':
        // Load specific assets by ID
        if (scope.assetIds) {
          for (const assetId of scope.assetIds) {
            try {
              const asset = await this.getAsset(assetId);
              expectedAssets.push(asset);
            } catch {
              // Skip missing assets
              console.warn(`Asset ${assetId} not found, skipping`);
            }
          }
        }
        break;
    }
    
    return expectedAssets;
  }

  async createStockTakeSession(data: StockTakeSessionCreate): Promise<StockTakeSession> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getStockTakeCategory();
    
    // Load expected assets based on scope
    const expectedAssets = await this.loadExpectedAssetsForScope(data.scope);
    
    // Create session object matching the actual type definition
    const sessionData: Omit<StockTakeSession, 'id'> = {
      startDate: data.startDate,
      completedDate: data.completedDate,
      status: data.status,
      scope: data.scope,
      expectedAssets: expectedAssets.map(a => ({
        assetId: a.id,
        assetNumber: a.assetNumber,
        name: a.name,
        location: a.location,
      })),
      scannedAssets: [],
      missingAssets: [],
      unexpectedAssets: [],
      conductedBy: data.conductedBy,
      conductedByName: data.conductedByName,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    
    // Save to ChurchTools
    const dataValue = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(sessionData),
    };
    
    const created = await this.apiClient.createDataValue(this.moduleId, category.id, dataValue);
    const session: StockTakeSession = {
      ...sessionData,
      id: String((created as { id: number }).id),
    };
    
    // Record change history
    await this.recordChange({
      entityType: 'stocktake',
      entityId: session.id,
      action: 'created',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return session;
  }

  private async getAssetNumberForScan(assetId: string): Promise<string> {
    try {
      const asset = await this.getAsset(assetId);
      return asset.assetNumber;
    } catch {
      // Asset might not be in expected list
      console.warn(`Asset ${assetId} not found in inventory`);
      return 'Unknown';
    }
  }

  async addStockTakeScan(
    sessionId: string,
    assetId: string,
    scannedBy: string,
    location?: string
  ): Promise<StockTakeSession> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getStockTakeCategory();
    const session = await this.getStockTakeSession(sessionId);
    
    // Check if asset already scanned
    const alreadyScanned = session.scannedAssets.some(scan => scan.assetId === assetId);
    if (alreadyScanned) {
      throw new Error(`Asset ${assetId} has already been scanned in this session`);
    }
    
    // Check if session is still active
    if (session.status !== 'active') {
      throw new Error(`Cannot add scans to a ${session.status} session`);
    }
    
    // Get asset details
    const assetNumber = await this.getAssetNumberForScan(assetId);
    
    // Add scan record
    const scanRecord = {
      assetId,
      assetNumber,
      scannedAt: new Date().toISOString(),
      scannedBy,
      scannedByName: scannedBy,
      location,
      condition: undefined,
    };
    
    const updatedSessionData = {
      ...session,
      scannedAssets: [...session.scannedAssets, scanRecord],
      lastModifiedAt: new Date().toISOString(),
    };
    
    // Save to ChurchTools
    const dataValue = {
      id: Number(sessionId),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updatedSessionData),
    };
    
    await this.apiClient.updateDataValue(this.moduleId, category.id, sessionId, dataValue);
    
    // Record change history
    await this.recordChange({
      entityType: 'stocktake',
      entityId: sessionId,
      action: 'updated',
      newValue: assetId,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return { ...updatedSessionData, id: sessionId };
  }

  async completeStockTakeSession(sessionId: string): Promise<StockTakeSession> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getStockTakeCategory();
    const session = await this.getStockTakeSession(sessionId);
    
    // Check if session is still active
    if (session.status !== 'active') {
      throw new Error(`Cannot complete a ${session.status} session`);
    }
    
    // Calculate discrepancies
    const scannedAssetIds = new Set(session.scannedAssets.map(scan => scan.assetId));
    const expectedAssetMap = new Map(
      session.expectedAssets.map(ea => [ea.assetId, ea])
    );
    
    // Missing assets = expected but not scanned
    const missingAssets = session.expectedAssets.filter(
      ea => !scannedAssetIds.has(ea.assetId)
    ).map(ea => ({
      assetId: ea.assetId,
      assetNumber: ea.assetNumber,
      name: ea.name,
      lastKnownLocation: ea.location,
    }));
    
    // Unexpected assets = scanned but not expected
    const unexpectedAssets = session.scannedAssets
      .filter(scan => !expectedAssetMap.has(scan.assetId))
      .map(scan => ({
        assetId: scan.assetId,
        assetNumber: scan.assetNumber,
        name: scan.assetNumber, // Use asset number as name fallback
      }));
    
    const updatedSessionData: StockTakeSession = {
      ...session,
      status: 'completed',
      missingAssets,
      unexpectedAssets,
      completedDate: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    
    // Save to ChurchTools
    const dataValue = {
      id: Number(sessionId),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updatedSessionData),
    };
    
    await this.apiClient.updateDataValue(this.moduleId, category.id, sessionId, dataValue);
    
    // Record change history
    await this.recordChange({
      entityType: 'stocktake',
      entityId: sessionId,
      action: 'updated',
      newValue: `${String(session.scannedAssets.length)}/${String(session.expectedAssets.length)} assets scanned`,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return updatedSessionData;
  }

  async cancelStockTakeSession(sessionId: string): Promise<void> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getStockTakeCategory();
    const session = await this.getStockTakeSession(sessionId);
    
    // Check if session is still active
    if (session.status !== 'active') {
      throw new Error(`Cannot cancel a ${session.status} session`);
    }
    
    const updatedSessionData = {
      ...session,
      status: 'cancelled' as StockTakeStatus,
      completedDate: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    
    // Save to ChurchTools
    const dataValue = {
      id: Number(sessionId),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updatedSessionData),
    };
    
    await this.apiClient.updateDataValue(this.moduleId, category.id, sessionId, dataValue);
    
    // Record change history
    await this.recordChange({
      entityType: 'stocktake',
      entityId: sessionId,
      action: 'deleted',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
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
