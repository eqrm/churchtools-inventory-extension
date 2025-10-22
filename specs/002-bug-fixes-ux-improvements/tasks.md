# Tasks: Bug Fixes & UX Improvements

**Feature**: 002-bug-fixes-ux-improvements  
**Branch**: `002-bug-fixes-ux-improvements`  
**Input**: Des### Implementation for User Story 3

- [x] T047 [P] [US3] Update src/types/entities.ts Booking interface with bookedById and bookingForId fields (**Already done** in FR-010)
### Cl### Clickable Tables

- [x] T114 [P] Update all table row components to be clickable (add onClick handlers)
- [x] T115 [P] Add hover effect to clickable rows (cursor: pointer, background color change)
- [x] T116 Manual test: Click asset in table, verify opens asset detail page
- [x] T117 Manual test: Click booking in table, verify opens booking detail
- [x] T118 Manual test: Hover over row, verify visual feedback Tables

- [x] T114 [P] Update all table row components to be clickable (add onClick handlers)
- [x] T115 [P] Add hover effect to clickable rows (cursor: pointer, background color change)
- [x] T116 Manual test: Click asset in table, verify opens asset detail page
- [x] T117 Manual test: Click booking in table, verify opens booking detail
- [x] T118 Manual test: Hover over row, verify visual feedback048 [P] [US3] Update src/components/bookings/BookingForm.tsx to add second PersonPicker for "Booking For" field (**Already done** in Phase 4)
- [x] T049 [US3] Add permission check using IPermissionService (currently always allowed, per clarification Q2)
- [x] T050 [US3] Show both "Booked By" (current user) and "Booking For" (selected person) in form with avatars
- [x] T051 [US3] Update booking creation API call to include both person IDs (**Already done**)
- [x] T052 [US3] Update booking list/history views to display both booker and recipient
- [x] T053 [US3] Manual test: Create booking for another person, verify both IDs saved
- [x] T054 [US3] Manual test: View booking history, verify both people displayed distinctly
- [x] T055 [US3] Manual test: Filter bookings by booker (should work)
- [x] T056 [US3] Manual test: Filter bookings by recipient (should work)ents from `/specs/002-bug-fixes-ux-improvements/`  
**Prerequisites**: ✅ plan.md, spec.md, research.md, data-model.md, contracts/ (all complete)

**Tests**: This feature uses manual testing for all user stories + automated tests for critical paths (booking conflicts, offline sync). Test tasks marked where applicable.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1-US10) - only for user story phases
- File paths use absolute paths from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new libraries and update project configuration

- [x] T001 Install @fullcalendar/react dependencies: `npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid` (~45KB)
- [x] T002 Install Material Design Icons: `npm install @mdi/js @mdi/react` (~5KB per 50 icons)
- [x] T003 [P] Install Dexie.js for offline storage: `npm install dexie` (~15KB)
- [x] T004 [P] Install browser-image-compression: `npm install browser-image-compression` (~15KB)
- [x] T005 Verify bundle size after installations (should be ~83KB additional, well within 5MB budget)
- [x] T006 Update vite.config.ts to set `base: '/ccm/fkoinventorymanagement/'` for route refresh fix
- [x] T007 Update vite.config.ts to change bundle size warning threshold from 200KB to 5MB (T331)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions & Interfaces

- [x] T008 [P] Create src/types/entities.ts with updated Booking interface (bookedById, bookingForId, bookingMode fields from data-model.md)
- [x] T009 [P] Update src/types/entities.ts with Asset interface (bookable field, photos array from data-model.md)
- [x] T010 [P] Create src/types/sync.ts with SyncStatus enum and SyncConflict interface from data-model.md
- [x] T011 [P] Create src/types/photo.ts with PhotoMetadata and CompressionOptions interfaces from contracts/photo-storage.ts

### Service Abstractions

- [x] T012 [P] Create src/services/storage/IPhotoStorage.ts interface from contracts/photo-storage.ts
- [x] T013 [P] Create src/services/permissions/IPermissionService.ts interface from data-model.md
- [x] T014 [P] Implement src/services/permissions/SimplePermissionService.ts (all methods return true, per clarification Q2)

### Base Path Configuration (Critical)

**Note**: Base path = `/ccm/fkoinventorymanagement/` (Vite calls it `base`, React Router calls it `basename`)

- [x] T015 Update src/App.tsx to add `basename={import.meta.env.BASE_URL}` to BrowserRouter for route refresh fix
- [x] T016 Test route refresh on all pages: Dashboard, Assets, Kits, Bookings, Reports, Settings (all should work without errors)
- [x] T017 Test browser back/forward navigation (should work correctly)
- [x] T018 Test deep links from external sources (should load correct page)

### Offline Storage Setup

- [x] T019 Create src/utils/offline-db.ts with Dexie database schema (stockTakeSessions, stockTakeScans, syncConflicts, personCache tables from data-model.md)
- [x] T020 Test IndexedDB initialization (database should be created successfully in browser DevTools)

**Constitution Compliance Gates**:
- [ ] ✅ TypeScript strict mode enabled in tsconfig.json (already enabled)
- [ ] ✅ ESLint configuration passing (run `npm run lint`)
- [ ] ✅ .env.example documented (already exists)
- [ ] ✅ Bundle size measured: Current + 83KB = within 5MB budget

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Navigation and Page Refresh (Priority: P0) 🎯 CRITICAL

**Goal**: Fix critical routing bug preventing page refresh on all routes

**Independent Test**: Navigate to any page, refresh browser, verify page loads without errors. Test browser back/forward buttons.

**Why First**: HIGHEST IMPACT - blocks all users from basic application usage

### Implementation for User Story 1

