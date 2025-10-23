# Feature Specification: ChurchTools Inventory Management Extension

**Feature Branch**: `001-inventory-management`  
**Created**: 2025-10-18  
**Status**: Draft  
**Input**: User description: "ChurchTools Inventory Management Extension - Comprehensive inventory management extension for ChurchTools enabling asset tracking, booking, barcode/QR code integration, kit management, maintenance scheduling, and stock take functionality."

## Clarifications

### Session 2025-10-19

- Q: How should asset number prefixes be managed across different equipment categories? → A: Single global prefix per organization (e.g., CHT-001, CHT-002), with sequence incrementing across all categories
- Q: Who has permission to approve bookings and manage assets? → A: Use ChurchTools' existing permission system (view/create/edit/delete permissions for categories and data). Plan for future granular permissions by category/label/prefix for asset editing and booking management
- Q: How long should historical data (bookings, maintenance records, change history) be retained? → A: Indefinite retention (never auto-delete)
- Q: What is the data synchronization strategy for offline stock take scanning? → A: Queue-based sync with conflict resolution (detect and resolve conflicts)
- Q: How should maintenance reminders be delivered to users? → A: Use ChurchTools' native notification system

### Session 2025-10-20

- Q: Who can approve bookings and what is the approval workflow? → A: Users with "edit data in categories" permission can approve any booking (including their own for now). Design the permission checking system to be easily changeable when ChurchTools adds more granular extension permissions. Note: ChurchTools handles permissions internally through its permission system API - query permissions at runtime rather than caching them.
- Q: How should maintenance photos be stored and accessed? → A: Store photos as base64 strings (compressed) in Custom Module data category fields for now. Implement client-side compression before encoding (max 1920px width, 85% quality JPEG). Design the storage layer to be easily replaceable when ChurchTools extensions get better access to the Files module and file permissions.
- Q: When should flexible kit assets be allocated - at booking creation (Pending) or at approval? → A: Use lazy allocation. Flexible kit bookings in "Pending" status do NOT allocate specific assets. System validates sufficient pool assets exist at booking creation. Actual asset allocation happens when booking is approved. If insufficient assets available at approval time, show error requiring re-booking. Administrators can manually select specific assets during approval process.
- Q: Should stock take sessions support multiple concurrent users? → A: Use shared sessions model. Multiple users can contribute scans to a single stock take session for team-based audits. Implement real-time collaboration with optimistic updates showing "Scanned by [User] at [Time]" for each asset. Session creator owns the session and can close it to generate the final report. All users with view permissions can see live scan progress.
- Q: How should custom field schema changes be handled (deleting fields, changing types, adding required fields)? → A: Use permissive with warnings approach. Deleting fields: show warning with count of affected assets, allow deletion, data is soft-deleted (retained but hidden). Changing field types: prevent if incompatible (e.g., Text→Number with non-numeric data), allow with validation warning otherwise. Adding required fields to categories with existing assets: allow but existing assets get null value, show banner prompting bulk update. Renaming fields: allow freely (internal field ID remains constant, only display name changes).
- Q: How should asset locations be managed and entered? → A: Locations should be pre-defined and managed in a dedicated settings menu (similar to asset prefix configuration). When entering an asset's location field, provide searchable autocomplete from existing locations with option to create new location inline if not found. This ensures consistency while allowing flexibility.

### Session 2025-10-20 (Analysis Follow-up)

- Q: How should asset identification work - should the unique database ID be the same as the barcode/QR code number? → A: Use dual identification system. **Asset ID** = unique database identifier with custom prefix (e.g., CHT-001) used for database lookups, URLs, and system references. **Barcode Number** = separate scannable code (can be random number) printed on physical labels for quick physical identification. When scanning, system looks up asset by barcode number. This allows flexibility to reprint damaged labels with new barcode numbers without changing the asset's permanent ID.
- Q: What field type changes are compatible vs incompatible? → A: **Compatible changes** (allowed with warning): Text↔LongText, Number→Text, Date→Text, any→LongText. **Incompatible changes** (blocked with error): Text→Number (if non-numeric data exists), Text→Date (if non-date data exists), LongText→Number, LongText→Date, complex types (Select, MultiSelect) to simple types if options would be lost. System validates data before allowing type change.
- Q: How should offline sync work specifically? → A: **Sync triggers**: Immediate on network reconnection, polling every 30 seconds if sync queue non-empty. **Retry strategy**: Exponential backoff (1s, 2s, 4s, 8s, 16s) for failed syncs, max 5 retries before requiring manual intervention. **Conflict resolution**: Server state takes precedence for asset properties (optimistic merge), but offline scans are always preserved (append-only for stock take data). User notified of conflicts requiring attention.

