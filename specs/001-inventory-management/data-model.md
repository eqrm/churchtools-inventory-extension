# Data Model: ChurchTools Inventory Management Extension

**Feature**: 001-inventory-management  
**Date**: 2025-10-18  
**Status**: Complete

## Overview

This document defines all entities, their properties, relationships, and state transitions for the inventory management system. All entities map to ChurchTools Custom Modules API structure using `customdatacategories` and `customdatavalues`.

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   Organization  │
│  (ChurchTools)  │
└────────┬────────┘
         │
         │ has many
         ▼
┌─────────────────────┐
│  Asset Category     │◄─────┐
├─────────────────────┤      │
│ - id                │      │
│ - name              │      │
│ - icon              │      │
│ - customFields[]    │      │ belongs to
└──────────┬──────────┘      │
           │                 │
           │ has many        │
           ▼                 │
    ┌─────────────┐          │
    │   Asset     │──────────┘
    ├─────────────┤
    │ - id        │◄────┐
    │ - assetNo   │     │
    │ - name      │     │ parent/child
    │ - status    │     │
    │ - parentId  │─────┘
    └──────┬──────┘
           │
           │ has many
           ├──────────┐
           ▼          ▼
   ┌────────────┐ ┌──────────────┐
   │  Booking   │ │ Maintenance  │
   └────────────┘ │   Record     │
                  └──────────────┘

   ┌─────────────┐
   │    Kit      │
   ├─────────────┤
   │ - assets[]  │ references
   │   or        ├──────────────► Asset
   │ - pools[]   │
   └─────────────┘

   ┌──────────────┐
   │  Stock Take  │
   │   Session    │
   ├──────────────┤
   │ - scans[]    │ references
   └───────┬──────┘      │
           │             │
           └─────────────┘
```

---

## Core Entities

### 1. Asset Category

Defines a classification of assets with custom field definitions.

**ChurchTools Storage**: `CustomDataCategory` named "AssetCategories" → `CustomDataValue`

```typescript
interface AssetCategory {
  // Identity
  id: string                      // UUID
  name: string                    // "Electronic Devices", "Audio Equipment"
  icon?: string                   // Tabler icon name: "device-laptop", "microphone"
  
  // Custom Fields Definition
  customFields: CustomFieldDefinition[]
  
  // Metadata
  createdBy: string               // Person ID from ChurchTools
  createdByName: string           // Cached name for display
  createdAt: string               // ISO 8601 timestamp
  lastModifiedBy: string          // Person ID from ChurchTools
  lastModifiedByName: string      // Cached name
  lastModifiedAt: string          // ISO 8601 timestamp
}

interface CustomFieldDefinition {
  id: string                      // UUID
  name: string                    // "Serial Number", "Warranty Until"
  type: CustomFieldType           // See below
  required: boolean               // Validation flag
  options?: string[]              // For select/multi-select types
  validation?: {
    min?: number                  // For number fields
    max?: number                  // For number fields
    pattern?: string              // Regex for text fields
    minLength?: number            // For text fields
    maxLength?: number            // For text fields
  }
  helpText?: string               // User guidance
}

type CustomFieldType =
  | 'text'                        // Single-line text input
  | 'number'                      // Numeric input
  | 'select'                      // Dropdown (single selection)
  | 'multi-select'                // Dropdown (multiple selections)
  | 'date'                        // Date picker
  | 'checkbox'                    // Boolean toggle
  | 'long-text'                   // Multi-line text area
  | 'url'                         // URL with validation
  | 'person-reference'            // ChurchTools Person ID
```

**Validation Rules**:
- `name` is required, 3-100 characters
- `customFields[].name` must be unique within category
- `customFields[].type` must be valid CustomFieldType
- If `type` is 'select' or 'multi-select', `options` array is required
- Person references must be valid ChurchTools Person IDs

**Example**:
```json
{
  "id": "cat-001",
  "name": "Electronic Devices",
  "icon": "device-laptop",
  "customFields": [
    {
      "id": "field-001",
      "name": "Serial Number",
      "type": "text",
      "required": true,
      "validation": {
        "pattern": "^[A-Z0-9]{8,20}$"
      }
    },
    {
      "id": "field-002",
      "name": "Warranty Until",
      "type": "date",
      "required": false
    },
    {
      "id": "field-003",
      "name": "Screen Size",
      "type": "number",
      "required": false,
      "validation": {
        "min": 0,
        "max": 100
      },
      "helpText": "Screen size in inches"
    }
  ]
}
```

---

### 2. Asset

Represents a physical item being tracked.

**ChurchTools Storage**: `CustomDataCategory` named "Assets" → `CustomDataValue`

```typescript
interface Asset {
  // Identity
  id: string                      // UUID
  assetNumber: string             // "SOUND-001", "CAM-042" (unique, immutable)
  
