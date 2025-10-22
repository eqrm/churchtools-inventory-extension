# Phase 13: Bug Fixes & UX Improvements

**Status**: Planning  
**Priority**: Critical  
**Start Date**: October 22, 2025

---

## Overview

This phase addresses critical bugs, UX improvements, and missing features identified during user testing. Focus areas include routing, booking enhancements, search functionality, UI polish, and data management improvements.

---

## Critical Issues (P0)

### T300: Fix Page Refresh Routing Issue
**Priority**: P0 - Blocking  
**Issue**: Page refresh breaks with base URL error message

**Current Behavior**:
- Refreshing any page shows: "The server is configured with a public base URL of /ccm/fkoinventorymanagement/"
- User must manually navigate to correct URL

**Expected Behavior**:
- Full forward, backward, and refresh functionality
- No broken states on page refresh
- Proper URL handling with base path

**Implementation**:
- Configure Vite base URL properly
- Update React Router basename configuration
- Test all route scenarios (refresh, back/forward, deep links)

**Files to Modify**:
- `vite.config.ts` - Add base configuration
- `src/App.tsx` - Update BrowserRouter basename
- Test all pages after changes

**Acceptance Criteria**:
- ✅ All pages work after refresh
- ✅ Browser back/forward buttons work correctly
- ✅ Deep links work from external sources
- ✅ Base path handled correctly in all routes

---

### T301: Implement ChurchTools Person Search API
**Priority**: P0 - Required for bookings

**Issue**: Person search not implemented; using local data only

**ChurchTools API**:
```bash
GET https://eqrm.church.tools/api/search?query=max&domain_types[]=person
```

**Implementation Requirements**:
1. Create `PersonSearchService` using ChurchTools search API
2. Implement debounced search (300ms)
3. Add person avatar/icon display
4. Cache person data for performance
5. Use in all person selection scenarios

**Use Cases**:
- Booking: Select person booking the asset
- Booking: Select person asset is booked for (requestedBy)
- Custom Fields: Person field type selection
- History: Display person who made changes
- Maintenance: Display person who performed work

**Files to Create**:
- `src/services/person/PersonSearchService.ts`
- `src/hooks/usePersonSearch.ts`
- `src/components/common/PersonPicker.tsx`
- `src/components/common/PersonAvatar.tsx`

**Files to Modify**:
- `src/components/bookings/BookingForm.tsx`
- All custom field inputs with person type
- All history displays
- Maintenance components

**Acceptance Criteria**:
- ✅ Search works with ChurchTools API
- ✅ Debouncing prevents excessive API calls
- ✅ Person avatars displayed everywhere
- ✅ Results cached for performance
- ✅ Works in all person selection contexts

---

### T302: Fix Asset Prefix Generation (400 Errors)
**Priority**: P0 - Blocking feature

**Issue**: Asset prefix creation failing with 400 errors from API

**Current Error**:
```
eqrm.church.tools/api/custommodules/53/customdatacategories: 400
```

**Root Cause**: API request format or payload incorrect

**Investigation Steps**:
1. Log actual API request being sent
2. Compare with API documentation
3. Check data category creation format
4. Verify permissions

**Implementation**:
- Fix API request format in ChurchToolsProvider
- Add better error handling and logging
- Validate data before sending to API
- Add retry logic for transient failures

**Files to Modify**:
- `src/services/storage/ChurchToolsProvider.ts`
- `src/hooks/useCreateAssetPrefix.ts`

**Acceptance Criteria**:
- ✅ Asset prefixes can be created successfully
- ✅ Clear error messages if creation fails
- ✅ Proper API request format
- ✅ No 400 errors in console

---

### T303: Fix Maintenance Creation (500 Error)
**Priority**: P0 - Blocking feature

**Issue**: Creating maintenance throws 500 error

**Investigation**:
- Check API endpoint and format
- Verify required fields
- Check data validation
- Review server logs if available

**Implementation**:
- Fix API request in maintenance hooks
- Add proper error handling
- Validate all required fields
- Add user-friendly error messages

**Files to Modify**:
- `src/hooks/useCreateMaintenanceSchedule.ts`
- `src/hooks/useCreateMaintenanceRecord.ts`
- `src/components/maintenance/MaintenanceRecordForm.tsx`
- `src/components/maintenance/MaintenanceScheduleForm.tsx`

