# Enhancement Specification: UX Improvements & Scanner Configuration

**Created**: 2025-10-20  
**Status**: Draft  
**Priority**: P1 (High - Critical UX Issues)

## User Feedback Summary

This document addresses critical UX issues and feature gaps identified during user testing:

1. **Barcode Scanner Configuration** - No way to configure scanner-specific codes (pairing, settings)
2. **Asset Barcode Update** - Cannot regenerate/update barcodes for existing assets
3. **Change History Format** - Unreadable JSON format instead of human-readable text
4. **Asset Detail Navigation** - Must click 3 dots menu instead of direct click
5. **Multi-Prefix Support** - Can only configure one prefix, need multiple with permissions
6. **Stock Take UI Issues** - Duplicate "New Stock Take" buttons, missing field update selection
7. **Category Display Bug** - `__StockTakeSessions__` showing as category
8. **Unused Navigation** - "Change History" label in sidebar serves no purpose

---

## Enhancement 1: Barcode Scanner Configuration System

### User Story
**As a** warehouse manager with multiple barcode scanners  
**I want** to configure scanner-specific codes (pairing, modes, settings)  
**So that** I can quickly access configuration barcodes without consulting manuals

### Problem
Different barcode scanner models require scanning specific configuration codes (e.g., Code128 "%#IFSNO$4" to enable Bluetooth pairing on Zebra scanners). Users must dig through manuals or carry printed code sheets.

### Requirements

**FR-E001**: System MUST provide scanner model management in Settings menu
- Add/edit/delete scanner models with name and uploaded photo
- Store models in localStorage as `scannerModels` array

**FR-E002**: System MUST allow defining configuration functions per scanner model
- Each function has: name (e.g., "Enable Pairing Mode"), code string (e.g., "%#IFSNO$4"), barcode format (Code128/QR)
- Functions stored with scanner model

**FR-E003**: System MUST provide per-client scanner selection with cache persistence
- Dropdown in Settings to select "My Scanner Model"
- Selected scanner stored in localStorage as `selectedScanner`
- Persists across sessions

**FR-E004**: System MUST show scanner config codes wherever scanning is available
- Button "Scanner Setup" appears on: Asset scanning page, Stock Take scanner, Quick Scan modal
- Opens modal displaying all config barcodes for selected scanner
- Each code shown as scannable barcode/QR with label

**FR-E005**: System MUST allow switching scanner without re-navigating to Settings
- Quick-switch dropdown in scanner config modal
- "Change Scanner" button to edit in Settings

### UI Mockup

```
Settings > Scanner Configuration Tab
┌─────────────────────────────────────────┐
│ My Scanner: [Zebra DS3608 ▼] [Edit]    │
├─────────────────────────────────────────┤
│ Available Scanners:                      │
│ ┌─────────────────┐                     │
│ │ [Photo]         │ Zebra DS3608        │
│ │                 │ 4 configuration     │
│ │                 │ functions           │
│ └─────────────────┘ [Edit] [Delete]     │
│                                          │
│ [+ Add Scanner Model]                   │
└─────────────────────────────────────────┘

Edit Scanner Model Dialog
┌─────────────────────────────────────────┐
│ Scanner Name: [Zebra DS3608_________]   │
│ Photo: [Upload] [zebra.jpg] [X]         │
│                                          │
│ Configuration Functions:                 │
│ ┌───────────────────────────────────┐  │
│ │ Enable Pairing Mode               │  │
│ │ Code: %#IFSNO$4                   │  │
│ │ Format: Code128                   │  │
│ │ [Edit] [Delete]                   │  │
│ └───────────────────────────────────┘  │
│ [+ Add Function]                        │
│                                          │
│ [Cancel] [Save]                         │
└─────────────────────────────────────────┘

Scanner Setup Modal (during scanning)
┌─────────────────────────────────────────┐
│ Scanner Setup - Zebra DS3608             │
│ My Scanner: [Zebra DS3608 ▼] [Change]  │
├─────────────────────────────────────────┤
│ Enable Pairing Mode                      │
│ ┌─────────────────────────────────────┐ │
│ │ [||||||||||||| BARCODE ||||||||||||]│ │
│ │ %#IFSNO$4                           │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Set Factory Defaults                     │
│ ┌─────────────────────────────────────┐ │
│ │ [||||||||||||| BARCODE ||||||||||||]│ │
│ │ $RESET$                             │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ [Close]                                  │
└─────────────────────────────────────────┘
```

