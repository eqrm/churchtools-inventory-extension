# UI Components Module

This folder contains all UI components for the inventory management system. Each component is self-contained and communicates via callbacks.

## Components

### AssetModal.ts
**Purpose**: Create/edit asset detail modal with tabs (Overview & History)

**Exports**: `createAssetModal(container, items, settings, prefixCounters, currentUserName)`

**Features**:
- Icon upload with preview
- Asset ID auto-generation
- Status management with buttons
- Person assignment with ChurchTools integration
- History tracking with change detection
- Form validation and data collection

**Usage**:
```typescript
const modal = createAssetModal(document.body, items, settings, prefixCounters, 'John Doe');
modal.open(itemId, {
    onSave: async (item, isNew) => { /* handle save */ },
    onClose: () => { /* handle close */ }
});
```

---

### InventoryTable.ts
**Purpose**: Display inventory items in a sortable table with person avatars

**Exports**: `createInventoryTable(container)`

**Features**:
- Person profile images/initials from ChurchTools API
- Sortable by update date
- Click row to edit
- Delete button with confirmation
- Async rendering

**Usage**:
```typescript
const table = createInventoryTable(container);
await table.render(items, {
    onRowClick: (itemId) => { /* open modal */ },
    onDelete: async (itemId) => { /* delete item */ }
});
```

---

### SettingsModal.ts
**Purpose**: Manage locations and asset ID prefixes

**Exports**: `createSettingsModal(container)`

**Features**:
- Add/remove locations
- Add/remove asset prefixes
- Live updates with save callbacks
- Informational note about fixed statuses

**Usage**:
```typescript
const modal = createSettingsModal(document.body);
modal.open(settings, {
    onSave: async (settings) => { /* save settings */ },
    onClose: () => { /* handle close */ }
});
```

---

### KitsSection.ts
**Purpose**: Create and manage equipment kits (collections of items)

**Exports**: `createKitsSection(container)`

**Features**:
- Multi-select item picker
- Kit notes field
- Delete with confirmation
- Custom event emission for form submission

**Usage**:
```typescript
const kits = createKitsSection(container);
kits.updateItemsSelect(items);
kits.render(kits, items, {
    onSave: async (kits) => { /* save kits */ }
});
kits.addEventListener('kit-submit', (e) => {
    const { name, notes, itemIds } = e.detail;
    // create kit
});
```

---

### BookingsSection.ts
**Purpose**: Manage equipment bookings with conflict detection

**Exports**: `createBookingsSection(container)`

**Features**:
- Date/time range picker
- Multi-select item picker
- Conflict detection callback
- Delete with confirmation
- Custom event emission for form submission

**Usage**:
```typescript
const bookings = createBookingsSection(container);
bookings.updateItemsSelect(items);
bookings.render(bookings, items, {
    onSave: async (bookings) => { /* save bookings */ },
    onConflictCheck: (start, end, itemIds, ignoreId) => { /* check conflicts */ }
});
bookings.addEventListener('booking-submit', (e) => {
    const { title, start, end, itemIds } = e.detail;
    // create booking
});
```

---

### Scanner.ts
**Purpose**: QR/Barcode scanning via camera or image upload

**Exports**: `createScanner(container)`

**Features**:
- Camera scanning with BarcodeDetector API
- Image upload scanning
- Manual code entry
- Fallback for browsers without BarcodeDetector
- Auto-stop on successful scan

**Usage**:
```typescript
const scanner = createScanner(container);
scanner.setCallbacks({
    onCodeScanned: (code, foundItem) => { /* handle found item */ },
    onCreateFromScan: async (code) => { /* create new item */ }
});
scanner.handleCode('ABC123', items); // manual code handling
scanner.stopCamera(); // cleanup
```

---

## Design Principles

1. **Separation of Concerns**: Each component handles its own UI rendering and events
2. **Callback Pattern**: Components communicate via callbacks, not direct references
3. **No Global State**: All state is passed in, components don't store data
4. **Async-First**: All data operations are async for future API integration
5. **Self-Contained**: Each component can be tested independently

## Component Lifecycle

1. **Creation**: `const component = createComponent(container)`
2. **Configuration**: Set callbacks, update selects, etc.
3. **Rendering**: `component.render(data, callbacks)`
4. **Events**: Listen for custom events or handle callbacks
5. **Cleanup**: Call cleanup methods (e.g., `scanner.stopCamera()`)

## Future Improvements

- [ ] Add component tests for each UI module
- [ ] Extract common modal logic into BaseModal
- [ ] Add loading states for async operations
- [ ] Implement optimistic UI updates
- [ ] Add error boundary handling
- [ ] Create Storybook stories for each component