- [x] T021 [US1] Verify vite.config.ts has `base: '/ccm/fkoinventorymanagement/'` (completed in T006)
- [x] T022 [US1] Verify src/App.tsx has `basename={import.meta.env.BASE_URL}` (completed in T015)
- [x] T023 [US1] Manual test: Refresh on dashboard page (should work)
- [x] T024 [US1] Manual test: Refresh on assets list page (should work)
- [x] T025 [US1] Manual test: Refresh on kit detail page (should work)
- [x] T026 [US1] Manual test: Refresh on bookings page (should work)
- [x] T027 [US1] Manual test: Refresh on reports page (should work)
- [x] T028 [US1] Manual test: Refresh on settings page (should work)
- [x] T029 [US1] Manual test: Browser back button after navigation (should work)
- [x] T030 [US1] Manual test: Browser forward button (should work)
- [x] T031 [US1] Manual test: Deep link from external source (should load correct page)

**Success Criteria**: ✅ 100% of routes work with browser refresh (SC-001)

**Checkpoint**: User Story 1 complete - core navigation fully functional

---

## Phase 4: User Story 2 - Person Search for Bookings (Priority: P0) 🎯 CRITICAL

**Goal**: Implement real ChurchTools person search in booking forms (replaces fake data)

**Independent Test**: Open booking form, search for person by name, select from results. Person avatar should display.

**Why Now**: Critical for booking system to work properly with real data

### Implementation for User Story 2

- [x] T032 [P] [US2] Create src/services/person/PersonSearchService.ts implementing contract from contracts/person-search.ts
- [x] T033 [P] [US2] Implement ChurchTools API integration: `GET /api/search?query={query}&domain_types[]=person` (**Fixed**: Corrected `/api/search` → `/search` to prevent duplicate /api prefix, Oct 22)
- [x] T034 [P] [US2] Add 300ms debounce to search requests (use useDebounce or lodash.debounce)
- [x] T035 [P] [US2] Implement in-memory cache (Map<string, CachedPerson>) with 5-minute TTL
- [x] T036 [P] [US2] Implement localStorage cache with 24-hour TTL for person details
- [x] T037 [P] [US2] Transform ChurchToolsPersonRaw → PersonSearchResult (extract firstName/lastName from title field)
- [x] T038 [P] [US2] Create src/hooks/usePersonSearch.ts hook wrapping PersonSearchService
- [x] T039 [P] [US2] Create src/components/common/PersonPicker.tsx component with search input and dropdown (**Enhanced**: Integrated into CustomFieldInput for person-reference fields, Oct 22)
- [x] T040 [US2] Integrate PersonPicker into src/components/bookings/BookingForm.tsx (replace fake person dropdown)
- [x] T041 [US2] Add person avatar display using avatarUrl from search results
- [x] T042 [US2] Handle search errors (network failures, API errors) with user-friendly messages
- [x] T043 [US2] Manual test: Search for "John" in booking form, verify results appear in dropdown
- [x] T044 [US2] Manual test: Select person "Jane Smith", verify avatar and name displayed correctly
- [x] T045 [US2] Manual test: Type quickly, verify debouncing (should not trigger API call on every keystroke)
- [x] T046 [US2] Manual test: Search same person twice, verify second search uses cache (instant results)

**Success Criteria**: ✅ Person search completes in <3 seconds (SC-002)

**Checkpoint**: User Story 2 complete - real person search functional

---

## Phase 5: User Story 3 - Book Asset for Another Person (Priority: P1)

**Goal**: Allow users to create bookings on behalf of others with distinct "booked by" and "booking for" fields

**Independent Test**: Create booking where "booked by" and "booking for" are different people. Both should display in booking history.

### Implementation for User Story 3

- [x] T047 [P] [US3] Update src/types/entities.ts Booking interface with bookedById and bookingForId fields (**Already done** in FR-010)
- [x] T048 [P] [US3] Update src/components/bookings/BookingForm.tsx to add second PersonPicker for "Booking For" field (**Already done** in Phase 4)
- [x] T049 [US3] Add permission check using IPermissionService (currently always allowed, per clarification Q2)
- [x] T050 [US3] Show both "Booked By" (current user) and "Booking For" (selected person) in form with avatars
- [x] T051 [US3] Update booking creation API call to include both person IDs (**Already done**)
- [x] T052 [US3] Update booking list/history views to display both booker and recipient
- [x] T053 [US3] Manual test: Create booking for another person, verify both IDs saved
- [x] T054 [US3] Manual test: View booking history, verify both people displayed distinctly
- [x] T055 [US3] Manual test: Filter bookings by booker (should work)
- [x] T056 [US3] Manual test: Filter bookings by recipient (should work)

**Success Criteria**: ✅ Both booker and recipient visible in all views (SC-003)

**Checkpoint**: User Story 3 complete - booking on behalf of others works

---

## Phase 6: User Story 4 - Smart Date and Time Booking (Priority: P1)

**Goal**: Support flexible booking: single day with times OR date range with optional times

**Independent Test**: Toggle between single day and date range modes, set times, create bookings. Verify calendar displays correctly.

### Implementation for User Story 4

- [x] T057 [P] [US4] Add bookingMode field to Booking entity ('single-day' | 'date-range')
- [x] T058 [P] [US4] Add mode toggle switch to src/components/bookings/BookingForm.tsx
- [x] T059 [US4] Show single date picker + start/end time pickers when mode = 'single-day'
- [x] T060 [US4] Show start/end date pickers + optional time pickers when mode = 'date-range'
- [x] T061 [US4] Add validation: start time must be before end time (single-day mode)
- [x] T062 [US4] Add validation: start date must be before end date (date-range mode)
- [x] T063 [US4] Update booking creation to handle both modes
- [ ] T064 [US4] Update calendar view to display single-day bookings as time blocks (**Deferred**: Full calendar implementation pending, see T119-T127)
- [ ] T065 [US4] Update calendar view to display date-range bookings spanning all days (**Deferred**: Full calendar implementation pending, see T119-T127)
- [x] T066 [US4] Manual test: Create single-day booking with times (9am-5pm), verify shows correctly in calendar
- [x] T067 [US4] Manual test: Create date-range booking (3 days), verify spans all days in calendar
- [x] T068 [US4] Manual test: Try to set start time after end time, verify validation error
- [x] T069 [US4] Manual test: Create date-range with optional times, verify works

**Success Criteria**: ✅ Single-day booking completes in <60 seconds (SC-004)

