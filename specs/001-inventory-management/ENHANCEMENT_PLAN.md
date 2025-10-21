# Enhancement Implementation Plan

**Created**: 2025-10-20  
**Priority**: P0-P3 (Mixed)  
**Source**: [ENHANCEMENT_SPEC.md](./ENHANCEMENT_SPEC.md)

## Overview

This plan addresses 8 critical UX improvements and feature enhancements identified during user testing. Work is organized by priority with critical P0 fixes first.

---

## Phase E1: Critical UX Fixes (P0) - Week 1

**Target**: 6 hours, must complete before any new features  
**Deliverables**: Readable history, direct click navigation, clean UI

### E3: Human-Readable Change History (4 hours)

**Problem**: Change history shows unreadable JSON diffs  
**Solution**: Parse changes into sentences, add History tab to AssetDetail

#### Tasks

**E3.1** Update ChangeHistoryEntry data model (30min)
- File: `src/types/entities.ts`
- Change from:
  ```typescript
  interface ChangeHistoryEntry {
    oldValue?: string; // JSON string
    newValue?: string; // JSON string
  }
  ```
- To:
  ```typescript
  interface ChangeHistoryEntry {
    changes?: FieldChange[]; // Granular changes
  }
  
  interface FieldChange {
    field: string;      // "status"
    oldValue: string;   // "Available"
    newValue: string;   // "Broken"
  }
  ```

**E3.2** Update storage provider to record granular changes (1h)
- File: `src/services/storage/ChurchToolsProvider.ts`
- Methods: `updateAsset()`, `updateCategory()`
- Logic: Compare old and new objects field-by-field
- Example:
  ```typescript
  const changes: FieldChange[] = [];
  if (oldAsset.status !== updates.status) {
    changes.push({
      field: 'status',
      oldValue: oldAsset.status,
      newValue: updates.status
    });
  }
  await recordChange({
    entityType: 'asset',
    entityId: assetId,
    action: 'updated',
    changes
  });
  ```

**E3.3** Create readable history formatter utility (1h)
- File: `src/utils/historyFormatters.ts`
- Function: `formatChangeEntry(entry: ChangeHistoryEntry): string`
- Logic:
  ```typescript
  export function formatChangeEntry(entry: ChangeHistoryEntry): string {
    const date = formatDateTime(entry.changedAt);
    const user = entry.changedByName;
    
    if (entry.action === 'created') {
      return `${date} ${user} created this asset`;
    }
    
    if (entry.action === 'deleted') {
      return `${date} ${user} deleted this asset`;
    }
    
    if (entry.changes && entry.changes.length > 0) {
      const changeText = entry.changes.map(c => 
        `${c.field} from '${c.oldValue}' to '${c.newValue}'`
      ).join(' and ');
      return `${date} ${user} changed ${changeText}`;
    }
    
    return `${date} ${user} ${entry.action}`;
  }
  ```

**E3.4** Add tabbed interface to AssetDetail (1h)
- File: `src/components/assets/AssetDetail.tsx`
- Use Mantine Tabs component
- Two tabs: "Overview" (existing content), "History" (new)
- History tab uses ChangeHistoryList with formatted entries

**E3.5** Update ChangeHistoryList to use formatter (30min)
- File: `src/components/assets/ChangeHistoryList.tsx`
- Replace DataTable with Timeline component for better UX
- Use `formatChangeEntry()` for each entry
- Example:
  ```tsx
  <Timeline>
    {history.map(entry => (
      <Timeline.Item key={entry.id} title={formatChangeEntry(entry)}>
        {entry.changes?.map(change => (
          <Text size="sm" c="dimmed">
            {change.field}: {change.oldValue} → {change.newValue}
          </Text>
        ))}
      </Timeline.Item>
    ))}
  </Timeline>
  ```

**E3.6** Invalidate cache after mutations (30min)
- File: `src/hooks/useAssets.ts`
- In `useUpdateAsset` onSuccess callback:
  ```typescript
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['change-history', assetId] });
  }
  ```

---

### E4: Direct Asset Click Navigation (1 hour)

