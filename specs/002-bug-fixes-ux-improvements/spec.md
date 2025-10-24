# Feature Specification: Bug Fixes & UX Improvements

**Feature Branch**: `002-bug-fixes-ux-improvements`  
**Created**: October 22, 2025  
**Status**: Draft  
**Input**: User description: "Bug fixes and UX improvements from user testing: routing, person search, bookings, and data management enhancements"

> NOTE: Per project constraints, photo upload/storage/gallery features and offline sync tasks are DEFERRED/REMOVED from the active implementation scope due to ChurchTools customdata size/line limitations. The specification retains historical references for traceability, but these features are not part of the active workplan and the codebase contains disabled stubs where appropriate. Re-introduction requires an approved migration plan and ChurchTools Files API support.

## Clarifications

### Session 2025-10-22

- Q: When two users simultaneously attempt to book the same asset for overlapping time periods, how should the system handle this race condition? → A: Last-write-wins with validation: Both requests validated, second request fails with friendly error asking user to select different dates
- Q: Who should be allowed to book assets on behalf of other people (FR-010)? This affects security and audit requirements. → A: Any authenticated user can book for anyone (current implementation); future: migrate to admin users and designated booking coordinators when ChurchTools introduces plugin permissions management
- Q: When offline scans are synced and conflicts are detected (asset was modified/deleted online during offline period), how should the system resolve this? → A: Present conflicts to user for manual resolution with side-by-side comparison
- Q: For image optimization before storage (FR-052), what compression approach should be used to balance quality and file size? → A: Two-tier: Aggressive for thumbnails (70% quality, 400px), moderate for full-size (85% quality, 2048px)
- Q: When a schema migration fails (User Story 7), what should be the rollback and recovery strategy? → A: Automatic rollback: Rollback failed migration, preserve all data, retry migration on next application load with logged error details

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Navigation and Page Refresh (Priority: P0)

Users need to navigate the application freely using browser controls without encountering errors or broken states.

**Why this priority**: This is the most critical issue blocking all users from basic application usage. Without working navigation, the application is fundamentally broken.

**Independent Test**: Can be fully tested by navigating to any page in the application, refreshing the browser, and using back/forward buttons. Delivers core navigation functionality.

**Acceptance Scenarios**:

1. **Given** user is on any page, **When** they refresh the browser, **Then** the page reloads successfully without errors
2. **Given** user has navigated through multiple pages, **When** they click browser back button, **Then** they return to previous page correctly
3. **Given** user has clicked back, **When** they click forward, **Then** they return to the newer page
4. **Given** external link with deep URL, **When** user clicks it, **Then** application loads correct page directly

---

### User Story 2 - Person Search for Bookings (Priority: P0)

Users need to search for people in ChurchTools when creating bookings, both to identify who is making the booking and who the asset is being booked for.

**Why this priority**: Critical functionality for the booking system to work properly. Without person search, bookings cannot accurately track who is involved.

**Independent Test**: Can be tested by opening booking form, searching for a person by name, and selecting them from results. Delivers searchable person selection.

**Acceptance Scenarios**:

1. **Given** booking form is open, **When** user types person name in search field, **Then** matching people from ChurchTools appear in dropdown
2. **Given** search results displayed, **When** user selects a person, **Then** person is populated in the form field with avatar
3. **Given** user types quickly, **When** multiple keystrokes entered, **Then** search is debounced to prevent excessive API calls
4. **Given** person was previously searched, **When** same search performed again, **Then** cached results appear instantly

---

### User Story 3 - Book Asset for Another Person (Priority: P1)

Users with permission need to create bookings on behalf of other people, clearly distinguishing between who made the booking and who will use the asset.

**Why this priority**: Essential for administrative users and support staff who handle bookings for others. Enables proper delegation and tracking.

**Independent Test**: Can be tested by creating a booking where "booked by" and "booking for" are different people. Delivers the ability to book on behalf of others.

**Acceptance Scenarios**:

1. **Given** booking form open, **When** user selects different person in "Booking For" field, **Then** both booker and recipient are clearly shown
2. **Given** booking created for another person, **When** viewing booking history, **Then** both people are displayed distinctly
3. **Given** booking made on behalf of someone, **When** filtering bookings, **Then** can filter by either booker or recipient
4. **Given** booking for another person, **When** notifications sent, **Then** both people receive appropriate notifications

---

### User Story 4 - Smart Date and Time Booking (Priority: P1)

Users need flexible options to book assets: either for a single day with specific times, or for multiple days with optional times.

**Why this priority**: Improves booking UX significantly and handles real-world use cases like "book projector from 9am-5pm today" vs "book camera for entire weekend".

**Independent Test**: Can be tested by toggling between single day and date range modes, setting times, and verifying bookings are created correctly. Delivers flexible booking time options.

**Acceptance Scenarios**:

1. **Given** booking form open, **When** user selects "Single Day" mode, **Then** one date picker and two time pickers appear
2. **Given** single day mode selected, **When** user sets start time later than end time, **Then** validation error displays
3. **Given** booking form open, **When** user selects "Date Range" mode, **Then** start date and end date pickers appear with optional times
4. **Given** date range booking created, **When** viewing calendar, **Then** booking spans all days in range
5. **Given** single day booking with times created, **When** viewing calendar, **Then** booking shows specific time block

---

### User Story 5 - Asset Availability Filtering (Priority: P1)

Users need to see only available assets when creating bookings, preventing double-booking and scheduling conflicts.

**Why this priority**: Prevents user frustration and booking conflicts. Essential for maintaining accurate asset scheduling.

**Independent Test**: Can be tested by attempting to book an asset that's already booked for a date range, and verifying it doesn't appear in available list. Delivers conflict prevention.

**Acceptance Scenarios**:

1. **Given** asset is already booked for date range, **When** user selects same dates in booking form, **Then** asset doesn't appear in available list
2. **Given** asset is in maintenance, **When** user creates booking during maintenance period, **Then** asset marked unavailable with reason
3. **Given** asset marked as broken, **When** user searches for bookable assets, **Then** broken asset excluded from results
4. **Given** asset becomes unavailable while form open, **When** user tries to submit, **Then** validation error displays with explanation

---

### User Story 6 - Asset Images and Visual Identification (Priority: P3)

Users need to upload and view images of assets to quickly identify items visually, especially useful for similar-looking equipment.

**Why this priority**: Enhances user experience and reduces confusion, but not critical for core functionality.

**Independent Test**: Can be tested by uploading images to an asset, setting a main image, and verifying gallery view shows images. Delivers visual asset identification.

**Acceptance Scenarios**:

1. **Given** asset form open, **When** user uploads image files, **Then** images are added to asset
2. **Given** multiple images uploaded, **When** user clicks "Set as Main", **Then** image becomes featured/primary
3. **Given** asset has images, **When** viewing in gallery mode, **Then** main image displays on asset card
4. **Given** asset detail page open, **When** viewing images section, **Then** all images displayed in gallery
5. **Given** large image uploaded, **When** image saved, **Then** image is optimized/compressed for performance

---

### User Story 7 - Data Schema Evolution (Priority: P3)

System administrators need the application to handle data schema changes gracefully as new versions are released, without losing existing data.

**Why this priority**: Future-proofs the application for updates and migrations, but not immediately necessary.

**Independent Test**: Can be tested by simulating a schema version change and verifying data migrates correctly. Delivers upgrade resilience.

**Acceptance Scenarios**:

1. **Given** data with older schema version, **When** application loads, **Then** migrations run automatically to update schema
2. **Given** migration required, **When** migration runs, **Then** existing data is preserved and transformed correctly
3. **Given** multiple version jumps needed, **When** migrations run, **Then** all intermediate migrations execute in sequence
4. **Given** migration fails, **When** error occurs, **Then** rollback prevents data corruption

---

### User Story 8 - Photo Storage Migration Path (Priority: P3)

