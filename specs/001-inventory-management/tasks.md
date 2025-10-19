# Tasks: ChurchTools Inventory Management Extension

**Feature**: 001-inventory-management  
**Branch**: `001-inventory-management`  
**Input**: Design documents from `/specs/001-inventory-management/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
Repository root: `/workspaces/churchtools-inventory-extension/`
- Source: `src/`
- Scripts: `scripts/`
- Public assets: `public/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify existing project structure matches plan.md (src/, scripts/, public/ directories exist)
- [x] T002 Install React 18.x, TypeScript 5.x, Vite 5.x dependencies in package.json
- [x] T003 [P] Install Mantine UI v7.x dependencies (@mantine/core, @mantine/hooks, @mantine/form, @mantine/dates, @mantine/notifications, @mantine/dropzone, mantine-datatable)
- [x] T004 [P] Install state management dependencies (TanStack Query v5, Zustand v4)
- [x] T005 [P] Install barcode/QR dependencies (jsbarcode v3, qrcode v1, html5-qrcode v2)
- [x] T006 [P] Install ChurchTools client (@churchtools/churchtools-client v1.4.0)
- [x] T007 [P] Install Dexie.js for offline support
- [x] T008 [P] Install date-fns v3 for date utilities
- [x] T009 Configure TypeScript strict mode in tsconfig.json (verify noImplicitAny, strictNullChecks enabled)
- [x] T010 [P] Configure ESLint with TypeScript rules in eslint.config.js
- [x] T011 [P] Create .env.example file with VITE_BASE_URL, VITE_USERNAME, VITE_PASSWORD, VITE_KEY, VITE_MODULE_ID
- [x] T012 Update vite.config.ts to optimize bundle size (tree shaking, code splitting)
- [x] T013 [P] Create Mantine theme configuration in src/theme.ts (match ChurchTools colors)
- [x] T014 [P] Setup TanStack Query provider in src/main.tsx with cache configuration
- [x] T015 [P] Create global Zustand store structure in src/stores/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions

- [x] T016 [P] Copy contracts/entities.ts to src/types/entities.ts
- [x] T017 [P] Copy contracts/storage-provider.ts to src/types/storage.ts
- [x] T018 [P] Copy contracts/churchtools-api.ts to src/types/api.ts

### Core Services

- [x] T019 Create ChurchTools API client in src/services/api/ChurchToolsAPIClient.ts
- [x] T020 [P] Implement person info caching in ChurchToolsAPIClient (Map<string, PersonInfo> with TTL)
- [x] T021 [P] Implement error handling class in src/services/api/ChurchToolsAPIError.ts
- [x] T022 [P] Create storage provider factory in src/services/storage/StorageProviderFactory.ts
- [x] T023 Implement ChurchToolsStorageProvider in src/services/storage/ChurchToolsProvider.ts (implements IStorageProvider)
- [x] T024 [P] Implement OfflineStorageProvider in src/services/storage/OfflineProvider.ts (Dexie.js wrapper)
- [x] T025 [P] Create Dexie database schema in src/services/storage/InventoryDB.ts (stockTakeSessions, scannedAssets, syncQueue tables)

### Utilities

- [x] T026 [P] Create date formatting utilities in src/utils/formatting.ts (date-fns wrappers)
- [x] T027 [P] Create validation helpers in src/utils/validation.ts
- [x] T028 [P] Create asset number generator utility in src/utils/assetNumbers.ts (matches formatters.ts pattern)

### UI State Management

- [x] T029 [P] Create UI store in src/stores/uiStore.ts (filters, view mode, preferences using Zustand)
- [x] T030 [P] Create scanner store in src/stores/scannerStore.ts (scanner session state using Zustand)

### Common Components

- [x] T031 [P] Create loading spinner component in src/components/common/LoadingSpinner.tsx
- [x] T032 [P] Create error display component in src/components/common/ErrorDisplay.tsx
- [x] T033 [P] Create empty state component in src/components/common/EmptyState.tsx
- [x] T034 [P] Create confirmation modal component in src/components/common/ConfirmModal.tsx

### Custom Hooks

- [x] T035 [P] Create useStorageProvider hook in src/hooks/useStorageProvider.ts (returns active storage provider)
- [x] T036 [P] Create useOnlineStatus hook in src/hooks/useOnlineStatus.ts (network detection)
- [x] T037 [P] Create useCurrentUser hook in src/hooks/useCurrentUser.ts (TanStack Query wrapper)

**Constitution Compliance Gates** (verify before proceeding):
- [x] T038 TypeScript strict mode compilation passes with no errors
- [x] T039 ESLint configuration passes with no warnings (fixed 24 issues: any→unknown, removed unnecessary assertions, extracted constants)
- [x] T040 All environment variables documented in .env.example
- [x] T041 Bundle size baseline measured (Phase 1 complete: 138.50 KB with all dependencies; will decrease after Phase 2 tree shaking)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Asset Creation and Tracking (Priority: P1) 🎯 MVP

**Goal**: Enable equipment managers to create, view, and track assets with unique identifiers, custom properties, and status management.

**Independent Test**: Create assets with various properties (microphones, projectors, cables), assign unique asset numbers and statuses, filter by status, verify all data persists correctly.

### Asset Category Management for User Story 1