## Terminology & Glossary

**Asset ID**: The permanent unique identifier for an asset in the database (e.g., CHT-001, CHT-002). Used for system references, URLs, and database lookups. Never changes once assigned. Uses the organization's configured prefix.

**Barcode Number**: The scannable code printed on physical asset labels. Can be different from Asset ID. Can be regenerated if label is damaged. Used for physical identification during stock takes, check-out/check-in, and quick asset lookup. May be a random number or sequential number independent of Asset ID.

**Asset Number**: When used in UI/documentation without qualification, refers to the **Asset ID** (the permanent database identifier). When specifically referring to the physical scannable code, use "Barcode Number" or "QR Code".

**Scanning**: The act of reading a barcode/QR code using a physical scanner or camera. System uses the scanned Barcode Number to look up the corresponding asset by Asset ID.

**Stock Take Session**: A physical inventory audit where users scan assets to verify presence and location. Multiple users can contribute to a single session.

**Custom Field Type Compatibility**:
- **Compatible** (with warning): Text↔LongText, Number→Text, Date→Text, any→LongText
- **Incompatible** (blocked): Text→Number (if non-numeric data), Text→Date (if invalid dates), LongText→Number, LongText→Date, Select/MultiSelect→Text (loses options)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Asset Creation and Tracking (Priority: P1)

Equipment managers need to create and track physical assets with unique identifiers, custom properties, and status management to maintain accountability for organizational equipment.

**Why this priority**: This is the foundation of the entire system. Without the ability to create and track assets, no other functionality can exist. It delivers immediate value by providing a centralized inventory database.

**Independent Test**: Can be fully tested by creating various asset types (microphones, projectors, cables), assigning them unique asset numbers and statuses, and verifying all information persists correctly and displays in a filterable list view.

**Acceptance Scenarios**:

1. **Given** I am logged into ChurchTools as an equipment manager, **When** I create a new asset with name "Shure SM58 Microphone", manufacturer "Shure", model "SM58", and status "Available", **Then** the system assigns it a unique asset number using the organization's global prefix (e.g., "CHT-001") and saves all details
2. **Given** I have created an asset, **When** I view the asset list, **Then** I can see the asset with all its properties including auto-generated creation date and creator name from ChurchTools
3. **Given** I have multiple assets, **When** I filter by status "Available", **Then** only assets with that status are displayed
4. **Given** I have an asset "CHT-001", **When** I change its status from "Available" to "In Repair", **Then** the status updates and the system records who made the change and when

---

### User Story 2 - Custom Asset Categories and Fields (Priority: P1)

Organizations need to create specialized asset categories with custom fields relevant to their specific equipment types (lighting specs, cable lengths, warranty dates) to capture all important information beyond basic properties.

**Why this priority**: Generic asset tracking without customization provides limited value. Different equipment types require different tracking fields, making customization essential for real-world adoption.

**Independent Test**: Can be fully tested by creating a custom category "Lighting Equipment" with fields for wattage (number), color temperature (number), and DMX address (text), then creating assets in that category and verifying custom field data is captured and displayed.

**Acceptance Scenarios**:

1. **Given** I am an equipment manager, **When** I create a new asset category "Electronic Devices" with custom fields "Serial Number" (text, required), "Warranty Until" (date), and "Screen Size" (number), **Then** the category is saved and available for asset creation
2. **Given** I have created a category with custom fields, **When** I create a new asset in that category, **Then** I see all custom fields in the asset form and can enter values for them
3. **Given** I have assets with custom fields, **When** I view the asset list, **Then** I can filter and sort by custom field values
4. **Given** I have a custom field marked as required, **When** I try to create an asset without filling that field, **Then** the system prevents creation and shows a validation error

---

### User Story 3 - Barcode and QR Code Asset Identification (Priority: P2)

Users need to quickly identify and locate assets using barcode or QR code scanning to reduce time spent searching and improve stock take accuracy.

