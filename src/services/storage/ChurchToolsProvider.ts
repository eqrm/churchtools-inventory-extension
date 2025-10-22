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
  ConditionAssessment,
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
import { EdgeCaseError } from '../../types/edge-cases';
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
    
    // Record change history with granular field changes (T258 - E3)
    const changes = [];
    for (const [field, newValue] of Object.entries(data)) {
      const oldValue = existing[field as keyof AssetCategory];
      
      // Deep comparison for actual changes
      if (!this.valuesAreEqual(oldValue, newValue)) {
        const formattedOld = this.formatFieldValue(oldValue);
        const formattedNew = this.formatFieldValue(newValue);
        
        // Only record if formatted values are actually different
        if (formattedOld !== formattedNew) {
          changes.push({
            field,
            oldValue: formattedOld,
            newValue: formattedNew,
          });
        }
      }
    }
    
    if (changes.length > 0) {
      await this.recordChange({
        entityType: 'category',
        entityId: id,
        action: 'updated',
        changes,
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
    
    // T274: Generate asset number using selected prefix or global prefix (FR-002)
    let assetNumber: string;
    
    if (data.prefixId) {
      // Use selected AssetPrefix (E5 - Multiple Asset Prefixes)
      const prefix = await this.getAssetPrefix(data.prefixId);
      const sequence = await this.incrementPrefixSequence(data.prefixId);
      assetNumber = `${prefix.prefix}-${sequence.toString().padStart(3, '0')}`;
    } else {
      // Legacy: Use global prefix
      const assets = await this.getAssets();
      const existingNumbers = assets.map(a => a.assetNumber.replace(`${this.globalPrefix}-`, ''));
      const nextNumber = generateNextAssetNumber(existingNumbers);
      assetNumber = `${this.globalPrefix}-${nextNumber}`;
    }
    
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
    // Compare the merged data with previous to capture actual changes
    await this.recordAssetChanges(asset, previous, updatedAssetData, user);
    
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
      barcodeHistory: data.barcodeHistory ?? previous.barcodeHistory,
      customFieldValues: data.customFieldValues ?? previous.customFieldValues,
      parentAssetId: data.parentAssetId ?? previous.parentAssetId,
      isParent: data.isParent ?? previous.isParent,
      bookable: data.bookable ?? previous.bookable,
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
    updatedData: Record<string, unknown>,
    user: { id: string; firstName: string; lastName: string }
  ): Promise<void> {
    // Build granular field changes array (T258 - E3)
    // Compare ALL relevant fields between previous and updated data
    const changes = [];
    
    // Fields to track for changes
    const fieldsToTrack: Array<keyof Asset> = [
      'name',
      'description',
      'manufacturer',
      'model',
      'status',
      'location',
      'inUseBy',
      'barcode',
      'qrCode',
      'customFieldValues',
      'parentAssetId',
      'isParent',
    ];
    
    for (const field of fieldsToTrack) {
      const oldValue = previous[field];
      const newValue = updatedData[field];
      
      // Deep comparison for actual changes (ignore non-changes)
      if (!this.valuesAreEqual(oldValue, newValue)) {
        const formattedOld = this.formatFieldValue(oldValue);
        const formattedNew = this.formatFieldValue(newValue);
        
        // Only record if formatted values are actually different
        if (formattedOld !== formattedNew) {
          changes.push({
            field,
            oldValue: formattedOld,
            newValue: formattedNew,
          });
        }
      }
    }
    
    if (changes.length > 0) {
      await this.recordChange({
        entityType: 'asset',
        entityId: asset.id,
        entityName: asset.name,
        action: 'updated',
        changes,
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
    }
  }

  /**
   * Deep equality check for values (handles objects, arrays, primitives)
   */
  private valuesAreEqual(a: unknown, b: unknown): boolean {
    // Same reference or both null/undefined
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    
    // Different types
    if (typeof a !== typeof b) return false;
    
    // Primitives (already checked with ===)
    if (typeof a !== 'object') return a === b;
    
    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => this.valuesAreEqual(val, b[idx]));
    }
    
    // Objects
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    
    // Get all keys (including those with null/undefined values)
    const aKeys = Object.keys(aObj).filter(k => aObj[k] !== null && aObj[k] !== undefined);
    const bKeys = Object.keys(bObj).filter(k => bObj[k] !== null && bObj[k] !== undefined);
    
    // Different number of non-null keys
    if (aKeys.length !== bKeys.length) return false;
    
    // Check each key
    for (const key of aKeys) {
      if (!bKeys.includes(key)) return false;
      if (!this.valuesAreEqual(aObj[key], bObj[key])) return false;
    }
    
    return true;
  }

  /**
   * Format a field value for change history display (T258 - E3)
   */
  private formatFieldValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      // Special handling for person references
      if ('personName' in value) {
        return String(value.personName);
      }
      // For category, show just the name
      if ('name' in value && 'id' in value) {
        return String(value.name);
      }
      // For objects/arrays, use JSON but filter out null/undefined
      const cleaned = this.cleanObjectForDisplay(value);
      const json = JSON.stringify(cleaned);
      // Return empty string for empty objects/arrays
      if (json === '{}' || json === '[]') {
        return '';
      }
      return json;
    }
    return String(value);
  }

  /**
   * Remove null/undefined values from objects for cleaner display
   */
  private cleanObjectForDisplay(obj: unknown): unknown {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObjectForDisplay(item)).filter(item => item !== undefined);
    }
    
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== null && value !== undefined) {
        const cleanedValue = this.cleanObjectForDisplay(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }

  async deleteAsset(id: string): Promise<void> {
    const user = await this.apiClient.getCurrentUser();
    const asset = await this.getAsset(id);
    
    // T241c: Check for children with active bookings before deletion
    if (asset.childAssetIds && asset.childAssetIds.length > 0) {
      const childrenWithBookings = [];
      
      for (const childId of asset.childAssetIds) {
        const childAsset = await this.getAsset(childId);
        const activeBookings = await this.getBookingsForAsset(childId);
        const activeCount = activeBookings.filter(
          b => b.status === 'approved' || b.status === 'active' || b.status === 'pending'
        ).length;
        
        if (activeCount > 0) {
          childrenWithBookings.push({
            assetId: childId,
            assetNumber: childAsset.assetNumber,
            activeBookingCount: activeCount,
          });
        }
      }
      
      if (childrenWithBookings.length > 0) {
        const error = new EdgeCaseError(
          `Cannot delete parent asset: ${childrenWithBookings.length} child asset(s) have active bookings`,
          {
            parentDeletionConflict: {
              parentId: id,
              childrenWithBookings,
            },
          }
        );
        throw error;
      }
    }
    
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
    
    // Soft delete: mark asset as deleted instead of removing data value
    // (ChurchTools API doesn't support DELETE operations on individual data values)
    await this.updateAsset(id, { status: 'deleted' });
  }

  /**
   * T282 - E2: Regenerate barcode for an asset
   * Archives old barcode and generates new one with timestamp or custom barcode
   * 
   * @param id - Asset ID
   * @param reason - Optional reason for regeneration
   * @param customBarcode - Optional custom barcode (if not provided, auto-generates)
   * @returns Updated asset with new barcode
   */
  async regenerateAssetBarcode(id: string, reason?: string, customBarcode?: string): Promise<Asset> {
    const user = await this.apiClient.getCurrentUser();
    const asset = await this.getAsset(id);
    
    // Archive the current barcode
    const historyEntry = {
      barcode: asset.barcode,
      generatedAt: asset.lastModifiedAt,
      generatedBy: asset.lastModifiedBy,
      generatedByName: asset.lastModifiedByName,
      reason,
    };
    
    const barcodeHistory = asset.barcodeHistory || [];
    barcodeHistory.push(historyEntry);
    
    // Use custom barcode if provided, otherwise generate new one with timestamp
    let newBarcode: string;
    if (customBarcode) {
      // Check for duplicates
      const allAssets = await this.getAssets();
      const duplicate = allAssets.find(a => a.barcode === customBarcode && a.id !== id);
      if (duplicate) {
        throw new Error(`Barcode "${customBarcode}" is already used by asset ${duplicate.assetNumber}`);
      }
      newBarcode = customBarcode;
    } else {
      // Generate new barcode with timestamp to ensure uniqueness
      const timestamp = Date.now().toString();
      newBarcode = `${asset.assetNumber}-${timestamp.substring(timestamp.length - 6)}`;
    }
    
    // Update asset with new barcode and history
    const updatedAsset = await this.updateAsset(id, {
      barcode: newBarcode,
      barcodeHistory,
    });
    
    // Record change history for barcode regeneration
    await this.recordChange({
      entityType: 'asset',
      entityId: id,
      entityName: asset.name,
      action: 'updated',
      changes: [
        {
          field: 'barcode',
          oldValue: asset.barcode,
          newValue: newBarcode,
        },
      ],
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return updatedAsset;
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
              changes: parsed['changes'] as ChangeHistoryEntry['changes'],
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
    if (cat && cat['data'] && typeof cat['data'] === 'string') {
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
      status: (asset['status'] as Asset['status']) || 'available',
      location: asset['location'] as string | undefined,
      inUseBy: asset['inUseBy'] as Asset['inUseBy'],
      barcode: asset['barcode'] as string,
      qrCode: asset['qrCode'] as string,
      barcodeHistory: asset['barcodeHistory'] as Asset['barcodeHistory'],
      customFieldValues: (asset['customFieldValues'] || {}) as Record<string, string | number | boolean | string[]>,
      parentAssetId: asset['parentAssetId'] as string | undefined,
      isParent: ((asset['isParent'] as boolean | undefined) !== undefined ? asset['isParent'] as boolean : false),
      bookable: ((asset['bookable'] as boolean | undefined) !== undefined ? asset['bookable'] as boolean : true),
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

    // Exclude deleted assets by default unless explicitly requested
    if (!filters.status || !filters.status.includes('deleted')) {
      filtered = filtered.filter(a => a.status !== 'deleted');
    }

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

  /**
   * T094 - US4: Create multiple assets from a parent
   * Creates a parent asset and N child assets with sequential numbers
   */
  async createMultiAsset(parentData: AssetCreate, quantity: number): Promise<Asset[]> {
    // Validate quantity
    if (quantity < 2) {
      throw new Error('Quantity must be at least 2 for multi-asset creation');
    }
    if (quantity > 100) {
      throw new Error('Quantity must not exceed 100 assets');
    }
    
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getCategory(parentData.category.id);
    const userName = `${user.firstName} ${user.lastName}`;
    
    // Generate sequential asset numbers
    const baseNumber = await this.generateBaseNumberForMultiAsset();
    const childIds = this.generateChildIds(quantity);
    
    // Create and store parent
    const parent = await this.createParentAsset(parentData, category, baseNumber, childIds, user.id, userName);
    
    // Create and store children
    const children = await this.createChildAssets(parentData, category, baseNumber, parent.id, quantity, user.id, userName);
    
    return [parent, ...children];
  }

  private async generateBaseNumberForMultiAsset(): Promise<string> {
    const assets = await this.getAssets();
    const existingNumbers = assets.map(a => a.assetNumber.replace(`${this.globalPrefix}-`, ''));
    return generateNextAssetNumber(existingNumbers);
  }

  private generateChildIds(quantity: number): string[] {
    const ids: string[] = [];
    for (let i = 0; i < quantity; i++) {
      ids.push(crypto.randomUUID());
    }
    return ids;
  }

  private async createParentAsset(
    data: AssetCreate,
    category: AssetCategory,
    baseNumber: string,
    childIds: string[],
    userId: string,
    userName: string
  ): Promise<Asset> {
    const assetNumber = `${this.globalPrefix}-${baseNumber}`;
    const assetData = {
      assetNumber,
      name: data.name,
      description: data.description,
      manufacturer: data.manufacturer,
      model: data.model,
      status: data.status,
      location: data.location,
      inUseBy: data.inUseBy,
      barcode: assetNumber,
      qrCode: assetNumber,
      barcodeHistory: [],
      isParent: true,
      parentAssetId: undefined,
      childAssetIds: childIds,
      customFieldValues: data.customFieldValues,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedByName: userName,
      lastModifiedAt: new Date().toISOString(),
    };

    const dataValue = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(assetData),
    };

    const created = await this.apiClient.createDataValue(this.moduleId, category.id, dataValue);
    return this.mapToAsset(created, category);
  }

  private async createChildAssets(
    data: AssetCreate,
    category: AssetCategory,
    baseNumber: string,
    parentId: string,
    quantity: number,
    userId: string,
    userName: string
  ): Promise<Asset[]> {
    const children: Asset[] = [];

    for (let i = 1; i <= quantity; i++) {
      const childNumber = String(parseInt(baseNumber) + i).padStart(3, '0');
      const childAssetNumber = `${this.globalPrefix}-${childNumber}`;

      const childData = {
        assetNumber: childAssetNumber,
        name: `${data.name} #${i}`,
        description: data.description,
        manufacturer: data.manufacturer,
        model: data.model,
        status: data.status,
        location: data.location,
        inUseBy: data.inUseBy,
        barcode: childAssetNumber,
        qrCode: childAssetNumber,
        barcodeHistory: [],
        isParent: false,
        parentAssetId: parentId,
        childAssetIds: [],
        customFieldValues: { ...data.customFieldValues },  // T096: Inherit from parent
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date().toISOString(),
        lastModifiedBy: userId,
        lastModifiedByName: userName,
        lastModifiedAt: new Date().toISOString(),
      };

      const dataValue = {
        dataCategoryId: Number(category.id),
        value: JSON.stringify(childData),
      };

      const created = await this.apiClient.createDataValue(this.moduleId, category.id, dataValue);
      const child = this.mapToAsset(created, category);
      children.push(child);
    }

    return children;
  }

  async searchAssets(_query: string): Promise<Asset[]> {
    throw new Error('Asset search not implemented - Phase 4 (US4)');
  }

  // ============================================================================
  // Bookings
  // ============================================================================

  private async getBookingCategory(): Promise<AssetCategory> {
    const categories = await this.getAllCategoriesIncludingHistory();
    let bookingCategory = categories.find(cat => cat.name === '__Bookings__');
    
    if (!bookingCategory) {
      // Create the bookings category
      const user = await this.apiClient.getCurrentUser();
      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__Bookings__',
        shorty: 'bookings' + Date.now().toString().slice(-4),
        description: 'System category for equipment bookings',
        data: null,
      };
      
      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      bookingCategory = this.mapToAssetCategory(created);
      
      await this.recordChange({
        entityType: 'category',
        entityId: bookingCategory.id,
        action: 'created',
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
    }
    
    return bookingCategory;
  }

  private mapToBooking(value: unknown): Booking {
    const val = value as Record<string, unknown>;
    
    // ChurchTools returns data in 'value' field for custom data
    const dataStr = (val['value'] || val['data']) as string | null;
    const data = dataStr ? JSON.parse(dataStr) : {};
    
    return {
      id: val['id']?.toString() || '',
      asset: data.asset || { id: '', assetNumber: '', name: '' },
      kit: data.kit,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      purpose: data.purpose || '',
      notes: data.notes,
      status: data.status || 'pending',
      // Phase 5: Dual person tracking
      bookedById: data.bookedById || data.requestedBy || '',
      bookedByName: data.bookedByName || data.requestedByName || '',
      bookingForId: data.bookingForId || data.requestedBy || '',
      bookingForName: data.bookingForName || data.requestedByName || '',
      // Phase 6: Smart date and time booking
      bookingMode: data.bookingMode || 'date-range',
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      // Deprecated fields (kept for backward compatibility)
      requestedBy: data.requestedBy || data.bookedById || '',
      requestedByName: data.requestedByName || data.bookedByName || '',
      approvedBy: data.approvedBy,
      approvedByName: data.approvedByName,
      checkedOutAt: data.checkedOutAt,
      checkedOutBy: data.checkedOutBy,
      checkedOutByName: data.checkedOutByName,
      checkedInAt: data.checkedInAt,
      checkedInBy: data.checkedInBy,
      checkedInByName: data.checkedInByName,
      conditionOnCheckOut: data.conditionOnCheckOut,
      conditionOnCheckIn: data.conditionOnCheckIn,
      damageReported: data.damageReported,
      damageNotes: data.damageNotes,
      createdAt: data.createdAt || val['created_at'] as string || new Date().toISOString(),
      lastModifiedAt: data.lastModifiedAt || val['modified_at'] as string || new Date().toISOString(),
    };
  }

  async getBookings(filters?: BookingFilters): Promise<Booking[]> {
    const category = await this.getBookingCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);
    let bookings = values.map((val: unknown) => this.mapToBooking(val));
    
    // Apply filters
    if (filters) {
      if (filters.assetId) {
        bookings = bookings.filter(b => b.asset?.id === filters.assetId);
      }
      if (filters.kitId) {
        bookings = bookings.filter(b => b.kit?.id === filters.kitId);
      }
      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        bookings = bookings.filter(b => statusArray.includes(b.status));
      }
      if (filters.requestedBy) {
        bookings = bookings.filter(b => b.requestedBy === filters.requestedBy);
      }
      if (filters.dateRange) {
        const dateRange = filters.dateRange;
        bookings = bookings.filter(b => {
          const bookingStart = new Date(b.startDate);
          const bookingEnd = new Date(b.endDate);
          const filterStart = new Date(dateRange.start);
          const filterEnd = new Date(dateRange.end);
          
          // Check for overlap
          return bookingStart <= filterEnd && bookingEnd >= filterStart;
        });
      }
    }
    
    return bookings;
  }

  async getBooking(id: string): Promise<Booking | null> {
    const bookings = await this.getBookings();
    return bookings.find(b => b.id === id) || null;
  }

  async getBookingsForAsset(assetId: string, dateRange?: { start: string; end: string }): Promise<Booking[]> {
    const filters: BookingFilters = { assetId };
    if (dateRange) {
      filters.dateRange = dateRange;
    }
    return await this.getBookings(filters);
  }

  /**
   * Validate booking creation data
   */
  private async validateBookingCreate(data: BookingCreate): Promise<void> {
    // Validate asset reference exists
    if (!data.asset || !data.asset.id) {
      throw new Error('Asset-Referenz erforderlich');
    }
    
    // Validate date range (allow same date for single-day bookings)
    if (data.bookingMode === 'date-range' && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new Error('Enddatum muss nach dem Startdatum liegen');
    }
    if (data.bookingMode === 'single-day' && new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error('Enddatum muss nach dem Startdatum liegen');
    }
    
    // Get asset and validate its status
    const asset = await this.getAsset(data.asset.id);
    if (!asset) {
      throw new Error('Asset nicht gefunden');
    }
    
    // Validate asset is not in broken/sold/destroyed status
    if (asset.status === 'broken' || asset.status === 'sold' || asset.status === 'destroyed') {
      throw new Error(`Asset kann nicht gebucht werden (Status: ${asset.status})`);
    }
    
    // Check availability before creating
    const available = await this.isAssetAvailable(
      data.asset.id,
      data.startDate,
      data.endDate
    );
    
    if (!available) {
      throw new Error('Asset ist für den gewählten Zeitraum nicht verfügbar');
    }
  }

  /**
   * Resolve person name for booking, with fallback to provided name
   */
  private async resolvePersonName(personId: string | undefined, fallbackName: string): Promise<string> {
    if (!personId) {
      return fallbackName;
    }
    
    try {
      const person = await this.getPersonInfo(personId);
      return `${person.firstName} ${person.lastName}`;
    } catch (error) {
      console.warn('Failed to fetch person info, using provided name:', error);
      return fallbackName;
    }
  }

  /**
   * Prepare booking data for storage
   */
  private async prepareBookingData(data: BookingCreate): Promise<Record<string, unknown>> {
    // Validate asset data
    if (!data.asset || !data.asset.id) {
      throw new Error('Asset ist erforderlich');
    }
    
    // Get person info for requestedBy
    const requestedByName = await this.resolvePersonName(
      data.requestedBy,
      data.requestedByName || 'Unknown'
    );
    
    return {
      asset: {
        id: data.asset.id,
        assetNumber: data.asset.assetNumber || '',
        name: data.asset.name || '',
      },
      kit: data.kit ? {
        id: data.kit.id,
        name: data.kit.name,
      } : undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      purpose: data.purpose,
      notes: data.notes,
      status: 'pending',
      requestedBy: data.requestedBy,
      requestedByName: requestedByName,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
  }

  async createBooking(data: BookingCreate): Promise<Booking> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getBookingCategory();
    
    // T124: Enhanced validation
    await this.validateBookingCreate(data);
    
    // Prepare booking data
    const bookingData = await this.prepareBookingData(data);
    
    // ChurchTools expects: { dataCategoryId: number, value: string }
    const valueData = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(bookingData),
    };
    
    try {
      const created = await this.apiClient.createDataValue(this.moduleId, category.id, valueData);
      const booking = this.mapToBooking(created);
      
      // Record change history
      await this.recordChange({
        entityType: 'booking',
        entityId: booking.id,
        action: 'created',
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
      
      return booking;
    } catch (error) {
      console.error('[ChurchToolsProvider] Failed to create booking:', error);
      console.error('[ChurchToolsProvider] Booking data that failed:', bookingData);
      throw error;
    }
  }

  async updateBooking(id: string, data: BookingUpdate): Promise<Booking> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getBookingCategory();
    const existing = await this.getBooking(id);
    
    if (!existing) {
      throw new Error(`Booking with ID ${id} not found`);
    }
    
    // Merge with existing data
    const updatedData = {
      ...existing,
      ...data,
      lastModifiedAt: new Date().toISOString(),
    };
    
    // ChurchTools API requires: { id, dataCategoryId, value: string }
    const valueData = {
      id: Number(id),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updatedData),
    };
    
    const updated = await this.apiClient.updateDataValue(this.moduleId, category.id, id, valueData);
    const booking = this.mapToBooking(updated);
    
    // Record change history with granular field changes
    const changes = [];
    for (const [field, newValue] of Object.entries(data)) {
      const oldValue = existing[field as keyof Booking];
      if (!this.valuesAreEqual(oldValue, newValue)) {
        const formattedOld = this.formatFieldValue(oldValue);
        const formattedNew = this.formatFieldValue(newValue);
        if (formattedOld !== formattedNew) {
          changes.push({
            field,
            oldValue: formattedOld,
            newValue: formattedNew,
          });
        }
      }
    }
    
    if (changes.length > 0) {
      await this.recordChange({
        entityType: 'booking',
        entityId: id,
        action: 'updated',
        changes,
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
    }
    
    return booking;
  }

  async cancelBooking(id: string, reason?: string): Promise<void> {
    // T123: Enhanced cancellation validation
    const booking = await this.getBooking(id);
    
    if (!booking) {
      throw new Error('Buchung nicht gefunden');
    }
    
    // Validate booking can be cancelled
    if (booking.status === 'completed') {
      throw new Error('Abgeschlossene Buchungen können nicht storniert werden');
    }
    
    if (booking.status === 'cancelled') {
      throw new Error('Buchung ist bereits storniert');
    }
    
    // If booking is active, we need to free the asset
    if (booking.status === 'active' && booking.asset) {
      await this.updateAsset(booking.asset.id, {
        status: 'available',
        inUseBy: undefined,
      });
    }
    
    const user = await this.apiClient.getCurrentUser();
    
    await this.updateBooking(id, {
      status: 'cancelled',
    });
    
    // Record cancellation in change history
    await this.recordChange({
      entityType: 'booking',
      entityId: id,
      action: 'updated',
      changes: [
        {
          field: 'status',
          oldValue: booking.status,
          newValue: 'cancelled',
        },
        ...(reason ? [{
          field: 'cancellationReason',
          oldValue: '',
          newValue: reason,
        }] : []),
      ],
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
  }

  async isAssetAvailable(assetId: string, startDate: string, endDate: string): Promise<boolean> {
    const bookings = await this.getBookingsForAsset(assetId, {
      start: startDate,
      end: endDate,
    });
    
    // Asset is available if there are no active or approved bookings in the date range
    const conflictingBookings = bookings.filter(b =>
      b.status === 'approved' || b.status === 'active'
    );
    
    return conflictingBookings.length === 0;
  }

  async checkOut(bookingId: string, conditionAssessment?: unknown): Promise<Booking> {
    const user = await this.apiClient.getCurrentUser();
    const booking = await this.getBooking(bookingId);
    
    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    if (booking.status !== 'approved') {
      throw new Error('Can only check out approved bookings');
    }
    
    // Update booking status
    const updated = await this.updateBooking(bookingId, {
      status: 'active',
      checkedOutAt: new Date().toISOString(),
      checkedOutBy: user.id,
      checkedOutByName: `${user.firstName} ${user.lastName}`,
      conditionOnCheckOut: conditionAssessment as ConditionAssessment | undefined,
    });
    
    // Update asset status to in-use
    if (booking.asset) {
      await this.updateAsset(booking.asset.id, {
        status: 'in-use',
        inUseBy: {
          personId: user.id,
          personName: `${user.firstName} ${user.lastName}`,
          since: new Date().toISOString(),
        },
      });
    }
    
    return updated;
  }

  async checkIn(bookingId: string, conditionAssessment: unknown): Promise<Booking> {
    const user = await this.apiClient.getCurrentUser();
    const booking = await this.getBooking(bookingId);
    
    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    if (booking.status !== 'active') {
      throw new Error('Can only check in active bookings');
    }
    
    // Extract damage information from condition assessment
    const condition = conditionAssessment as { rating: string; notes?: string; photos?: string[] };
    const damageReported = condition.rating === 'damaged' || condition.rating === 'poor';
    
    // Update booking status
    const updated = await this.updateBooking(bookingId, {
      status: 'completed',
      checkedInAt: new Date().toISOString(),
      checkedInBy: user.id,
      checkedInByName: `${user.firstName} ${user.lastName}`,
      conditionOnCheckIn: conditionAssessment as ConditionAssessment,
      damageReported,
      damageNotes: damageReported ? condition.notes : undefined,
    });
    
    // Update asset status
    if (booking.asset) {
      const newStatus = damageReported ? 'broken' : 'available';
      await this.updateAsset(booking.asset.id, {
        status: newStatus,
        inUseBy: undefined,
      });
    }
    
    return updated;
  }

  // ============================================================================
  // Kits
  // ============================================================================

  /**
   * Get the internal category for storing kits
   */
  private async getKitsCategory(): Promise<AssetCategory> {
    const categories = await this.getAllCategoriesIncludingHistory();
    let kitsCategory = categories.find(cat => cat.name === '__Kits__');
    
    if (!kitsCategory) {
      // Create the kits category
      const user = await this.apiClient.getCurrentUser();
      const shorty = 'kits_' + Date.now().toString().substring(-4);
      
      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__Kits__',
        shorty,
        description: 'Internal category for equipment kits',
        data: null,
      };
      
      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      kitsCategory = this.mapToAssetCategory(created);
      
      // Record change history
      await this.recordChange({
        entityType: 'category',
        entityId: kitsCategory.id,
        entityName: kitsCategory.name,
        action: 'created',
        changedBy: user.id,
        changedByName: user.name,
      });
    }
    
    return kitsCategory;
  }

  /**
   * Map ChurchTools custom data value to Kit entity
   */
  private mapToKit(value: unknown): Kit {
    const val = value as Record<string, unknown>;
    const dataStr = (val['value'] || val['data']) as string | null;
    
    if (!dataStr) {
      throw new Error('Invalid kit data: missing value field');
    }
    
    const data = JSON.parse(dataStr) as Record<string, unknown>;
    
    return {
      id: String(val['id']),
      name: data['name'] as string,
      description: data['description'] as string | undefined,
      type: data['type'] as 'fixed' | 'flexible',
      boundAssets: data['boundAssets'] as Kit['boundAssets'],
      poolRequirements: data['poolRequirements'] as Kit['poolRequirements'],
      createdBy: data['createdBy'] as string,
      createdByName: data['createdByName'] as string,
      createdAt: (data['createdAt'] || val['created_at'] || new Date().toISOString()) as string,
      lastModifiedBy: data['lastModifiedBy'] as string,
      lastModifiedByName: data['lastModifiedByName'] as string,
      lastModifiedAt: (data['lastModifiedAt'] || val['modified_at'] || new Date().toISOString()) as string,
    };
  }

  async getKits(): Promise<Kit[]> {
    try {
      const category = await this.getKitsCategory();
      const values = await this.apiClient.getDataValues(this.moduleId, category.id);
      return values.map(v => this.mapToKit(v));
    } catch (error) {
      console.error('Error fetching kits:', error);
      return [];
    }
  }

  async getKit(id: string): Promise<Kit | null> {
    try {
      const kits = await this.getKits();
      return kits.find(kit => kit.id === id) || null;
    } catch (error) {
      console.error('Error fetching kit:', error);
      return null;
    }
  }

  async createKit(data: KitCreate): Promise<Kit> {
    const category = await this.getKitsCategory();
    const user = await this.apiClient.getCurrentUser();
    
    // Validate kit data
    if (data.type === 'fixed' && (!data.boundAssets || data.boundAssets.length === 0)) {
      throw new Error('Fixed kit must have at least one bound asset');
    }
    
    if (data.type === 'flexible' && (!data.poolRequirements || data.poolRequirements.length === 0)) {
      throw new Error('Flexible kit must have at least one pool requirement');
    }
    
    // Validate bound assets exist (for fixed kits)
    if (data.type === 'fixed' && data.boundAssets) {
      for (const boundAsset of data.boundAssets) {
        const asset = await this.getAsset(boundAsset.assetId);
        if (!asset) {
          throw new Error(`Asset ${boundAsset.assetNumber} not found`);
        }
        if (asset.status !== 'available') {
          throw new Error(`Asset ${boundAsset.assetNumber} is not available (status: ${asset.status})`);
        }
      }
    }
    
    const now = new Date().toISOString();
    const kitData = {
      ...data,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
      lastModifiedBy: user.id,
      lastModifiedByName: user.name,
      lastModifiedAt: now,
    };
    
    const valueData = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(kitData),
    };
    
    const created = await this.apiClient.createDataValue(this.moduleId, category.id, valueData);
    const kit = this.mapToKit(created);
    
    // Record change history
    await this.recordChange({
      entityType: 'kit',
      entityId: kit.id,
      entityName: kit.name,
      action: 'created',
      changedBy: user.id,
      changedByName: user.name,
    });
    
    return kit;
  }

  async updateKit(id: string, data: KitUpdate): Promise<Kit> {
    const existing = await this.getKit(id);
    if (!existing) {
      throw new Error(`Kit ${id} not found`);
    }
    
    const category = await this.getKitsCategory();
    const user = await this.apiClient.getCurrentUser();
    
    // Validate updates
    if (data.boundAssets && data.boundAssets.length > 0) {
      for (const boundAsset of data.boundAssets) {
        const asset = await this.getAsset(boundAsset.assetId);
        if (!asset) {
          throw new Error(`Asset ${boundAsset.assetNumber} not found`);
        }
      }
    }
    
    const now = new Date().toISOString();
    const updatedKitData = {
      ...existing,
      ...data,
      lastModifiedBy: user.id,
      lastModifiedByName: user.name,
      lastModifiedAt: now,
    };
    
    const valueData = {
      id: Number(id),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updatedKitData),
    };
    
    const updated = await this.apiClient.updateDataValue(this.moduleId, category.id, id, valueData);
    const kit = this.mapToKit(updated);
    
    // Record change history
    await this.recordChange({
      entityType: 'kit',
      entityId: kit.id,
      entityName: kit.name,
      action: 'updated',
      changedBy: user.id,
      changedByName: user.name,
    });
    
    return kit;
  }

  async deleteKit(id: string): Promise<void> {
    const kit = await this.getKit(id);
    if (!kit) {
      throw new Error(`Kit ${id} not found`);
    }
    
    // Check for active bookings
    const bookings = await this.getBookings({ kitId: id, status: ['pending', 'approved', 'active'] });
    if (bookings.length > 0) {
      throw new Error(`Cannot delete kit with active bookings (${bookings.length} bookings found)`);
    }
    
    const category = await this.getKitsCategory();
    const user = await this.apiClient.getCurrentUser();
    
    await this.apiClient.deleteDataValue(this.moduleId, category.id, id);
    
    // Record change history
    await this.recordChange({
      entityType: 'kit',
      entityId: id,
      entityName: kit.name,
      action: 'deleted',
      changedBy: user.id,
      changedByName: user.name,
    });
  }

  // ============================================================================
  // Maintenance - Phase 10 (T168)
  // ============================================================================

  /**
   * Get maintenance records category (internal storage)
   */
  private async getMaintenanceRecordsCategory(): Promise<AssetCategory> {
    const categories = await this.getAllCategoriesIncludingHistory();
    let maintenanceCategory = categories.find(cat => cat.name === '__MaintenanceRecords__');
    
    if (!maintenanceCategory) {
      const user = await this.apiClient.getCurrentUser();
      const shorty = 'maint_' + Date.now().toString().substring(-4);
      
      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__MaintenanceRecords__',
        shorty,
        description: 'Internal category for maintenance records',
        data: null,
      };
      
      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      maintenanceCategory = this.mapToAssetCategory(created);
      
      await this.recordChange({
        entityType: 'category',
        entityId: maintenanceCategory.id,
        action: 'created',
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
    }
    
    return maintenanceCategory;
  }

  /**
   * Get maintenance schedules category (internal storage)
   */
  private async getMaintenanceSchedulesCategory(): Promise<AssetCategory> {
    const categories = await this.getAllCategoriesIncludingHistory();
    let scheduleCategory = categories.find(cat => cat.name === '__MaintenanceSchedules__');
    
    if (!scheduleCategory) {
      const user = await this.apiClient.getCurrentUser();
      const shorty = 'sched_' + Date.now().toString().substring(-4);
      
      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__MaintenanceSchedules__',
        shorty,
        description: 'Internal category for maintenance schedules',
        data: null,
      };
      
      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      scheduleCategory = this.mapToAssetCategory(created);
      
      await this.recordChange({
        entityType: 'category',
        entityId: scheduleCategory.id,
        action: 'created',
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
    }
    
    return scheduleCategory;
  }

  async getMaintenanceRecords(assetId?: string): Promise<MaintenanceRecord[]> {
    const category = await this.getMaintenanceRecordsCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);
    let records = values.map((val: unknown) => this.mapToMaintenanceRecord(val));
    
    if (assetId) {
      records = records.filter((r: MaintenanceRecord) => r.asset.id === assetId);
    }
    
    return records.sort((a: MaintenanceRecord, b: MaintenanceRecord) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getMaintenanceRecord(id: string): Promise<MaintenanceRecord | null> {
    const records = await this.getMaintenanceRecords();
    return records.find(r => r.id === id) || null;
  }

  async createMaintenanceRecord(recordData: MaintenanceRecordCreate): Promise<MaintenanceRecord> {
    try {
      const category = await this.getMaintenanceRecordsCategory();
      const user = await this.apiClient.getCurrentUser();
      
      // Prepare maintenance record data for storage
      const maintenanceData = {
        ...recordData,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      };
      
      // ChurchTools expects: { dataCategoryId: number, value: string }
      const valueData = {
        dataCategoryId: Number(category.id),
        value: JSON.stringify(maintenanceData),
      };
      
      const created = await this.apiClient.createDataValue(this.moduleId, category.id, valueData);
      const record = this.mapToMaintenanceRecord(created);
      
      await this.recordChange({
        entityType: 'maintenance',
        entityId: record.id,
        action: 'created',
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });
      
      return record;
    } catch (error) {
      console.error('[ChurchToolsProvider] Failed to create maintenance record:', error);
      if (error instanceof Error) {
        throw new Error(`Could not create maintenance record: ${error.message}`);
      }
      throw new Error('Could not create maintenance record: Unknown error occurred');
    }
  }

  async updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const existing = await this.getMaintenanceRecord(id);
    
    if (!existing) {
      throw new Error(`Maintenance record ${id} not found`);
    }
    
    const category = await this.getMaintenanceRecordsCategory();
    const user = await this.apiClient.getCurrentUser();
    const updated = { ...existing, ...updates, lastModifiedAt: new Date().toISOString() };
    
    // ChurchTools API requires: { id, dataCategoryId, value: string }
    const dataValue = {
      id: Number(id),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updated),
    };
    
    const updatedValue = await this.apiClient.updateDataValue(
      this.moduleId,
      category.id,
      id,
      dataValue
    );
    
    const record = this.mapToMaintenanceRecord(updatedValue);
    
    await this.recordChange({
      entityType: 'maintenance',
      entityId: id,
      action: 'updated',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return record;
  }

  private mapToMaintenanceRecord(val: unknown): MaintenanceRecord {
    const v = val as Record<string, unknown>;
    
    // ChurchTools returns data in 'value' field for custom data
    const dataStr = (v['value'] || v['data']) as string | null;
    const data = dataStr ? JSON.parse(dataStr) : v;
    
    return {
      id: String(v['id']),
      asset: data['asset'] as MaintenanceRecord['asset'],
      type: data['type'] as MaintenanceRecord['type'],
      date: data['date'] as string,
      performedBy: data['performedBy'] as string,
      performedByName: data['performedByName'] as string,
      description: data['description'] as string,
      notes: data['notes'] as string | undefined,
      cost: data['cost'] as number | undefined,
      photos: data['photos'] as string[] | undefined,
      documents: data['documents'] as string[] | undefined,
      nextDueDate: data['nextDueDate'] as string | undefined,
      createdAt: data['createdAt'] as string || new Date().toISOString(),
      lastModifiedAt: data['lastModifiedAt'] as string || new Date().toISOString(),
    };
  }

  /**
   * Check availability of fixed kit (all bound assets must be available)
   */
  private async checkFixedKitAvailability(
    kit: Kit,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; unavailableAssets?: string[]; reason?: string }> {
    const unavailableAssets: string[] = [];
    
    if (!kit.boundAssets || kit.boundAssets.length === 0) {
      return { available: false, reason: 'Fixed kit has no bound assets' };
    }
    
    for (const boundAsset of kit.boundAssets) {
      const isAvailable = await this.isAssetAvailable(boundAsset.assetId, startDate, endDate);
      if (!isAvailable) {
        unavailableAssets.push(boundAsset.assetId);
      }
    }
    
    if (unavailableAssets.length > 0) {
      return {
        available: false,
        unavailableAssets,
        reason: `${unavailableAssets.length} asset(s) unavailable`,
      };
    }
    
    return { available: true };
  }

  /**
   * Check availability of flexible kit (sufficient pool assets must be available)
   */
  private async checkFlexibleKitAvailability(
    kit: Kit,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; unavailableAssets?: string[]; reason?: string }> {
    if (!kit.poolRequirements || kit.poolRequirements.length === 0) {
      return { available: false, reason: 'Flexible kit has no pool requirements' };
    }
    
    for (const pool of kit.poolRequirements) {
      // Get all assets in this category
      const assets = await this.getAssets({ categoryId: pool.categoryId });
      
      // Apply additional filters if specified
      let filteredAssets = assets;
      if (pool.filters) {
        filteredAssets = assets.filter(asset => {
          for (const [key, value] of Object.entries(pool.filters || {})) {
            if (asset.customFieldValues[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }
      
      // Count how many are available
      let availableCount = 0;
      for (const asset of filteredAssets) {
        const isAvailable = await this.isAssetAvailable(asset.id, startDate, endDate);
        if (isAvailable) {
          availableCount++;
        }
      }
      
      if (availableCount < pool.quantity) {
        return {
          available: false,
          reason: `Insufficient assets in pool ${pool.categoryName}: need ${pool.quantity}, only ${availableCount} available`,
        };
      }
    }
    
    return { available: true };
  }

  async isKitAvailable(_kitId: string, _startDate: string, _endDate: string): Promise<{ available: boolean; unavailableAssets?: string[]; reason?: string }> {
    const kit = await this.getKit(_kitId);
    if (!kit) {
      return { available: false, reason: 'Kit not found' };
    }
    
    if (kit.type === 'fixed') {
      return this.checkFixedKitAvailability(kit, _startDate, _endDate);
    } else {
      return this.checkFlexibleKitAvailability(kit, _startDate, _endDate);
    }
  }

  async getMaintenanceSchedules(assetId?: string): Promise<MaintenanceSchedule[]> {
    const category = await this.getMaintenanceSchedulesCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);
    let schedules = values.map((val: unknown) => this.mapToMaintenanceSchedule(val));
    
    if (assetId) {
      schedules = schedules.filter((s: MaintenanceSchedule) => s.assetId === assetId);
    }
    
    return schedules;
  }

  async getMaintenanceSchedule(assetId: string): Promise<MaintenanceSchedule | null> {
    const schedules = await this.getMaintenanceSchedules(assetId);
    return schedules[0] || null;
  }

  async createMaintenanceSchedule(scheduleData: MaintenanceScheduleCreate): Promise<MaintenanceSchedule> {
    const category = await this.getMaintenanceSchedulesCategory();
    const user = await this.apiClient.getCurrentUser();
    
    // ChurchTools expects: { dataCategoryId: number, value: string }
    const dataValue = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(scheduleData),
    };
    
    const created = await this.apiClient.createDataValue(
      this.moduleId,
      category.id,
      dataValue
    );
    
    const schedule = this.mapToMaintenanceSchedule(created);
    
    await this.recordChange({
      entityType: 'maintenance',
      entityId: schedule.id,
      action: 'created',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return schedule;
  }

  async updateMaintenanceSchedule(id: string, updates: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const category = await this.getMaintenanceSchedulesCategory();
    const schedules = await this.getMaintenanceSchedules();
    const existing = schedules.find(s => s.id === id);
    
    if (!existing) {
      throw new Error(`Maintenance schedule ${id} not found`);
    }
    
    const user = await this.apiClient.getCurrentUser();
    const updated = { ...existing, ...updates };
    
    // ChurchTools API requires: { id, dataCategoryId, value: string }
    const dataValue = {
      id: Number(id),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updated),
    };
    
    await this.apiClient.updateDataValue(
      this.moduleId,
      category.id,
      id,
      dataValue
    );
    
    const schedule = this.mapToMaintenanceSchedule(updated);
    
    await this.recordChange({
      entityType: 'maintenance',
      entityId: id,
      action: 'updated',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return schedule;
  }

  async deleteMaintenanceSchedule(id: string): Promise<void> {
    const category = await this.getMaintenanceSchedulesCategory();
    const user = await this.apiClient.getCurrentUser();
    
    await this.apiClient.deleteDataValue(this.moduleId, category.id, id);
    
    await this.recordChange({
      entityType: 'maintenance',
      entityId: id,
      action: 'deleted',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
  }

  async getOverdueMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    const schedules = await this.getMaintenanceSchedules();
    const today = new Date().toISOString().split('T')[0] as string;
    
    return schedules.filter((s: MaintenanceSchedule) => 
      s.nextDue !== undefined && s.nextDue < today
    );
  }

  async getOverdueMaintenance(): Promise<Asset[]> {
    const overdueSchedules = await this.getOverdueMaintenanceSchedules();
    const assetIds = new Set(overdueSchedules.map(s => s.assetId));
    
    const assets: Asset[] = [];
    for (const assetId of assetIds) {
      const asset = await this.getAsset(assetId);
      if (asset) {
        assets.push(asset);
      }
    }
    
    return assets;
  }

  async getUpcomingMaintenance(daysAhead: number): Promise<Asset[]> {
    const schedules = await this.getMaintenanceSchedules();
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0] as string;
    const todayStr = today.toISOString().split('T')[0] as string;
    
    const upcoming = schedules.filter((s: MaintenanceSchedule) => 
      s.nextDue !== undefined && s.nextDue >= todayStr && s.nextDue <= futureDateStr
    );
    
    const assetIds = new Set(upcoming.map(s => s.assetId));
    const assets: Asset[] = [];
    for (const assetId of assetIds) {
      const asset = await this.getAsset(assetId);
      if (asset) {
        assets.push(asset);
      }
    }
    
    return assets;
  }

  private mapToMaintenanceSchedule(val: unknown): MaintenanceSchedule {
    const v = val as Record<string, unknown>;
    return {
      id: v['id'] as string,
      assetId: v['assetId'] as string,
      scheduleType: v['scheduleType'] as MaintenanceSchedule['scheduleType'],
      intervalDays: v['intervalDays'] as number | undefined,
      intervalMonths: v['intervalMonths'] as number | undefined,
      intervalYears: v['intervalYears'] as number | undefined,
      intervalHours: v['intervalHours'] as number | undefined,
      intervalBookings: v['intervalBookings'] as number | undefined,
      fixedDate: v['fixedDate'] as string | undefined,
      reminderDaysBefore: v['reminderDaysBefore'] as number,
      lastPerformed: v['lastPerformed'] as string | undefined,
      nextDue: v['nextDue'] as string | undefined,
      isOverdue: v['isOverdue'] as boolean | undefined,
      createdAt: v['created_at'] as string || new Date().toISOString(),
      lastModifiedAt: v['modified_at'] as string || new Date().toISOString(),
    };
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
    
    // T241b: Enhanced duplicate scan prevention with timestamp info
    const existingScan = session.scannedAssets.find(scan => scan.assetId === assetId);
    if (existingScan) {
      // Return detailed duplicate scan error with timestamp
      const error = new EdgeCaseError('Asset already scanned in this session', {
        duplicateScan: {
          assetId,
          assetNumber: existingScan.assetNumber,
          scannedAt: existingScan.scannedAt,
          scannedBy: existingScan.scannedByName,
        },
      });
      throw error;
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

  // ============================================================================
  // Saved Views (User Story 9)
  // ============================================================================

  private async getSavedViewsCategory(): Promise<AssetCategory> {
    const categories = await this.getAllCategoriesIncludingHistory();
    let category = categories.find(cat => cat.name === '__SavedViews__');
    
    if (!category) {
      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__SavedViews__',
        shorty: 'savedviews_' + Date.now().toString().substring(-4),
        description: 'Internal: User saved view configurations',
        data: null,
      };
      
      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      category = this.mapToAssetCategory(created);
    }
    
    return category;
  }

  private mapToSavedView(dataValue: unknown): SavedView {
    const value = dataValue as { id: string; value: string };
    const parsed = JSON.parse(value.value) as SavedView;
    
    return {
      ...parsed,
      id: value.id,
    };
  }

  async getSavedViews(userId: string): Promise<SavedView[]> {
    const category = await this.getSavedViewsCategory();
    const dataValues = await this.apiClient.getDataValues(this.moduleId, category.id);
    
    const allViews = dataValues.map(dv => this.mapToSavedView(dv));
    
    // Filter to only views owned by this user or public views
    return allViews.filter(view => view.ownerId === userId || view.isPublic);
  }

  async createSavedView(data: SavedViewCreate): Promise<SavedView> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getSavedViewsCategory();
    
    const now = new Date().toISOString();
    const savedView: SavedView = {
      id: '', // Will be set by ChurchTools
      ...data,
      createdAt: now,
      lastModifiedAt: now,
    };
    
    const dataValue = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(savedView),
    };
    
    const created = await this.apiClient.createDataValue(this.moduleId, category.id, dataValue);
    const createdValue = created as { id: string; value: string };
    
    // Record change history
    await this.recordChange({
      entityType: 'asset', // Using 'asset' as generic type for change history
      entityId: createdValue.id,
      action: 'created',
      newValue: `Saved view: ${data.name}`,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return this.mapToSavedView(createdValue);
  }

  async updateSavedView(id: string, updates: Partial<SavedView>): Promise<SavedView> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getSavedViewsCategory();
    
    // Get current view
    const dataValues = await this.apiClient.getDataValues(this.moduleId, category.id);
    const current = dataValues.find(dv => (dv as { id: string }).id === id);
    
    if (!current) {
      throw new Error(`Saved view with ID ${id} not found`);
    }
    
    const currentView = this.mapToSavedView(current);
    
    // Only owner can update
    if (currentView.ownerId !== user.id) {
      throw new Error('Only the view owner can update this view');
    }
    
    const updatedView: SavedView = {
      ...currentView,
      ...updates,
      id, // Preserve ID
      lastModifiedAt: new Date().toISOString(),
    };
    
    const dataValue = {
      id: Number(id),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updatedView),
    };
    
    await this.apiClient.updateDataValue(this.moduleId, category.id, id, dataValue);
    
    // Record change history
    await this.recordChange({
      entityType: 'asset', // Using 'asset' as generic type for change history
      entityId: id,
      action: 'updated',
      newValue: `Saved view: ${updatedView.name}`,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
    
    return updatedView;
  }

  async deleteSavedView(id: string): Promise<void> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getSavedViewsCategory();
    
    // Get current view
    const dataValues = await this.apiClient.getDataValues(this.moduleId, category.id);
    const current = dataValues.find(dv => (dv as { id: string }).id === id);
    
    if (!current) {
      throw new Error(`Saved view with ID ${id} not found`);
    }
    
    const currentView = this.mapToSavedView(current);
    
    // Only owner can delete
    if (currentView.ownerId !== user.id) {
      throw new Error('Only the view owner can delete this view');
    }
    
    await this.apiClient.deleteDataValue(this.moduleId, category.id, id);
    
    // Record change history
    await this.recordChange({
      entityType: 'asset', // Using 'asset' as generic type for change history
      entityId: id,
      action: 'deleted',
      oldValue: `Saved view: ${currentView.name}`,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
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

  async getPersonInfo(personId: string): Promise<PersonInfo> {
    return await this.apiClient.getPersonInfo(personId);
  }

  async searchPeople(query: string): Promise<PersonInfo[]> {
    return await this.apiClient.searchPeople(query);
  }

  // ============================================================================
  // Asset Prefix Management (E5 - Multiple Asset Prefixes)
  // ============================================================================

  /**
   * Get all asset prefixes
   */
  async getAssetPrefixes(): Promise<import('../../types/entities').AssetPrefix[]> {
    const category = await this.getAssetPrefixesCategory();
    const dataValues = await this.apiClient.getDataValues(this.moduleId, category.id);
    return dataValues.map(dv => this.mapToAssetPrefix(dv));
  }

  /**
   * Get a single asset prefix by ID
   */
  async getAssetPrefix(id: string): Promise<import('../../types/entities').AssetPrefix> {
    const prefixes = await this.getAssetPrefixes();
    const prefix = prefixes.find(p => p.id === id);
    if (!prefix) {
      throw new Error(`Asset prefix with ID ${id} not found`);
    }
    return prefix;
  }

  /**
   * Create a new asset prefix
   */
  async createAssetPrefix(
    data: import('../../types/entities').AssetPrefixCreate
  ): Promise<import('../../types/entities').AssetPrefix> {
    try {
      const user = await this.apiClient.getCurrentUser();
      const category = await this.getAssetPrefixesCategory();

      // Validate prefix doesn't already exist
      const existingPrefixes = await this.getAssetPrefixes();
      if (existingPrefixes.some(p => p.prefix === data.prefix)) {
        throw new Error(`Prefix "${data.prefix}" already exists`);
      }

      // Prepare asset prefix data for storage
      const prefixData = {
        prefix: data.prefix,
        description: data.description,
        color: data.color,
        sequence: 0, // Start at 0, first asset will be 001
        createdBy: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
        lastModifiedBy: user.id,
        lastModifiedByName: `${user.firstName} ${user.lastName}`,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      };

      // ChurchTools expects: { dataCategoryId: number, value: string }
      const valueData = {
        dataCategoryId: Number(category.id),
        value: JSON.stringify(prefixData),
      };

      const created = await this.apiClient.createDataValue(this.moduleId, category.id, valueData);
      const prefix = this.mapToAssetPrefix(created);

      await this.recordChange({
        entityType: 'asset-prefix',
        entityId: prefix.id,
        action: 'created',
        newValue: `Prefix: ${data.prefix} - ${data.description}`,
        changedBy: user.id,
        changedByName: `${user.firstName} ${user.lastName}`,
      });

      return prefix;
    } catch (error) {
      console.error('[ChurchToolsProvider] Failed to create asset prefix:', error);
      if (error instanceof Error) {
        throw new Error(`Could not create asset prefix: ${error.message}`);
      }
      throw new Error('Could not create asset prefix: Unknown error occurred');
    }
  }

  /**
   * Update an asset prefix
   */
  async updateAssetPrefix(
    id: string,
    data: import('../../types/entities').AssetPrefixUpdate
  ): Promise<import('../../types/entities').AssetPrefix> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getAssetPrefixesCategory();
    const current = await this.getAssetPrefix(id);

    // Merge update data with current prefix data
    const updatedPrefixData = {
      ...current,
      ...data,
      lastModifiedBy: user.id,
      lastModifiedByName: `${user.firstName} ${user.lastName}`,
      lastModifiedAt: new Date().toISOString(),
    };

    // ChurchTools API requires: { id, dataCategoryId, value: string }
    const dataValue = {
      id: Number(id),
      dataCategoryId: Number(category.id),
      value: JSON.stringify(updatedPrefixData),
    };

    const updated = await this.apiClient.updateDataValue(this.moduleId, category.id, id, dataValue);
    const prefix = this.mapToAssetPrefix(updated);

    await this.recordChange({
      entityType: 'asset-prefix',
      entityId: id,
      action: 'updated',
      oldValue: JSON.stringify(current),
      newValue: JSON.stringify(data),
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });

    return prefix;
  }

  /**
   * Delete an asset prefix
   */
  async deleteAssetPrefix(id: string): Promise<void> {
    const user = await this.apiClient.getCurrentUser();
    const category = await this.getAssetPrefixesCategory();
    const prefix = await this.getAssetPrefix(id);

    await this.apiClient.deleteDataValue(this.moduleId, category.id, id);

    await this.recordChange({
      entityType: 'asset-prefix',
      entityId: id,
      action: 'deleted',
      oldValue: `Prefix: ${prefix.prefix} - ${prefix.description}`,
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });
  }

  /**
   * Increment sequence number for a prefix (called when creating asset)
   */
  async incrementPrefixSequence(prefixId: string): Promise<number> {
    const prefix = await this.getAssetPrefix(prefixId);
    const newSequence = prefix.sequence + 1;
    
    await this.updateAssetPrefix(prefixId, {
      sequence: newSequence,
    });
    
    return newSequence;
  }

  // ============================================================================
  // Private Helper Methods for Asset Prefixes
  // ============================================================================

  private async getAssetPrefixesCategory() {
    // Try to get existing category first
    try {
      const categories = await this.apiClient.getDataCategories(this.moduleId);
      const category = (categories as Array<{ id: string; name: string }>).find(
        c => c.name === '__AssetPrefixes__'
      );
      if (category) {
        return category;
      }
    } catch {
      // Category doesn't exist, create it
    }

    // Create the category with required fields
    const user = await this.apiClient.getCurrentUser();
    const categoryData = {
      customModuleId: Number(this.moduleId),
      name: '__AssetPrefixes__',
      shorty: 'assetprefixes_' + Date.now().toString().substring(-4),
      description: 'System category for asset prefixes',
      data: null,
    };

    const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
    const category = this.mapToAssetCategory(created);

    await this.recordChange({
      entityType: 'category',
      entityId: category.id,
      action: 'created',
      changedBy: user.id,
      changedByName: `${user.firstName} ${user.lastName}`,
    });

    return category;
  }

  private mapToAssetPrefix(dataValue: unknown): import('../../types/entities').AssetPrefix {
    const dv = dataValue as Record<string, unknown>;
    
    // ChurchTools returns data in 'value' field for custom data
    const dataStr = (dv['value'] || dv['data']) as string | null;
    const data = dataStr ? JSON.parse(dataStr) : dv;
    
    return {
      id: String(dv['id']),
      prefix: data['prefix'] as string,
      description: data['description'] as string,
      color: data['color'] as string,
      sequence: (data['sequence'] as number) || 0,
      createdBy: data['createdBy'] as string,
      createdByName: data['createdByName'] as string,
      createdAt: data['createdAt'] as string,
      lastModifiedBy: data['lastModifiedBy'] as string,
      lastModifiedByName: data['lastModifiedByName'] as string,
      lastModifiedAt: data['lastModifiedAt'] as string,
    };
  }
}