- [x] T042 [P] [US1] Create TanStack Query hooks in src/hooks/useCategories.ts (useCategories, useCategory, useCreateCategory, useUpdateCategory, useDeleteCategory)
- [x] T043 [P] [US1] Create AssetCategoryList component in src/components/categories/AssetCategoryList.tsx (display all categories with DataTable)
- [x] T044 [P] [US1] Create AssetCategoryForm component in src/components/categories/AssetCategoryForm.tsx (Mantine form with validation)
- [x] T045 [P] [US1] Create CustomFieldDefinitionInput component in src/components/categories/CustomFieldDefinitionInput.tsx (add/edit custom fields)
- [x] T046 [US1] Implement category CRUD methods in ChurchToolsStorageProvider (getCategories, createCategory, updateCategory, deleteCategory)

### Asset Management for User Story 1

- [x] T047 [P] [US1] Create TanStack Query hooks in src/hooks/useAssets.ts (useAssets, useAsset, useAssetByNumber, useCreateAsset, useUpdateAsset, useDeleteAsset)
- [x] T048 [P] [US1] Create AssetList component in src/components/assets/AssetList.tsx (DataTable with filtering, sorting, pagination)
- [x] T049 [P] [US1] Create AssetDetail component in src/components/assets/AssetDetail.tsx (display full asset information)
- [x] T050 [P] [US1] Create AssetForm component in src/components/assets/AssetForm.tsx (create/edit asset with category selection)
- [x] T051 [P] [US1] Create CustomFieldInput component in src/components/assets/CustomFieldInput.tsx (dynamic input based on field type)
- [x] T052 [P] [US1] Create AssetStatusBadge component in src/components/assets/AssetStatusBadge.tsx (color-coded status display)
- [x] T053 [US1] Implement asset CRUD methods in ChurchToolsStorageProvider (getAssets, getAsset, getAssetByNumber, createAsset, updateAsset, deleteAsset)
- [x] T054 [US1] Implement asset number generation in src/utils/assetNumbers.ts (generateAssetNumber with prefix support)
- [x] T055 [US1] Add asset filtering logic in ChurchToolsStorageProvider (by category, status, location)

### Change History for User Story 1

- [x] T056 [P] [US1] Create TanStack Query hooks in src/hooks/useChangeHistory.ts (useChangeHistory)
- [x] T057 [P] [US1] Create ChangeHistoryList component in src/components/assets/ChangeHistoryList.tsx (audit trail display)
- [x] T058 [US1] Implement change history logging in ChurchToolsStorageProvider (createChangeHistoryEntry)

### Integration for User Story 1

- [x] T059 [US1] Create main App routing in src/App.tsx (routes for categories, assets, asset detail)
- [x] T060 [US1] Add navigation menu in src/components/layout/Navigation.tsx
- [x] T061 [US1] Integrate AssetList with filters from uiStore
- [x] T062 [US1] Add optimistic updates for asset mutations (TanStack Query onMutate)
- [x] T063 [US1] Add toast notifications for success/error states (Mantine notifications)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create categories with custom fields, create assets, view asset lists with filtering, and see change history.

---

## Phase 4: User Story 2 - Custom Asset Categories and Fields (Priority: P1)

**Goal**: Enable organizations to create specialized asset categories with custom field definitions tailored to specific equipment types.

**Independent Test**: Create category "Lighting Equipment" with custom fields (wattage number, color temperature number, DMX address text), create assets in that category, verify custom field data displays correctly.

**Note**: Most implementation completed in User Story 1. This phase adds advanced features.

### Advanced Custom Field Features for User Story 2

- [ ] T064 [P] [US2] Create custom field validation logic in src/utils/validation.ts (validateCustomFieldValue based on field type and validation rules)
- [ ] T065 [P] [US2] Add person-reference field type support in CustomFieldInput (ChurchTools person picker)
- [ ] T066 [P] [US2] Add URL field type validation in CustomFieldInput (URL validation)
- [ ] T067 [P] [US2] Add multi-select field type support in CustomFieldInput (Mantine MultiSelect)
- [ ] T068 [P] [US2] Create custom field preview in AssetCategoryForm (show how fields will look)
- [ ] T069 [US2] Implement required field validation in AssetForm (prevent submission if required custom fields empty)
- [ ] T070 [US2] Add custom field filtering in AssetList (filter by custom field values)
- [ ] T071 [US2] Add custom field sorting in AssetList (sort by custom field values)

### Category Management Enhancements for User Story 2

- [ ] T072 [P] [US2] Add category icon picker in AssetCategoryForm (Tabler icons via Mantine)
- [ ] T073 [P] [US2] Create category templates feature in src/components/categories/CategoryTemplates.tsx (pre-defined category configurations)
- [ ] T074 [US2] Add category validation (prevent deletion if assets exist)
- [ ] T075 [US2] Add category duplication feature (copy category with all custom fields)

**Checkpoint**: At this point, User Stories 1 AND 2 are complete - users have full custom field support with all field types, validation, filtering, and sorting.

---

## Phase 5: User Story 3 - Barcode and QR Code Asset Identification (Priority: P2)

**Goal**: Enable users to quickly identify and locate assets using barcode or QR code scanning.

**Independent Test**: Generate QR codes for existing assets, print them, scan with USB scanner and mobile camera, verify system navigates to correct asset details.

### Barcode/QR Generation for User Story 3

- [ ] T076 [P] [US3] Create BarcodeService in src/services/barcode/BarcodeService.ts (generateBarcode using JsBarcode, generateQRCode using qrcode)
- [ ] T077 [P] [US3] Create BarcodeDisplay component in src/components/scanner/BarcodeDisplay.tsx (display barcode image)
- [ ] T078 [P] [US3] Create QRCodeDisplay component in src/components/scanner/QRCodeDisplay.tsx (display QR code image)
- [ ] T079 [P] [US3] Add barcode/QR display to AssetDetail component
- [ ] T080 [P] [US3] Create AssetLabelPrint component in src/components/assets/AssetLabelPrint.tsx (printable asset labels with barcode/QR)