**Why this priority**: Barcode scanning dramatically improves operational efficiency once basic asset tracking exists. It's high-impact but depends on assets already being in the system.

**Independent Test**: Can be fully tested by generating QR codes for existing assets, printing them, then using a scanner or mobile device camera to scan codes and verify the system immediately displays the correct asset details.

**Acceptance Scenarios**:

1. **Given** I have created an asset with asset number "CAM-015", **When** I view the asset details, **Then** the system displays a QR code and barcode representing that asset number
2. **Given** I have a QR code for asset "CAM-015", **When** I scan it using a barcode scanner (USB/Bluetooth), **Then** the system navigates to the asset detail page for CAM-015
3. **Given** I am performing a stock take, **When** I scan multiple asset barcodes in sequence, **Then** each scanned asset is added to the stock take count list with real-time visual confirmation
4. **Given** I manually enter an asset number "SOUND-042" in the scan field, **When** I press enter, **Then** the system behaves identically to scanning that asset's barcode

---

### User Story 4 - Multi-Asset Management (Parent-Child Assets) (Priority: P2)

When purchasing multiple identical items (e.g., 15 identical microphones), managers need to efficiently create them as sub-assets that share common properties but maintain unique identifiers and independent status/location tracking.

**Why this priority**: Bulk equipment purchases are common, and creating each asset individually is time-consuming and error-prone. This significantly improves data entry efficiency for recurring scenarios.

**Independent Test**: Can be fully tested by creating a parent asset "Shure SM58 Microphone" with quantity 10, verifying the system creates 10 child assets with inherited properties but unique asset numbers (SOUND-001 through SOUND-010), then independently updating one child's status and confirming others remain unchanged.

**Acceptance Scenarios**:

1. **Given** I am creating an asset, **When** I mark it as a "Parent Asset" and specify quantity as 10, **Then** the system creates one parent asset and 10 child assets with inherited properties
2. **Given** I have a parent asset with 10 children, **When** I view the parent asset details, **Then** I see a list of all 10 child assets with their individual statuses and locations
3. **Given** I have child assets, **When** I update the status of child "SOUND-003" to "Broken", **Then** only that specific child's status changes, not the parent or siblings
4. **Given** I have a parent asset, **When** I update a common property on the parent (e.g., manufacturer), **Then** all child assets automatically inherit the updated value

---

### User Story 5 - Equipment Booking and Reservation (Priority: P2)

Event coordinators need to book equipment for specific date ranges, see availability calendars, and manage check-out/check-in processes to prevent double-booking and track who has what equipment.

**Why this priority**: Booking prevents conflicts and is a primary use case for inventory systems, but it requires existing assets and categories to be valuable. It's core functionality that significantly improves operational efficiency.

**Independent Test**: Can be fully tested by creating a booking for "Projector XYZ" from Oct 20-22, verifying the calendar shows it as unavailable during that period, checking out the projector on Oct 20 (status changes to "In Use"), then checking it back in on Oct 22 (status returns to "Available").

**Acceptance Scenarios**:

1. **Given** I am an event coordinator, **When** I view asset "CAM-015" in calendar view, **Then** I see all existing bookings and available time slots
2. **Given** asset "CAM-015" is available Oct 25-30, **When** I create a booking for Oct 27-29, **Then** the booking is created with status "Pending" and the calendar reflects the reservation
3. **Given** I have a booking with status "Approved", **When** I scan the asset barcode during check-out, **Then** the system marks the booking as "Active" and changes asset status to "In Use"
4. **Given** I have an asset checked out, **When** I scan it during check-in, **Then** the booking is marked "Completed", asset status returns to "Available", and the system prompts for condition assessment
5. **Given** an asset has status "Broken" or "In Repair", **When** I try to create a booking for it, **Then** the system prevents the booking and shows an error message

---

### User Story 6 - Equipment Kits and Grouped Bookings (Priority: P3)

Event coordinators need to create and book pre-defined equipment kits (e.g., "Livestream Kit" = 2 cameras + 4 mics + 1 switcher) to streamline the booking process for recurring setups.

**Why this priority**: Kits are a convenience feature that improves efficiency after core booking functionality exists. It's valuable but not essential for MVP operation.

**Independent Test**: Can be fully tested by creating a kit "Sunday Service Audio" containing 4 microphones and 1 mixer, booking the kit for next Sunday, and verifying all component assets are automatically reserved and marked unavailable for that time period.