**Acceptance Criteria**:
- ✅ Maintenance can be created successfully
- ✅ No 500 errors
- ✅ Clear validation messages
- ✅ Data persists correctly

---

### T304: Fix Kit Not Found Error
**Priority**: P0 - Blocking feature

**Issue**: Clicking on kit or creating kit shows "kit not found"

**Symptoms**:
- Kit detail page shows error
- New kit creation fails
- Two "New Kit" buttons visible

**Investigation**:
- Check route parameters
- Verify kit ID generation
- Check data storage/retrieval
- Review kit hooks

**Implementation**:
- Fix kit detail route handling
- Fix kit creation flow
- Remove duplicate "New Kit" button
- Improve error handling

**Files to Modify**:
- `src/pages/KitDetailPage.tsx`
- `src/pages/KitsPage.tsx`
- `src/hooks/useKit.ts`
- `src/hooks/useCreateKit.ts`

**Acceptance Criteria**:
- ✅ Kit detail page loads correctly
- ✅ Kit creation works
- ✅ Only one "New Kit" button
- ✅ Proper error messages

---

### T305: Fix Report Navigation Issue
**Priority**: P0 - Reports unusable

**Issue**: Clicking on a report redirects to dashboard

**Expected**: Should show the selected report

**Implementation**:
- Fix routing in ReportsPage
- Ensure report components render
- Add proper loading states
- Test all 4 report types

**Files to Modify**:
- `src/pages/ReportsPage.tsx`
- `src/components/reports/ReportList.tsx`

**Acceptance Criteria**:
- ✅ All reports open correctly
- ✅ No unexpected navigation
- ✅ Reports display data
- ✅ Back button returns to report list

---

## High Priority Issues (P1)

### T306: English Language for All Booking Features
**Priority**: P1

**Issue**: Booking features currently in German

**Scope**:
- All booking form labels
- Status labels (Approved, Pending, Declined, etc.)
- Error messages
- Date/time pickers
- Validation messages

**Implementation**:
- Review all booking components
- Replace German text with English
- Use i18n keys if internationalization planned
- Update status enums

**Files to Modify**:
- `src/components/bookings/*.tsx` (all files)
- `src/types/entities.ts` (BookingStatus enum)
- `src/utils/formatters.ts`

**Acceptance Criteria**:
- ✅ All booking UI in English
- ✅ All status labels in English
- ✅ Consistent terminology throughout

---

### T307: Enable Booking for Other People
**Priority**: P1

**Feature**: Allow booking asset on behalf of another person

**Requirements**:
1. "Booking for" person selector (uses T301 PersonSearch)
2. "Booked by" auto-filled with current user
3. Both fields clearly labeled
4. Distinguish between booker and user in history

**UI Design**:
```
Booking Details:
┌────────────────────────────────┐
│ Booking For: [Person Picker]  │  ← New field
│ Booked By: John Doe (you)     │  ← Auto-filled, read-only
│ Asset: [Asset Picker]          │
│ Start: [Date Time]             │
│ End: [Date Time]               │
└────────────────────────────────┘
```

**Implementation**:
- Update Booking type to include both fields
- Update BookingForm component
- Update booking history display
- Update booking list to show both people

**Files to Modify**:
- `src/types/entities.ts`
- `src/components/bookings/BookingForm.tsx`
- `src/components/bookings/BookingDetail.tsx`
- `src/components/bookings/BookingList.tsx`

**Acceptance Criteria**:
- ✅ Can select different person for booking
- ✅ Clear distinction between booker and user
- ✅ History shows both people
- ✅ Filters work for both fields

---

### T308: Fix Asset Reselection After Book Action
**Priority**: P1

**Issue**: After booking from asset detail, must reselect asset in booking form

**Expected Flow**:
1. User clicks "Book" on Asset Detail page
2. Booking form opens with asset pre-selected
3. User fills dates and submits

**Current Flow**:
1. User clicks "Book" on Asset Detail page
2. Booking form opens with empty asset field
3. User must search and reselect asset

**Implementation**:
- Pass asset ID to BookAssetModal
- Pre-populate asset field
- Lock asset field (non-editable)
- Show asset details above form