### Barcode/QR Scanning for User Story 3

- [ ] T081 [P] [US3] Create BarcodeScanner component in src/components/scanner/BarcodeScanner.tsx (handles USB/Bluetooth keyboard emulation + camera scanning)
- [ ] T082 [P] [US3] Add camera scanning support in BarcodeScanner (html5-qrcode integration)
- [ ] T083 [P] [US3] Create ScannerInput component in src/components/scanner/ScannerInput.tsx (manual entry fallback)
- [ ] T084 [P] [US3] Add scan success feedback (visual + audio confirmation)
- [ ] T085 [US3] Implement asset lookup by number in ChurchToolsStorageProvider (optimize for fast lookup)
- [ ] T086 [US3] Create scanner navigation logic (scan asset number → navigate to AssetDetail)
- [ ] T087 [US3] Add scanner keyboard shortcuts (Alt+S to focus scanner input)

### Scanner UI for User Story 3

- [ ] T088 [P] [US3] Create QuickScan modal in src/components/scanner/QuickScanModal.tsx (overlay for quick asset lookup)
- [ ] T089 [US3] Integrate QuickScan modal with global keyboard shortcut
- [ ] T090 [US3] Add recent scans history to scanner store
- [ ] T091 [US3] Create scanner settings (enable/disable camera, audio feedback, etc.)

**Checkpoint**: At this point, User Stories 1, 2, and 3 are complete - users can scan barcodes/QR codes to quickly locate assets.

---

## Phase 6: User Story 4 - Multi-Asset Management (Parent-Child Assets) (Priority: P2)

**Goal**: Enable efficient creation of multiple identical items as sub-assets sharing common properties but with unique identifiers.

**Independent Test**: Create parent asset "Shure SM58 Microphone" with quantity 10, verify 10 child assets created with unique numbers (SOUND-001 to SOUND-010), independently update one child's status, confirm others unchanged.

### Parent-Child Asset Logic for User Story 4

- [ ] T092 [P] [US4] Add parent asset checkbox to AssetForm (isParent field)
- [ ] T093 [P] [US4] Add quantity field to AssetForm (visible when isParent is true)
- [ ] T094 [P] [US4] Implement createMultiAsset in ChurchToolsStorageProvider (create parent + N children in single operation)
- [ ] T095 [P] [US4] Implement automatic child asset number generation (sequential from parent number)
- [ ] T096 [P] [US4] Add child asset inheritance logic (copy category, manufacturer, model, custom fields from parent)

### Parent-Child UI Components for User Story 4

