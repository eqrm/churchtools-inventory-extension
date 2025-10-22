# Data Model: Bug Fixes & UX Improvements

**Feature**: 002-bug-fixes-ux-improvements  
**Date**: October 22, 2025  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data entities, relationships, validation rules, and state transitions for implementing bug fixes and UX improvements. Focuses on: (1) Extended booking model with person tracking, (2) Photo storage abstraction entities, (3) Offline sync entities, (4) Schema versioning entities, (5) Permission abstraction entities.

---

## Entity Catalog

### Core Entities (Extended)

#### Booking (Extended)
Represents asset reservation with enhanced person tracking.

**Fields**:
```typescript
interface Booking {
  id: string;                    // Unique identifier
  assetId: string;               // Asset being booked
  
  // Person tracking (NEW - T307)
  bookedById: string;            // Person who created the booking (ChurchTools person ID)
  bookingForId: string;          // Person using the asset (can be same or different)
  
  // Date/time modes (MODIFIED - T312)
  bookingMode: 'single-day' | 'date-range';
  
  // Single day mode
  date?: Date;                   // Single date (if bookingMode = 'single-day')
  startTime?: string;            // Start time "HH:mm" (if bookingMode = 'single-day')
  endTime?: string;              // End time "HH:mm" (if bookingMode = 'single-day')
  
  // Date range mode
  startDate?: Date;              // Start date (if bookingMode = 'date-range')
  endDate?: Date;                // End date (if bookingMode = 'date-range')
  startDateTime?: string;        // Optional start time (date-range mode)
  endDateTime?: string;          // Optional end time (date-range mode)
  
  status: BookingStatus;         // Status (see enum below)
  purpose: string;               // Why booking the asset
  notes?: string;                // Additional notes
  
  createdAt: Date;               // When booking created
  updatedAt: Date;               // Last modification
  
  schemaVersion: string;         // For migrations (NEW - T329)
}

enum BookingStatus {
  REQUESTED = 'requested',       // Initial state
  PENDING = 'pending',           // Awaiting approval
  APPROVED = 'approved',         // Approved by admin
  DECLINED = 'declined',         // Rejected by admin (FIXED - T313)
  CANCELLED = 'cancelled',       // Cancelled by requester (FIXED - T313)
  ACTIVE = 'active',             // Currently in use
  COMPLETED = 'completed'        // Booking period ended
}
```

**Validation Rules**:
- `bookedById` MUST be valid ChurchTools person ID
- `bookingForId` MUST be valid ChurchTools person ID
- `bookedById` and `bookingForId` can be same person (self-booking)
- If `bookingMode = 'single-day'`: `date`, `startTime`, `endTime` MUST be set
- If `bookingMode = 'date-range'`: `startDate`, `endDate` MUST be set
- `startTime` MUST be before `endTime` (single-day mode)
- `startDate` MUST be before `endDate` (date-range mode)
- Cannot book dates in the past (validation on creation)
- Asset MUST be bookable (`asset.bookable = true`) - NEW (T309)

**State Transitions**:
```
REQUESTED → PENDING → APPROVED → ACTIVE → COMPLETED
          ↓           ↓
        CANCELLED   DECLINED
```

**Conflict Resolution** (Clarification Q1):
- Last-write-wins validation at submission
- Second booking attempt returns 409 Conflict if dates overlap
- No optimistic locking or held reservations

---

#### Asset (Extended)
Physical item with booking control and images.

**Fields**:
```typescript
interface Asset {
  id: string;
  name: string;
  categoryId: string;
  
  // Booking control (NEW - T309)
  bookable: boolean;             // Can this asset be booked? Default: true
  
  // Images (NEW - T327)
  photos: string[];              // Array of photo IDs (base64 or file IDs)
  mainPhotoIndex?: number;       // Index of main photo in photos array
  
  // Existing fields
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  status: AssetStatus;
  customFields: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: string;         // NEW (T329)
}
```