### Data Model

```typescript
interface ScannerModel {
  id: string;                    // Unique ID
  name: string;                  // "Zebra DS3608"
  photoUrl: string | null;       // Base64 or URL
  functions: ScannerFunction[];  // Configuration functions
}

interface ScannerFunction {
  id: string;                    // Unique ID
  name: string;                  // "Enable Pairing Mode"
  code: string;                  // "%#IFSNO$4"
  format: 'code128' | 'qr';      // Barcode format
}

// LocalStorage keys:
// - scannerModels: ScannerModel[]
// - selectedScanner: string (scanner model ID)
```

---

## Enhancement 2: Asset Barcode Regeneration

### User Story
**As an** asset manager  
**I want** to regenerate barcodes for existing assets  
**So that** I can replace damaged labels or update barcode formats

### Problem
Currently, barcodes are generated once at asset creation. If a label is damaged or format needs updating (e.g., switching from Code128 to QR), users cannot regenerate.

### Requirements

**FR-E006**: System MUST provide "Regenerate Barcode" button in AssetDetail view
- Located near barcode display
- Confirms before regenerating
- Logs change in history

**FR-E007**: System MUST archive old barcode numbers when regenerating
- Store in `barcodeHistory` array on asset
- Each entry: { number, generatedAt, archivedAt }
- Old barcodes remain scannable (lookup in history)

**FR-E008**: System MUST log barcode regeneration in change history
- Format: "2025-10-20 14:30 John Doe regenerated barcode from 'OLD-123' to 'NEW-456'"

### UI Mockup

```
Asset Detail - Barcode Section
┌─────────────────────────────────────────┐
│ Barcode                                  │
│ ┌─────────────────────────────────────┐ │
│ │ [||||||||||||| CHT-001 ||||||||||||]│ │
│ └─────────────────────────────────────┘ │
│ [Download] [Print] [Regenerate]         │
│                                          │
│ Barcode History (2):                     │
│ • OLD-123 (2024-01-15 - 2025-10-20)     │
│ • TEMP-999 (2024-01-01 - 2024-01-15)    │
└─────────────────────────────────────────┘

Confirm Regeneration Dialog
┌─────────────────────────────────────────┐
│ Regenerate Barcode?                      │
│                                          │
│ Current: CHT-001                         │
│ New: CHT-042 (preview)                   │
│                                          │
│ ⚠️  Old barcode will be archived but     │
│ remain scannable for lookup.             │
│                                          │
│ [Cancel] [Confirm Regeneration]         │
└─────────────────────────────────────────┘
```

---

## Enhancement 3: Human-Readable Change History

### User Story
**As an** auditor  
**I want** to read change history in plain English  
**So that** I can understand what changed without interpreting JSON

### Problem
Current format shows raw JSON diffs like:
```
{"name": "Microphone", "status": "Available"} → {"name": "Mic", "status": "Broken"}
```

Users cannot easily identify what changed.

### Requirements

**FR-E009**: System MUST format change history as readable sentences
- Format: "{date} {time} {user} changed {field} from '{old}' to '{new}'"
- Example: "2025-10-20 14:30 John Doe changed status from 'Available' to 'Broken'"
- Multiple fields: "changed status from 'Available' to 'Broken' and location from 'Room A' to 'Room B'"

**FR-E010**: System MUST update history immediately after asset edit
- Display in UI without page reload
- Use TanStack Query cache invalidation

**FR-E011**: System MUST move history to dedicated "History" tab in AssetDetail
- Default tab: "Overview" (current asset detail view)
- Second tab: "History" (change history table)
- History tab shows full change log with pagination