**Files to Modify**:
- `src/components/bookings/BookAssetModal.tsx`
- `src/components/assets/AssetDetail.tsx`

**Acceptance Criteria**:
- ✅ Asset pre-selected in booking form
- ✅ Asset field locked/disabled
- ✅ Asset details clearly visible
- ✅ User can complete booking quickly

---

### T309: Add Bookable Field to Assets
**Priority**: P1

**Feature**: Control which assets can be booked

**Requirements**:
1. Add `bookable: boolean` field to Asset type
2. Checkbox in AssetForm "Allow this asset to be booked"
3. Default: true for new assets
4. Hide "Book" button for non-bookable assets
5. Filter assets by bookable status in booking form

**UI Changes**:
```
Asset Form:
┌────────────────────────────────┐
│ Basic Information              │
│ ✓ Allow this asset to be      │  ← New
│   booked by users              │
└────────────────────────────────┘

Asset Detail:
[Edit] [Book]  ← Hide Book if not bookable
```

**Implementation**:
- Add field to Asset type
- Update AssetForm with checkbox
- Update AssetDetail to hide button
- Filter booking asset picker
- Add visual indicator (badge) on asset list

**Files to Modify**:
- `src/types/entities.ts`
- `src/components/assets/AssetForm.tsx`
- `src/components/assets/AssetDetail.tsx`
- `src/components/assets/AssetList.tsx`
- `src/components/bookings/BookingForm.tsx`

**Acceptance Criteria**:
- ✅ Can mark assets as bookable/non-bookable
- ✅ Non-bookable assets can't be booked
- ✅ Clear visual indicators
- ✅ Filter works in booking form

---

### T310: Filter Available Assets Only in Booking Form
**Priority**: P1

**Issue**: Can select unavailable assets when creating booking

**Requirements**:
1. Only show available assets in picker
2. Check availability for selected date range
3. Show unavailable with reason (booked, maintenance, broken)
4. Warn if asset becomes unavailable while form open

**Implementation**:
- Add availability check to asset picker
- Filter by status and existing bookings
- Add date range to availability check
- Real-time validation

**Files to Modify**:
- `src/components/bookings/BookingForm.tsx`
- `src/hooks/useAssetAvailability.ts` (new)
- `src/components/assets/AssetAvailabilityIndicator.tsx`

**Acceptance Criteria**:
- ✅ Only available assets shown
- ✅ Availability checked for date range
- ✅ Clear indicators of availability
- ✅ Real-time validation

---

### T311: Fix Date Picker Behavior in Bookings
**Priority**: P1

**Issue**: Second date selection doesn't change; unclear reset behavior

**Expected Behavior**:
1. Click first date → Start date set, waiting for end date
2. Click second date → End date set, complete
3. Click any date again → Reset both, new start date

**Visual Feedback**:
```
State 1: No dates selected
[Calendar with no highlights]

State 2: Start date selected
[Calendar with start date highlighted, end date waiting]
"Select end date"

State 3: Both dates selected
[Calendar with range highlighted]
[✓] Oct 15 - Oct 20

State 4: Click again → Reset
[Calendar reset to State 1]
```

**Implementation**:
- Fix DateRangePicker state management
- Add clear visual states
- Add helper text
- Test edge cases (same day, past dates)

**Files to Modify**:
- `src/components/bookings/BookingForm.tsx`
- Consider custom DateRangePicker component

**Acceptance Criteria**:
- ✅ Intuitive date selection
- ✅ Clear visual feedback for each state
- ✅ Easy to reset selection
- ✅ Works for all scenarios

---

### T312: Add Single Date & Time Booking
**Priority**: P1

**Feature**: Book assets for single date with specific times

**Requirements**:
1. Toggle: "Single Day" vs "Date Range"
2. If single day: Show date + start time + end time
3. If date range: Show start date + end date (times optional)
4. Validate time ranges
5. Handle overnight bookings

**UI Design**:
```
Booking Type:
○ Date Range    ● Single Day

Single Day View:
Date: [Oct 22, 2025]
Start Time: [09:00]
End Time: [17:00]

Date Range View:
Start Date: [Oct 22, 2025] at [09:00] (optional)
End Date: [Oct 25, 2025] at [17:00] (optional)
```