**Validation Rules**:
- If `bookable = false`, cannot be selected in booking forms
- `photos` array limited to 10 images maximum
- `mainPhotoIndex` MUST be valid index in `photos` array if set
- Photo IDs can be base64 data URLs or ChurchTools file IDs (abstraction handles both)

---

#### Person (ChurchTools Integration)
ChurchTools user searchable via API.

**Fields**:
```typescript
interface Person {
  id: string;                    // ChurchTools person ID
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;            // ChurchTools avatar URL
  
  // Cached locally (NEW - T301)
  cachedAt?: Date;               // When person data cached
}
```

**Data Source**: ChurchTools search API endpoint `/api/search?query={query}&domain_types[]=person`

**Caching Strategy**:
- Cache search results in memory for 5 minutes
- Cache person details in localStorage for 24 hours
- Refresh avatar URLs on cache miss

---

### New Entities (Photo Storage)

#### PhotoStorage (Abstraction)
Interface for photo storage implementations.

**Interface**:
```typescript
interface IPhotoStorage {
  uploadPhoto(file: File): Promise<string>;        // Returns photo ID
  deletePhoto(id: string): Promise<void>;
  getPhotoUrl(id: string): string;                 // Returns displayable URL
  isBase64Photo(id: string): boolean;              // Check if legacy format
}
```

**Implementations**:
1. `Base64PhotoStorage` (current): Converts File → base64 data URL
2. `ChurchToolsPhotoStorage` (future): Uploads to ChurchTools Files API

**Storage Location**:
- Base64: Stored inline in Asset JSON (photos array)
- Files API: Stored in ChurchTools Files module, only ID in Asset JSON

---

#### PhotoMetadata (NEW)
Metadata for compressed photos.

**Fields**:
```typescript
interface PhotoMetadata {
  originalId: string;            // ID of original uploaded photo
  thumbnailId: string;           // ID of thumbnail (400px, 70% quality)
  fullSizeId: string;            // ID of full-size (2048px, 85% quality)
  originalSize: number;          // Original file size in bytes
  thumbnailSize: number;         // Thumbnail size in bytes
  fullSizeSize: number;          // Full-size size in bytes
  format: 'jpeg';                // Always JPEG after compression
  uploadedAt: Date;
  schemaVersion: string;
}
```

**Compression Spec** (Clarification Q4):
- Thumbnails: 70% JPEG quality, 400px max width
- Full-size: 85% JPEG quality, 2048px max width

---

### New Entities (Offline Sync)

#### StockTakeSession (Extended)
Inventory verification session with offline support.

**Fields**:
```typescript
interface StockTakeSession {
  id: string;
  nameReason: string;            // RENAMED from "note" (T315)
  startedAt: Date;
  completedAt?: Date;
  
  // Offline support (NEW - T310)
  syncStatus: SyncStatus;
  lastSyncAt?: Date;
  
  createdBy: string;             // Person ID
  schemaVersion: string;
}

enum SyncStatus {
  ONLINE = 'online',             // Created online, no offline data
  OFFLINE = 'offline',           // Created offline, not synced
  SYNCING = 'syncing',           // Sync in progress
  SYNCED = 'synced',             // Successfully synced
  CONFLICT = 'conflict'          // Conflicts detected
}
```

---

#### StockTakeScan (Extended)
Individual asset scan during stock take.

**Fields**:
```typescript
interface StockTakeScan {
  id: string;
  sessionId: string;
  assetId: string;
  scannedAt: Date;
  scannedBy: string;             // Person ID
  location?: string;             // Where scanned
  condition?: string;            // Asset condition notes
  
  // Offline tracking (NEW)
  localId?: string;              // Local IndexedDB ID (before sync)
  syncStatus: SyncStatus;
  syncedAt?: Date;
  
  schemaVersion: string;
}
```

---

#### SyncConflict (NEW)
Represents a sync conflict requiring manual resolution.