**FR-E012**: System MUST store granular field-level changes instead of object diffs
- Old format: `{ action: 'updated', oldValue: '{...}', newValue: '{...}' }`
- New format: `{ action: 'updated', changes: [{ field: 'status', oldValue: 'Available', newValue: 'Broken' }] }`

### UI Mockup

```
Asset Detail - Tabbed View
┌─────────────────────────────────────────┐
│ [Overview] [History]                    │
├─────────────────────────────────────────┤
│ (Overview content - current AssetDetail)│
└─────────────────────────────────────────┘

History Tab
┌─────────────────────────────────────────┐
│ Change History                           │
├─────────────────────────────────────────┤
│ 2025-10-20 14:30 John Doe               │
│ • Changed status from 'Available' to    │
│   'Broken'                               │
│ • Changed location from 'Room A' to     │
│   'Room B'                               │
├─────────────────────────────────────────┤
│ 2025-10-19 09:15 Jane Smith             │
│ • Changed name from 'Microphone' to     │
│   'Wireless Mic'                         │
├─────────────────────────────────────────┤
│ 2025-10-18 16:45 John Doe               │
│ • Created asset                          │
└─────────────────────────────────────────┘
```

---

## Enhancement 4: Direct Asset Click Navigation

### User Story
**As a** user browsing assets  
**I want** to click an asset row to open details  
**So that** I don't have to find and click the three-dot menu

### Problem
Current UX requires: Click row → Click three dots → Click "View" (3 clicks). Standard expectation is 1 click to open details.

### Requirements

**FR-E013**: System MUST navigate to asset detail on row click in AssetList
- Clicking anywhere on row (except action buttons) opens detail
- Preserves existing three-dot menu for Edit/Delete actions
- Uses React Router navigation (e.g., `/assets/:id`)

**FR-E014**: System MUST show visual affordance that rows are clickable
- Hover effect: subtle background color change
- Cursor: pointer
- Optional: row highlight on focus (keyboard navigation)

---

## Enhancement 5: Multi-Prefix Support with Permissions

### User Story
**As an** organization with multiple departments  
**I want** to configure multiple asset prefixes (SOUND-, VIDEO-, LIGHT-)  
**So that** assets are organized by department with proper permissions

### Problem
Current system allows only one global prefix. Organizations with departments need different prefixes (e.g., SOUND-001, VIDEO-001, LIGHT-001) with department-specific view/edit permissions.

### Requirements

**FR-E015**: System MUST support multiple asset prefixes
- Defined in Settings as list of prefixes
- Each prefix: { id, prefix (2-10 chars), description, color }
- Example: { id: '1', prefix: 'SOUND', description: 'Audio Equipment', color: 'blue' }

**FR-E016**: System MUST allow selecting prefix when creating asset
- Dropdown in AssetForm: "Prefix: [SOUND ▼]"
- Asset number auto-generated using selected prefix: SOUND-001, SOUND-002, etc.
- Each prefix maintains separate sequence counter

**FR-E017**: System MUST prepare for future permission-based prefix restrictions
- Data model includes `allowedPrefixes: string[]` per user (not enforced yet)
- When ChurchTools adds granular permissions, restrict:
  - **View**: Users see only assets with their allowed prefixes
  - **Edit**: Users can edit only assets with their allowed prefixes
  - **Create**: Users can create assets only with their allowed prefixes

**FR-E018**: System MUST apply selected prefix during asset creation
- Current bug: Prefix setting ignored, assets created without prefix
- Fix: Read selected prefix from form, pass to generateAssetNumber()

### UI Mockup