**Acceptance Scenarios**:

1. **Given** I am an equipment manager, **When** I create a new kit "Livestream Setup" and add specific assets (CAM-001, CAM-002, SOUND-010, SOUND-011), **Then** the kit is saved as a fixed kit with bound assets
2. **Given** I have created a fixed kit, **When** I book the kit for a date range, **Then** all component assets are automatically booked together
3. **Given** I want to create a flexible kit, **When** I define a kit as "4x Microphone (SM58)" without specifying which exact microphones, **Then** the system creates a pool-based kit
4. **Given** I book a flexible kit, **When** the booking is approved, **Then** the system automatically allocates available assets from the pool to satisfy the kit requirements

---

### User Story 7 - Stock Take and Physical Inventory Audits (Priority: P3)

Maintenance personnel need to perform periodic physical stock takes by scanning assets as they're located to identify missing equipment and update location records.

**Why this priority**: Stock takes are important for compliance and loss prevention but are typically periodic rather than daily operations. This functionality builds on existing scanning and asset tracking.

**Independent Test**: Can be fully tested by creating a stock take session, scanning 20 assets from a category, generating a discrepancy report showing 5 assets that weren't scanned (marked as missing), and bulk-updating locations for scanned assets.

**Acceptance Scenarios**:

1. **Given** I am performing a stock take, **When** I create a new stock take session for category "Audio Equipment", **Then** the system loads all assets in that category and initializes a scanning session
2. **Given** I am in a stock take session, **When** I scan an asset barcode, **Then** the system marks it as "Found" with visual confirmation and timestamp
3. **Given** I have completed scanning, **When** I close the stock take session, **Then** the system generates a report showing all scanned assets and any assets not scanned (missing)
4. **Given** I have a stock take discrepancy report, **When** I review missing assets, **Then** I can mark them with status updates (e.g., "Lost", "Destroyed") or dismiss as false positives

---

### User Story 8 - Maintenance Scheduling and Reminders (Priority: P3)

Maintenance technicians need automated reminders when assets require scheduled maintenance (annual inspections, usage-based servicing) to ensure compliance and prevent equipment failure.

**Why this priority**: Maintenance automation is valuable for compliance but is less urgent than core asset tracking and booking. It's an enhancement that improves long-term asset management.

**Independent Test**: Can be fully tested by creating an asset with annual inspection requirement, setting last inspection date as 350 days ago, and verifying the system shows a maintenance reminder and sends notifications to assigned personnel.

**Acceptance Scenarios**:

1. **Given** I have an asset, **When** I configure maintenance as "Annual Inspection" due every 365 days, **Then** the maintenance schedule is saved with the asset
2. **Given** an asset has maintenance due in 7 days, **When** the daily maintenance check runs, **Then** the system sends reminder notifications to maintenance personnel
3. **Given** I am a maintenance technician, **When** I view my dashboard, **Then** I see all assets with overdue or upcoming maintenance
4. **Given** I complete maintenance on an asset, **When** I scan the asset and record maintenance performed with photos, **Then** the system updates the next due date and stores the maintenance record

---

### User Story 9 - Filtered Views and Custom Reports (Priority: P3)

Users need to create saved filtered views (Notion-style tables, galleries, calendars) to quickly access relevant subsets of inventory data and generate reports for utilization, compliance, and asset value.

**Why this priority**: Advanced filtering and reporting are power-user features that enhance productivity but aren't essential for basic inventory operations. They provide significant value once the system has substantial data.

**Independent Test**: Can be fully tested by creating a saved view "Available Audio Equipment" filtered by category="Audio" AND status="Available", switching to gallery view mode, and verifying the view persists after logging out and back in.

**Acceptance Scenarios**:

1. **Given** I am viewing the asset list, **When** I apply filters for category "Lighting" and status "Available", **Then** only matching assets are displayed
2. **Given** I have applied filters, **When** I save the view as "Available Lighting", **Then** the view is saved to my profile and appears in my saved views list
3. **Given** I have a saved view, **When** I switch view modes between Table, Gallery, and Calendar, **Then** the same filtered data is displayed in the selected format
4. **Given** I need a utilization report, **When** I generate the "Asset Utilization" report for last 90 days, **Then** the system shows booking frequency, total usage hours, and idle time for each asset

