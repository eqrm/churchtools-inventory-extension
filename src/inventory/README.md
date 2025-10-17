# Inventory Module Structure

This directory contains the modularized inventory management system.

## Directory Structure

```
inventory/
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Application constants
├── utils.ts                   # Utility functions
├── components/                # Reusable UI components
│   ├── SearchableDropdown.ts  # Generic searchable dropdown
│   └── PersonSearcher.ts      # ChurchTools person search component
├── services/                  # Business logic services
│   ├── assetId.service.ts     # Asset ID generation logic
│   └── storage.service.ts     # Data persistence (re-exports from api/)
└── index.ts                   # Main entry point (re-exports from old inventory.ts)
```

## Module Responsibilities

### Types (`types.ts`)
- All TypeScript interfaces and type definitions
- `InventoryItem`, `Kit`, `Booking`, `HistoryEntry`, `InventorySettings`, etc.

### Constants (`constants.ts`)
- Application-wide constants
- `FIXED_STATUSES` - predefined status options

### Utils (`utils.ts`)
- Pure utility functions
- `genId()` - Generate unique IDs
- `fmtDate()` - Format dates
- `createEl()` - DOM element creation helper

### Components (`components/`)
Reusable UI components with their own encapsulated logic:

- **SearchableDropdown**: Generic dropdown with filtering
- **PersonSearcher**: ChurchTools API-integrated person search with profile images

### Services (`services/`)
Business logic and data access:

- **assetId.service**: Asset ID generation and counter management
- **storage.service**: Re-exports data persistence functions from `api/inventory-api.ts`

## Usage

```typescript
// Import the main initialization function
import { initInventory } from './inventory';

// Initialize in your application
await initInventory(containerElement, {
    currentUser: { firstName: 'John', lastName: 'Doe' }
});
```

## Future Improvements

To fully complete the modularization, consider:

1. **Split large UI sections** into separate files in `ui/`:
   - `InventoryTable.ts` - Main inventory table rendering
   - `AssetModal.ts` - Asset detail modal
   - `SettingsModal.ts` - Settings management
   - `KitsSection.ts` - Kits management
   - `BookingsSection.ts` - Booking management

2. **Extract scanning logic** into `services/scanner.service.ts`:
   - QR/barcode scanning functionality
   - Camera access management

3. **Create a state management service** (`services/state.service.ts`):
   - Centralized state for items, kits, bookings
   - Event emitters for state changes

4. **Add tests** for each module:
   - Unit tests for services
   - Component tests for UI elements