```
Settings > Asset Prefixes Tab
┌─────────────────────────────────────────┐
│ Asset Prefixes                           │
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐  │
│ │ SOUND (Audio Equipment)           │  │
│ │ Color: [Blue ■]                   │  │
│ │ Next: SOUND-042                   │  │
│ │ Assets: 41                        │  │
│ │ [Edit] [Delete]                   │  │
│ └───────────────────────────────────┘  │
│                                          │
│ ┌───────────────────────────────────┐  │
│ │ VIDEO (Video Equipment)           │  │
│ │ Color: [Red ■]                    │  │
│ │ Next: VIDEO-015                   │  │
│ │ Assets: 14                        │  │
│ │ [Edit] [Delete]                   │  │
│ └───────────────────────────────────┘  │
│                                          │
│ [+ Add Prefix]                          │
└─────────────────────────────────────────┘

Asset Form - Prefix Selection
┌─────────────────────────────────────────┐
│ Asset Number Prefix: [SOUND ▼]         │
│ Next Number: SOUND-042 (preview)        │
│                                          │
│ Name: [Wireless Microphone_________]   │
│ ...                                      │
└─────────────────────────────────────────┘
```

### Data Model

```typescript
interface AssetPrefix {
  id: string;          // Unique ID
  prefix: string;      // "SOUND" (2-10 chars, uppercase, alphanumeric + hyphen)
  description: string; // "Audio Equipment"
  color: string;       // Mantine color name or hex
  sequence: number;    // Current sequence number (0-based)
}

// LocalStorage key:
// - assetPrefixes: AssetPrefix[]

// Future (when ChurchTools permissions available):
interface UserPermissions {
  userId: string;
  allowedPrefixes: string[]; // Array of prefix IDs user can view/edit
  role: 'viewer' | 'editor' | 'admin';
}
```

---

## Enhancement 6: Stock Take UI Fixes

### User Story
**As a** warehouse manager performing stock take  
**I want** a clean UI without duplicates and ability to select which fields to update  
**So that** I can efficiently audit different scenarios (location, status, etc.)

### Problem
1. Two "New Stock Take" buttons appear (duplicate)
2. Cannot select which fields to bulk-update after scanning (always updates all)
3. No workflow for partial updates (e.g., "I'm in Room A, update location only for scanned assets")

### Requirements

**FR-E019**: System MUST remove duplicate "New Stock Take" button
- Keep only header button
- Remove button from StockTakeSessionList component

**FR-E020**: System MUST allow selecting update fields when creating stock take session
- Checkboxes in StartStockTakeForm: "Update location", "Update status"
- Store selections in session metadata
- Apply only selected updates when completing session

**FR-E021**: System MUST support partial field updates during stock take
- Example workflow:
  1. Create session with scope "Category: Audio", fields "Update location"
  2. Scan assets in Room A → all scanned assets get location = "Room A"
  3. Move to Room B, continue session → scanned assets get location = "Room B"
  4. Complete session → only location updated, status unchanged

**FR-E022**: System MUST allow specifying update values per scan location
- During scanning, show "Current location: [Room A_____]" input
- Each scan updates asset with current values
- User can change values mid-session

### UI Mockup

```
Start Stock Take Form
┌─────────────────────────────────────────┐
│ Stock Take Scope                         │
│ ○ All Assets                             │
│ ● Category: [Audio Equipment ▼]         │
│ ○ Location: [______________]             │
│                                          │
│ Fields to Update:                        │
│ ☑ Location                               │
│ ☐ Status                                 │
│ ☐ Custom Field: Last Audited            │
│                                          │
│ [Cancel] [Start Stock Take]             │
└─────────────────────────────────────────┘

Stock Take Scanner View
┌─────────────────────────────────────────┐
│ Current Settings:                        │
│ Location: [Room A_____________]         │
│ Status: [Available ▼] (if enabled)      │
│                                          │
│ (Scanner interface)                      │
│                                          │
│ Scanned: 15 / 42 assets                 │
└─────────────────────────────────────────┘
```

---

## Enhancement 7: Category Display Bug Fix

### User Story
**As a** user viewing categories  
**I want** to see only real asset categories  
**So that** I'm not confused by system entities

### Problem
`__StockTakeSessions__` appears in category list because it's stored in Custom Modules API as a category. It's a system entity, not a user-created category.

### Requirements

**FR-E023**: System MUST filter out system categories from category list
- Exclude any category with prefix `__` (double underscore)
- Filter applied in `useCategories` hook before returning data
- System categories remain in database but hidden from UI