**Checkpoint**: User Story 4 complete - flexible booking times work

---

## Phase 7: User Story 5 - Asset Availability Filtering (Priority: P1)

**Goal**: Show only available assets when creating bookings, prevent double-booking

**Independent Test**: Book an asset, try to book same asset for overlapping dates. Should not appear in available list.

### Implementation for User Story 5

- [x] T070 [P] [US5] Add bookable field to Asset entity (default: true)
- [x] T071 [P] [US5] Create src/services/booking/BookingConflictService.ts implementing contracts/booking-conflicts.ts
- [x] T072 [US5] Implement availability check: query bookings for asset in date range
- [x] T073 [US5] Implement conflict detection algorithm (overlap check from contract)
- [x] T074 [US5] Add last-write-wins validation at submission (per clarification Q1)
- [x] T075 [US5] Filter asset picker in BookingForm to show only bookable assets
- [x] T076 [US5] Filter asset picker to exclude assets booked for selected dates
- [x] T077 [US5] Show friendly error if conflict detected: "Asset already booked for these dates by [person]"
- [x] T078 [US5] Change Sort order, of booking creation view, so that date and time is selcted before the assets, to then show only avaible assets
- [ ] T079 [US5] Manual test: Book asset for Jan 15-17, try to book same asset Jan 16-18, verify conflict error
- [ ] T080 [US5] Manual test: Asset marked unbookable (bookable=false), verify excluded from booking form
- [ ] T081 [US5] Manual test: Asset in maintenance, verify marked unavailable with reason
- [ ] T082 [US5] Manual test: Two users try to book same asset simultaneously, second should fail with friendly error

**Success Criteria**: ✅ Conflicts prevented 100% of time (SC-005)

**Checkpoint**: User Story 5 complete - double-booking prevented

---

## Phase 8: API Error Fixes (Priority: P0) 🎯 CRITICAL

**Goal**: Fix 400/500 errors for asset prefixes and maintenance records

**Independent Test**: Create asset prefix, create maintenance record. Both should succeed without errors.

### Implementation

- [x] T083 [P] Update src/services/storage/ChurchToolsProvider.ts to fix asset prefix creation API call format (analyze T302 error details)
- [x] T084 [P] Update src/services/storage/ChurchToolsProvider.ts to fix maintenance record creation API call format (analyze T302 error details)
- [x] T085 Verify API request payloads match ChurchTools API spec exactly
- [x] T086 Add error handling with user-friendly messages for all API operations
- [x] T087 Manual test: Create new asset prefix, verify succeeds without 400 error
- [x] T088 Manual test: Create maintenance record, verify succeeds without 500 error
- [ ] T089 Manual test: Disconnect network, perform API operation, verify friendly error message shown

**Success Criteria**: ✅ Asset prefix creation 100% success rate (SC-006), ✅ Maintenance record creation 100% success rate (SC-007)

**Checkpoint**: API errors fixed - core operations reliable

---

## Phase 9: Kit and Report Navigation Fixes (Priority: P0) 🎯 CRITICAL

**Goal**: Fix kit detail page "not found" errors and report navigation

**Independent Test**: Click kit from list, should open detail page. Click report from list, should show report content.

### Implementation

- [x] T090 [P] Fix src/pages/KitDetailPage.tsx to handle kit ID parameter correctly (investigate T303/T304 root cause)
- [x] T091 [P] Fix src/pages/ReportsPage.tsx navigation logic to show report content instead of redirecting to dashboard
- [x] T092 Update kit creation flow to properly set kit IDs
- [x] T093 Remove duplicate "New Kit" button (keep only one in appropriate location)
- [x] T094 Manual test: Click kit from list, verify detail page loads successfully
- [x] T095 Manual test: Create new kit, verify no errors
- [x] T096 Manual test: Click report from list, verify report displays (not dashboard redirect)
- [x] T097 Manual test: Test all 4 report types (all should work)

**Success Criteria**: ✅ Kit detail pages load 100% of time (SC-008), ✅ Report navigation works 100% of time (SC-009)

**Checkpoint**: Kit and report navigation fully functional

---

## Phase 10: English Localization (Priority: P1)

**Goal**: Replace all German text with English in booking interface

**Independent Test**: Navigate through entire booking workflow, verify all text is in English.

### Implementation

- [x] T098 [P] Create src/i18n/bookingStrings.ts with English string constants
- [x] T099 [P] Search for German strings in src/components/bookings/ directory: `grep -r "Buchung\|Anfrage\|Genehmigt\|Abgelehnt" src/components/bookings/`
- [x] T100 Replace German strings with English constants: Booking, Request, Approved, Declined, Cancelled
- [x] T101 Update BookingStatusBadge component to use "Declined" (approver rejects) vs "Cancelled" (requester cancels) correctly
- [x] T102 Update all error messages to English
- [x] T103 Update all validation messages to English
- [x] T104 Manual test: Navigate booking interface, verify 0 German text remaining
- [x] T105 Manual test: Create booking request, verify "Requested" status in English
- [x] T106 Manual test: Approver rejects booking, verify "Declined" status (not "Cancelled")
- [x] T107 Manual test: Requester cancels own booking, verify "Cancelled" status

**Success Criteria**: ✅ All booking text in English (SC-010), ✅ "Declined" for approver rejection (SC-019), ✅ "Cancelled" only for self-cancellation (SC-019)

**Checkpoint**: English localization complete - consistent language

---

## Phase 11: UI/UX Improvements (Priority: P2)

**Goal**: Improve date pickers, fix React warnings, make tables clickable, add actual calendar

**Independent Test**: Use date picker to select dates, click table rows, view bookings in calendar.

### Date Picker Improvements

- [ ] T108 [P] Enhance date picker component with clear visual feedback for start/end/selection states
- [ ] T109 [P] Add reset button to date picker for easy date clearing
- [ ] T110 Manual test: Select date range, verify clear visual feedback
- [ ] T111 Manual test: Reset dates, verify clears successfully

### React Key Warnings