**Fields**:
```typescript
interface SyncConflict {
  id: string;
  entityType: 'stock-take-scan' | 'asset' | 'booking';
  entityId: string;
  
  offlineData: any;              // Data from offline storage
  onlineData: any;               // Data from server
  
  offlineTimestamp: Date;
  onlineTimestamp: Date;
  
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;           // Person ID who resolved
  resolution?: 'keep-offline' | 'keep-online' | 'merge';
  
  schemaVersion: string;
}
```

**Conflict Resolution UI** (Clarification Q3):
- Show side-by-side comparison of offline vs online data
- User selects which version to keep or manually merges
- Resolution logged for audit trail

---

### New Entities (Schema Versioning)

#### SchemaVersion (NEW)
Tracks applied schema migrations.

**Fields**:
```typescript
interface SchemaVersion {
  version: string;               // Semantic version (e.g., "1.1.0")
  appliedAt: Date;
  appliedBy: string;             // User/system who applied
  migrationDuration: number;     // Milliseconds
  status: 'pending' | 'applied' | 'failed' | 'rolled-back';
  errorMessage?: string;         // If failed
  
  schemaVersion: string;         // Meta: version of this entity's schema
}
```

**Migration Lifecycle**:
1. Detect pending migration (current version < latest version)
2. Mark as `pending`
3. Run migration function
4. If success: Mark as `applied`, update all entity schemas
5. If failure: Mark as `failed`, rollback, log error (Clarification Q5)
6. If rollback: Mark as `rolled-back`, retry on next load

---

#### MigrationDefinition (NEW)
Defines how to migrate between schema versions.

**Structure**:
```typescript
interface MigrationDefinition {
  fromVersion: string;
  toVersion: string;
  
  up: (data: any) => Promise<any>;    // Forward migration
  down: (data: any) => Promise<any>;  // Rollback migration
  
  description: string;
  breaking: boolean;             // Is this a breaking change?
}
```

**Example Migration** (1.0.0 → 1.1.0):
```typescript
const migration_1_0_0_to_1_1_0: MigrationDefinition = {
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  description: 'Add bookable field to assets',
  breaking: false,
  
  up: async (data) => {
    if (data.type === 'asset') {
      return { ...data, bookable: true }; // Default to bookable
    }
    return data;
  },
  
  down: async (data) => {
    if (data.type === 'asset') {
      const { bookable, ...rest } = data;
      return rest; // Remove bookable field
    }
    return data;
  }
};
```

---

### New Entities (Permissions)

#### PermissionContext (NEW)
Context for permission checks (future abstraction).

**Interface**:
```typescript
interface IPermissionService {
  canBookForOthers(userId: string): Promise<boolean>;
  canApproveBookings(userId: string): Promise<boolean>;
  canManageAssets(userId: string): Promise<boolean>;
  // ... future permissions
}
```

**Current Implementation** (Clarification Q2):
```typescript
class SimplePermissionService implements IPermissionService {
  async canBookForOthers(userId: string): Promise<boolean> {
    return true; // Any authenticated user can book for anyone
  }
  
  // ... all other methods return true
}
```

**Future Implementation**:
```typescript
class ChurchToolsPermissionService implements IPermissionService {
  async canBookForOthers(userId: string): Promise<boolean> {
    const roles = await this.api.getUserRoles(userId);
    return roles.includes('inventory-admin') || 
           roles.includes('booking-coordinator');
  }
  
  // ... check actual roles from ChurchTools API
}
```

---

## Entity Relationships

```
┌─────────────────┐
│     Person      │ (ChurchTools API)
└────────┬────────┘
         │
         │ bookedBy / bookingFor
         ↓
┌─────────────────┐       ┌─────────────────┐
│    Booking      │──────→│     Asset       │
└─────────────────┘       └────────┬────────┘
         │                         │
         │                         │ photos[]
         │                         ↓
         │                ┌─────────────────┐
         │                │ PhotoMetadata   │
         │                └─────────────────┘
         │
         │
┌─────────────────┐       ┌─────────────────┐
│ StockTakeSession│──────→│ StockTakeScan   │
└────────┬────────┘       └─────────────────┘
         │
         │ has conflicts
         ↓
┌─────────────────┐
│  SyncConflict   │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ SchemaVersion   │──────→│MigrationDefinition│
└─────────────────┘       └─────────────────┘
```