**Implementation**:
- Update Booking type with time fields
- Update BookingForm with toggle
- Add time pickers
- Update availability checking
- Update calendar view

**Files to Modify**:
- `src/types/entities.ts`
- `src/components/bookings/BookingForm.tsx`
- `src/components/bookings/BookingCalendar.tsx`
- `src/hooks/useAssetAvailability.ts`

**Acceptance Criteria**:
- ✅ Can book for single day with times
- ✅ Can book for date range with/without times
- ✅ Validation works correctly
- ✅ Calendar displays times

---

### T313: Fix "Cancelled" vs "Declined" Status
**Priority**: P1

**Issue**: Declining booking shows status as "Cancelled" instead of "Declined"

**Booking Status Flow**:
```
Requested → Pending → Approved → Active → Completed
            ↓          ↓
          Declined   Cancelled
```

**Definitions**:
- **Declined**: Rejected by approver
- **Cancelled**: Cancelled by requester

**Implementation**:
- Use correct status when declining
- Update UI labels
- Update formatters
- Add icons for each status

**Files to Modify**:
- `src/components/bookings/ApprovalButtons.tsx`
- `src/utils/formatters.ts`
- `src/components/bookings/BookingStatusBadge.tsx`

**Acceptance Criteria**:
- ✅ Declined bookings show "Declined"
- ✅ Cancelled bookings show "Cancelled"
- ✅ Clear visual distinction
- ✅ Correct icons for each

---

## Medium Priority (P2)

### T314: Fix Stock Take Report Key Warning
**Priority**: P2

**Issue**: React key warning in StockTakeReport

**Error**:
```
Warning: Each child in a list should have a unique "key" prop.
Check the render method of `qr`.
```

**Investigation**:
- Locate component rendering list without keys
- Likely in DataTable rows

**Implementation**:
- Add unique keys to list items
- Use asset ID or scan ID as key
- Test all stock take scenarios

**Files to Modify**:
- `src/components/stocktake/StockTakeReport.tsx`

**Acceptance Criteria**:
- ✅ No console warnings
- ✅ Proper React keys
- ✅ Report renders correctly

---

### T315: Rename Stock Take Note to Name/Reason
**Priority**: P2

**Feature**: More meaningful stock take identification

**Change**:
- Current: "Note" field (multi-line)
- New: "Name/Reason" field (single line, required)
- Examples: "Q4 2025 Audit", "Office Move Inventory Update", "Annual Check"

**Implementation**:
- Update StockTakeSession type
- Update form label
- Change to TextInput (from Textarea)
- Make required field
- Update displays

**Files to Modify**:
- `src/types/entities.ts`
- `src/components/stocktake/StartStockTakeForm.tsx`
- `src/components/stocktake/StockTakeSessionList.tsx`

**Acceptance Criteria**:
- ✅ Clear "Name/Reason" label
- ✅ Single line input
- ✅ Required field
- ✅ Better stock take organization

---

### T316: Add Person Avatars Throughout App
**Priority**: P2

**Feature**: Display person avatars consistently

**Locations**:
1. Person search results
2. Person picker dropdown
3. Custom field person values
4. History entries (who made change)
5. Booking lists (booked by/for)
6. Maintenance records (performed by)
7. Asset detail (created by, modified by)

**Requirements**:
- Fetch avatar from ChurchTools API
- Cache avatars (localStorage or memory)
- Fallback to initials if no avatar
- Consistent size and styling
- Lazy loading

**Implementation**:
- Create PersonAvatar component
- Implement caching strategy
- Add to all person displays
- Consider lazy loading

**Files to Create**:
- `src/components/common/PersonAvatar.tsx`
- `src/hooks/usePersonAvatar.ts`
- `src/services/person/PersonAvatarCache.ts`

**Files to Modify**:
- All components displaying person data

**Acceptance Criteria**:
- ✅ Avatars show throughout app
- ✅ Cached for performance
- ✅ Consistent styling
- ✅ Fallback for missing avatars

---

### T317: Remove Asset Numbering Settings Tab
**Priority**: P2

**Issue**: Asset Numbering tab is obsolete with Asset Prefixes

**Action**:
- Remove "Asset Numbering" tab from Settings
- Keep only "Asset Prefixes" tab
- Update documentation