- [ ] T097 [P] [US4] Create ChildAssetsList component in src/components/assets/ChildAssetsList.tsx (display children on parent AssetDetail)
- [ ] T098 [P] [US4] Create ParentAssetLink component in src/components/assets/ParentAssetLink.tsx (display parent link on child AssetDetail)
- [ ] T099 [P] [US4] Add parent-child relationship indicators in AssetList (parent icon, indent children)
- [ ] T100 [US4] Add bulk status update for children (update all children's status from parent)
- [ ] T101 [US4] Add property propagation from parent to children (update common properties on all children)

### Parent-Child Business Logic for User Story 4

- [ ] T102 [US4] Implement parent deletion validation (prevent if children have active bookings)
- [ ] T103 [US4] Add child independence validation (children can have different status, location, inUseBy)
- [ ] T104 [US4] Implement parent summary statistics (count of children by status)

**Checkpoint**: At this point, User Stories 1-4 are complete - users can efficiently create and manage bulk identical assets.

---

## Phase 7: User Story 5 - Equipment Booking and Reservation (Priority: P2)

**Goal**: Enable event coordinators to book equipment for date ranges, view availability calendars, and manage check-out/check-in.

**Independent Test**: Create booking for "Projector XYZ" Oct 20-22, verify calendar shows unavailable, check out on Oct 20 (status → "In Use"), check in on Oct 22 (status → "Available").

### Booking Data Layer for User Story 5

- [ ] T105 [P] [US5] Create TanStack Query hooks in src/hooks/useBookings.ts (useBookings, useBooking, useCreateBooking, useUpdateBooking, useDeleteBooking, useCheckOut, useCheckIn)
- [ ] T106 [US5] Implement booking CRUD in ChurchToolsStorageProvider (getBookings, createBooking, updateBooking, deleteBooking)
- [ ] T107 [US5] Implement availability checking logic in ChurchToolsStorageProvider (isAssetAvailable method)
- [ ] T108 [US5] Implement booking conflict detection (prevent overlapping bookings)

### Booking UI Components for User Story 5

- [ ] T109 [P] [US5] Create BookingList component in src/components/bookings/BookingList.tsx (DataTable with status filtering)
- [ ] T110 [P] [US5] Create BookingForm component in src/components/bookings/BookingForm.tsx (date pickers, asset selector, purpose input)
- [ ] T111 [P] [US5] Create BookingDetail component in src/components/bookings/BookingDetail.tsx (display booking information)
- [ ] T112 [P] [US5] Create BookingCalendar component in src/components/bookings/BookingCalendar.tsx (Mantine Calendar with booking overlay)
- [ ] T113 [P] [US5] Create BookingStatusBadge component in src/components/bookings/BookingStatusBadge.tsx (color-coded status)
- [ ] T114 [P] [US5] Create AssetAvailabilityIndicator component in src/components/bookings/AssetAvailabilityIndicator.tsx (available/booked visual)

### Check-Out/Check-In Workflow for User Story 5

- [ ] T115 [P] [US5] Create CheckOutModal component in src/components/bookings/CheckOutModal.tsx (scan asset, confirm check-out)
- [ ] T116 [P] [US5] Create CheckInModal component in src/components/bookings/CheckInModal.tsx (scan asset, condition assessment)
- [ ] T117 [P] [US5] Create ConditionAssessment component in src/components/bookings/ConditionAssessment.tsx (rating + notes + photos)
- [ ] T118 [US5] Implement checkOut logic in ChurchToolsStorageProvider (update booking status to Active, asset status to In Use, set inUseBy)
- [ ] T119 [US5] Implement checkIn logic in ChurchToolsStorageProvider (update booking status to Completed, asset status to Available, clear inUseBy)
- [ ] T120 [US5] Add photo upload support for condition assessment (Mantine Dropzone + storage)

### Booking Business Logic for User Story 5

- [ ] T121 [US5] Implement automatic status update to Overdue (scheduled job or client-side check)
- [ ] T122 [US5] Add booking approval workflow (optional: admin approves pending bookings)
- [ ] T123 [US5] Implement booking cancellation logic (update status, free asset)
- [ ] T124 [US5] Add booking validation (asset must be available, end date > start date)

### Booking Integration for User Story 5

- [ ] T125 [US5] Add booking indicator to AssetDetail (show current/upcoming bookings)
- [ ] T126 [US5] Add "Book This Asset" button to AssetDetail
- [ ] T127 [US5] Integrate booking calendar with asset filtering (view bookings by category, location)
- [ ] T128 [US5] Add booking notifications (Mantine notifications for check-out/check-in success)

**Checkpoint**: At this point, User Stories 1-5 are complete - users can book assets, prevent conflicts, check out/in equipment with condition tracking.

---

## Phase 8: User Story 6 - Equipment Kits and Grouped Bookings (Priority: P3)

**Goal**: Enable event coordinators to create and book pre-defined equipment kits for recurring setups.

**Independent Test**: Create kit "Sunday Service Audio" with 4 microphones + 1 mixer, book kit for next Sunday, verify all component assets reserved.

### Kit Data Layer for User Story 6

- [ ] T129 [P] [US6] Create TanStack Query hooks in src/hooks/useKits.ts (useKits, useKit, useCreateKit, useUpdateKit, useDeleteKit)
- [ ] T130 [US6] Implement kit CRUD in ChurchToolsStorageProvider (getKits, createKit, updateKit, deleteKit)
- [ ] T131 [US6] Implement kit availability checking (all components available)
- [ ] T132 [US6] Implement flexible kit allocation logic (select N available assets from pool)

### Kit UI Components for User Story 6

- [ ] T133 [P] [US6] Create KitList component in src/components/kits/KitList.tsx (display all kits)
- [ ] T134 [P] [US6] Create KitForm component in src/components/kits/KitForm.tsx (create/edit kit with type selection)
- [ ] T135 [P] [US6] Create KitDetail component in src/components/kits/KitDetail.tsx (display kit components)
- [ ] T136 [P] [US6] Create FixedKitBuilder component in src/components/kits/FixedKitBuilder.tsx (select specific assets)
- [ ] T137 [P] [US6] Create FlexibleKitBuilder component in src/components/kits/FlexibleKitBuilder.tsx (define pool requirements)
- [ ] T138 [P] [US6] Create KitAvailabilityIndicator component in src/components/kits/KitAvailabilityIndicator.tsx (show if kit can be fulfilled)

### Kit Booking Integration for User Story 6

- [ ] T139 [US6] Extend BookingForm to support kit selection (asset OR kit)
- [ ] T140 [US6] Implement kit booking creation (create multiple asset bookings for kit components)
- [ ] T141 [US6] Add kit allocation logic to booking approval (assign specific assets from flexible kit pools)
- [ ] T142 [US6] Add kit components display to BookingDetail

### Kit Business Logic for User Story 6

- [ ] T143 [US6] Validate fixed kit components exist and are active
- [ ] T144 [US6] Prevent fixed kit booking if any component unavailable
- [ ] T145 [US6] Prevent flexible kit booking if insufficient pool assets available
- [ ] T146 [US6] Add kit validation (prevent deletion if kit has active bookings)

**Checkpoint**: At this point, User Stories 1-6 are complete - users can create equipment kits and book them as grouped units.

---

## Phase 9: User Story 7 - Stock Take and Physical Inventory Audits (Priority: P3)

**Goal**: Enable maintenance personnel to perform periodic physical stock takes by scanning assets and identifying missing equipment.

**Independent Test**: Create stock take session, scan 20 assets, generate discrepancy report showing 5 unscanned assets (marked missing), bulk-update locations.

### Stock Take Data Layer for User Story 7

- [ ] T147 [P] [US7] Create TanStack Query hooks in src/hooks/useStockTake.ts (useStockTakeSessions, useStockTakeSession, useCreateStockTakeSession, useAddStockTakeScan, useCompleteStockTakeSession)
- [ ] T148 [US7] Implement stock take CRUD in ChurchToolsStorageProvider (getStockTakeSessions, createStockTakeSession, addStockTakeScan, completeStockTakeSession)
- [ ] T149 [US7] Implement offline stock take in OfflineStorageProvider (sync to Dexie.js)
- [ ] T150 [US7] Implement sync queue for offline scans (automatic sync when online)

### Stock Take UI Components for User Story 7

- [ ] T151 [P] [US7] Create StockTakeSessionList component in src/components/stocktake/StockTakeSessionList.tsx (active and completed sessions)
- [ ] T152 [P] [US7] Create StartStockTakeForm component in src/components/stocktake/StartStockTakeForm.tsx (define scope: category/location/all)
- [ ] T153 [P] [US7] Create StockTakeScanner component in src/components/stocktake/StockTakeScanner.tsx (full-screen scanning interface)
- [ ] T154 [P] [US7] Create StockTakeScanList component in src/components/stocktake/StockTakeScanList.tsx (real-time list of scanned assets)
- [ ] T155 [P] [US7] Create StockTakeProgress component in src/components/stocktake/StockTakeProgress.tsx (progress bar: scanned / total)
- [ ] T156 [P] [US7] Create StockTakeReport component in src/components/stocktake/StockTakeReport.tsx (discrepancy report display)

### Stock Take Business Logic for User Story 7

- [ ] T157 [US7] Load expected assets based on scope at session start
- [ ] T158 [US7] Add real-time scan validation (duplicate detection, unexpected asset handling)
- [ ] T159 [US7] Calculate discrepancies (missing assets = expected - scanned)
- [ ] T160 [US7] Implement bulk location update from stock take results
- [ ] T161 [US7] Add asset status update from stock take (mark as Lost, Destroyed)

### Stock Take Offline Support for User Story 7

- [ ] T162 [US7] Implement session data download to IndexedDB at session start
- [ ] T163 [US7] Add offline indicator banner in StockTakeScanner
- [ ] T164 [US7] Queue scans locally when offline (store in Dexie.js syncQueue)
- [ ] T165 [US7] Implement automatic sync on network reconnection
- [ ] T166 [US7] Add sync progress indicator (show queued scans syncing)

**Checkpoint**: At this point, User Stories 1-7 are complete - users can perform offline stock takes with automatic sync and discrepancy reporting.

---

## Phase 10: User Story 8 - Maintenance Scheduling and Reminders (Priority: P3)

**Goal**: Enable maintenance technicians to receive automated reminders when assets require scheduled maintenance.

**Independent Test**: Create asset with annual inspection requirement, set last inspection 350 days ago, verify system shows maintenance reminder.

### Maintenance Data Layer for User Story 8

- [ ] T167 [P] [US8] Create TanStack Query hooks in src/hooks/useMaintenance.ts (useMaintenanceRecords, useMaintenanceSchedules, useCreateMaintenanceRecord, useCreateMaintenanceSchedule, useUpdateMaintenanceSchedule)
- [ ] T168 [US8] Implement maintenance CRUD in ChurchToolsStorageProvider (getMaintenanceRecords, createMaintenanceRecord, getMaintenanceSchedules, createMaintenanceSchedule, updateMaintenanceSchedule)
- [ ] T169 [US8] Implement next due date calculation logic (calculateNextDue for time/usage/event/fixed schedules)
- [ ] T170 [US8] Implement overdue detection logic (isOverdue check)

### Maintenance UI Components for User Story 8

- [ ] T171 [P] [US8] Create MaintenanceRecordList component in src/components/maintenance/MaintenanceRecordList.tsx (display maintenance history)
- [ ] T172 [P] [US8] Create MaintenanceRecordForm component in src/components/maintenance/MaintenanceRecordForm.tsx (record completed maintenance with photos)
- [ ] T173 [P] [US8] Create MaintenanceScheduleForm component in src/components/maintenance/MaintenanceScheduleForm.tsx (configure recurring maintenance)
- [ ] T174 [P] [US8] Create MaintenanceDashboard component in src/components/maintenance/MaintenanceDashboard.tsx (technician view: overdue + upcoming)
- [ ] T175 [P] [US8] Create MaintenanceReminderBadge component in src/components/maintenance/MaintenanceReminderBadge.tsx (overdue indicator)

### Maintenance Scheduling Logic for User Story 8

- [ ] T176 [US8] Implement time-based schedule calculation (intervalDays/Months/Years)
- [ ] T177 [US8] Implement usage-based schedule calculation (requires usage hours tracking)
- [ ] T178 [US8] Implement event-based schedule calculation (count bookings since last maintenance)
- [ ] T179 [US8] Implement fixed-date schedule calculation (annual recurring)
- [ ] T180 [US8] Add maintenance reminder generation (X days before due date)

### Maintenance Integration for User Story 8

- [ ] T181 [US8] Add maintenance schedule display to AssetDetail
- [ ] T182 [US8] Add maintenance reminder indicator to AssetList
- [ ] T183 [US8] Add "Record Maintenance" button to AssetDetail (opens MaintenanceRecordForm)
- [ ] T184 [US8] Implement automatic next due date update after recording maintenance
- [ ] T185 [US8] Add photo upload support for maintenance records (Mantine Dropzone)
- [ ] T186 [US8] Add maintenance notification system (browser notifications or in-app alerts)

**Checkpoint**: At this point, User Stories 1-8 are complete - users have automated maintenance scheduling with reminders and compliance tracking.

---

## Phase 11: User Story 9 - Filtered Views and Custom Reports (Priority: P3)

**Goal**: Enable users to create saved filtered views and generate reports for utilization, compliance, and asset value.

**Independent Test**: Create saved view "Available Audio Equipment" filtered by category="Audio" AND status="Available", switch to gallery mode, verify view persists after logout.

### Saved Views Data Layer for User Story 9

- [ ] T187 [P] [US9] Create TanStack Query hooks in src/hooks/useSavedViews.ts (useSavedViews, useSavedView, useCreateSavedView, useUpdateSavedView, useDeleteSavedView)
- [ ] T188 [US9] Implement saved view CRUD in ChurchToolsStorageProvider (getSavedViews, createSavedView, updateSavedView, deleteSavedView)
- [ ] T189 [US9] Store saved views in user preferences (ChurchTools user settings or extension storage)

### Filtered Views UI Components for User Story 9

- [ ] T190 [P] [US9] Create ViewModeSelector component in src/components/reports/ViewModeSelector.tsx (table/gallery/calendar/kanban/list toggle)
- [ ] T191 [P] [US9] Create AssetGalleryView component in src/components/assets/AssetGalleryView.tsx (card-based grid)
- [ ] T192 [P] [US9] Create AssetKanbanView component in src/components/assets/AssetKanbanView.tsx (grouped by status)
- [ ] T193 [P] [US9] Create AssetCalendarView component in src/components/assets/AssetCalendarView.tsx (booking timeline)
- [ ] T194 [P] [US9] Create FilterBuilder component in src/components/reports/FilterBuilder.tsx (build multi-condition filters with AND/OR)
- [ ] T195 [P] [US9] Create SavedViewsList component in src/components/reports/SavedViewsList.tsx (display user's saved views)
- [ ] T196 [P] [US9] Create SavedViewForm component in src/components/reports/SavedViewForm.tsx (save current view configuration)

### Advanced Filtering Logic for User Story 9

- [ ] T197 [US9] Implement multi-condition filter evaluation (AND/OR logic)
- [ ] T198 [US9] Implement filter operators (equals, not-equals, contains, starts-with, greater-than, less-than, in, not-in)
- [ ] T199 [US9] Implement custom field filtering (support all custom field types)
- [ ] T200 [US9] Add filter persistence to URL query params (shareable links)
- [ ] T201 [US9] Add grouping logic (group assets by field value)

### Reports for User Story 9

- [ ] T202 [P] [US9] Create ReportList component in src/components/reports/ReportList.tsx (available pre-built reports)
- [ ] T203 [P] [US9] Create AssetUtilizationReport component in src/components/reports/AssetUtilizationReport.tsx (booking frequency, usage hours, idle time)
- [ ] T204 [P] [US9] Create MaintenanceComplianceReport component in src/components/reports/MaintenanceComplianceReport.tsx (overdue vs compliant)
- [ ] T205 [P] [US9] Create StockTakeSummaryReport component in src/components/reports/StockTakeSummaryReport.tsx (found vs missing)
- [ ] T206 [P] [US9] Create BookingHistoryReport component in src/components/reports/BookingHistoryReport.tsx (booking trends over time)
- [ ] T207 [US9] Implement report data calculation logic (aggregate bookings, calculate utilization)
- [ ] T208 [US9] Add report export functionality (CSV, PDF)

### View Integration for User Story 9

- [ ] T209 [US9] Integrate ViewModeSelector with AssetList (switch between table/gallery/kanban/calendar)
- [ ] T210 [US9] Integrate FilterBuilder with AssetList (apply filters to current view)
- [ ] T211 [US9] Add "Save Current View" button to AssetList
- [ ] T212 [US9] Add saved view quick access menu to AssetList
- [ ] T213 [US9] Store view preferences in uiStore (persist view mode, sort, filters)

**Checkpoint**: At this point, ALL USER STORIES (1-9) are complete - users have full inventory management with advanced filtering, reporting, and saved views.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Performance Optimization

- [ ] T214 [P] Implement virtualized tables for large asset lists (mantine-datatable virtualization)
- [ ] T215 [P] Add React.lazy code splitting for all major routes
- [ ] T216 [P] Implement React.memo for expensive components (AssetList, BookingCalendar)
- [ ] T217 [P] Add useMemo for complex filters and calculations
- [ ] T218 [P] Optimize TanStack Query cache times (balance freshness vs API calls)
- [ ] T219 Run bundle size analysis (npm run build -- --analyze)
- [ ] T220 Verify bundle size < 200 KB gzipped (constitution requirement)

### Error Handling & UX

- [ ] T221 [P] Add global error boundary component in src/App.tsx
- [ ] T222 [P] Implement API error retry logic with exponential backoff
- [ ] T223 [P] Add loading skeletons for all async data (Mantine Skeleton)
- [ ] T224 [P] Add empty state messages for all lists (use EmptyState component)
- [ ] T225 [P] Add undo functionality for destructive actions (delete asset, delete booking)
- [ ] T226 Add keyboard shortcuts documentation (modal with all shortcuts)
- [ ] T227 Add accessibility audit (ARIA labels, keyboard navigation)

### Documentation & Developer Experience

- [ ] T228 [P] Add JSDoc comments to all services and utilities
- [ ] T229 [P] Add inline code comments for complex business logic
- [ ] T230 [P] Create API documentation in docs/api.md (ChurchToolsStorageProvider methods)
- [ ] T231 [P] Create component documentation in docs/components.md (major component props)
- [ ] T232 Update quickstart.md with deployment instructions
- [ ] T233 Create user guide in docs/user-guide.md (end-user documentation)

### Testing & Quality Assurance

- [ ] T234 [P] Write unit tests for AssetNumberService in src/services/utils/__tests__/AssetNumberService.test.ts
- [ ] T235 [P] Write unit tests for validation utilities in src/utils/__tests__/validation.test.ts
- [ ] T236 [P] Write unit tests for date formatting in src/utils/__tests__/formatting.test.ts
- [ ] T237 [P] Write integration tests for ChurchToolsStorageProvider in src/services/storage/__tests__/ChurchToolsProvider.test.ts
- [ ] T238 Run quickstart.md validation (follow developer setup guide)
- [ ] T239 Perform cross-browser testing (Chrome, Safari, Firefox)
- [ ] T240 Test on mobile devices (responsive behavior, camera scanning)
- [ ] T241 Test offline functionality (stock take with network disconnection)

### Security & Production Readiness

- [ ] T242 [P] Remove all console.log and debug statements
- [ ] T243 [P] Add .env validation (verify required variables on startup)
- [ ] T244 [P] Implement rate limiting for API calls (respect ChurchTools API limits)
- [ ] T245 [P] Add Content Security Policy headers
- [ ] T246 Audit dependencies for security vulnerabilities (npm audit)
- [ ] T247 Update package.json version number (semver)
- [ ] T248 Create CHANGELOG.md with release notes

**Pre-Deployment Quality Gates**:
- [ ] T249 TypeScript compilation passes with no errors (npx tsc --noEmit)
- [ ] T250 ESLint passes with no warnings (npm run lint)
- [ ] T251 Bundle size verified < 200 KB gzipped
- [ ] T252 Manual testing completed in dev mode
- [ ] T253 Manual testing completed in production mode (embedded in ChurchTools)
- [ ] T254 Cross-browser testing completed
- [ ] T255 Performance budget met (< 1s initial load, < 100ms interactions)
- [ ] T256 All constitution gates pass (type safety, code quality, performance, UX consistency)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Can start after Phase 2 complete
- **User Story 2 (Phase 4)**: Depends on User Story 1 (most implementation shared)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Can start after Phase 2 complete (independent of US1/US2)
- **User Story 4 (Phase 6)**: Depends on User Story 1 (extends asset creation)
- **User Story 5 (Phase 7)**: Depends on User Story 1 (requires assets to book)
- **User Story 6 (Phase 8)**: Depends on User Story 5 (extends booking with kits)
- **User Story 7 (Phase 9)**: Depends on User Story 3 (requires scanning) and User Story 1 (requires assets)
- **User Story 8 (Phase 10)**: Depends on User Story 1 (requires assets to schedule maintenance)
- **User Story 9 (Phase 11)**: Depends on User Story 1 (requires assets to filter/report)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) →
                                          → US1 (P1) → US2 (P1) [extends US1]
                                          ↓           ↓
                                          → US3 (P2) [independent]
                                          ↓
                                          → US4 (P2) [extends US1]
                                          ↓
                                          → US5 (P2) [requires US1] → US6 (P3) [extends US5]
                                          ↓
                                          → US7 (P3) [requires US1, US3]
                                          ↓
                                          → US8 (P3) [requires US1]
                                          ↓
                                          → US9 (P3) [requires US1]
```

### Recommended Implementation Order

**Option A: MVP First (Fastest to Value)**
1. Setup (Phase 1)
2. Foundational (Phase 2) ← **CRITICAL BLOCKER**
3. User Story 1 (Basic Assets) ← **MVP CORE**
4. User Story 2 (Custom Fields) ← **Completes MVP**
5. **STOP and VALIDATE** - Deploy MVP
6. User Story 5 (Bookings) ← **High value P2**
7. User Story 3 (Scanning) ← **High value P2**
8. Remaining stories as needed

**Option B: Priority Order (By Spec)**
1. Setup + Foundational
2. US1 + US2 (both P1 - asset management foundation)
3. US3, US4, US5 (all P2 - can parallelize if team capacity)
4. US6, US7, US8, US9 (all P3 - can prioritize based on user feedback)

**Option C: Parallel Teams**
1. Setup + Foundational (whole team)
2. Split teams after Phase 2:
   - Team A: US1 → US2 → US4 (asset management track)
   - Team B: US3 (scanning - independent)
   - Team C: US5 → US6 (booking track)
3. Merge and integrate
4. Team D: US7, US8, US9 (advanced features)

### Parallel Opportunities

**Within Foundational Phase** (all can run in parallel after T016-T018 complete):
- T019-T021: API client
- T022-T025: Storage providers
- T026-T028: Utilities
- T029-T030: State stores
- T031-T034: Common components
- T035-T037: Custom hooks

**Within User Story 1** (parallel groups):
- T042-T045: Category UI (after T046 complete for testing)
- T047-T052: Asset UI (after T053-T055 complete for testing)
- T056-T057: Change history UI (after T058 complete)

**Across User Stories** (after Foundational complete):
- US3 (scanning) is independent of US1/US2 - can parallelize
- US4 (parent-child) and US5 (bookings) both depend on US1 but not each other - can parallelize after US1

---

## Parallel Example: Foundational Phase

```bash
# After type definitions are in place (T016-T018), launch all service layers in parallel:

Team Member 1: T019-T021 (ChurchTools API client + error handling)
Team Member 2: T022-T025 (Storage providers + Dexie DB)
Team Member 3: T026-T028 (Utilities: formatting, validation, asset numbering)
Team Member 4: T029-T030 (Zustand stores: UI state + scanner state)
Team Member 5: T031-T034 (Common components: Loading, Error, Empty, Confirm)
Team Member 6: T035-T037 (Custom hooks: storage provider, online status, current user)
```

---

## Parallel Example: User Story 1

```bash
# After storage provider methods are implemented (T046, T053-T055, T058), launch all UI in parallel:

Team Member 1: T042-T045 (Category management UI)
Team Member 2: T047-T052 (Asset management UI)
Team Member 3: T056-T057 (Change history UI)
Team Member 4: T059-T063 (Integration: routing, navigation, notifications)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T015) ← ~2-4 hours
2. Complete Phase 2: Foundational (T016-T041) ← **CRITICAL** ~8-16 hours
3. Complete Phase 3: User Story 1 (T042-T063) ← ~16-24 hours
4. Complete Phase 4: User Story 2 (T064-T075) ← ~8-12 hours
5. **STOP and VALIDATE**: Test MVP independently
6. Deploy/demo basic asset management with custom fields
7. Gather user feedback before continuing