System administrators need the ability to migrate from base64-encoded photos to ChurchTools Files module without breaking existing data or requiring downtime.

**Why this priority**: Optimizes storage and performance for installations with many photos, but existing base64 implementation works adequately.

**Independent Test**: Can be tested by configuring Files module, uploading new photos via Files API, and verifying old base64 photos still display correctly. Delivers storage flexibility.

**Acceptance Scenarios**:

1. **Given** system configured with Files module enabled, **When** user uploads new photo, **Then** photo is stored using Files API and displays correctly
2. **Given** asset has mix of base64 and Files module photos, **When** user views asset, **Then** all photos display correctly regardless of storage method
3. **Given** migration script running, **When** base64 photo is migrated to Files, **Then** photo remains accessible and asset is updated with new file ID
4. **Given** system needs to rollback, **When** Files module is disabled, **Then** system falls back to base64 storage without data loss

---

### User Story 9 - Development and Deployment Workflow (Priority: P2)

Developers need a smooth workflow from local development through to production deployment, including hot-reload for rapid iteration and proper CORS configuration.

**Why this priority**: Essential for development efficiency and proper deployment, but infrastructure-focused rather than user-facing.

**Independent Test**: Can be tested by running `npm run dev`, making changes to see hot-reload, building with `npm run build`, and deploying with `npm run deploy`. Delivers complete dev-to-prod workflow.

**Acceptance Scenarios**:

1. **Given** developer runs development server, **When** code changes are saved, **Then** browser automatically reloads with changes
2. **Given** ChurchTools CORS configured, **When** local dev server makes API calls, **Then** requests succeed without CORS errors
3. **Given** production build created, **When** running preview server, **Then** build works correctly in production-like environment
4. **Given** deployment package created, **When** uploaded to ChurchTools, **Then** extension installs and runs successfully within 20MB limit

---

### User Story 10 - Offline Stock Take with Sync (Priority: P2)

Users conducting physical inventory need to scan assets offline in warehouse/field locations, then sync data when internet connection is restored.

**Why this priority**: Enables inventory in areas without reliable connectivity, important for physical stock takes but not blocking core features.

**Independent Test**: Can be tested by starting stock take session, going offline, scanning multiple assets, reconnecting, and verifying scans sync to server. Delivers offline capability.

**Acceptance Scenarios**:

1. **Given** stock take session started while online, **When** user goes offline, **Then** scanning continues using IndexedDB storage
2. **Given** assets scanned offline, **When** scans are saved, **Then** data persists in local IndexedDB without errors
3. **Given** offline scans completed, **When** connection restored, **Then** system automatically syncs scans to ChurchTools API
4. **Given** sync in progress, **When** sync completes, **Then** local IndexedDB data is cleared and user sees confirmation

---

### Edge Cases

- What happens when user refreshes during form submission?
- How does system handle ChurchTools API being unavailable during person search?
- What if user tries to book asset for dates in the past?
- How does system handle asset being deleted while booking form is open?
- What if two users try to book the same asset for same time simultaneously?
- How does system handle extremely large image uploads (>5MB)?
- What if schema migration takes longer than expected?
- What happens when asset prefix creation conflicts with existing prefixes?
- How does system handle maintenance records with invalid date ranges?
- What if kit contains child assets that are individually booked?
- What happens when photo migration fails mid-process?
- How does system handle Safari cookie restrictions in development mode?
- What if offline sync fails due to conflicting changes made online?
- What happens when ChurchTools Files module quota is exceeded?
- How does system handle dev container initialization failures?

## Requirements *(mandatory)*

### Functional Requirements

#### Critical Navigation & Routing (P0)

- **FR-001**: System MUST properly handle browser refresh on all application routes without showing 404 errors (caused by incorrect base path configuration)
- **FR-002**: System MUST support browser back and forward navigation correctly
- **FR-003**: System MUST handle deep links from external sources to any application page
- **FR-004**: System MUST configure base path `/ccm/fkoinventorymanagement/` in both Vite build (`base` option) and React Router (`basename` prop)