**Problem**: Must click three-dot menu → View (3 clicks instead of 1)  
**Solution**: Make entire row clickable, preserve menu for actions

#### Tasks

**E4.1** Update AssetList row click handler (30min)
- File: `src/components/assets/AssetList.tsx`
- Add `onRowClick` prop to DataTable:
  ```tsx
  <DataTable
    records={sortedAssets}
    onRowClick={(asset) => navigate(`/assets/${asset.id}`)}
    rowStyle={{ cursor: 'pointer' }}
    // ... existing props
  />
  ```

**E4.2** Add hover styles (15min)
- File: `src/components/assets/AssetList.tsx`
- Add CSS or inline styles for hover effect:
  ```tsx
  rowStyle={(asset) => ({
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--mantine-color-gray-0)' }
  })}
  ```

**E4.3** Preserve three-dot menu (15min)
- Ensure menu actions (Edit, Delete) still work
- Stop propagation on menu clicks:
  ```tsx
  <Menu>
    <Menu.Target>
      <ActionIcon onClick={(e) => e.stopPropagation()}>
        <IconDots />
      </ActionIcon>
    </Menu.Target>
  </Menu>
  ```

---

### E7: Filter System Categories (30 minutes)

**Problem**: `__StockTakeSessions__` appears in category list  
**Solution**: Filter out categories with `__` prefix

#### Tasks

**E7.1** Add filter to useCategories hook (30min)
- File: `src/hooks/useCategories.ts`
- Filter categories before returning:
  ```typescript
  export function useCategories() {
    const query = useQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const storage = getStorageProvider();
        const allCategories = await storage.getCategories();
        
        // Filter out system categories (prefix __)
        return allCategories.filter(cat => !cat.name.startsWith('__'));
      }
    });
    return query;
  }
  ```

---

### E8: Remove Unused Navigation (30 minutes)

**Problem**: "Change History" navigation item is disabled and unused  
**Solution**: Remove item, access history via Asset Detail tabs

#### Tasks

**E8.1** Remove navigation item (30min)
- File: `src/components/layout/Navigation.tsx`
- Delete NavLink for "Change History"
- Remove IconHistory import if not used elsewhere

---

## Phase E2: High Priority Features (P1) - Week 2

**Target**: 10 hours  
**Deliverables**: Multi-prefix support, stock take UI improvements

### E5: Multi-Prefix Support (6 hours)

**Problem**: Only one global prefix, need department-specific prefixes  
**Solution**: Configure multiple prefixes, select during asset creation

#### Tasks

**E5.1** Update data model for prefixes (30min)
- File: `src/types/entities.ts`
- Add AssetPrefix interface:
  ```typescript
  export interface AssetPrefix {
    id: string;
    prefix: string;         // "SOUND" (2-10 chars)
    description: string;    // "Audio Equipment"
    color: string;          // Mantine color
    sequence: number;       // Current sequence (0-based)
  }
  ```

**E5.2** Create AssetPrefixList component (1h)
- File: `src/components/settings/AssetPrefixList.tsx`
- Display all prefixes in DataTable
- Show: prefix, description, color badge, next number, count
- Actions: Edit, Delete (with protection if assets exist)

**E5.3** Create AssetPrefixForm component (1.5h)
- File: `src/components/settings/AssetPrefixForm.tsx`
- Fields: prefix (validation: 2-10 chars, alphanumeric), description, color picker
- Validation: unique prefix, uppercase conversion
- Preview next number

**E5.4** Add Prefixes tab to Settings page (30min)
- File: `src/pages/SettingsPage.tsx`
- Add third tab: "Prefixes"
- Render AssetPrefixList component

**E5.5** Update AssetForm to select prefix (1h)
- File: `src/components/assets/AssetForm.tsx`
- Add Select field: "Prefix"
- Load prefixes from localStorage
- Preview next asset number based on selected prefix
- Pass selected prefix to createAsset mutation

**E5.6** Update asset number generation (1h)
- File: `src/utils/assetNumbers.ts`
- Update `generateAssetNumber()` to accept prefix parameter
- Increment sequence for selected prefix only
- Store updated sequences in localStorage