- [x] T112 Fix StockTakeReport component in src/components/stocktake/StockTakeReport.tsx to use unique stable keys (asset.id or session.id + asset.id) instead of array indices
- [x] T113 Manual test: Open stock take report, check browser console, verify 0 React key warnings

### Clickable Tables

- [x] T114 [P] Update all table row components to be clickable (add onClick handlers)
- [x] T115 [P] Add hover effect to clickable rows (cursor: pointer, background color change)
- [x] T116 Manual test: Click asset in table, verify opens asset detail page
- [x] T117 Manual test: Click booking in table, verify opens booking detail
- [x] T118 Manual test: Hover over row, verify visual feedback

### Calendar View

- [x] T119 Create src/components/bookings/BookingCalendar.tsx using @fullcalendar/react
- [x] T120 Configure calendar with ChurchTools theme colors
- [x] T121 Map booking statuses to event colors (Approved=green, Pending=yellow, Declined=red)
- [x] T122 Display bookings on calendar with date ranges
- [x] T123 Add click handler to calendar events (open booking detail)
- [x] T124 Replace placeholder calendar view with actual FullCalendar component
- [x] T125 Manual test: View calendar, verify bookings displayed on correct dates
- [x] T126 Manual test: Color coding works (green for approved, yellow for pending)
- [x] T127 Manual test: Click event, verify opens booking detail

**Success Criteria**: ✅ Date picker successful on first attempt 90% of time (SC-011), ✅ Zero console warnings (SC-012), ✅ Table rows respond to clicks (SC-016), ✅ Calendar displays actual calendar with bookings (SC-017)

**Checkpoint**: UI/UX improvements complete - better user experience

---

## Phase 12: Settings & Configuration (Priority: P2)

**Goal**: Clean up settings, add manufacturer/model dropdowns, fix stock take field name

**Independent Test**: Create asset with new manufacturer inline, view settings (only Asset Prefixes tab).

### Settings Cleanup

- [x] T128 [P] Remove "Asset Numbering" tab from src/pages/SettingsPage.tsx
- [x] T129 [P] Keep only "Asset Prefixes" tab in settings
- [ ] T130 Manual test: Open settings, verify only one tab visible

### Manufacturer/Model Dropdowns

- [x] T131 [P] Create src/components/common/CreatableSelect.tsx component (dropdown with search + create new option)
- [x] T132 [P] Replace manufacturer text input in src/components/assets/AssetForm.tsx with CreatableSelect
- [x] T133 [P] Replace model text input in AssetForm with CreatableSelect
- [x] T134 Allow inline creation of new manufacturers during asset creation
- [x] T135 Allow inline creation of new models during asset creation
- [ ] T136 Manual test: Create asset, start typing manufacturer name, verify dropdown appears
- [ ] T137 Manual test: Type new manufacturer not in list, verify can create inline
- [ ] T138 Manual test: Complete asset creation with new manufacturer/model in <2 minutes

### Scanner Preference

- [x] T139 [P] Add scanner dropdown to src/components/scanner/QuickScanModal.tsx
- [x] T140 [P] Create src/hooks/useScannerPreference.ts to persist selection in localStorage
- [ ] T141 Manual test: Select scanner, verify preference persists after reload

### Stock Take Field Rename

- [x] T142 Update src/components/stocktake/StartStockTakeForm.tsx to change "Note" field to "Name/Reason" (single line, required)
- [x] T143 Update StockTakeSession entity to rename field: note → nameReason
- [ ] T144 Manual test: Start stock take, verify "Name/Reason" field displayed

**Success Criteria**: ✅ Asset creation with new manufacturer/model in <2 minutes (SC-018)

**Checkpoint**: Settings and configuration improvements complete

---

## Phase 13: User Story 6 - Asset Images and Visual Identification (Priority: P3)

**Goal**: Support multiple photos per asset with compression

**Independent Test**: Upload photos to asset, set main image, verify gallery view displays correctly.

### Photo Storage Abstraction

- [ ] T145 [P] [US6] Implement src/services/storage/Base64PhotoStorage.ts (current implementation, converts File → base64 data URL)
- [ ] T146 [P] [US6] Create src/services/storage/ChurchToolsPhotoStorage.ts stub (future Files API implementation)
- [ ] T147 [P] [US6] Create src/services/storage/PhotoStorageFactory.ts to select implementation based on config

### Image Compression

- [ ] T148 [P] [US6] Create src/utils/imageCompression.ts wrapper around browser-image-compression library
- [ ] T149 [P] [US6] Implement two-tier compression: thumbnail (70% quality, 400px) + full-size (85% quality, 2048px) per clarification Q4
- [ ] T150 [US6] Generate both versions on upload, store both IDs in PhotoMetadata

### UI Components

- [ ] T151 [P] [US6] Create src/components/common/ImageUpload.tsx component with drag-and-drop support
- [ ] T152 [P] [US6] Add file validation (JPEG/PNG/WebP only, max 5MB per clarification Q4)
- [ ] T153 [P] [US6] Add progress indicator during compression and upload
- [ ] T154 [P] [US6] Create src/components/assets/AssetGalleryView.tsx to display thumbnails
- [ ] T155 [US6] Add "Set as Main" button to mark featured image
- [ ] T156 [US6] Update src/components/assets/AssetForm.tsx to include ImageUpload component
- [ ] T157 [US6] Update Asset entity to add photos array and mainPhotoIndex fields
- [ ] T158 [US6] Limit to 10 images maximum per asset

### Integration

- [ ] T159 [US6] Display main image in gallery view asset cards
- [ ] T160 [US6] Display all images in asset detail page with gallery
- [ ] T161 [US6] Add lightbox view for full-size images on click
- [ ] T162 [US6] Manual test: Upload 5MB image, verify compresses to ~20KB thumbnail + ~100KB full-size
- [ ] T163 [US6] Manual test: Upload multiple images, verify all display correctly
- [ ] T164 [US6] Manual test: Set main image, verify appears on asset card in gallery
- [ ] T165 [US6] Manual test: Try to upload 6MB image, verify validation error
- [ ] T166 [US6] Manual test: Try to upload 11th image, verify max limit enforced