---

## Storage Strategy

### ChurchTools Custom Modules API
**Entities Stored**:
- Booking (with schemaVersion)
- Asset (with schemaVersion, photos as base64 or file IDs)
- StockTakeSession (synced from offline)
- StockTakeScan (synced from offline)
- SchemaVersion

**Custom Data Categories**:
- `bookings` - All booking records
- `assets` - All asset records
- `stock-take-sessions` - All stock take sessions
- `stock-take-scans` - All scans
- `schema-versions` - Migration tracking
- `photo-metadata` - Photo compression info (future)

---

### IndexedDB (Offline Storage - Dexie.js)
**Entities Stored**:
- StockTakeSession (while offline)
- StockTakeScan (while offline)
- SyncConflict (during resolution)
- PersonCache (cached person data)

**Database Schema**:
```typescript
const db = new Dexie('InventoryDB');

db.version(1).stores({
  stockTakeSessions: 'id, syncStatus, lastSyncAt',
  stockTakeScans: 'id, sessionId, syncStatus, scannedAt',
  syncConflicts: 'id, entityType, entityId, resolvedAt',
  personCache: 'id, cachedAt'
});
```

---

### LocalStorage
**Data Stored**:
- Scanner preferences (`scannerPreference` key)
- Child asset collapse state (`assetCollapseState` key)
- View mode preferences (`viewModePrefs` key)

**Size Limit**: ~5MB (sufficient for preferences)

---

## Validation Rules Summary

### Cross-Entity Validations
1. **Booking → Asset**:
   - Asset MUST exist
   - Asset MUST be bookable (`asset.bookable = true`)
   - Asset MUST be available for selected dates (no overlapping bookings)

2. **Booking → Person**:
   - Both `bookedById` and `bookingForId` MUST be valid ChurchTools person IDs
   - Person search results MUST be cached for performance

3. **StockTakeScan → Asset**:
   - Asset MUST exist
   - Cannot scan same asset twice in same session (unless explicitly allowed)

4. **PhotoMetadata → PhotoStorage**:
   - All photo IDs (original, thumbnail, fullSize) MUST be valid
   - Can be base64 data URLs or ChurchTools file IDs
   - Must pass `photoStorage.isBase64Photo()` or be valid file ID

---

## Performance Considerations

### Indexing Strategy
- **Bookings**: Index on `assetId`, `bookedById`, `startDate`, `status`
- **Assets**: Index on `bookable`, `categoryId`, `status`
- **StockTakeScans**: Index on `sessionId`, `syncStatus`, `scannedAt`
- **PersonCache**: Index on `cachedAt` for expiration cleanup

### Caching Strategy
- **Person data**: 5 minutes in-memory, 24 hours localStorage
- **Asset availability**: Real-time check (no caching, critical data)
- **Photos**: Browser cache headers for thumbnails (1 week)

### Data Size Estimates
- Booking: ~500 bytes JSON
- Asset: ~1-2KB JSON (without photos)
- Asset with photos (base64): ~50KB per photo (average)
- Asset with photos (Files API): ~50 bytes per photo ID
- StockTakeScan: ~300 bytes JSON
- Person cache entry: ~200 bytes JSON

---

## Migration Strategy

### Phase 1: Add new fields (backward compatible)
- Add `bookable` to Asset (default: `true`)
- Add `bookedById`/`bookingForId` to Booking
- Add `bookingMode` to Booking (default: `'date-range'` for existing)
- All existing data remains valid

### Phase 2: Photo storage abstraction
- All existing base64 photos continue working
- New uploads can use base64 or Files API (config-driven)
- Migration script to convert base64 → Files (optional, gradual)

### Phase 3: Schema versioning
- Add `schemaVersion` field to all entities
- Run migrations on app load
- Automatic rollback on failure

**No Breaking Changes**: All migrations are additive or have rollback capability.

---

Ready to proceed to contract generation and quickstart guide.