**Files to Modify**:
- `src/pages/SettingsPage.tsx`
- Remove `src/components/settings/AssetPrefixSettings.tsx`

**Acceptance Criteria**:
- ✅ Only one prefixes tab
- ✅ No duplicate functionality
- ✅ Clean settings UI

---

### T318: Scanner Dropdown in Quick Scan
**Priority**: P2

**Feature**: Select preferred scanner in quick scan view

**Requirements**:
1. Dropdown at top of quick scan modal
2. Shows all configured scanners
3. Display scanner icon/image
4. Save preferred scanner to localStorage
5. Auto-select last used scanner

**UI Design**:
```
┌──────────────────────────────┐
│ Scanner: [Zebra DS4308 ▼]   │  ← New dropdown
│          [Icon]              │
│                              │
│ Scan or enter:               │
│ [________________]           │
└──────────────────────────────┘
```

**Implementation**:
- Add dropdown to QuickScanModal
- Load scanner configs
- Display scanner icons
- Save preference
- Apply scanner settings

**Files to Modify**:
- `src/components/scanner/QuickScanModal.tsx`
- `src/hooks/useScannerPreference.ts` (new)

**Acceptance Criteria**:
- ✅ Can select scanner
- ✅ Shows scanner icons
- ✅ Preference persists
- ✅ Settings applied correctly

---

### T319: Implement Actual Calendar in Calendar View
**Priority**: P2

**Issue**: Calendar view doesn't show actual calendar

**Expected**: Full calendar with bookings displayed on dates

**Libraries**: Consider using `@fullcalendar/react` or `react-big-calendar`

**Features**:
- Month, week, day views
- Show bookings on dates
- Click date to create booking
- Click booking to view details
- Color code by status

**Implementation**:
- Replace AssetCalendarView implementation
- Integrate calendar library
- Connect to booking data
- Add interactions

**Files to Modify**:
- `src/components/assets/AssetCalendarView.tsx`
- `package.json` (add calendar library)

**Acceptance Criteria**:
- ✅ Shows actual calendar
- ✅ Bookings displayed on dates
- ✅ Interactive (click to create/view)
- ✅ Multiple view modes

---

### T320: Remove Keyboard Shortcuts Page
**Priority**: P2

**Action**: Remove unnecessary keyboard shortcuts modal

**Keep**: Quick Scan shortcut (Alt+S / Cmd+S)

**Remove**:
- Keyboard Shortcuts modal/page
- Keyboard Shortcuts nav link
- KeyboardShortcutsModal component

**Files to Modify**:
- `src/components/layout/Navigation.tsx`
- Delete `src/components/common/KeyboardShortcutsModal.tsx`

**Acceptance Criteria**:
- ✅ Modal removed
- ✅ Nav link removed
- ✅ Quick Scan still works

---

### T321: Make Table Rows Clickable
**Priority**: P2

**Feature**: Click row to open default action

**Tables to Update**:
- Asset list → View asset detail
- Booking list → View booking detail
- Kit list → View kit detail
- Category list → Edit category
- Maintenance list → View maintenance
- Report list → Open report

**Implementation**:
- Add onClick handler to DataTable rows
- Add hover effect
- Add cursor: pointer
- Keep action buttons functional
- Stop propagation on button clicks

**Files to Modify**:
- All list components with DataTable

**Acceptance Criteria**:
- ✅ Rows clickable throughout app
- ✅ Hover effect indicates clickability
- ✅ Action buttons still work
- ✅ Consistent behavior

---

### T322: Add/Improve General Settings
**Priority**: P2

**Issue**: General Settings tab is empty

**Options**:
1. Add useful settings (date format, language, etc.)
2. Remove tab if no settings planned

**Recommended Settings**:
- Date format preference
- Time format (12h/24h)
- Language preference (if i18n planned)
- Notification preferences
- Default view modes

**Alternative**: Remove tab entirely

**Decision**: User to decide

---

### T323: Manufacturer & Model Dropdown with Search
**Priority**: P2

**Feature**: Smart dropdowns like Location field

**Requirements**:
1. Search existing manufacturers/models
2. Create new if not found
3. Clear "Create new" option
4. Autocomplete suggestions