**Success Criteria**: ✅ Visual asset identification in gallery (SC-013), ✅ Photos up to 5MB with validation (SC-027)

**Checkpoint**: User Story 6 complete - asset images functional

---

## Phase 14: User Story 7 - Data Schema Evolution (Priority: P3)

**Goal**: Support automatic schema migrations with rollback on failure

**Independent Test**: Simulate schema version change, verify migration runs automatically and rollback works on failure.

### Schema Versioning Infrastructure

- [ ] T167 [P] [US7] Create src/services/migrations/SchemaVersioning.ts service
- [ ] T168 [P] [US7] Add SchemaVersion entity to track applied migrations (version, appliedAt, status)
- [ ] T169 [P] [US7] Create src/services/migrations/MigrationRegistry.ts to register all migrations
- [ ] T170 [P] [US7] Add schemaVersion field to all entities (Booking, Asset, StockTakeSession, etc.)

### Migration System

- [ ] T171 [US7] Implement runMigrations() function to detect and run pending migrations
- [ ] T172 [US7] Implement automatic rollback on migration failure (per clarification Q5)
- [ ] T173 [US7] Add detailed error logging for failed migrations
- [ ] T174 [US7] Implement retry on next app load for failed migrations
- [ ] T175 [US7] Call runMigrations() on app initialization (in src/main.ts or App.tsx)

### Example Migration

- [ ] T176 [P] [US7] Create src/services/migrations/v1.0.0-to-v1.1.0.ts example migration (add bookable field to Asset)
- [ ] T177 [P] [US7] Implement up() migration function (adds bookable: true to all assets)
- [ ] T178 [P] [US7] Implement down() rollback function (removes bookable field)

### Testing

- [ ] T179 [US7] Manual test: Trigger migration, verify runs automatically and succeeds
- [ ] T180 [US7] Manual test: Simulate migration failure, verify automatic rollback preserves data
- [ ] T181 [US7] Manual test: After failed migration, reload app, verify retry attempts
- [ ] T182 [US7] Manual test: Verify existing data preserved after migration (no data loss)

**Success Criteria**: ✅ Automatic migration without data loss (SC-014)

**Checkpoint**: User Story 7 complete - schema evolution works safely

---

## Phase 15: User Story 8 - Photo Storage Migration Path (Priority: P3)

**Goal**: Support migrating from base64 to ChurchTools Files without breaking existing photos

**Independent Test**: Upload new photo with Files API, verify old base64 photos still display correctly.

### ChurchTools Files Implementation

- [ ] T183 [P] [US8] Complete src/services/storage/ChurchToolsPhotoStorage.ts implementation (upload to Files API)
- [ ] T184 [P] [US8] Implement file upload: POST /api/files with FormData
- [ ] T185 [P] [US8] Implement file retrieval: GET /api/files/{id}/content
- [ ] T186 [P] [US8] Implement file deletion: DELETE /api/files/{id}

### Migration Script

- [ ] T187 [P] [US8] Create src/services/migrations/migratePhotos.ts migration script
- [ ] T188 [US8] Implement iterative migration (batch of 100 assets at a time)
- [ ] T189 [US8] For each asset: upload base64 photos to Files, replace IDs, verify accessible
- [ ] T190 [US8] Add progress reporting for migration script
- [ ] T191 [US8] Add rollback capability if migration fails mid-process

### Dual Storage Support

- [ ] T192 [US8] Update PhotoStorageFactory to detect photo format (base64 vs file ID)
- [ ] T193 [US8] If ID starts with "data:image/": use Base64PhotoStorage
- [ ] T194 [US8] If ID starts with "file-" or numeric: use ChurchToolsPhotoStorage
- [ ] T195 [US8] Add config option to select default storage for new uploads

### Testing

- [ ] T196 [US8] Manual test: Configure Files module, upload new photo, verify uses Files API
- [ ] T197 [US8] Manual test: Asset with mix of base64 and Files photos, verify all display correctly
- [ ] T198 [US8] Manual test: Run migration script, verify photos accessible after migration
- [ ] T199 [US8] Manual test: Disable Files module, verify fallback to base64 works

**Success Criteria**: ✅ Photos migrated without any becoming inaccessible (SC-021)

**Checkpoint**: User Story 8 complete - photo migration path ready

---

## Phase 16: User Story 9 - Development and Deployment Workflow (Priority: P2)

**Goal**: Ensure smooth dev workflow with hot-reload, build, and deployment

**Independent Test**: Run dev server, make changes to see hot-reload. Build production bundle, verify <20MB.

### Development Server

- [ ] T200 [P] [US9] Verify hot-reload works: run `npm run dev`, edit file, check browser auto-refreshes
- [ ] T201 [P] [US9] Document CORS configuration for local ChurchTools development in quickstart.md
- [ ] T202 [P] [US9] Test Safari browser with authentication (verify cookies work in dev mode)
- [ ] T203 [US9] Verify dev server starts in <10 seconds (per SC-022)

### Build & Preview

- [ ] T204 [P] [US9] Run `npm run build`, verify production build succeeds
- [ ] T205 [P] [US9] Verify bundle size <5MB warning threshold (updated in T007)
- [ ] T206 [P] [US9] Run preview server: `npm run preview`, verify works correctly
- [ ] T207 [US9] Test production build in ChurchTools-like environment

### Deployment

- [ ] T208 [P] [US9] Update scripts/package.js to create deployment zip
- [ ] T209 [P] [US9] Verify deployment package <20MB (ChurchTools limit)
- [ ] T210 [US9] Document deployment workflow in quickstart.md
- [ ] T211 [US9] Test upload to ChurchTools, verify extension installs successfully

**Success Criteria**: ✅ Dev server starts <10s with hot-reload (SC-022), ✅ Deployment package <20MB (SC-025)

**Checkpoint**: User Story 9 complete - dev/deploy workflow smooth

---

## Phase 17: User Story 10 - Offline Stock Take with Sync (Priority: P2)

**Goal**: Enable stock take scanning offline with sync when connection restored

