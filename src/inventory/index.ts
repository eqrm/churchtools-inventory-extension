/**
 * Inventory Management System - Main Entry Point
 * 
 * This module provides a comprehensive inventory management system
 * with asset tracking, kits, bookings, and ChurchTools integration.
 */

// Main entry point for inventory module
// Re-export everything for clean imports

// Types
export * from './types';

// Constants
export * from './constants';

// Utils
export * from './utils';

// Components
export * from './components/SearchableDropdown';
export * from './components/PersonSearcher';

// Services
export * from './services/assetId.service';
export * from './services/storage.service';

// UI Components
export * from './ui/AssetModal';
export * from './ui/InventoryTable';
export * from './ui/SettingsModal';
export * from './ui/KitsSection';
export * from './ui/BookingsSection';
export * from './ui/Scanner';

// Main initialization function - still imported from old file for now
// TODO: Refactor the main init logic into separate UI modules
export { initInventory } from '../inventory';
