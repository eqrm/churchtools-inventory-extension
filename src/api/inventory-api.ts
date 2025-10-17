// API service for storing inventory data
// Note: Using localStorage for now as ChurchTools Custom Modules API 
// doesn't have straightforward data category support yet
import type { InventoryItem, Kit, Booking, InventorySettings } from '../inventory';

// Storage keys
const STORAGE_KEY = 'ct-inventory-items';
const KITS_KEY = 'ct-inventory-kits';
const BOOKINGS_KEY = 'ct-inventory-bookings';
const SETTINGS_KEY = 'ct-inventory-settings';
const COUNTERS_KEY = 'ct-inventory-counters';

type PrefixCounters = Record<string, number>;

/**
 * Load items from localStorage
 */
export async function loadItems(): Promise<InventoryItem[]> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as InventoryItem[];
    } catch (e) {
        console.error('Error loading items:', e);
        return [];
    }
}

/**
 * Save items to localStorage
 */
export async function saveItems(items: InventoryItem[]): Promise<void> {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Error saving items:', e);
        throw e;
    }
}

/**
 * Load kits from localStorage
 */
export async function loadKits(): Promise<Kit[]> {
    try {
        const raw = localStorage.getItem(KITS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Kit[];
    } catch (e) {
        console.error('Error loading kits:', e);
        return [];
    }
}

/**
 * Save kits to localStorage
 */
export async function saveKits(kits: Kit[]): Promise<void> {
    try {
        localStorage.setItem(KITS_KEY, JSON.stringify(kits));
    } catch (e) {
        console.error('Error saving kits:', e);
        throw e;
    }
}

/**
 * Load bookings from localStorage
 */
export async function loadBookings(): Promise<Booking[]> {
    try {
        const raw = localStorage.getItem(BOOKINGS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Booking[];
    } catch (e) {
        console.error('Error loading bookings:', e);
        return [];
    }
}

/**
 * Save bookings to localStorage
 */
export async function saveBookings(bookings: Booking[]): Promise<void> {
    try {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (e) {
        console.error('Error saving bookings:', e);
        throw e;
    }
}

/**
 * Load settings from localStorage
 */
export async function loadSettings(): Promise<InventorySettings> {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return { 
                locations: [], 
                assetPrefixes: [], 
                statuses: [],
                masterdata: {
                    manufacturers: [],
                    locations: [],
                    models: []
                }
            };
        }
        const settings = JSON.parse(raw) as InventorySettings;
        
        // Initialize masterdata if it doesn't exist (backward compatibility)
        if (!settings.masterdata) {
            settings.masterdata = {
                manufacturers: [],
                locations: [],
                models: []
            };
            
            // Migrate old locations to masterdata
            if (settings.locations && settings.locations.length > 0) {
                settings.masterdata.locations = settings.locations.map((loc, idx) => ({
                    id: `loc-${Date.now()}-${idx}`,
                    name: loc,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));
            }
        }
        
        return settings;
    } catch (e) {
        console.error('Error loading settings:', e);
        return { 
            locations: [], 
            assetPrefixes: [], 
            statuses: [],
            masterdata: {
                manufacturers: [],
                locations: [],
                models: []
            }
        };
    }
}

/**
 * Save settings to localStorage
 */
export async function saveSettings(settings: InventorySettings): Promise<void> {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving settings:', e);
        throw e;
    }
}

/**
 * Load prefix counters from localStorage
 */
export async function loadPrefixCounters(): Promise<PrefixCounters> {
    try {
        const raw = localStorage.getItem(COUNTERS_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as PrefixCounters;
    } catch (e) {
        console.error('Error loading prefix counters:', e);
        return {};
    }
}

/**
 * Save prefix counters to localStorage
 */
export async function savePrefixCounters(counters: PrefixCounters): Promise<void> {
    try {
        localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
    } catch (e) {
        console.error('Error saving prefix counters:', e);
        throw e;
    }
}