**FR-E024**: System MUST use consistent naming for system entities
- Convention: All system entities use `__EntityName__` format
- Examples: `__StockTakeSessions__`, `__ChangeHistory__`, `__ScannerModels__`
- Documentation in data-model.md

---

## Enhancement 8: Remove Unused Navigation Items

### User Story
**As a** user  
**I want** a clean navigation menu  
**So that** I'm not confused by disabled or non-functional items

### Problem
"Change History" navigation item exists but is disabled with "Coming soon" label. It serves no purpose and clutters the UI.

### Requirements

**FR-E025**: System MUST remove "Change History" navigation item
- Delete from Navigation.tsx
- Change history accessed via Asset Detail > History tab (see Enhancement 3)
- No standalone change history page needed

**FR-E026**: System MUST keep navigation clean and functional
- Remove all disabled/placeholder items
- Only show features that are implemented
- Future features added when ready, not as placeholders

---

## Acceptance Criteria Summary

### Enhancement 1: Scanner Configuration
- [ ] Can add/edit/delete scanner models with photos
- [ ] Can define configuration functions (name, code, format)
- [ ] Can select "My Scanner" in Settings
- [ ] "Scanner Setup" button appears wherever scanning is available
- [ ] Config codes displayed as scannable barcodes/QR codes
- [ ] Can quick-switch scanner from setup modal

### Enhancement 2: Barcode Regeneration
- [ ] "Regenerate Barcode" button in AssetDetail
- [ ] Confirmation dialog shows old/new barcode
- [ ] Old barcode archived with timestamp
- [ ] Old barcodes remain scannable
- [ ] Regeneration logged in change history

### Enhancement 3: Readable History
- [ ] History displayed as sentences: "Date Time USER changed FIELD from VALUE to VALUE"
- [ ] History updates immediately after edit (no reload)
- [ ] Asset Detail has tabs: Overview, History
- [ ] History tab shows full log with pagination
- [ ] Multiple field changes grouped in single entry

### Enhancement 4: Direct Click Navigation
- [ ] Clicking asset row opens detail view
- [ ] Row shows hover effect (background change)
- [ ] Three-dot menu still available for Edit/Delete
- [ ] Keyboard navigation supported (Enter to open)

### Enhancement 5: Multi-Prefix Support
- [ ] Can configure multiple prefixes in Settings
- [ ] Each prefix has: name, description, color, sequence
- [ ] AssetForm shows prefix dropdown
- [ ] Asset number generated with selected prefix
- [ ] Selected prefix actually applied (bug fix)
- [ ] Data model ready for future permission restrictions

### Enhancement 6: Stock Take UI Fixes
- [ ] Only one "New Stock Take" button (header)
- [ ] Can select which fields to update in StartStockTakeForm
- [ ] Can specify update values during scanning
- [ ] Can change values mid-session
- [ ] Only selected fields updated on completion

### Enhancement 7: Category Filter
- [ ] `__StockTakeSessions__` not shown in category list
- [ ] All system entities (prefix `__`) filtered out
- [ ] System entities remain in database

### Enhancement 8: Clean Navigation
- [ ] "Change History" navigation item removed
- [ ] No disabled/placeholder items in navigation
- [ ] All navigation items functional

---

## Priority & Effort Estimates

| Enhancement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| E3: Readable History | P0 | 4h | Critical - auditing broken |
| E4: Direct Click | P0 | 1h | Critical - UX anti-pattern |
| E7: Category Filter | P0 | 0.5h | Critical - confusing bug |
| E8: Clean Navigation | P0 | 0.5h | Critical - UX polish |
| E5: Multi-Prefix | P1 | 6h | High - requested feature |
| E6: Stock Take UI | P1 | 4h | High - UX improvements |
| E2: Barcode Regen | P2 | 3h | Medium - nice-to-have |
| E1: Scanner Config | P3 | 8h | Low - convenience feature |

**Total Effort**: 27 hours  
**Critical Path (P0)**: 6 hours  
**Week 1 Target**: E3, E4, E7, E8 (P0) + E5 (P1) = 12 hours