  // Basic Info
  name: string                    // "Shure SM58 Microphone"
  manufacturer?: string           // "Shure"
  model?: string                  // "SM58"
  description?: string            // Long-form description
  
  // Classification
  category: {
    id: string                    // Reference to AssetCategory
    name: string                  // Cached for display
  }
  
  // Status Management
  status: AssetStatus
  location?: string               // Physical location description
  inUseBy?: {
    personId: string              // ChurchTools Person ID
    personName: string            // Cached name
    since: string                 // ISO 8601 timestamp
  }
  
  // Parent-Child Relationships
  isParent: boolean               // True if this is a parent asset
  parentAssetId?: string          // Reference to parent asset (if child)
  childAssetIds?: string[]        // References to child assets (if parent)
  
  // Barcode/QR
  barcode: string                 // Code-128 barcode data (usually = assetNumber)
  qrCode: string                  // QR code data (usually = assetNumber)
  
  // Custom Fields (dynamic based on category)
  customFieldValues: Record<string, CustomFieldValue>
  
  // Metadata
  createdBy: string               // Person ID
  createdByName: string           // Cached name
  createdAt: string               // ISO 8601
  lastModifiedBy: string          // Person ID
  lastModifiedByName: string      // Cached name
  lastModifiedAt: string          // ISO 8601
  
  // Computed/Derived (not stored)
  isAvailable?: boolean           // Derived from status
  currentBooking?: string         // Reference to active booking
  nextMaintenance?: string        // ISO 8601 date of next scheduled maintenance
}

type AssetStatus =
  | 'available'                   // Ready to be booked
  | 'in-use'                      // Currently checked out
  | 'broken'                      // Needs repair, not bookable
  | 'in-repair'                   // Being repaired, not bookable
  | 'installed'                   // Permanently installed, bookable in place
  | 'sold'                        // Disposed by sale, archived
  | 'destroyed'                   // Disposed, archived

type CustomFieldValue = 
  | string                        // text, long-text, url, date (ISO 8601)
  | number                        // number
  | boolean                       // checkbox
  | string[]                      // multi-select
```

**State Transitions**:
```
available ──┬─► in-use ──────────┬─► available
            │                    │
            ├─► broken ─► in-repair
            │
            ├─► installed ──────────► available
            │
            └─► sold (terminal state)
            └─► destroyed (terminal state)