**Independent Test**: Start stock take, go offline, scan assets, reconnect, verify scans sync successfully.

### Offline Infrastructure

- [ ] T212 [P] [US10] Verify src/utils/offline-db.ts has correct Dexie schema (from T019)
- [ ] T213 [P] [US10] Create src/services/sync/OfflineSyncService.ts implementing contracts/offline-sync.ts
- [ ] T214 [P] [US10] Implement offline detection: listen to navigator.onLine events

### Offline Stock Take

- [ ] T215 [US10] Update StockTakeSession entity to add syncStatus and lastSyncAt fields
- [ ] T216 [US10] Update StockTakeScan entity to add localId and syncStatus fields
- [ ] T217 [US10] When offline: save scans to IndexedDB with syncStatus='offline'
- [ ] T218 [US10] When online: automatically trigger sync of offline scans
- [ ] T219 [US10] Add visual indicator for offline/online status (icon in header)

### Sync with Conflict Resolution

- [ ] T220 [US10] Implement conflict detection: compare offline timestamps vs server timestamps
- [ ] T221 [US10] For conflicts: create SyncConflict entity, store in IndexedDB
- [ ] T222 [US10] Create src/components/sync/ConflictResolutionModal.tsx with side-by-side comparison (per clarification Q3)
- [ ] T223 [US10] Allow user to select: keep offline, keep server, or merge manually
- [ ] T224 [US10] After resolution: apply choice, mark conflict resolved, continue sync
- [ ] T225 [US10] Show sync progress: "X of Y scans synced"

### Testing

- [ ] T226 [US10] Manual test: Start stock take online, go offline, scan 5 assets, verify saves locally
- [ ] T227 [US10] Manual test: Go online, verify automatic sync triggers
- [ ] T228 [US10] Manual test: Simulate conflict (asset changed online during offline scan), verify conflict UI appears
- [ ] T229 [US10] Manual test: Resolve conflict by keeping offline version, verify syncs successfully
- [ ] T230 [US10] Manual test: Complete full offline stock take, verify 100% data integrity after sync

**Success Criteria**: ✅ Offline scan and sync with 100% data integrity (SC-024), ✅ Offline/online indicator visible within 2 seconds (SC-028)

**Checkpoint**: User Story 10 complete - offline stock take fully functional

---

## Phase 18: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories + documentation

### Icon Migration (MDI)

- [ ] T231 [P] Create src/utils/iconMigrationMap.ts mapping Tabler icons → MDI equivalents
- [ ] T232 [P] Update IconPicker component to use @mdi/react
- [ ] T233 [P] Update IconDisplay component for backward compatibility (handle both Tabler and MDI)
- [ ] T234 New features use MDI icons only
- [ ] T235 Gradually update existing Tabler icons to MDI (non-blocking)

### Additional UX Improvements

- [ ] T236 [P] Implement collapsible child asset lists with expand/collapse state persistence in localStorage
- [ ] T237 [P] Implement view mode persistence (gallery vs list) in localStorage
- [ ] T238 [P] Add search debouncing (300ms) to all search inputs
- [ ] T239 [P] Add error boundaries to catch and display React errors gracefully
- [ ] T240 Manual test: Collapse child assets, reload page, verify state persisted
- [ ] T241 Manual test: Switch view mode, reload, verify mode persisted

### Master Data Management

- [ ] T242 [P] Create src/pages/ManufacturersPage.tsx for manufacturer CRUD
- [ ] T243 [P] Create src/pages/ModelsPage.tsx for model CRUD
- [ ] T244 [P] Add routes to src/App.tsx for new pages
- [ ] T245 Manual test: Navigate to manufacturers page, create/edit/delete manufacturer
- [ ] T246 Manual test: Navigate to models page, create/edit/delete model

### Asset Naming

- [ ] T247 [P] Create src/utils/assetNameGenerator.ts for template-based name generation
- [ ] T248 Allow manual override of auto-generated names
- [ ] T249 Manual test: Create asset with auto-generated name, verify correct format
- [ ] T250 Manual test: Override auto-generated name, verify override works

### Documentation Consolidation (T332)

- [ ] T251 [P] Create specs/CONSTITUTION.md consolidating core principles
- [ ] T252 [P] Create specs/SPECIFICATIONS.md consolidating all requirements
- [ ] T253 [P] Create specs/IMPLEMENTATION.md consolidating technical decisions
- [ ] T254 [P] Create specs/TASKS.md consolidating all task lists
- [ ] T255 [P] Create specs/CHANGELOG.md documenting feature history
- [ ] T256 Delete obsolete root markdown files: PHASE*.md, IMPLEMENTATION*.md, UI-*.md, T*_*.md (25+ files)
- [ ] T257 Update README.md to reference new specs/ structure
- [ ] T258 Verify root directory has <10 markdown files after consolidation (SC-015)

### Final Quality Checks

- [ ] T259 Run TypeScript compilation: `npm run type-check` (must pass with 0 errors)
- [ ] T260 Run ESLint: `npm run lint` (must pass with 0 warnings)
- [ ] T261 Verify bundle size: `npm run build` and check output (<5MB warning threshold)
- [ ] T262 Manual testing in development mode: `npm run dev` (all features work)
- [ ] T263 Manual testing in production mode: `npm run preview` (all features work)
- [ ] T264 Cross-browser testing: Chrome, Safari, Firefox (all work correctly)
- [ ] T265 Verify no console.log or debug statements in production code
- [ ] T266 Verify API error handling provides user-friendly messages (no raw error codes)
- [ ] T267 Verify 0 console errors and 0 warnings during normal use (SC-012)
- [ ] T268 Performance check: Initial load <1s, interactions <100ms
- [ ] T269 Update version number in package.json
- [ ] T270 Update changelog/release notes

**Success Criteria**: ✅ All 172+ components remain accessible (no regressions) (SC-026), ✅ Root directory <10 markdown files (SC-015), ✅ Zero console errors/warnings (SC-012), ✅ Bundle size <5MB (SC-020)