#### Person Search Integration (P0)

- **FR-005**: System MUST integrate with ChurchTools search API endpoint `/api/search?query={query}&domain_types[]=person`
- **FR-006**: System MUST debounce person search requests with minimum 300ms delay
- **FR-007**: System MUST cache person search results to minimize API calls
- **FR-008**: System MUST display person avatars from ChurchTools in all person selection contexts
- **FR-009**: System MUST show person avatars in: booking forms, custom fields, history entries, maintenance records, and asset details

#### Booking Enhancements (P0-P1)

- **FR-010**: System MUST allow users to book assets on behalf of other people with distinct "booked by" and "booking for" fields
- **FR-010a**: System MUST allow any authenticated user to book for anyone in current implementation; MUST provide abstraction layer to support future role-based restrictions when ChurchTools plugin permissions become available
- **FR-011**: System MUST pre-populate asset field when booking initiated from asset detail page
- **FR-012**: System MUST provide toggle between "single day" and "date range" booking modes
- **FR-013**: System MUST support time selection for single day bookings (start time and end time)
- **FR-014**: System MUST support optional time selection for date range bookings
- **FR-015**: System MUST filter asset picker to show only available assets for selected date range
- **FR-016**: System MUST check asset availability against existing bookings, maintenance schedules, and asset status
- **FR-016a**: System MUST prevent simultaneous booking conflicts by validating availability at submission time and rejecting second booking with user-friendly error message
- **FR-017**: System MUST add `bookable` boolean field to assets to control booking eligibility
- **FR-018**: System MUST use "Declined" status when approver rejects booking, not "Cancelled"
- **FR-019**: System MUST use "Cancelled" status only when requester cancels their own booking

#### Language & Localization (P1)

- **FR-020**: System MUST display all booking-related text in English
- **FR-021**: System MUST translate all status labels (Approved, Pending, Declined, Cancelled) to English
- **FR-022**: System MUST use English for all error messages and validation text

#### API Error Fixes (P0)

- **FR-023**: System MUST successfully create asset prefixes without 400 errors
- **FR-024**: System MUST successfully create maintenance records without 500 errors
- **FR-025**: System MUST properly format API requests according to ChurchTools API specifications (Content-Type: application/json header, snake_case field names, ISO 8601 dates)
- **FR-026**: System MUST provide clear error messages when API operations fail (format: "Could not [action]: [reason]. [suggestion]" - e.g., "Could not create booking: Asset is already booked for this time. Please select different dates.")

#### Kit Management Fixes (P0)

- **FR-027**: System MUST successfully display kit detail pages without "kit not found" errors
- **FR-028**: System MUST successfully create new kits without errors
- **FR-029**: System MUST display only one "New Kit" button in appropriate location
- **FR-030**: System MUST properly handle kit ID parameters in routes

#### Report Navigation (P0)

- **FR-031**: System MUST navigate to selected report when user clicks report in list
- **FR-032**: System MUST display report content, not redirect to dashboard
- **FR-033**: System MUST support all four report types correctly

#### UI/UX Improvements (P2)

- **FR-034**: System MUST provide clear date picker with visual feedback for start, end, and selection states
- **FR-035**: System MUST allow easy reset of date selection
- **FR-036**: System MUST eliminate React key warnings in StockTakeReport component
- **FR-037**: System MUST make table rows clickable to open default detail view
- **FR-038**: System MUST show hover effect on clickable rows
- **FR-039**: System MUST implement actual calendar component in calendar view using established library
- **FR-040**: System MUST display bookings on calendar dates with color coding by status
- **FR-041**: System MUST provide scanner dropdown selection in quick scan modal
- **FR-042**: System MUST persist scanner selection preference

#### Settings & Configuration (P2)

