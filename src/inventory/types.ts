/**
 * Core type definitions for the inventory system
 */

// Individual Asset Instance - each has unique identifying information
export type InventoryItem = {
    // internal stable id (never changes)
    id: string;
    // human visible asset id with prefix (optional)
    assetId?: string;
    // barcode/QR code - independent from assetId
    barcode?: string;
    
    // Parent-child relationship for asset instances
    // If this is set, this item is an instance/copy of another asset
    parentAssetId?: string;
    
    // Shared properties (inherited from parent if parentAssetId is set)
    name: string;
    manufacturer?: string;
    model?: string;
    assetIcon?: string; // Data URL for asset icon image
    location?: string;
    tags?: string[];
    
    // Instance-specific properties (always unique per item, never inherited)
    serialNumber?: string;
    status?: string;
    assignedToPersonId?: number;
    assignedToPersonName?: string;
    notes?: string;
    
    // Metadata
    createdBy?: string;
    createdAt?: string;
    updatedBy?: string;
    updatedAt: string;
    history?: HistoryEntry[];
};

export type HistoryEntry = {
    timestamp: string;
    user: string;
    action: string;
    changes?: { field: string; oldValue?: string; newValue?: string }[];
};

export type Kit = {
    id: string;
    name: string;
    itemIds: string[];
    notes?: string;
    updatedAt: string;
};

export type Booking = {
    id: string;
    title: string;
    start: string; // ISO
    end: string; // ISO
    itemIds: string[]; // items or kit-expanded items
    createdAt: string;
};

export type PrefixCounters = Record<string, number>;

export type MasterdataItem = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

export type Masterdata = {
    manufacturers: MasterdataItem[];
    locations: MasterdataItem[];
    models: MasterdataItem[];
};

export type InventorySettings = {
    locations: string[]; // Deprecated - kept for backward compatibility
    assetPrefixes: string[];
    statuses: string[];
    masterdata?: Masterdata;
};

export type InitOptions = {
    syncHandler?: (items: InventoryItem[]) => Promise<void>;
    currentUser?: {
        firstName: string;
        lastName: string;
    };
};