**UI Flow**:
```
Type "Sony" → Shows existing matches
              [Sony]
              [Sony Electronics]
              ---
              + Create "Sony"

Type "XYZ123" → No matches
              + Create "XYZ123" as new manufacturer
```

**Implementation**:
- Create Select component with search
- Load existing values
- Allow creation
- Apply to both fields

**Files to Modify**:
- `src/components/assets/AssetForm.tsx`
- Create `src/components/common/CreatableSelect.tsx`

**Acceptance Criteria**:
- ✅ Search existing values
- ✅ Create new clearly indicated
- ✅ Autocomplete works
- ✅ Data persists

---

## Advanced Features (P3)

### T324: Auto-Generate Asset Names from Fields
**Priority**: P3

**Feature**: Template-based asset name generation

**Requirements**:
1. Define template in category settings
2. Use variables: %Manufacturer%, %Model%, %CustomField%
3. Auto-update when fields change
4. Option to lock name (manual override)

**UI Design**:
```
Category Settings:
┌────────────────────────────────────┐
│ Name Template:                     │
│ [%Manufacturer% %Model%]           │
│                                    │
│ Example Result:                    │
│ "Sony A7III"                       │
│                                    │
│ Available Variables:               │
│ %Manufacturer%, %Model%,           │
│ %SerialNumber%, %CustomFieldName%  │
└────────────────────────────────────┘

Asset Form:
┌────────────────────────────────────┐
│ Name: Sony A7III  🔒             │
│       ↑ Auto-generated from template
│       Click 🔒 to manually override │
└────────────────────────────────────┘
```

**Implementation**:
- Add template field to AssetCategory
- Parse template and extract variables
- Generate name on field changes
- Lock mechanism for manual names

**Files to Modify**:
- `src/types/entities.ts`
- `src/components/categories/AssetCategoryForm.tsx`
- `src/components/assets/AssetForm.tsx`
- Create `src/utils/assetNameGenerator.ts`

**Acceptance Criteria**:
- ✅ Template can be defined
- ✅ Names auto-generated
- ✅ Names update when fields change
- ✅ Can manually override

---

### T325: Remove VITE_MODULE_ID Warning
**Priority**: P3

**Issue**: Console warning about VITE_MODULE_ID

**Message**:
```
[Config] VITE_MODULE_ID not set - will fetch from API using VITE_KEY.
Set VITE_MODULE_ID in .env for faster startup.
```

**Action**:
- Remove warning from code
- Remove from .env-example
- Module ID is cached and installation-specific

**Files to Modify**:
- `src/utils/envValidation.ts`
- `.env-example`

**Acceptance Criteria**:
- ✅ No console warning
- ✅ Clean .env-example
- ✅ Still functions correctly

---

### T326: Implement MDI Icons Library
**Priority**: P3

**Feature**: Use Material Design Icons throughout

**Current**: Using Tabler Icons

**Requirements**:
1. Replace icon picker with MDI icons
2. Update all icon selections
3. Maintain backward compatibility
4. Consider migration strategy

**Library**: `@mdi/js` + `@mdi/react`

**Implementation**:
- Install MDI React
- Update IconPicker component
- Migrate existing icons
- Update icon display

**Files to Modify**:
- `src/components/categories/IconPicker.tsx`
- `src/components/categories/IconDisplay.tsx`
- Update all icon references

**Acceptance Criteria**:
- ✅ MDI icons available
- ✅ Icon picker uses MDI
- ✅ Existing icons migrated
- ✅ Consistent icon system

---

### T327: Add Image Upload for Assets
**Priority**: P3

**Feature**: Upload and display asset images

**Requirements**:
1. Upload multiple images per asset
2. Set main/featured image
3. Gallery view shows main image
4. Detail view shows all images
5. Image optimization/compression
6. ChurchTools file storage

**UI Design**:
```
Asset Form:
┌────────────────────────────────┐
│ Images:                        │
│ [Upload Images]                │
│                                │
│ ┌────┐ ┌────┐ ┌────┐          │
│ │IMG1│ │IMG2│ │IMG3│          │
│ │⭐  │ │    │ │    │          │
│ └────┘ └────┘ └────┘          │
│  Main   [Set] [Delete]         │
└────────────────────────────────┘

Gallery View:
┌────┐ ┌────┐ ┌────┐
│IMG │ │IMG │ │📦 │
│    │ │    │ │   │
└────┘ └────┘ └────┘
```