```

**Validation Rules**:
- `assetNumber` is immutable after creation
- `name` is required, 3-200 characters
- `status` must be valid AssetStatus
- If `status` is 'in-use', `inUseBy` must be set
- If `parentAssetId` is set, parent asset must exist
- All `customFieldValues` must match category's `customFields` definitions
- Required custom fields must have values

**Example**:
```json
{
  "id": "asset-123",
  "assetNumber": "SOUND-001",
  "name": "Shure SM58 Microphone",
  "manufacturer": "Shure",
  "model": "SM58",
  "category": {
    "id": "cat-audio",
    "name": "Audio Equipment"
  },
  "status": "available",
  "location": "Storage Room A, Shelf 3",
  "isParent": false,
  "parentAssetId": null,
  "barcode": "SOUND-001",
  "qrCode": "SOUND-001",
  "customFieldValues": {
    "field-serial": "ABC123XYZ789",
    "field-purchase-date": "2024-01-15"
  },
  "createdBy": "person-456",
  "createdByName": "John Smith",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### 3. Booking

Reservation of an asset for a specific time period.

**ChurchTools Storage**: `CustomDataCategory` named "Bookings" → `CustomDataValue`

```typescript
interface Booking {
  // Identity
  id: string                      // UUID
  
  // Asset Reference
  asset: {
    id: string                    // Asset ID
    assetNumber: string           // Cached for display
    name: string                  // Cached for display
  }
  
  // Or Kit Reference (mutually exclusive with asset)
  kit?: {
    id: string
    name: string
  }
  
  // Booking Details
  startDate: string               // ISO 8601 date
  endDate: string                 // ISO 8601 date
  purpose: string                 // "Sunday Service", "Youth Event"
  notes?: string                  // Additional information
  
  // Status Management
  status: BookingStatus
  
  // People
  requestedBy: string             // Person ID
  requestedByName: string         // Cached name
  approvedBy?: string             // Person ID (if status is approved+)
  approvedByName?: string         // Cached name
  
  // Check-out/Check-in
  checkedOutAt?: string           // ISO 8601 timestamp
  checkedOutBy?: string           // Person ID
  checkedOutByName?: string       // Cached name
  checkedInAt?: string            // ISO 8601 timestamp
  checkedInBy?: string            // Person ID
  checkedInByName?: string        // Cached name
  
  // Condition Assessment
  conditionOnCheckOut?: ConditionAssessment
  conditionOnCheckIn?: ConditionAssessment
  damageReported?: boolean        // Flag for follow-up
  damageNotes?: string            // Details if damaged
  
  // Metadata
  createdAt: string               // ISO 8601
  lastModifiedAt: string          // ISO 8601
}

type BookingStatus =
  | 'pending'                     // Created, awaiting approval
  | 'approved'                    // Approved, not yet checked out
  | 'active'                      // Checked out, in use
  | 'completed'                   // Returned, normal completion
  | 'overdue'                     // Not returned by end date
  | 'cancelled'                   // Cancelled before use

interface ConditionAssessment {
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  notes?: string
  photos?: string[]               // URLs to uploaded photos
}
```

**State Transitions**:
```
pending ──┬─► approved ─► active ──┬─► completed
          │                        │
          └─► cancelled            └─► overdue ─► completed
```

**Validation Rules**:
- `startDate` must be before `endDate`
- `endDate` must be in the future (for new bookings)
- Asset or Kit must be available for the requested date range (no overlapping bookings)
- Asset status must allow booking (not broken, sold, destroyed)
- If `status` is 'approved', 'active', 'completed', or 'overdue', `approvedBy` must be set
- If `status` is 'active', 'completed', or 'overdue', `checkedOutAt` and `checkedOutBy` must be set
- If `status` is 'completed', `checkedInAt` and `checkedInBy` must be set

**Business Rules**:
- Automatic status update to 'in-use' when checked out
- Automatic status update to 'completed' when checked in
- Automatic status update to 'overdue' if not checked in by midnight of `endDate`
- Asset status automatically updated: 'available' → 'in-use' on checkout, 'in-use' → 'available' on checkin

---

### 4. Equipment Kit

Pre-defined collection of assets for grouped booking.

**ChurchTools Storage**: `CustomDataCategory` named "Kits" → `CustomDataValue`

```typescript
interface Kit {
  // Identity
  id: string                      // UUID
  name: string                    // "Livestream Setup", "Sunday Service Audio"
  description?: string            // Long-form description
  
  // Type
  type: KitType
  
  // Fixed Kit: Specific bound assets
  boundAssets?: {
    assetId: string
    assetNumber: string           // Cached
    name: string                  // Cached
  }[]
  
  // Flexible Kit: Asset pool requirements
  poolRequirements?: {
    categoryId: string            // Asset category
    categoryName: string          // Cached
    quantity: number              // Number of assets needed
    filters?: Record<string, any> // Optional: filter by custom fields
  }[]
  
  // Metadata
  createdBy: string               // Person ID
  createdByName: string           // Cached name
  createdAt: string               // ISO 8601
  lastModifiedBy: string          // Person ID
  lastModifiedByName: string      // Cached name
  lastModifiedAt: string          // ISO 8601
}

type KitType = 'fixed' | 'flexible'
```

**Validation Rules**:
- `name` is required, 3-100 characters
- If `type` is 'fixed', `boundAssets` must have at least 1 asset
- If `type` is 'flexible', `poolRequirements` must have at least 1 requirement
- All referenced assets must exist and be active (not sold/destroyed)
- Flexible kit allocation checks availability at booking time

**Kit Booking Logic**:
- **Fixed Kit**: All bound assets are booked together. If any asset is unavailable, entire kit booking fails.
- **Flexible Kit**: System allocates available assets from pools at booking approval time. If insufficient assets available, booking fails with specific error.

---

### 5. Maintenance Record

Documentation of maintenance performed on an asset.

**ChurchTools Storage**: `CustomDataCategory` named "MaintenanceRecords" → `CustomDataValue`

```typescript
interface MaintenanceRecord {
  // Identity
  id: string                      // UUID
  
  // Asset Reference
  asset: {
    id: string
    assetNumber: string           // Cached
    name: string                  // Cached
  }
  
  // Maintenance Details
  type: MaintenanceType
  date: string                    // ISO 8601 date
  performedBy: string             // Person ID
  performedByName: string         // Cached name
  
  // Documentation
  description: string             // What was done
  notes?: string                  // Additional observations
  cost?: number                   // Maintenance cost
  photos?: string[]               // URLs to uploaded photos
  documents?: string[]            // URLs to uploaded documents (PDFs, etc.)
  
  // Next Maintenance (if recurring)
  nextDueDate?: string            // ISO 8601 date
  
  // Metadata
  createdAt: string               // ISO 8601 (usually = date)
  lastModifiedAt: string          // ISO 8601
}

type MaintenanceType =
  | 'inspection'                  // Routine inspection
  | 'cleaning'                    // Cleaning/servicing
  | 'repair'                      // Fixing broken component
  | 'calibration'                 // Technical calibration
  | 'testing'                     // Functionality testing
  | 'compliance'                  // Regulatory compliance check
  | 'other'                       // Other maintenance
```

**Validation Rules**:
- `asset.id` must reference existing asset
- `date` cannot be in the future
- `performedBy` must be valid Person ID
- `description` is required, 10-1000 characters
- If `type` is 'compliance', record should include compliance document references

---

### 6. Maintenance Schedule

Configuration for recurring maintenance requirements.

**ChurchTools Storage**: Part of Asset entity (embedded in customFieldValues or separate data category)

```typescript
interface MaintenanceSchedule {
  // Identity
  id: string                      // UUID
  
  // Asset Reference
  assetId: string
  
  // Schedule Configuration
  scheduleType: ScheduleType
  
  // Time-based
  intervalDays?: number           // Every X days
  intervalMonths?: number         // Every X months
  intervalYears?: number          // Every X years
  
  // Usage-based
  intervalHours?: number          // Every X hours of use
  
  // Event-based
  intervalBookings?: number       // After X bookings
  
  // Fixed date
  fixedDate?: string              // ISO 8601 date (annual recurring)
  
  // Reminders
  reminderDaysBefore: number      // Days before due to send first reminder
  
  // Status
  lastPerformed?: string          // ISO 8601 date (from last MaintenanceRecord)
  nextDue?: string                // ISO 8601 date (calculated)
  isOverdue?: boolean             // Calculated flag
  
  // Metadata
  createdAt: string               // ISO 8601
  lastModifiedAt: string          // ISO 8601
}

type ScheduleType =
  | 'time-based'                  // Calendar-based interval
  | 'usage-based'                 // Based on usage hours
  | 'event-based'                 // Based on number of bookings
  | 'fixed-date'                  // Specific date (annual)
```

**Next Due Calculation**:
```typescript
function calculateNextDue(schedule: MaintenanceSchedule, asset: Asset): string {
  const lastPerformed = schedule.lastPerformed || asset.createdAt
  
  switch (schedule.scheduleType) {
    case 'time-based':
      if (schedule.intervalYears) {
        return addYears(lastPerformed, schedule.intervalYears)
      }
      if (schedule.intervalMonths) {
        return addMonths(lastPerformed, schedule.intervalMonths)
      }
      if (schedule.intervalDays) {
        return addDays(lastPerformed, schedule.intervalDays)
      }
      break
      
    case 'usage-based':
      // Calculate based on asset usage hours (if tracked)
      const usageHours = calculateUsageHours(asset)
      const hoursUntilDue = schedule.intervalHours! - (usageHours % schedule.intervalHours!)
      return addHours(new Date(), hoursUntilDue)
      
    case 'event-based':
      // Calculate based on booking count since last maintenance
      const bookingsSince = countBookingsSince(asset.id, lastPerformed)
      const bookingsUntilDue = schedule.intervalBookings! - (bookingsSince % schedule.intervalBookings!)
      return `After ${bookingsUntilDue} more bookings`
      
    case 'fixed-date':
      const nextYear = addYears(schedule.fixedDate!, 1)
      return nextYear > new Date() ? schedule.fixedDate! : nextYear
  }
}
```

---

### 7. Stock Take Session

Physical inventory audit process.

**ChurchTools Storage**: `CustomDataCategory` named "StockTakeSessions" → `CustomDataValue`

```typescript
interface StockTakeSession {
  // Identity
  id: string                      // UUID
  
  // Session Details
  startDate: string               // ISO 8601 timestamp
  completedDate?: string          // ISO 8601 timestamp (null until completed)
  status: StockTakeStatus
  
  // Scope Definition
  scope: {
    type: 'all' | 'category' | 'location' | 'custom'
    categoryIds?: string[]        // If type is 'category'
    locations?: string[]          // If type is 'location'
    assetIds?: string[]           // If type is 'custom'
  }
  
  // Expected Assets (loaded at session start)
  expectedAssets: {
    assetId: string
    assetNumber: string           // Cached
    name: string                  // Cached
    location?: string             // Expected location
  }[]
  
  // Scanned Assets
  scannedAssets: {
    assetId: string
    assetNumber: string
    scannedAt: string             // ISO 8601 timestamp
    scannedBy: string             // Person ID
    scannedByName: string         // Cached name
    location?: string             // Location at time of scan
    condition?: string            // Optional condition note
  }[]
  
  // Discrepancies (calculated)
  missingAssets?: {               // Expected but not scanned
    assetId: string
    assetNumber: string
    name: string
    lastKnownLocation?: string
  }[]
  
  unexpectedAssets?: {            // Scanned but not expected
    assetId: string
    assetNumber: string
    name: string
  }[]
  
  // People
  conductedBy: string             // Person ID (session creator)
  conductedByName: string         // Cached name
  
  // Notes
  notes?: string
  
  // Metadata
  createdAt: string               // ISO 8601
  lastModifiedAt: string          // ISO 8601
}

type StockTakeStatus =
  | 'active'                      // In progress
  | 'completed'                   // Finished, report generated
  | 'cancelled'                   // Cancelled before completion
```

**Workflow**:
1. **Start Session**: Create session with scope, load expected assets
2. **Scanning**: Add scanned assets to session (online or offline)
3. **Complete Session**: Finalize, generate discrepancy report
4. **Actions**: Update asset locations, mark assets as lost, etc.

**Validation Rules**:
- `scope.type` determines which scope fields are required
- `expectedAssets` is populated at session start based on scope
- Duplicate scans of same asset are allowed (updates last scan timestamp)
- Session cannot be completed until `completedDate` is set

---

### 8. Change History Entry

Audit trail record for any system modification.

**ChurchTools Storage**: `CustomDataCategory` named "ChangeHistory" → `CustomDataValue`

```typescript
interface ChangeHistoryEntry {
  // Identity
  id: string                      // UUID
  
  // What Changed
  entityType: 'asset' | 'category' | 'booking' | 'kit' | 'maintenance' | 'stocktake'
  entityId: string                // ID of the changed entity
  entityName?: string             // Cached name for display
  
  // Change Details
  action: ChangeAction
  fieldName?: string              // Which field changed (for updates)
  oldValue?: string               // Previous value (JSON string)
  newValue?: string               // New value (JSON string)
  
  // Who & When
  changedBy: string               // Person ID
  changedByName: string           // Cached name
  changedAt: string               // ISO 8601 timestamp
  
  // Context
  ipAddress?: string              // Optional security tracking
  userAgent?: string              // Optional browser/device info
}

type ChangeAction =
  | 'created'                     // Entity created
  | 'updated'                     // Field(s) modified
  | 'deleted'                     // Entity deleted/archived
  | 'status-changed'              // Status field specifically
  | 'booked'                      // Booking created
  | 'checked-out'                 // Asset checked out
  | 'checked-in'                  // Asset checked in
  | 'maintenance-performed'       // Maintenance record added
  | 'scanned'                     // Asset scanned in stock take
```

**Display Format**:
```
[2025-10-18 14:32] John Smith | Changed Status: Available → In Use
[2025-10-18 15:00] Jane Doe | Checked out asset SOUND-001
[2025-10-18 16:45] Jane Doe | Checked in asset SOUND-001 (Excellent condition)
```

---

### 9. Saved View

User-defined filtered and formatted asset list.

**ChurchTools Storage**: Part of user preferences or separate data category

```typescript
interface SavedView {
  // Identity
  id: string                      // UUID
  name: string                    // "Available Audio Equipment"
  
  // Owner
  ownerId: string                 // Person ID
  ownerName: string               // Cached name
  isPublic: boolean               // Shared with all users?
  
  // View Configuration
  viewMode: ViewMode
  
  // Filters
  filters: ViewFilter[]
  
  // Sorting
  sortBy?: string                 // Field name
  sortDirection?: 'asc' | 'desc'
  
  // Grouping
  groupBy?: string                // Field name
  
  // Visible Columns (for table view)
  visibleColumns?: string[]       // Field names
  
  // Metadata
  createdAt: string               // ISO 8601
  lastModifiedAt: string          // ISO 8601
}

type ViewMode =
  | 'table'                       // Data table with columns
  | 'gallery'                     // Card-based grid
  | 'calendar'                    // Calendar view (for bookings)
  | 'kanban'                      // Grouped by status
  | 'list'                        // Simple list

interface ViewFilter {
  field: string                   // Field name (or custom field ID)
  operator: FilterOperator
  value: any                      // Value to compare against
  logic?: 'AND' | 'OR'            // Combine with previous filter
}

type FilterOperator =
  | 'equals'
  | 'not-equals'
  | 'contains'
  | 'not-contains'
  | 'starts-with'
  | 'ends-with'
  | 'greater-than'
  | 'less-than'
  | 'is-empty'
  | 'is-not-empty'
  | 'in'                          // Value is in array
  | 'not-in'
```

**Example Saved View**:
```json
{
  "id": "view-123",
  "name": "Available Audio Equipment",
  "ownerId": "person-456",
  "isPublic": true,
  "viewMode": "table",
  "filters": [
    {
      "field": "category.name",
      "operator": "equals",
      "value": "Audio Equipment",
      "logic": "AND"
    },
    {
      "field": "status",
      "operator": "equals",
      "value": "available"
    }
  ],
  "sortBy": "assetNumber",
  "sortDirection": "asc",
  "visibleColumns": ["assetNumber", "name", "manufacturer", "model", "location"]
}
```

---

## Indexes and Performance Considerations

For optimal query performance, the following fields should be indexed:

**Asset**:
- `assetNumber` (unique index)
- `category.id`
- `status`
- `parentAssetId`

**Booking**:
- `asset.id`
- `status`
- `startDate`, `endDate` (composite index)
- `requestedBy`

**MaintenanceRecord**:
- `asset.id`
- `date`
- `type`

**StockTakeSession**:
- `status`
- `startDate`

**ChangeHistoryEntry**:
- `entityType`, `entityId` (composite index)
- `changedAt`

---

## Data Migration Considerations

When deploying this system to an existing ChurchTools instance:

1. **Initial Setup**:
   - Create "churchtools-inventory" custom module
   - Create all required data categories
   - Set up default asset category templates

2. **Data Import** (if migrating from existing system):
   - Import asset categories first
   - Import assets with parent-child relationships
   - Import historical bookings
   - Import maintenance records
   - Generate change history for audit trail

3. **Validation**:
   - Verify all asset numbers are unique
   - Ensure all person references are valid ChurchTools IDs
   - Validate custom field values match definitions
   - Check booking conflicts don't exist

---

## Summary

This data model provides a complete foundation for the inventory management system with:

- **10 core entities** fully defined with types, relationships, and validation rules
- **Strong typing** throughout for TypeScript strict mode compliance
- **Audit trail** support via Change History
- **Flexible storage** via ChurchTools Custom Modules API mapping
- **Performance optimization** through strategic indexing
- **State management** with clear state transitions for assets and bookings
- **Extensibility** via custom fields and saved views

All entities map cleanly to the ChurchTools Custom Modules API structure while maintaining a clean, typed interface for application code.