---

### Edge Cases

- What happens when a user tries to book an asset that becomes unavailable (marked as broken) after booking but before check-out?
- How does the system handle scanning the same asset barcode multiple times during a single stock take session?
- What occurs when a parent asset is deleted that has active child assets with bookings?
- How does the system behave when a kit contains an asset that is individually booked during the same time period?
- What happens when maintenance is performed but the technician forgets to scan the asset code?
- How does the system handle simultaneous booking attempts for the same asset from two different users?
- What occurs when an asset's barcode is damaged and needs to be regenerated?
- How does check-in work when an asset is returned in damaged condition?
- What happens when a flexible kit cannot be fulfilled because insufficient assets are available in the pool?

## Requirements *(mandatory)*

### Functional Requirements

**Asset Management Core**

- **FR-001**: System MUST allow creation of assets with required fields: name, Asset ID (unique database identifier), Barcode Number (scannable code), manufacturer, model, and status
- **FR-001a**: System MUST enforce asset creation, viewing, editing, and deletion permissions using ChurchTools' existing Custom Module permission system (view categories, create categories, edit categories, delete categories, view data in categories, create data in categories, edit/delete data in categories)
- **FR-002**: System MUST auto-generate unique Asset IDs in format [ORG_PREFIX]-[SEQUENCE] where ORG_PREFIX is a single global prefix configured per organization (e.g., CHT-001, CHT-002) with sequence incrementing across all asset categories. Asset ID is permanent and never changes.
- **FR-002a**: System MUST auto-generate Barcode Numbers independently of Asset IDs. Barcode Number can be sequential, random, or user-specified. System MUST allow regenerating Barcode Number if physical label is damaged while preserving Asset ID.
- **FR-002b**: System MUST maintain bidirectional lookup: Asset ID → Barcode Number and Barcode Number → Asset ID for scanning operations
- **FR-003**: System MUST track creation and modification metadata (creator, created date, last modified by, last modified date) using ChurchTools user references
- **FR-004**: System MUST support asset status values: Available, In Use, Broken, In Repair, Installed, Sold, Destroyed
- **FR-005**: System MUST automatically update asset status to "In Use" when a person is assigned to "In Use By" field
- **FR-006**: System MUST prevent bookings for assets with status: In Use, Broken, In Repair, Sold, Destroyed
- **FR-007**: System MUST allow administrators to configure the organization-specific global asset number prefix via settings interface (2-10 alphanumeric characters, validated on save, affects all new assets)
- **FR-007a**: System MUST display current asset prefix in settings page with preview of next asset number (e.g., "CHT-042"), show count of existing assets using current prefix, and warn if prefix change will affect consistency
- **FR-007b**: System MUST provide a location management interface in settings where administrators can create, edit, and delete predefined locations
- **FR-007c**: System MUST provide searchable autocomplete for location field in asset forms, showing existing locations from settings
- **FR-007d**: System MUST allow inline creation of new locations when entering asset location if the typed location doesn't exist (quick-add without navigating to settings)

**Custom Categories and Fields**

- **FR-008**: System MUST allow creation of unlimited custom asset categories
- **FR-009**: System MUST support custom field types: Text, Number, Select (dropdown), Multi-Select, Date, Checkbox, Long Text, URL, and Person Reference
- **FR-010**: System MUST allow marking custom fields as required during category creation
- **FR-011**: System MUST validate required custom fields before allowing asset creation
- **FR-012**: System MUST allow filtering and sorting asset lists by custom field values
- **FR-012a**: System MUST allow deletion of custom fields with warning showing count of affected assets, soft-delete data (retain but hide)
- **FR-012b**: System MUST prevent custom field type changes if data is incompatible. **Compatible changes** (allowed with warning): Text↔LongText, Number→Text, Date→Text, any→LongText. **Incompatible changes** (blocked with error): Text→Number (if non-numeric data exists), Text→Date (if invalid dates), LongText→Number, LongText→Date, Select/MultiSelect→Text (loses option definitions)
- **FR-012c**: System MUST allow adding required fields to categories with existing assets, setting existing assets to null value and showing banner prompting bulk update
- **FR-012d**: System MUST allow renaming custom fields freely (internal field ID remains constant, only display name changes)