**Implementation**:
- Integrate ChurchTools file API
- Add image upload component
- Add image gallery component
- Update AssetForm
- Update gallery view

**Files to Modify**:
- `src/types/entities.ts`
- `src/components/assets/AssetForm.tsx`
- `src/components/assets/AssetGalleryView.tsx`
- `src/components/assets/AssetDetail.tsx`
- Create `src/components/common/ImageUpload.tsx`
- Create `src/hooks/useFileUpload.ts`

**Acceptance Criteria**:
- ✅ Can upload images
- ✅ Set main image
- ✅ Gallery view shows images
- ✅ Images optimized
- ✅ Stored in ChurchTools

---

### T328: Collapsible Sub-Assets
**Priority**: P3

**Feature**: Collapse/expand child assets in asset view

**UI Design**:
```
Parent Asset: Projector Kit
┌────────────────────────────────┐
│ ▼ Child Assets (5)             │  ← Clickable to collapse
│   ├─ Projector                 │
│   ├─ HDMI Cable                │
│   ├─ Remote Control            │
│   ├─ Carrying Case             │
│   └─ Power Cable               │
└────────────────────────────────┘

Collapsed:
┌────────────────────────────────┐
│ ▶ Child Assets (5)             │  ← Click to expand
└────────────────────────────────┘
```

**Implementation**:
- Add collapse/expand state
- Save preference (localStorage)
- Add expand/collapse all button
- Nested view for sub-children

**Files to Modify**:
- `src/components/assets/ChildAssetsList.tsx`
- `src/components/assets/AssetDetail.tsx`

**Acceptance Criteria**:
- ✅ Can collapse/expand
- ✅ Preference persists
- ✅ Visual indicators clear
- ✅ Works with nested children

---

### T329: Implement Data Schema Versioning
**Priority**: P3

**Feature**: Version control for data schemas

**Requirements**:
1. Each data object has schema version
2. Migration system for schema changes
3. Backward compatibility
4. Easy to add migrations

**Schema Version Field**:
```typescript
interface VersionedData {
  schemaVersion: string; // "1.0.0"
  data: any;
}
```

**Migration System**:
```typescript
const migrations = {
  "1.0.0": (data) => data, // Initial
  "1.1.0": (data) => { /* Add new fields */ },
  "2.0.0": (data) => { /* Breaking changes */ }
};
```

**Implementation**:
- Add schemaVersion to all data types
- Create migration registry
- Run migrations on data load
- Version checking on save

**Files to Create**:
- `src/services/storage/migrations/index.ts`
- `src/services/storage/migrations/v1.0.0-to-v1.1.0.ts`
- `src/services/storage/SchemaVersioning.ts`

**Files to Modify**:
- `src/types/entities.ts` (add version to all types)
- `src/services/storage/ChurchToolsProvider.ts`

**Acceptance Criteria**:
- ✅ All data has version
- ✅ Migrations run automatically
- ✅ Easy to add new migrations
- ✅ Backward compatible

---

### T330: Master Data Management for Models & Manufacturers
**Priority**: P3

**Feature**: Dedicated management pages like Locations

**Pages Needed**:
1. Manufacturers page (Settings → Manufacturers)
2. Models page (Settings → Models)

**Features**:
- CRUD operations
- Search and filter
- Usage count (how many assets)
- Bulk operations
- Import/export

**UI Design**:
```
Settings → Manufacturers:
┌────────────────────────────────────┐
│ [Search] [+ New Manufacturer]      │
├────────────────────────────────────┤
│ Name          | Assets | Actions   │
├────────────────────────────────────┤
│ Sony          | 15     | [Edit][Del]│
│ Canon         | 8      | [Edit][Del]│
│ Nikon         | 12     | [Edit][Del]│
└────────────────────────────────────┘

Settings → Models:
┌────────────────────────────────────┐
│ [Search] [+ New Model]             │
├────────────────────────────────────┤
│ Name    | Manufacturer| Assets | … │
├────────────────────────────────────┤
│ A7III   | Sony       | 3      | …  │
│ EOS R5  | Canon      | 2      | …  │
└────────────────────────────────────┘
```