**E5.7** Fix prefix application bug (30min)
- File: `src/services/storage/ChurchToolsProvider.ts`
- In `createAsset()`, use provided prefix from form
- Current bug: Ignores prefix setting
- Fix: Read prefix from form values, pass to generator

**E5.8** Add prefix-based filtering (30min)
- File: `src/components/assets/AssetList.tsx`
- Add prefix filter dropdown
- Filter assets by prefix in query

---

### E6: Stock Take UI Improvements (4 hours)

**Problem**: Duplicate buttons, no field selection, inflexible updates  
**Solution**: Clean UI, configurable field updates

#### Tasks

**E6.1** Remove duplicate "New Stock Take" button (15min)
- File: `src/components/stocktake/StockTakeSessionList.tsx`
- Remove button from component (keep only in page header)

**E6.2** Add field selection to StartStockTakeForm (1h)
- File: `src/components/stocktake/StartStockTakeForm.tsx`
- Add checkboxes: "Update location", "Update status", "Update custom field: [select]"
- Store selections in session metadata
- Example:
  ```typescript
  interface StockTakeSession {
    // ... existing fields
    updateFields: {
      location: boolean;
      status: boolean;
      customFields: string[]; // Field IDs to update
    };
  }
  ```

**E6.3** Add current values input during scanning (1.5h)
- File: `src/components/stocktake/StockTakeScanner.tsx` (or StockTakePage if inline)
- Add inputs for updateable fields:
  - Location: TextInput (if updateFields.location = true)
  - Status: Select (if updateFields.status = true)
  - Custom fields: Dynamic inputs
- Store current values in component state
- Pass values to addScan mutation

**E6.4** Update scan logic to apply field updates (1h)
- File: `src/hooks/useStockTake.ts` (or storage provider)
- In `addStockTakeScan()`:
  ```typescript
  const scan = {
    assetId,
    scannedBy,
    scannedAt: new Date().toISOString(),
    updates: {
      location: session.updateFields.location ? currentLocation : undefined,
      status: session.updateFields.status ? currentStatus : undefined,
      // ... custom fields
    }
  };
  ```
- Apply updates to asset when scan is recorded

**E6.5** Add value change UI mid-session (30min)
- File: Stock Take scanner view
- Allow changing "Current location" input during scanning
- Show notification: "Location changed to 'Room B' - future scans will use this value"

---

## Phase E3: Medium Priority Features (P2) - Week 3

**Target**: 3 hours  
**Deliverables**: Barcode regeneration

### E2: Asset Barcode Regeneration (3 hours)

**Problem**: Cannot regenerate barcodes for damaged labels  
**Solution**: "Regenerate Barcode" button with history tracking

#### Tasks

**E2.1** Update Asset data model for barcode history (30min)
- File: `src/types/entities.ts`
- Add field:
  ```typescript
  interface Asset {
    // ... existing fields
    barcodeHistory?: BarcodeHistoryEntry[];
  }
  
  interface BarcodeHistoryEntry {
    barcode: string;
    generatedAt: string;
    archivedAt?: string;
  }
  ```

**E2.2** Create regenerateBarcode method (1h)
- File: `src/services/storage/ChurchToolsProvider.ts`
- Method: `regenerateAssetBarcode(assetId: string): Promise<Asset>`
- Logic:
  1. Get current asset
  2. Archive current barcode with timestamp
  3. Generate new barcode number
  4. Update asset with new barcode
  5. Add to barcodeHistory array
  6. Log change in history
  7. Return updated asset

**E2.3** Add hook for barcode regeneration (30min)
- File: `src/hooks/useAssets.ts`
- Hook: `useRegenerateBarcode()`
- TanStack Query mutation with cache invalidation

**E2.4** Add Regenerate button to AssetDetail (30min)
- File: `src/components/assets/AssetDetail.tsx`
- Button next to Download/Print
- Opens confirmation modal