**MVP Scope**: Basic asset tracking with custom categories and fields. Users can:
- Create asset categories with custom field definitions
- Create/edit/delete assets with custom field values
- View asset lists with filtering and sorting
- See change history for audit trail
- This delivers immediate value for basic inventory tracking

### Incremental Delivery (Add Stories Sequentially)

1. MVP (US1 + US2) → Test → Deploy
2. Add US5 (Bookings) → Test → Deploy (now have reservation system)
3. Add US3 (Scanning) → Test → Deploy (now have barcode/QR support)
4. Add US4 (Parent-Child) → Test → Deploy (now have bulk asset creation)
5. Add US7 (Stock Take) → Test → Deploy (now have physical inventory audits)
6. Add US8 (Maintenance) → Test → Deploy (now have compliance tracking)
7. Add US6 + US9 as needed (kits + advanced reporting)

**Benefit**: Each increment adds value without breaking previous functionality. Users can start using the system early and provide feedback.

### Parallel Team Strategy (If 3+ Developers)

**Week 1**: Whole team on Setup + Foundational (T001-T041)
- **Checkpoint**: Foundation ready, constitution gates pass

**Week 2**: Split into tracks
- **Track A** (2 devs): US1 + US2 (Asset Management)
- **Track B** (1 dev): US3 (Scanning)