**Multi-Asset (Parent-Child) System**

- **FR-013**: System MUST allow creation of parent assets with specified quantity to generate multiple child assets
- **FR-014**: System MUST automatically generate child assets with inherited category and common properties from parent
- **FR-015**: System MUST assign unique sequential Asset IDs to each child asset using the organization's global prefix (e.g., CHT-001, CHT-002, CHT-003) and unique Barcode Numbers
- **FR-016**: System MUST allow independent status, location, and booking management for each child asset
- **FR-017**: System MUST display parent-child relationships in asset detail views

**Barcode and QR Code System**

- **FR-018**: System MUST generate both Code-128 barcodes and QR codes encoding the asset's Barcode Number (not Asset ID)
- **FR-018a**: System MUST display both Asset ID (permanent identifier) and Barcode Number (scannable code) in asset detail view
- **FR-018b**: System MUST allow regenerating Barcode Number and printing new labels if physical label is damaged, while preserving Asset ID
- **FR-019**: System MUST support barcode scanning via USB/Bluetooth scanners (keyboard emulation mode)
- **FR-020**: System MUST support QR code scanning via device cameras
- **FR-021**: System MUST allow manual entry of Barcode Numbers as alternative to scanning
- **FR-022**: System MUST look up asset by Barcode Number and navigate to asset detail page immediately upon successful scan

**Kit Management**

- **FR-023**: System MUST support creation of fixed kits with specific bound assets
- **FR-024**: System MUST support creation of flexible kits defined by quantities from asset pools
- **FR-025**: System MUST automatically book all kit components when a fixed kit is booked
- **FR-026**: System MUST validate sufficient pool assets exist when flexible kit booking is created (Pending status) but NOT allocate specific assets
- **FR-026a**: System MUST allocate specific assets from pools when flexible kit booking is approved, with option for administrators to manually select specific assets during approval
- **FR-026b**: System MUST show error and prevent approval if insufficient pool assets are available at approval time, requiring user to re-book
- **FR-027**: System MUST prevent kit booking when any required components are unavailable

**Booking and Reservation System**

- **FR-028**: System MUST allow users to create bookings with start date, end date, and purpose
- **FR-029**: System MUST support booking states: Pending, Approved, Active, Completed, Overdue, Cancelled
- **FR-029a**: System MUST allow users with "edit data in categories" permission to approve any booking
- **FR-029b**: System MUST design permission checking to query ChurchTools permission system API at runtime (not cached) to be easily adaptable when ChurchTools adds more granular extension permissions
- **FR-029c**: System MUST plan for future granular permission enhancements allowing category-specific, label-specific, or prefix-specific permissions for asset editing and booking management
- **FR-030**: System MUST display asset availability in calendar view format
- **FR-031**: System MUST allow check-out by scanning Barcode Number, looking up asset by Asset ID, updating booking status to Active and asset status to In Use
- **FR-032**: System MUST allow check-in by scanning Barcode Number, looking up asset by Asset ID, updating booking status to Completed and asset status to Available
- **FR-033**: System MUST prompt for condition assessment during check-in process
- **FR-034**: System MUST prevent double-booking of assets for overlapping time periods
- **FR-035**: System MUST send automated reminders when equipment return date approaches via ChurchTools email service API

**Stock Take Functionality**

- **FR-036**: System MUST allow creation of stock take sessions with defined scope (category, location, or all assets)
- **FR-036a**: System MUST support shared stock take sessions where multiple users can contribute scans to a single session for team-based audits
- **FR-036b**: System MUST show real-time scan progress to all users with view permissions, displaying "Scanned by [User] at [Time]" for each asset
- **FR-036c**: System MUST allow only the session creator to close the session and generate the final report
- **FR-037**: System MUST track assets as scanned during stock take with timestamp and scanning user attribution (scans record Barcode Number, lookup Asset ID)
- **FR-038**: System MUST provide real-time visual feedback when Barcode Number is successfully scanned and asset located
- **FR-039**: System MUST generate discrepancy reports showing scanned vs. missing assets
- **FR-040**: System MUST allow bulk location updates for assets scanned during stock take
- **FR-041**: System MUST support offline scanning with automatic sync when connection restored. **Sync triggers**: immediate on reconnection, polling every 30s if queue non-empty. **Retry strategy**: exponential backoff (1s, 2s, 4s, 8s, 16s), max 5 retries before manual intervention required.
- **FR-041a**: System MUST implement queue-based synchronization for offline scans, queuing all operations locally and syncing when connectivity is restored
- **FR-041b**: System MUST detect and resolve conflicts when the same asset is modified both offline and online during disconnection. **Conflict resolution**: server state takes precedence for asset properties (optimistic merge), offline scans always preserved (append-only for stock take data), user notified of conflicts requiring attention.