- **FR-043**: System MUST remove obsolete "Asset Numbering" settings tab (legacy term, now called "Asset Prefixes")
- **FR-044**: System MUST keep only "Asset Prefixes" in settings
- **FR-045**: System MUST provide dropdown with search for Manufacturer and Model fields
- **FR-046**: System MUST allow creation of new manufacturers/models inline during asset creation
- **FR-047**: Stock take sessions MUST have "Name/Reason" field (single line, required) instead of "Note"

#### Advanced Features (P3)

- **FR-048**: System MUST support uploading multiple images per asset
- **FR-049**: System MUST allow setting one image as main/featured image per asset
- **FR-050**: System MUST display main image in gallery view asset cards
- **FR-051**: System MUST store images using ChurchTools file API
- **FR-052**: ~~System MUST optimize/compress uploaded images before storage~~ *(superseded by FR-052a)*
- **FR-052a**: System MUST use two-tier compression: aggressive for thumbnails (70% quality JPEG, 400px max width) and moderate for full-size images (85% quality JPEG, 2048px max width)
- **FR-053**: System MUST support collapsible/expandable child asset lists
- **FR-054**: System MUST persist collapse/expand preference for child assets
- **FR-055**: System MUST include schema version field in all data entities
- **FR-056**: System MUST run data migrations automatically when schema version changes
- **FR-057**: System MUST maintain backward compatibility during schema migrations
- **FR-057a**: System MUST rollback failed migrations automatically, preserve all data, log detailed error information, and retry migration on next application load
- **FR-058**: System MUST support template-based automatic asset name generation from fields
- **FR-059**: System MUST allow manual override of auto-generated asset names
- **FR-060**: System MUST replace icon system with Material Design Icons (MDI)
- **FR-061**: System MUST provide dedicated management pages for manufacturers and models

#### Documentation (P2)

- **FR-062**: Project MUST consolidate scattered markdown files into organized specs/ directory structure
- **FR-063**: Documentation MUST include: CONSTITUTION.md, SPECIFICATIONS.md, IMPLEMENTATION.md, TASKS.md, and CHANGELOG.md
- **FR-064**: System MUST remove obsolete scattered markdown files after consolidation

#### Photo Storage & Performance (P3)

- **FR-065**: System MUST provide abstraction layer (IPhotoStorage interface) supporting both base64 and ChurchTools Files storage
- **FR-066**: System MUST maintain backward compatibility when migrating from base64 photos to Files module
- **FR-067**: System MUST validate uploaded photo file types (JPEG, PNG, WebP only)
- **FR-068**: System MUST enforce file size limits (maximum 5MB per photo)
- **FR-069**: System MUST detect legacy base64 photos and display them correctly alongside Files module photos
- **FR-070**: System MUST provide migration script to convert base64 photos to Files module storage

#### Development Workflow (P2)

- **FR-071**: System MUST support hot-reload development server for rapid iteration
- **FR-072**: System MUST provide clear CORS configuration instructions for local development
- **FR-073**: System MUST support Safari browser with proper cookie handling in development
- **FR-074**: System MUST support dev container configuration for consistent development environment
- **FR-075**: System MUST provide build and deployment workflow within ChurchTools 20MB size limit
- **FR-076**: System MUST include preview server to test production builds locally

#### Offline Capability (P2)

- **FR-077**: System MUST support offline stock take scanning using IndexedDB storage
- **FR-078**: System MUST automatically sync offline scans when connection is restored
- **FR-079**: System MUST persist offline data reliably and prevent data loss during sync
- **FR-080**: System MUST provide clear visual indicators for offline/online status
- **FR-081**: System MUST handle sync conflicts when data changes online during offline period
- **FR-081a**: System MUST present sync conflicts to user for manual resolution with side-by-side comparison of offline and online data

#### API Integration (P0)

- **FR-082**: System MUST use ChurchTools Custom Modules API for all data persistence
- **FR-083**: System MUST support all CRUD operations on custom data categories and values
- **FR-084**: System MUST format API requests according to ChurchTools API specifications (REDUNDANT - covered by FR-025, consolidate)
- **FR-085**: System MUST handle API errors gracefully with user-friendly messages (never show raw HTTP status codes or JSON error objects to users - see FR-026 for message format)