**E2.5** Create barcode regeneration confirmation modal (30min)
- Component: Inline in AssetDetail or separate component
- Show: Current barcode, preview of new barcode
- Warning: Old barcode archived but scannable
- Actions: Cancel, Confirm

**E2.6** Display barcode history in AssetDetail (30min)
- File: `src/components/assets/AssetDetail.tsx`
- Section below barcode display
- Show: List of previous barcodes with date ranges
- Example: "OLD-123 (2024-01-15 - 2025-10-20)"

---

## Phase E4: Low Priority Features (P3) - Future

**Target**: 8 hours  
**Deliverables**: Scanner configuration system

### E1: Barcode Scanner Configuration (8 hours)

**Problem**: No easy access to scanner config codes  
**Solution**: Full scanner model management system

#### Tasks

**E1.1** Create ScannerModel data model (30min)
- File: `src/types/entities.ts`
- Interfaces: ScannerModel, ScannerFunction

**E1.2** Create ScannerModelList component (1.5h)
- File: `src/components/settings/ScannerModelList.tsx`
- Display all scanner models with photos
- Show function count
- Actions: Edit, Delete, Select as "My Scanner"

**E1.3** Create ScannerModelForm component (2h)
- File: `src/components/settings/ScannerModelForm.tsx`
- Fields: name, photo upload (Mantine Dropzone), functions list
- Function editor: name, code, format (Code128/QR)
- Add/remove functions inline

**E1.4** Add Scanner Configuration tab to Settings (30min)
- File: `src/pages/SettingsPage.tsx`
- New tab: "Scanner Configuration"
- Render ScannerModelList

**E1.5** Create ScannerSetupModal component (2h)
- File: `src/components/scanner/ScannerSetupModal.tsx`
- Display selected scanner's config functions
- Generate barcode/QR for each function code
- Quick-switch scanner dropdown
- "Change Scanner" link to Settings

**E1.6** Add "Scanner Setup" button to scanning contexts (1h)
- Files:
  - `src/components/scanner/BarcodeScanner.tsx`
  - `src/components/stocktake/StockTakeScanner.tsx`
  - `src/components/scanner/QuickScanModal.tsx` (if exists)
- Button opens ScannerSetupModal
- Only shown if scanner selected in Settings

**E1.7** Implement localStorage persistence (30min)
- Keys: `scannerModels`, `selectedScanner`
- Load/save on component mount/change

**E1.8** Add photo upload and storage (1h)
- Use Mantine Dropzone for photo upload
- Store as base64 in localStorage (or ChurchTools Files module if available)
- Display uploaded photo in list and form

---

## Testing Strategy

### Automated Tests

**E3: Readable History**
- Unit tests: `historyFormatters.test.ts`
  - Test formatChangeEntry() with various change types
  - Test multiple field changes
  - Test date formatting
- Integration tests: Create asset → Update → Verify history readable

**E4: Direct Click**
- Integration test: Click row → Verify navigation to detail view

**E5: Multi-Prefix**
- Unit tests: `assetNumbers.test.ts`
  - Test prefix selection
  - Test sequence increment per prefix
  - Test validation
- Integration tests: Create assets with different prefixes → Verify numbering

**E7: Category Filter**
- Unit test: useCategories hook filters system categories

### Manual Tests

**E3: History Tab**
- [ ] Create asset → Update multiple fields → Verify history shows as sentences
- [ ] Verify History tab appears in AssetDetail
- [ ] Verify history updates immediately after edit

**E4: Click Navigation**
- [ ] Click asset row → Opens detail view
- [ ] Click three-dot menu → Menu still works
- [ ] Verify hover effect on rows

**E5: Multi-Prefix**
- [ ] Configure 3 prefixes (SOUND, VIDEO, LIGHT)
- [ ] Create assets with each prefix
- [ ] Verify numbering: SOUND-001, VIDEO-001, LIGHT-001, SOUND-002
- [ ] Filter assets by prefix

**E6: Stock Take**
- [ ] Create stock take with "Update location" enabled
- [ ] Scan assets → Verify location updated
- [ ] Change location mid-session → Verify new location applied
- [ ] Complete session → Verify only location updated

