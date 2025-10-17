/**
 * Storage service - provides access to data persistence layer
 */

// Re-export all storage functions from the API layer
export {
    loadItems,
    saveItems,
    loadKits,
    saveKits,
    loadBookings,
    saveBookings,
    loadSettings,
    saveSettings,
    loadPrefixCounters,
    savePrefixCounters
} from '../../api/inventory-api';