### Key Entities

- **Booking**: Represents asset reservation with booking person, recipient person, asset, date range, optional times, status
- **Person**: ChurchTools user with avatar, searchable by name via API
- **Asset**: Physical item with optional images, bookable flag, availability status, manufacturer, model
- **AssetImage**: Image file associated with asset, with main/featured designation (stored as base64 or Files module reference)
- **AssetPrefix**: Configuration for automatic asset numbering within categories
- **Kit**: Collection of related assets treated as single bookable unit
- **MaintenanceRecord**: Scheduled or completed maintenance on asset
- **StockTakeSession**: Inventory verification session with name/reason and completion date (supports offline operation)
- **SchemaVersion**: Version identifier for data entity schemas enabling migrations
- **PhotoStorage**: Abstraction for photo storage supporting both base64 encoding and ChurchTools Files module
- **CustomDataCategory**: ChurchTools API entity for organizing custom module data
- **CustomDataValue**: ChurchTools API entity for storing individual data records
- **OfflineCache**: IndexedDB storage for offline stock take operations
- **Kit**: Collection of related assets treated as single bookable unit
- **MaintenanceRecord**: Scheduled or completed maintenance on asset
- **StockTakeSession**: Inventory verification session with name/reason and completion date
- **SchemaVersion**: Version identifier for data entity schemas enabling migrations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can refresh any page in application without encountering errors (100% of routes work)
- **SC-002**: Users can find and select people from ChurchTools in under 3 seconds using person search
- **SC-003**: Users can create bookings on behalf of others with clear distinction between booker and recipient visible in all views
- **SC-004**: Users can complete single-day booking with specific times in under 60 seconds
- **SC-005**: Users cannot accidentally double-book assets - system prevents conflicts 100% of time
- **SC-006**: Asset prefix creation succeeds without errors 100% of time
- **SC-007**: Maintenance record creation succeeds without errors 100% of time
- **SC-008**: Kit detail pages load successfully 100% of time
- **SC-009**: Report navigation works correctly 100% of time - no redirects to dashboard
- **SC-010**: All booking interface text displays in English (0 German text remaining)
- **SC-011**: Date picker provides clear visual feedback with successful date selection on first attempt 90% of time
- **SC-012**: Browser console shows zero errors and zero warnings during normal application use
- **SC-013**: Users can identify assets visually in gallery view when images are provided
- **SC-014**: Application handles schema version upgrades automatically without data loss
- **SC-015**: Root directory contains fewer than 10 markdown files after documentation consolidation
- **SC-016**: Table rows throughout application respond to clicks with appropriate navigation
- **SC-017**: Calendar view displays actual calendar with bookings visible on appropriate dates
- **SC-018**: Users can complete asset creation with new manufacturer/model inline in under 2 minutes
- **SC-019**: "Declined" status displays for approver-rejected bookings, "Cancelled" only for self-cancelled bookings
- **SC-020**: Application builds successfully with bundle size under 5MB warning threshold
- **SC-021**: Photos can be migrated from base64 to Files module without any photos becoming inaccessible
- **SC-022**: Development server starts in under 10 seconds with hot-reload functional
- **SC-023**: Safari browser works correctly in development mode with proper authentication
- **SC-024**: Users can scan assets offline and sync successfully when connection restored (100% data integrity)
- **SC-025**: Deployment package is created and uploaded to ChurchTools within 20MB limit
- **SC-026**: All 172+ components remain accessible after bug fixes (no regressions)
- **SC-027**: Users can upload photos up to 5MB with validation preventing larger files
- **SC-028**: System displays clear offline/online status indicators visible within 2 seconds of status change
- **SC-029**: API operations provide user-friendly error messages (no raw error codes shown to users)
- **SC-030**: Dev container initializes successfully and provides consistent environment across all developer machines
- **SC-031**: Error messages follow format "Could not [action]: [reason]. [suggestion]" 100% of time (no raw HTTP status codes or JSON objects shown)

