# Inventory System Architecture

## Module Dependency Graph

```
main.ts
   │
   ├─> inventory/index.ts (public API)
   │      │
   │      ├─> types.ts
   │      ├─> constants.ts
   │      ├─> utils.ts
   │      ├─> components/
   │      │      ├─> SearchableDropdown.ts
   │      │      └─> PersonSearcher.ts ──> @churchtools/churchtools-client
   │      │
   │      └─> services/
   │             ├─> assetId.service.ts
   │             └─> storage.service.ts ──> api/inventory-api.ts ──> localStorage
   │
   └─> inventory.ts (legacy, to be refactored)
          │
          ├─> inventory.css
          └─> all above modules
```

## Data Flow

```
┌──────────────┐
│   Browser    │
│  localStorage│
└──────┬───────┘
       │
       ↓
┌──────────────────────────┐
│  api/inventory-api.ts    │
│  (Data Persistence)      │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────────┐
│ services/storage.service.ts  │
│ (Wrapper & Re-exports)       │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────┐
│   inventory.ts           │
│   (Main UI Logic)        │
│   - Rendering            │
│   - Event Handlers       │
│   - State Management     │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│   Components             │
│   - SearchableDropdown   │
│   - PersonSearcher       │
│   - AssetModal          │
│   - SettingsModal       │
└──────────────────────────┘
```

## Component Interactions

```
┌─────────────────────┐
│   initInventory()   │
│   (Main Entry)      │
└──────────┬──────────┘
           │
           ├─> Load Data (Storage Service)
           │   ├─> loadItems()
           │   ├─> loadKits()
           │   ├─> loadBookings()
           │   ├─> loadSettings()
           │   └─> loadPrefixCounters()
           │
           ├─> Render UI
           │   ├─> Inventory Table
           │   ├─> Kits Section
           │   └─> Bookings Section
           │
           ├─> Setup Event Handlers
           │   ├─> New Asset Button
           │   ├─> Settings Button
           │   ├─> Import/Export
           │   └─> Search Input
           │
           └─> Initialize Components
               ├─> createSearchableDropdown()
               ├─> createPersonSearcher()
               └─> openAssetModal()
```

## Key Responsibilities

### Types Layer
- **Purpose**: Define data structures
- **Files**: `types.ts`
- **Dependencies**: None
- **Used By**: Everything

### Constants Layer
- **Purpose**: Application-wide constants
- **Files**: `constants.ts`
- **Dependencies**: None
- **Used By**: UI components, validation

### Utils Layer
- **Purpose**: Pure utility functions
- **Files**: `utils.ts`
- **Dependencies**: None
- **Used By**: All components and services

### Components Layer
- **Purpose**: Reusable UI widgets
- **Files**: `components/*.ts`
- **Dependencies**: Utils, ChurchTools client
- **Used By**: Main UI logic

### Services Layer
- **Purpose**: Business logic and data access
- **Files**: `services/*.ts`
- **Dependencies**: Types, API layer
- **Used By**: Main UI logic, components

### API Layer
- **Purpose**: Data persistence
- **Files**: `api/inventory-api.ts`
- **Dependencies**: Browser APIs (localStorage)
- **Used By**: Storage service

### UI Layer (Legacy)
- **Purpose**: Main application logic
- **Files**: `inventory.ts`
- **Dependencies**: All above layers
- **Used By**: main.ts

## Future State (Planned)

```
src/inventory/
├── types.ts
├── constants.ts
├── utils.ts
├── components/
│   ├── SearchableDropdown.ts
│   ├── PersonSearcher.ts
│   ├── AssetIcon.ts          ← NEW
│   └── StatusBadge.ts         ← NEW
├── services/
│   ├── assetId.service.ts
│   ├── storage.service.ts
│   ├── state.service.ts       ← NEW (centralized state)
│   └── scanner.service.ts     ← NEW (QR/barcode)
├── ui/
│   ├── InventoryTable.ts      ← NEW (extracted)
│   ├── AssetModal.ts          ← NEW (extracted)
│   ├── SettingsModal.ts       ← NEW (extracted)
│   ├── KitsSection.ts         ← NEW (extracted)
│   └── BookingsSection.ts     ← NEW (extracted)
└── index.ts
```

## Benefits of Current Refactoring

1. **Clear Boundaries**: Each module has a single responsibility
2. **Easy Testing**: Can test components/services in isolation
3. **Reusability**: Components can be used elsewhere
4. **Maintainability**: Smaller files, easier to understand
5. **Type Safety**: Centralized type definitions
6. **Scalability**: Easy to add new features in appropriate modules