**Maintenance and Reminders**

- **FR-042**: System MUST support maintenance schedule types: time-based (every X days/months/years), usage-based (every X hours), event-based (after Y bookings), and fixed date
- **FR-043**: System MUST send maintenance reminder notifications X days before due date via ChurchTools email service API
- **FR-044**: System MUST send notifications on due date and after overdue via ChurchTools email service API
- **FR-045**: System MUST allow maintenance technicians to record completed maintenance with notes and photo uploads (up to 10 photos per record, max 5MB each before compression, formats: JPG, PNG, HEIC, WebP)
- **FR-045a**: System MUST compress photos client-side before storage (max 1920px width, 85% quality JPEG conversion) and store as base64 strings in Custom Module data fields
- **FR-045b**: System MUST design photo storage layer to be easily replaceable when ChurchTools extensions gain better access to Files module and file permissions
- **FR-046**: System MUST automatically calculate next maintenance due date after maintenance is recorded
- **FR-047**: System MUST display overdue maintenance on technician dashboard

**Filtered Views and Reporting**

- **FR-048**: System MUST support view modes: Table, Gallery, Calendar, Kanban, and List
- **FR-049**: System MUST allow multi-condition filtering with AND/OR logic
- **FR-050**: System MUST allow sorting and grouping by any field (standard or custom)
- **FR-051**: System MUST allow users to save custom view configurations
- **FR-052**: System MUST generate pre-built reports: Asset Utilization, Maintenance Compliance, Stock Take Summary, Booking History
- **FR-053**: System MUST allow export of reports to common formats (CSV for data tables, PDF for formatted reports)

**Edge Cases and Exception Handling**

- **FR-062**: System MUST handle booking status changes when asset becomes unavailable (marked as broken) after booking but before check-out: cancel booking with status "Cancelled - Asset Unavailable" and send notification to booking requester via ChurchTools email service
- **FR-063**: System MUST prevent duplicate scanning during stock take sessions by showing visual warning "Already scanned at [timestamp]" and not incrementing count
- **FR-064**: System MUST prevent deletion of parent assets that have active child assets with bookings: show error listing number of children with active bookings and prevent deletion
- **FR-065**: System MUST detect kit component conflicts when asset is individually booked during same time period: prevent kit booking and show error message "Asset [number] is already booked for this period"
- **FR-066**: System MUST allow manual maintenance record creation when technician forgets to scan asset: require manual asset number entry, show warning "Asset not scanned - verify asset number", proceed with record creation
- **FR-067**: System MUST handle simultaneous booking attempts for same asset using optimistic locking: second user receives error "This asset was just booked by another user. Please refresh and try again."
- **FR-068**: System MUST allow Barcode Number regeneration when physical label is damaged: archive old Barcode Number with timestamp, generate new Barcode Number, preserve Asset ID unchanged, log change in history, allow printing new label
- **FR-069**: System MUST handle damaged asset returns during check-in: prompt for damage assessment (photos required, description required), update asset status to "Broken", send notification to maintenance personnel via ChurchTools email service
- **FR-070**: System MUST handle insufficient flexible kit availability: prevent booking and show detailed message "Cannot fulfill kit: requires [X] of [category], only [Y] available during this period"

**Change History and Audit Trail**

- **FR-054**: System MUST log all create, update, and delete operations on assets
- **FR-055**: System MUST log all status changes with timestamp and user attribution
- **FR-056**: System MUST log all bookings, check-outs, and check-ins
- **FR-057**: System MUST log all maintenance activities
- **FR-058**: System MUST log all stock take scans
- **FR-059**: System MUST display change history in chronological order on asset detail pages
- **FR-060**: System MUST attribute all actions to ChurchTools user accounts
- **FR-061**: System MUST retain all historical data (bookings, maintenance records, change history) indefinitely with no automatic archiving or deletion

### Key Entities