**Pre-Deployment Quality Gates**:
- [ ] ✅ TypeScript compilation passes (T259)
- [ ] ✅ All ESLint rules passing (T260)
- [ ] ✅ Bundle size verified <5MB (T261)
- [ ] ✅ Manual testing completed in dev and production (T262-T263)
- [ ] ✅ Cross-browser testing (T264)
- [ ] ✅ No debug code in production (T265)
- [ ] ✅ User-friendly error messages (T266)
- [ ] ✅ Zero console warnings (T267)
- [ ] ✅ Performance budget met (T268)
- [ ] ✅ Version updated (T269)
- [ ] ✅ Release notes prepared (T270)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately ✅
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories ⚠️
- **User Stories (Phases 3-17)**: All depend on Foundational completion
  - Can then proceed in parallel (if team capacity allows)
  - Or sequentially by priority: P0 → P1 → P2 → P3
- **Polish (Phase 18)**: Depends on desired user stories being complete
- **Migrated Tasks (Phase 19)**: Can be integrated throughout implementation
  - CI/CD tasks can run anytime after Phase 2
  - Feature completions integrate with relevant user stories
  - QA/security tasks run during final polish
  - E5 (Multi-Prefix) can be implemented independently after Phase 2

### User Story Dependencies

All user stories are **independently testable** after Foundational phase:

- **US1 - Navigation** (P0): No dependencies on other stories ✅
- **US2 - Person Search** (P0): No dependencies on other stories ✅
- **US3 - Book for Others** (P1): Depends on US2 (PersonPicker) ⚠️
- **US4 - Smart Dates** (P1): No dependencies on other stories ✅
- **US5 - Availability** (P1): Depends on US3 (booking flow) + US4 (date modes) ⚠️
- **US6 - Images** (P3): No dependencies on other stories ✅
- **US7 - Schema Evolution** (P3): No dependencies on other stories ✅
- **US8 - Photo Migration** (P3): Depends on US6 (photo storage) ⚠️
- **US9 - Dev Workflow** (P2): No dependencies on other stories ✅
- **US10 - Offline Stock Take** (P2): Depends on US2 (PersonCache) ⚠️

### Recommended Execution Order

**Week 1** (P0 - Critical Bugs): 
1. Phase 1: Setup (T001-T007)
2. Phase 2: Foundational (T008-T020) ← **MUST COMPLETE FIRST**
3. Phase 3: US1 - Navigation (T021-T031)
4. Phase 4: US2 - Person Search (T032-T046)
5. Phase 8: API Error Fixes (T083-T089)
6. Phase 9: Kit/Report Fixes (T090-T097)

**Week 2-3** (P1 - Essential Features):
7. Phase 5: US3 - Book for Others (T047-T056)
8. Phase 6: US4 - Smart Dates (T057-T069)
9. Phase 7: US5 - Availability (T070-T082)
10. Phase 10: English Localization (T098-T107)

**Week 4** (P2 - UX Polish):
11. Phase 11: UI/UX Improvements (T108-T127)
12. Phase 12: Settings & Config (T128-T144)
13. Phase 16: US9 - Dev Workflow (T200-T211)
14. Phase 17: US10 - Offline Stock Take (T212-T230)

**Week 5-6** (P3 - Advanced Features):
15. Phase 13: US6 - Images (T145-T166)
16. Phase 14: US7 - Schema Evolution (T167-T182)
17. Phase 15: US8 - Photo Migration (T183-T199)
18. Phase 18: Polish & Documentation (T231-T270)

**Week 7** (Complete Remaining Items from 001):
19. Phase 19: Migrated Tasks (T271-T303)
  - CI/CD setup (T271)
  - Feature completions (T272-T276)
  - QA & Security (T277-T295)
  - Multi-Prefix Support - E5 (T296-T303)

### Parallel Opportunities

**Within Setup (Phase 1)**: T002, T003, T004 can run in parallel

**Within Foundational (Phase 2)**: T008-T014 (types and services) can run in parallel

**After Foundational Complete**:
- US1 (Navigation) + US2 (Person Search) can run in parallel
- US6 (Images) + US7 (Schema) + US9 (Dev Workflow) can run in parallel
- API Fixes + Kit Fixes can run in parallel

**Within User Stories**:
- All tasks marked [P] can run in parallel (different files)
- Models can be created in parallel
- Services can be created in parallel (if no dependencies)

---

## Parallel Example: User Story 2 (Person Search)

```bash
# Can run in parallel (different files):
T032: Create PersonSearchService.ts
T033: Implement ChurchTools API integration
T034: Add debounce
T035: Implement memory cache
T036: Implement localStorage cache
T037: Transform API response
T038: Create usePersonSearch.ts hook
T039: Create PersonPicker.tsx component

# Must run sequentially:
T040: Integrate PersonPicker into BookingForm (depends on T039)
T041-T046: Testing (depends on integration complete)
```

---

## Implementation Strategy

### MVP First (Critical Path Only - Week 1)

**Goal**: Get core application working without errors

1. ✅ Phase 1: Setup (install libraries, configure base path)
2. ✅ Phase 2: Foundational (types, interfaces, base path fix) ← **CRITICAL**
3. ✅ Phase 3: US1 - Navigation (route refresh fix) ← **HIGHEST IMPACT**
4. ✅ Phase 4: US2 - Person Search (real data in bookings)
5. ✅ Phase 8: API Error Fixes (prefixes, maintenance)
6. ✅ Phase 9: Kit/Report Fixes (navigation)

**Result**: Application is usable, no critical bugs, ready for user testing

### Incremental Delivery (Add Features Week by Week)

**Week 2-3**: Add booking enhancements (US3-US5, localization)
**Week 4**: Add UX polish (UI improvements, settings, offline)
**Week 5-6**: Add advanced features (images, migrations, documentation)

Each increment adds value without breaking existing functionality.

### Parallel Team Strategy

With 3 developers after Foundational phase complete:

- **Developer A**: US1 (Navigation) → US2 (Person Search) → US3 (Book for Others)
- **Developer B**: API Fixes → Kit Fixes → US4 (Smart Dates) → US5 (Availability)
- **Developer C**: US6 (Images) → US7 (Schema) → US8 (Photo Migration)