**Week 3**: Merge and integrate
- **Checkpoint**: MVP ready with scanning support

**Week 4**: Split again
- **Track A** (2 devs): US5 + US6 (Booking + Kits)
- **Track B** (1 dev): US4 (Parent-Child)

**Week 5**: Final features
- **Track A** (1 dev): US7 (Stock Take)
- **Track B** (1 dev): US8 (Maintenance)
- **Track C** (1 dev): US9 (Reports)

**Week 6**: Polish + Testing + Deployment
- Whole team on Phase 12 (Polish) and quality gates

---

## Task Count Summary

| Phase | Task Count | User Story | Priority |
|-------|-----------|------------|----------|
| Phase 1: Setup | 15 tasks | N/A | Foundation |
| Phase 2: Foundational | 26 tasks | N/A | Foundation ⚠️ BLOCKER |
| Phase 3: User Story 1 | 22 tasks | Basic Asset Creation | P1 🎯 MVP |
| Phase 4: User Story 2 | 12 tasks | Custom Categories/Fields | P1 🎯 MVP |
| Phase 5: User Story 3 | 16 tasks | Barcode/QR Scanning | P2 |
| Phase 6: User Story 4 | 13 tasks | Multi-Asset (Parent-Child) | P2 |
| Phase 7: User Story 5 | 24 tasks | Booking & Reservation | P2 |
| Phase 8: User Story 6 | 18 tasks | Equipment Kits | P3 |
| Phase 9: User Story 7 | 20 tasks | Stock Take & Audits | P3 |
| Phase 10: User Story 8 | 20 tasks | Maintenance Scheduling | P3 |
| Phase 11: User Story 9 | 27 tasks | Filtered Views & Reports | P3 |
| Phase 12: Polish | 43 tasks | Cross-Cutting | Final |
| **TOTAL** | **256 tasks** | 9 user stories | |