- **Asset**: Represents a physical item tracked by the system. Contains base fields: Asset ID (permanent unique identifier, e.g., CHT-001), Barcode Number (scannable code for physical labels, can be regenerated), name, manufacturer, model, status, location, creator, dates, plus category-specific custom fields. Can be standalone, parent, or child asset. System maintains bidirectional Asset ID ↔ Barcode Number lookup for scanning operations. Related to: Category, Bookings, Maintenance Records, Stock Take Scans, Change History.

- **Asset Category**: User-defined classification with custom field definitions. Contains category name and list of custom field specifications (name, type, required flag, validation rules). Related to: Assets.

- **Custom Field Definition**: Specification for a custom field within a category. Contains field name, data type (Text, Number, Select, Multi-Select, Date, Checkbox, Long Text, URL, Person Reference), whether required, and validation rules (for select fields: list of options, for numbers: min/max ranges). Related to: Asset Category.

- **Asset Booking**: Reservation of an asset for a specific time period. Contains start date, end date, purpose, status (Pending/Approved/Active/Completed/Overdue/Cancelled), requesting user, approver, check-out timestamp, check-in timestamp, condition notes. References asset by Asset ID. Related to: Asset, User (from ChurchTools).

- **Equipment Kit**: Predefined collection of assets for grouped booking. Contains kit name, description, kit type (Fixed or Flexible). For fixed kits: specific asset references (by Asset ID). For flexible kits: asset category and quantity requirements. Related to: Assets (for fixed kits), Asset Categories (for flexible kits), Kit Bookings.

- **Maintenance Record**: Documentation of maintenance performed on an asset. Contains maintenance date, performed by (user reference), maintenance type, notes, photo attachments, next due date. Related to: Asset, User (from ChurchTools).

- **Maintenance Schedule**: Configuration for recurring maintenance requirements. Contains asset reference, schedule type (time-based/usage-based/event-based/fixed), interval specification, reminder settings (days before due). Related to: Asset.

- **Stock Take Session**: Physical inventory audit process. Contains session start date, completed date, scope definition (category/location/all), list of scanned Barcode Numbers with timestamps and Asset ID lookups, discrepancy report results. Supports multi-user collaboration with real-time scan attribution. Related to: Assets.

- **Barcode/QR Code**: Visual representation of an asset's Barcode Number printed on physical labels. Contains Barcode Number (scannable identifier), barcode format (Code-128 or QR), generated image data. Separate from Asset ID. Can be regenerated if damaged. Related to: Asset (one-to-many - asset keeps history of Barcode Numbers).

- **Change History Entry**: Audit trail record for any system modification. Contains timestamp, user (from ChurchTools), action type (create/update/delete/status change/booking/maintenance/barcode regeneration), entity type, entity ID (Asset ID), old value, new value. Logs both Asset ID changes and Barcode Number changes. Related to: Asset, User (from ChurchTools).

- **Saved View**: User-defined filtered and formatted asset list. Contains view name, owner (user reference), filter criteria (field, operator, value combinations with AND/OR logic), sort configuration, grouping configuration, view mode (Table/Gallery/Calendar/Kanban/List). Related to: User (from ChurchTools).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new asset with custom category and fields in under 60 seconds
- **SC-002**: Users can locate any asset in the system in under 30 seconds using barcode scanning
- **SC-003**: Stock take sessions covering 100+ assets can be completed in under 15 minutes using barcode scanning
- **SC-004**: Equipment booking conflicts are reduced to zero through calendar visibility and automated status updates
- **SC-005**: 95% or higher asset accountability rate during physical stock takes (found assets / total expected assets)
- **SC-006**: Maintenance compliance reaches 100% with zero overdue inspections after automated reminder implementation
- **SC-007**: System supports organizations managing up to 5,000 assets without performance degradation
- **SC-008**: Mobile barcode scanning works reliably with 95%+ first-scan success rate in typical lighting conditions
- **SC-009**: User adoption rate exceeds 80% of target users within 3 months of deployment
- **SC-010**: Equipment utilization visibility increases from current baseline (assumed 0% visibility) to 100% visibility for all tracked assets
- **SC-011**: Average time to complete equipment check-out process is under 2 minutes per asset
- **SC-012**: Equipment search and filtering returns results in under 2 seconds for queries on datasets up to 5,000 assets