All merge into main branch, integrate at end.

---

## Phase 19: Tasks from 001-inventory-management (Open Items)

**Purpose**: Complete remaining tasks from the foundational inventory management feature that were not finished

**Source**: Migrated from `/specs/001-inventory-management/tasks.md`

**Note**: These tasks are necessary to complete the full feature set and should be integrated alongside the bug fixes and UX improvements.

### CI/CD and Testing

- [ ] T271 [Migrated-001] Create .github/workflows/test.yml with GitHub Actions CI pipeline

### Feature Completions

- [ ] T272 [Migrated-001] [US2] Add custom field sorting in AssetList (sort by custom field values) in src/components/assets/AssetList.tsx
- [ ] T273 [P] [Migrated-001] [US5] Create BookingList component in src/components/bookings/BookingList.tsx (DataTable with status filtering)
- [ ] T274 [P] [Migrated-001] [US8] Implement photo upload in MaintenanceRecordForm using Mantine Dropzone (up to 10 photos, max 5MB each, formats: JPG/PNG/HEIC/WebP, store in ChurchTools file storage) in src/components/maintenance/MaintenanceRecordForm.tsx
- [ ] T275 [Migrated-001] [US8] Implement ChurchTools email service integration in src/services/api/ChurchToolsEmailService.ts (wrapper for ChurchTools email API)
- [ ] T276 [Migrated-001] [US8] Add maintenance reminder email sending via ChurchTools email service (triggered by scheduled job or client-side check)

### Quality Assurance and Testing

- [ ] T277 [Migrated-001] Run quickstart.md validation (follow developer setup guide)
- [ ] T278 [Migrated-001] Perform cross-browser testing (Chrome, Safari, Firefox)
- [ ] T279 [Migrated-001] Test on mobile devices (responsive behavior, camera scanning)
- [ ] T280 [Migrated-001] Test offline functionality (stock take with network disconnection)

### Security and Production Readiness

- [ ] T281 [P] [Migrated-001] Remove all console.log and debug statements
- [ ] T282 [P] [Migrated-001] Add .env validation (verify required variables on startup)
- [ ] T283 [P] [Migrated-001] Implement rate limiting for API calls (respect ChurchTools API limits)
- [ ] T284 [P] [Migrated-001] Add Content Security Policy headers
- [ ] T285 [Migrated-001] Audit dependencies for security vulnerabilities (npm audit)
- [ ] T286 [Migrated-001] Update package.json version number (semver)
- [ ] T287 [Migrated-001] Create CHANGELOG.md with release notes

### Pre-Deployment Quality Gates

- [ ] T288 [Migrated-001] TypeScript compilation passes with no errors (npx tsc --noEmit)
- [ ] T289 [Migrated-001] ESLint passes with no warnings (npm run lint)
- [ ] T290 [Migrated-001] Bundle size verified < 200 KB gzipped
- [ ] T291 [Migrated-001] Manual testing completed in dev mode
- [ ] T292 [Migrated-001] Manual testing completed in production mode (embedded in ChurchTools)
- [ ] T293 [Migrated-001] Cross-browser testing completed
- [ ] T294 [Migrated-001] Performance budget met (< 1s initial load, < 100ms interactions)
- [ ] T295 [Migrated-001] All constitution gates pass (type safety, code quality, performance, UX consistency)

### Enhancement E5: Multi-Prefix Support (Priority: P1)

**Note**: Originally from 001-inventory-management Phase 13 (E5)

- [ ] T296 [P] [Migrated-001] [E5] Add AssetPrefix interface to src/types/entities.ts with id, prefix, description, color, sequence fields
- [ ] T297 [P] [Migrated-001] [E5] Create AssetPrefixList component in src/components/settings/AssetPrefixList.tsx with DataTable display and CRUD actions
- [ ] T298 [P] [Migrated-001] [E5] Create AssetPrefixForm component in src/components/settings/AssetPrefixForm.tsx with validation and color picker
- [ ] T299 [Migrated-001] [E5] Add Prefixes tab to SettingsPage in src/pages/SettingsPage.tsx
- [ ] T300 [Migrated-001] [E5] Update AssetForm in src/components/assets/AssetForm.tsx to add prefix Select dropdown with preview
- [ ] T301 [Migrated-001] [E5] Update generateAssetNumber in src/utils/assetNumbers.ts to support multiple prefixes with independent sequences
- [ ] T302 [Migrated-001] [E5] Fix prefix application in createAsset method in src/services/storage/ChurchToolsProvider.ts to use selected prefix
- [ ] T303 [P] [Migrated-001] [E5] Add prefix-based filtering to AssetList in src/components/assets/AssetList.tsx

**Checkpoint**: After completing these tasks, all functionality from 001-inventory-management will be complete and integrated with the bug fixes and UX improvements from 002.

---

## Summary

- **Total Tasks**: 303 tasks across 19 phases
- **User Stories**: 10 user stories (P0: 2, P1: 3, P2: 3, P3: 3)
- **Migrated Tasks**: 33 tasks from 001-inventory-management
- **Duration**: ~6-7 weeks (130 hours for 002 + ~20 hours for migrated tasks)
- **MVP Scope**: Phases 1-4 + 8-9 (navigation, person search, API fixes, kit/report fixes)
- **Parallel Opportunities**: ~50 tasks marked [P] can run in parallel
- **Independent Stories**: Most user stories testable independently after Foundational
- **Critical Path**: Setup → Foundational → US1 (Navigation) - MUST complete first

**Success Metrics** (from spec.md):
- 31 success criteria to verify (including SC-031 for error message format)
- 85 functional requirements to implement
- 15 edge cases to handle
- 0 console errors/warnings target
- 100% route refresh success rate
- <5MB bundle size
- <3 second person search
- 100% data integrity in offline sync
- Error messages must follow "Could not [action]: [reason]. [suggestion]" format

---

**Ready to Start**: Pick first task T001 (install dependencies) and follow sequence!