### Parallel Opportunities Identified

- **Setup Phase**: 7 parallel tasks (T003-T007, T010-T011, T013-T015)
- **Foundational Phase**: 22 parallel tasks (most of T016-T037)
- **User Story Phases**: 30+ tasks can run in parallel within each story
- **Cross-Story**: US3, US4, US5 can run in parallel after US1 complete

### MVP Scope

**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 + Phase 4
- **Total**: 75 tasks (15 + 26 + 22 + 12)
- **Estimated Effort**: 40-60 developer hours
- **Delivers**: Complete basic asset management with custom fields
- **Value**: Organizations can immediately start tracking inventory

---

## Constitution Compliance Summary

All tasks designed to comply with project constitution v1.0.0:

✅ **Type Safety First**: TypeScript strict mode enforced (T009, T038), all contracts typed (T016-T018)  
✅ **User Experience Consistency**: Mantine UI configured to match ChurchTools (T013), responsive design throughout  
✅ **Code Quality**: ESLint configured (T010, T039), JSDoc required (T228), < 50 line functions encouraged  
✅ **Performance Budget**: Bundle size monitored (T041, T219-T220), code splitting implemented (T215), virtualization added (T214)  
✅ **Testing Strategy**: Manual testing required (T238-T241), automated tests for complex logic (T234-T237)  
✅ **Maintainability**: Feature-based organization, clear separation of concerns, comprehensive documentation (T228-T233)

---

## Notes

- **[P] marker**: Task can run in parallel with others in its phase (different files, no dependencies)
- **[Story] label**: Maps task to specific user story (US1-US9) for traceability and independent testing
- **Checkpoint comments**: Natural stopping points to validate story independently before proceeding
- **MVP indicators 🎯**: Tasks that are part of the minimum viable product
- **Blocker indicators ⚠️**: Tasks that block other work from starting

**Development Approach**:
- Commit after each task or logical group of tasks
- Run TypeScript compilation and ESLint after each phase
- Test user stories independently at checkpoints
- Measure bundle size frequently (especially after adding libraries)
- Use TanStack Query DevTools during development for cache inspection
- Use React DevTools for component performance profiling

**Remember**: Each user story should be independently completable and testable. Avoid creating dependencies between stories unless absolutely necessary. This enables incremental delivery and parallel development.

---

**Generated**: 2025-10-19  
**Total Tasks**: 256  
**User Stories**: 9 (2x P1, 3x P2, 4x P3)  
**MVP Scope**: 75 tasks (US1 + US2)  
**Constitution**: v1.0.0 compliant ✅