**E7: Category Filter**
- [ ] Verify `__StockTakeSessions__` not in category list
- [ ] Verify real categories still appear

**E8: Navigation**
- [ ] Verify "Change History" item removed from nav
- [ ] Access history via Asset Detail > History tab

**E2: Barcode Regen**
- [ ] Click "Regenerate Barcode" → Verify new barcode generated
- [ ] Verify old barcode archived
- [ ] Scan old barcode → Still finds asset
- [ ] Verify history shows regeneration event

**E1: Scanner Config**
- [ ] Add scanner model with photo
- [ ] Add config functions
- [ ] Select as "My Scanner"
- [ ] Open "Scanner Setup" during scanning
- [ ] Verify config codes displayed as barcodes
- [ ] Scan config code → Verify scanner accepts it

---

## Rollout Plan

### Week 1: Critical Fixes (P0)
**Day 1-2**: E3 (Readable History) - 4h  
**Day 3**: E4 (Direct Click) + E7 (Filter) + E8 (Navigation) - 2h  
**Deployment**: Friday - Critical UX fixes live

### Week 2: High Priority (P1)
**Day 1-3**: E5 (Multi-Prefix) - 6h  
**Day 4-5**: E6 (Stock Take UI) - 4h  
**Deployment**: Friday - Major feature enhancements live

### Week 3: Medium Priority (P2)
**Day 1-2**: E2 (Barcode Regen) - 3h  
**Day 3-5**: Testing, bug fixes, documentation  
**Deployment**: Friday - Complete enhancement package

### Future: Low Priority (P3)
**E1 (Scanner Config)**: Scheduled based on user demand (8h)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking change history format | Migrate existing entries, fallback to old format if no changes array |
| Multi-prefix conflicts with existing assets | Assign default prefix to existing assets, preserve numbering |
| Stock take field updates break existing sessions | Version check, apply updates only to new sessions |
| Barcode regeneration causes lookup failures | Keep old barcodes scannable via history lookup |

---

## Success Metrics

- **E3**: 100% of change history entries readable by non-technical users
- **E4**: 90% of asset detail views reached via direct click (analytics)
- **E5**: Organizations using 2+ prefixes see improved categorization
- **E6**: Stock take completion time reduced by 30% (measured)
- **E7**: Zero user confusion about system categories
- **E8**: Zero clicks on disabled navigation items
- **E2**: Barcode regeneration used for damaged labels (usage tracking)
- **E1**: Scanner configuration reduces setup time by 50% (measured)

---

## Dependencies

- **E3**: No dependencies, can start immediately
- **E4**: No dependencies, can start immediately
- **E5**: Depends on E3 (history format) for logging prefix changes
- **E6**: No dependencies, can parallelize with E5
- **E7**: No dependencies, can start immediately
- **E8**: No dependencies, can start immediately
- **E2**: Depends on E3 (history format) for logging regeneration
- **E1**: No dependencies, low priority

---

## Completion Criteria

**Phase E1 (P0) Complete When:**
- [ ] Change history displays as readable sentences
- [ ] Asset Detail has tabbed interface (Overview, History)
- [ ] History updates immediately after edits
- [ ] Asset rows clickable for navigation
- [ ] System categories filtered from lists
- [ ] "Change History" navigation item removed
- [ ] All P0 tests passing

**Phase E2 (P1) Complete When:**
- [ ] Multiple prefixes configurable in Settings
- [ ] Asset creation uses selected prefix
- [ ] Prefix sequences independent
- [ ] Stock take allows field selection
- [ ] Stock take allows value changes mid-session
- [ ] All P1 tests passing

**Phase E3 (P2) Complete When:**
- [ ] Barcode regeneration functional
- [ ] Barcode history tracked and displayed
- [ ] Old barcodes remain scannable
- [ ] All P2 tests passing

**Phase E4 (P3) Complete When:**
- [ ] Scanner models manageable
- [ ] Config codes accessible during scanning
- [ ] All P3 tests passing

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-20  
**Status**: Ready for Implementation