**Implementation**:
- Create separate data categories for each
- Create management components
- Add to Settings tabs
- Link to asset creation

**Files to Create**:
- `src/pages/ManufacturersPage.tsx`
- `src/pages/ModelsPage.tsx`
- `src/components/settings/ManufacturerList.tsx`
- `src/components/settings/ManufacturerForm.tsx`
- `src/components/settings/ModelList.tsx`
- `src/components/settings/ModelForm.tsx`

**Files to Modify**:
- `src/pages/SettingsPage.tsx`
- `src/App.tsx` (add routes)

**Acceptance Criteria**:
- ✅ Can manage manufacturers
- ✅ Can manage models
- ✅ Shows usage count
- ✅ Linked to asset form

---

## Bundle Size Optimization

### T331: Update Bundle Size Warning
**Priority**: P3

**Current**: Warning at 200KB
**ChurchTools Limit**: 20MB

**Action**:
- Update Vite config
- Set warning to reasonable level (5MB?)
- Document actual limits
- Monitor bundle size

**Files to Modify**:
- `vite.config.ts`

**Acceptance Criteria**:
- ✅ No false warnings
- ✅ Actual limit documented
- ✅ Monitoring in place

---

## Documentation Cleanup

### T332: Consolidate Project Documentation
**Priority**: P2

**Issue**: Too many scattered markdown files

**Files to Consolidate**:
```
Current scattered files:
- PHASE*_*.md (multiple)
- IMPLEMENTATION_*.md (multiple)
- UI-*.md (multiple)
- T*_*.md (multiple)
- EDGE_CASES_*.md
- etc.

Target structure:
specs/
  001-inventory-management/
    CONSTITUTION.md      ← Core principles
    SPECIFICATIONS.md    ← What to build
    IMPLEMENTATION.md    ← How it's built
    TASKS.md            ← Detailed task list
    CHANGELOG.md        ← Version history
```

**Process**:
1. Read all existing .md files
2. Extract unique information
3. Consolidate into target structure
4. Remove duplicates
5. Delete old files
6. Update references

**Consolidation Map**:
- All PHASE files → CHANGELOG.md
- All IMPLEMENTATION files → IMPLEMENTATION.md
- All UI files → SPECIFICATIONS.md + IMPLEMENTATION.md
- All task files → TASKS.md
- Keep only: README.md, docs/, specs/

**Files to Keep**:
- `README.md` (project root)
- `docs/` (technical documentation)
- `specs/` (specifications)
- `.github/` (GitHub specific)

**Files to Remove** (after consolidation):
- All PHASE*.md
- All IMPLEMENTATION*.md
- All UI-*.md (except move to docs/)
- All T*_*.md
- All PROGRESS*.md
- All *_SUMMARY.md

**Acceptance Criteria**:
- ✅ Clean root directory
- ✅ All info preserved in specs/
- ✅ No duplicate information
- ✅ Easy to navigate

---

## Testing Requirements

For each task, ensure:
1. Unit tests for new functionality
2. Integration tests for API interactions
3. E2E tests for critical user flows
4. Manual testing checklist

**Critical Flows to Test**:
- Create booking for another person
- Search for person using ChurchTools API
- Create asset with prefix
- Upload asset image
- Create maintenance schedule
- Complete stock take
- View all reports
- Navigate all routes (refresh test)

---

## Success Metrics

- ✅ Zero console errors
- ✅ All routes work with refresh
- ✅ All features accessible from UI
- ✅ English language throughout
- ✅ All bugs fixed
- ✅ Documentation consolidated
- ✅ Test coverage >80%

---

## Timeline Estimate

**P0 Tasks (Week 1)**: T300-T305 (Critical bugs)
**P1 Tasks (Week 2-3)**: T306-T313 (High priority features)
**P2 Tasks (Week 4)**: T314-T323 (Medium priority)
**P3 Tasks (Week 5-6)**: T324-T331 (Advanced features)
**Documentation (Week 6)**: T332 (Cleanup)

**Total Estimate**: 6 weeks

---

**Phase Owner**: Development Team  
**Started**: October 22, 2025  
**Target Completion**: December 6, 2025
