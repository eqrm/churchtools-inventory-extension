# ChurchTools Inventory Extension - API Documentation

**Version**: 1.0  
**Last Updated**: October 21, 2025  
**Audience**: Developers

---

## Table of Contents

1. [Overview](#overview)
2. [ChurchToolsStorageProvider](#churchtoolsstorageprovider)
3. [Asset Management](#asset-management)
4. [Category Management](#category-management)
5. [Booking Management](#booking-management)
6. [Kit Management](#kit-management)
7. [Stock Take](#stock-take)
8. [Maintenance](#maintenance)
9. [Settings](#settings)
10. [Type Definitions](#type-definitions)
11. [Error Handling](#error-handling)

---

## Overview

The ChurchTools Inventory Extension uses a storage provider abstraction layer to interact with ChurchTools Custom Modules API.

### Architecture

```
React Components
     ↓
TanStack Query Hooks (useAssets, useBookings, etc.)
     ↓
ChurchToolsStorageProvider
     ↓
ChurchTools Custom Modules API
```

### Main Provider

**File**: `src/services/storage/ChurchToolsProvider.ts`

```typescript
class ChurchToolsStorageProvider implements IStorageProvider {
  private moduleId: number;
  private apiClient: ChurchToolsApiClient;
  
  constructor(moduleId: number, apiToken?: string) {
    // Initialize provider
  }
}
```

---

## ChurchToolsStorageProvider

### Initialization

```typescript
import { ChurchToolsStorageProvider } from './services/storage/ChurchToolsProvider';

const provider = new ChurchToolsStorageProvider(
  12345, // Module ID from ChurchTools
  'optional-api-token'
);
```

### Configuration

**Environment Variables**:
```env
VITE_CHURCHTOOLS_MODULE_ID=12345
VITE_CHURCHTOOLS_API_TOKEN=your-token-here
VITE_ENVIRONMENT=development
```

---

## Asset Management

### getAssets

Retrieve all assets with optional filtering.

**Signature**:
```typescript
async getAssets(filters?: AssetFilters): Promise<Asset[]>
```

**Parameters**:
- `filters` (optional): Filter criteria
  - `categoryId?: string` - Filter by category
  - `status?: AssetStatus` - Filter by status
  - `location?: string` - Filter by location
  - `search?: string` - Search by name/number
  - `parentAssetId?: string | null` - Filter by parent

**Returns**: `Promise<Asset[]>` - Array of matching assets

**Example**:
```typescript
// Get all assets
const allAssets = await provider.getAssets();

// Get available cameras
const availableCameras = await provider.getAssets({
  categoryId: 'cat-123',
  status: 'available'
});

// Search by name
const searchResults = await provider.getAssets({
  search: 'Canon'
});

// Get child assets of a parent
const children = await provider.getAssets({
  parentAssetId: 'asset-456'
});
```

---

### getAsset

Get a single asset by ID.

**Signature**:
```typescript
async getAsset(id: string): Promise<Asset>
```

**Parameters**:
- `id`: Asset ID

**Returns**: `Promise<Asset>` - The asset

**Throws**: Error if asset not found

**Example**:
```typescript
const asset = await provider.getAsset('asset-123');
console.log(asset.name); // "Canon EOS R5"
```

---

### createAsset

Create a new asset.

**Signature**:
```typescript
async createAsset(data: Omit<Asset, 'id'>): Promise<Asset>
```

**Parameters**:
- `data`: Asset data (without ID)

**Required Fields**:
- `categoryId: string`
- `name: string`
- `assetNumber: string`
- `status: AssetStatus`

**Optional Fields**:
- `location?: string`
- `purchaseDate?: Date`
- `purchasePrice?: number`
- `warrantyExpiry?: Date`
- `photos?: string[]` (base64 data URLs)
- `notes?: string`
- `customFields?: Record<string, unknown>`
- `isParent?: boolean`
- `parentAssetId?: string`
- `childAssetIds?: string[]`

**Returns**: `Promise<Asset>` - Created asset with ID

**Example**:
```typescript
const newAsset = await provider.createAsset({
  categoryId: 'cat-123',
  name: 'Canon EOS R5',
  assetNumber: 'CAM-001',
  status: 'available',
  location: 'Storage Room A',
  purchaseDate: new Date('2024-01-15'),
  purchasePrice: 3899.99,
  customFields: {
    sensorSize: 'Full Frame',
    isoRange: '100-51200'
  }
});
```

---

### updateAsset

Update an existing asset.

**Signature**:
```typescript
async updateAsset(id: string, data: Partial<Asset>): Promise<Asset>
```

**Parameters**:
- `id`: Asset ID
- `data`: Fields to update

**Returns**: `Promise<Asset>` - Updated asset

**Example**:
```typescript
const updated = await provider.updateAsset('asset-123', {
  status: 'broken',
  notes: 'Lens mount damaged, sent for repair'
});
```

**Auto-Cancellation** (T241a):
If status changes to 'broken', active bookings are automatically cancelled.

---

### deleteAsset

Delete an asset.

**Signature**:
```typescript
async deleteAsset(id: string): Promise<void>
```

**Parameters**:
- `id`: Asset ID

**Throws**: 
- `EdgeCaseError` if parent asset has children with active bookings (T241c)

**Example**:
```typescript
await provider.deleteAsset('asset-123');
```

**Validation**:
- Parent assets cannot be deleted if children have active bookings
- Throws detailed error with child asset numbers and booking counts

---

### regenerateAssetBarcode

Generate a new barcode for an asset.

**Signature**:
```typescript
async regenerateAssetBarcode(id: string): Promise<Asset>
```

**Parameters**:
- `id`: Asset ID

**Returns**: `Promise<Asset>` - Asset with new barcode

**Example**:
```typescript
const asset = await provider.regenerateAssetBarcode('asset-123');
// Old barcode archived in history
// New barcode generated with timestamp
```

---

## Category Management

### getCategories

Get all asset categories.

**Signature**:
```typescript
async getCategories(): Promise<Category[]>
```

**Returns**: `Promise<Category[]>` - All categories

**Example**:
```typescript
const categories = await provider.getCategories();
categories.forEach(cat => {
  console.log(`${cat.name}: ${cat.assetCount} assets`);
});
```

---

### getCategory

Get a single category by ID.

**Signature**:
```typescript
async getCategory(id: string): Promise<Category>
```

**Parameters**:
- `id`: Category ID

**Returns**: `Promise<Category>` - The category

**Example**:
```typescript
const category = await provider.getCategory('cat-123');
```

---

### createCategory

Create a new category.

**Signature**:
```typescript
async createCategory(data: Omit<Category, 'id' | 'assetCount'>): Promise<Category>
```

**Parameters**:
- `data`: Category data

**Required Fields**:
- `name: string`
- `icon: string`

**Optional Fields**:
- `description?: string`
- `customFields?: CustomFieldDefinition[]`

**Returns**: `Promise<Category>` - Created category

**Example**:
```typescript
const category = await provider.createCategory({
  name: 'Cameras',
  icon: 'Camera',
  description: 'Camera bodies and lenses',
  customFields: [
    {
      id: 'sensor-size',
      name: 'Sensor Size',
      type: 'select',
      options: ['Full Frame', 'APS-C', 'Micro 4/3'],
      required: false
    }
  ]
});
```

---

### updateCategory

Update a category.

**Signature**:
```typescript
async updateCategory(id: string, data: Partial<Category>): Promise<Category>
```

**Parameters**:
- `id`: Category ID
- `data`: Fields to update

**Returns**: `Promise<Category>` - Updated category

**Example**:
```typescript
const updated = await provider.updateCategory('cat-123', {
  description: 'Updated description'
});
```

---

### deleteCategory

Delete a category.

**Signature**:
```typescript
async deleteCategory(id: string): Promise<void>
```

**Parameters**:
- `id`: Category ID

**Throws**: Error if category has assets

**Example**:
```typescript
await provider.deleteCategory('cat-123');
```

---

## Booking Management

### getBookings

Get all bookings with optional filtering.

**Signature**:
```typescript
async getBookings(filters?: BookingFilters): Promise<Booking[]>
```

**Parameters**:
- `filters` (optional):
  - `assetId?: string` - Filter by asset
  - `status?: BookingStatus` - Filter by status
  - `startDate?: Date` - Bookings starting after date
  - `endDate?: Date` - Bookings ending before date

**Returns**: `Promise<Booking[]>` - Array of bookings

**Example**:
```typescript
// Get all active bookings
const active = await provider.getBookings({ status: 'active' });

// Get bookings for specific asset
const assetBookings = await provider.getBookings({ 
  assetId: 'asset-123' 
});

// Get upcoming bookings
const upcoming = await provider.getBookings({
  status: 'approved',
  startDate: new Date()
});
```

---

### getBooking

Get a single booking by ID.

**Signature**:
```typescript
async getBooking(id: string): Promise<Booking>
```

**Parameters**:
- `id`: Booking ID

**Returns**: `Promise<Booking>` - The booking

**Example**:
```typescript
const booking = await provider.getBooking('booking-123');
```

---

### createBooking

Create a new booking.

**Signature**:
```typescript
async createBooking(data: Omit<Booking, 'id' | 'status'>): Promise<Booking>
```

**Parameters**:
- `data`: Booking data

**Required Fields**:
- `assetId: string` - Asset to book
- `startDate: Date` - Start date/time
- `endDate: Date` - End date/time
- `bookedBy: string` - User ID
- `purpose: string` - Reason for booking

**Optional Fields**:
- `notes?: string`
- `kitId?: string` - If booking a kit

**Returns**: `Promise<Booking>` - Created booking with 'pending' status

**Validation**:
- Checks asset availability for date range
- Prevents double-booking
- For kits: validates all components available

**Example**:
```typescript
const booking = await provider.createBooking({
  assetId: 'asset-123',
  startDate: new Date('2025-10-25T09:00:00'),
  endDate: new Date('2025-10-25T17:00:00'),
  bookedBy: 'user-456',
  purpose: 'Sunday Service',
  notes: 'Need for main sanctuary'
});
```

---

### updateBooking

Update a booking.

**Signature**:
```typescript
async updateBooking(id: string, data: Partial<Booking>): Promise<Booking>
```

**Parameters**:
- `id`: Booking ID
- `data`: Fields to update

**Returns**: `Promise<Booking>` - Updated booking

**Example**:
```typescript
// Approve booking
const approved = await provider.updateBooking('booking-123', {
  status: 'approved'
});

// Extend booking
const extended = await provider.updateBooking('booking-123', {
  endDate: new Date('2025-10-26T17:00:00')
});
```

---

### checkOutBooking

Mark booking as checked out.

**Signature**:
```typescript
async checkOutBooking(id: string): Promise<Booking>
```

**Parameters**:
- `id`: Booking ID

**Returns**: `Promise<Booking>` - Booking with 'active' status

**Example**:
```typescript
const active = await provider.checkOutBooking('booking-123');
// Asset status changes to 'in-use'
```

---

### checkInBooking

Mark booking as checked in (returned).

**Signature**:
```typescript
async checkInBooking(
  id: string, 
  options?: {
    damaged?: boolean;
    damageNotes?: string;
    damagePhotos?: string[];
  }
): Promise<Booking>
```

**Parameters**:
- `id`: Booking ID
- `options` (optional):
  - `damaged`: Report damage
  - `damageNotes`: Damage description
  - `damagePhotos`: Photos of damage

**Returns**: `Promise<Booking>` - Booking with 'completed' status

**Side Effects**:
- If damaged: Asset status changes to 'broken'
- Maintenance record created automatically
- Email sent to maintenance team (if configured)

**Example**:
```typescript
// Normal check-in
await provider.checkInBooking('booking-123');

// Check-in with damage report
await provider.checkInBooking('booking-123', {
  damaged: true,
  damageNotes: 'Lens mount loose, needs tightening',
  damagePhotos: ['data:image/jpeg;base64,...']
});
```

---

### cancelBooking

Cancel a booking.

**Signature**:
```typescript
async cancelBooking(id: string, reason?: string): Promise<void>
```

**Parameters**:
- `id`: Booking ID
- `reason` (optional): Cancellation reason

**Example**:
```typescript
await provider.cancelBooking('booking-123', 'Event postponed');
```

---

### isAssetAvailable

Check if asset is available for booking.

**Signature**:
```typescript
async isAssetAvailable(
  assetId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean>
```

**Parameters**:
- `assetId`: Asset to check
- `startDate`: Start of period
- `endDate`: End of period

**Returns**: `Promise<boolean>` - True if available

**Example**:
```typescript
const available = await provider.isAssetAvailable(
  'asset-123',
  new Date('2025-10-25T09:00:00'),
  new Date('2025-10-25T17:00:00')
);

if (!available) {
  console.log('Asset is already booked for this time');
}
```

---

## Kit Management

### getKits

Get all equipment kits.

**Signature**:
```typescript
async getKits(): Promise<Kit[]>
```

**Returns**: `Promise<Kit[]>` - All kits

**Example**:
```typescript
const kits = await provider.getKits();
```

---

### getKit

Get a single kit by ID.

**Signature**:
```typescript
async getKit(id: string): Promise<Kit>
```

**Parameters**:
- `id`: Kit ID

**Returns**: `Promise<Kit>` - The kit

**Example**:
```typescript
const kit = await provider.getKit('kit-123');
```

---

### createKit

Create a new kit.

**Signature**:
```typescript
async createKit(data: Omit<Kit, 'id'>): Promise<Kit>
```

**Parameters**:
- `data`: Kit data

**For Fixed Kits**:
```typescript
{
  name: 'Sunday Worship Kit',
  description: 'Complete audio setup',
  type: 'fixed',
  components: [
    { assetId: 'asset-123', assetNumber: 'MIC-001' },
    { assetId: 'asset-456', assetNumber: 'MIC-002' }
  ]
}
```

**For Flexible Kits**:
```typescript
{
  name: 'Basic Audio Kit',
  description: 'Flexible microphone setup',
  type: 'flexible',
  flexibleComponents: [
    { categoryId: 'cat-microphones', quantity: 4 },
    { categoryId: 'cat-cables', quantity: 4 }
  ]
}
```

**Returns**: `Promise<Kit>` - Created kit

**Example**:
```typescript
const fixedKit = await provider.createKit({
  name: 'Camera Kit A',
  type: 'fixed',
  components: [
    { assetId: 'cam-001', assetNumber: 'CAM-001' },
    { assetId: 'lens-001', assetNumber: 'LENS-001' }
  ]
});

const flexibleKit = await provider.createKit({
  name: 'Event Audio',
  type: 'flexible',
  flexibleComponents: [
    { categoryId: 'cat-mic', quantity: 6 },
    { categoryId: 'cat-cable', quantity: 6 }
  ]
});
```

---

### updateKit

Update a kit.

**Signature**:
```typescript
async updateKit(id: string, data: Partial<Kit>): Promise<Kit>
```

**Parameters**:
- `id`: Kit ID
- `data`: Fields to update

**Returns**: `Promise<Kit>` - Updated kit

**Example**:
```typescript
const updated = await provider.updateKit('kit-123', {
  name: 'Updated Kit Name',
  components: [/* new components */]
});
```

---

### deleteKit

Delete a kit.

**Signature**:
```typescript
async deleteKit(id: string): Promise<void>
```

**Parameters**:
- `id`: Kit ID

**Note**: Deleting kit does not delete assets

**Example**:
```typescript
await provider.deleteKit('kit-123');
```

---

## Stock Take

### getStockTakeSessions

Get all stock take sessions.

**Signature**:
```typescript
async getStockTakeSessions(): Promise<StockTakeSession[]>
```

**Returns**: `Promise<StockTakeSession[]>` - All sessions

**Example**:
```typescript
const sessions = await provider.getStockTakeSessions();
```

---

### getStockTakeSession

Get a single session by ID.

**Signature**:
```typescript
async getStockTakeSession(id: string): Promise<StockTakeSession>
```

**Parameters**:
- `id`: Session ID

**Returns**: `Promise<StockTakeSession>` - The session

**Example**:
```typescript
const session = await provider.getStockTakeSession('session-123');
console.log(`Scanned ${session.scannedAssets.length} assets`);
```

---

### createStockTakeSession

Start a new stock take session.

**Signature**:
```typescript
async createStockTakeSession(
  data: Omit<StockTakeSession, 'id' | 'scannedAssets' | 'createdAt' | 'status'>
): Promise<StockTakeSession>
```

**Parameters**:
- `data`: Session data
  - `name: string` - Session name
  - `locationFilter?: string` - Limit to location
  - `categoryFilter?: string` - Limit to category
  - `startedBy: string` - User ID

**Returns**: `Promise<StockTakeSession>` - Created session with 'in-progress' status

**Example**:
```typescript
const session = await provider.createStockTakeSession({
  name: 'Q4 2025 Inventory Audit',
  locationFilter: 'Storage Room A',
  startedBy: 'user-123'
});
```

---

### addStockTakeScan

Add a scanned asset to session.

**Signature**:
```typescript
async addStockTakeScan(
  sessionId: string,
  assetId: string
): Promise<StockTakeScan>
```

**Parameters**:
- `sessionId`: Session ID
- `assetId`: Asset ID to add

**Returns**: `Promise<StockTakeScan>` - Scan record

**Throws**: `EdgeCaseError` if asset already scanned (T241b)

**Example**:
```typescript
try {
  const scan = await provider.addStockTakeScan('session-123', 'asset-456');
  console.log('Scanned successfully');
} catch (error) {
  if (error instanceof EdgeCaseError && error.duplicateScan) {
    console.log(`Already scanned ${error.duplicateScan.scannedAt}`);
  }
}
```

---

### completeStockTakeSession

Complete and finalize a session.

**Signature**:
```typescript
async completeStockTakeSession(id: string): Promise<StockTakeSession>
```

**Parameters**:
- `id`: Session ID

**Returns**: `Promise<StockTakeSession>` - Session with 'completed' status

**Side Effects**:
- Generates discrepancy report
- Identifies missing assets
- Flags unexpected scans

**Example**:
```typescript
const completed = await provider.completeStockTakeSession('session-123');
console.log(`Found: ${completed.foundCount}`);
console.log(`Missing: ${completed.missingCount}`);
```

---

## Maintenance

### getMaintenanceSchedules

Get all maintenance schedules.

**Signature**:
```typescript
async getMaintenanceSchedules(): Promise<MaintenanceSchedule[]>
```

**Returns**: `Promise<MaintenanceSchedule[]>` - All schedules

**Example**:
```typescript
const schedules = await provider.getMaintenanceSchedules();
```

---

### createMaintenanceSchedule

Create a maintenance schedule for an asset.

**Signature**:
```typescript
async createMaintenanceSchedule(
  data: Omit<MaintenanceSchedule, 'id'>
): Promise<MaintenanceSchedule>
```

**Parameters**:
- `data`: Schedule data

**For Time-Based**:
```typescript
{
  assetId: 'asset-123',
  scheduleType: 'time-based',
  intervalDays: 180, // Every 6 months
  maintenanceType: 'service',
  description: 'Regular service and cleaning'
}
```

**For Usage-Based**:
```typescript
{
  assetId: 'asset-123',
  scheduleType: 'usage-based',
  usageHours: 100, // Every 100 hours of use
  maintenanceType: 'calibration',
  description: 'Calibrate after 100 hours'
}
```

**Returns**: `Promise<MaintenanceSchedule>` - Created schedule

**Example**:
```typescript
const schedule = await provider.createMaintenanceSchedule({
  assetId: 'asset-123',
  scheduleType: 'time-based',
  intervalDays: 90,
  maintenanceType: 'inspection',
  description: 'Quarterly inspection'
});
```

---

### createMaintenanceRecord

Record completed maintenance.

**Signature**:
```typescript
async createMaintenanceRecord(
  data: Omit<MaintenanceRecord, 'id' | 'createdAt'>
): Promise<MaintenanceRecord>
```

**Parameters**:
- `data`: Record data
  - `assetId: string`
  - `maintenanceType: string`
  - `date: Date`
  - `performedBy: string`
  - `cost?: number`
  - `notes?: string`
  - `nextDue?: Date`

**Returns**: `Promise<MaintenanceRecord>` - Created record

**Side Effects**:
- Updates schedule's last completion date
- Auto-calculates next due date (if not specified)

**Example**:
```typescript
const record = await provider.createMaintenanceRecord({
  assetId: 'asset-123',
  maintenanceType: 'service',
  date: new Date(),
  performedBy: 'user-456',
  cost: 150.00,
  notes: 'Cleaned sensor, checked all functions'
});
```

---

## Settings

### getSettings

Get system settings.

**Signature**:
```typescript
async getSettings(): Promise<Settings>
```

**Returns**: `Promise<Settings>` - Current settings

**Example**:
```typescript
const settings = await provider.getSettings();
console.log(`Asset prefix: ${settings.assetNumberPrefix}`);
```

---

### updateSettings

Update system settings.

**Signature**:
```typescript
async updateSettings(data: Partial<Settings>): Promise<Settings>
```

**Parameters**:
- `data`: Settings to update

**Example**:
```typescript
const updated = await provider.updateSettings({
  assetNumberPrefix: 'AUD'
});
```

---

### getLocations

Get all pre-defined locations.

**Signature**:
```typescript
async getLocations(): Promise<Location[]>
```

**Returns**: `Promise<Location[]>` - All locations

**Example**:
```typescript
const locations = await provider.getLocations();
```

---

### createLocation

Add a new location.

**Signature**:
```typescript
async createLocation(name: string): Promise<Location>
```

**Parameters**:
- `name`: Location name

**Returns**: `Promise<Location>` - Created location

**Example**:
```typescript
const location = await provider.createLocation('Tech Booth');
```

---

### deleteLocation

Delete a location.

**Signature**:
```typescript
async deleteLocation(id: string): Promise<void>
```

**Parameters**:
- `id`: Location ID

**Throws**: Error if location has assets

**Example**:
```typescript
await provider.deleteLocation('loc-123');
```

---

## Type Definitions

### Asset

```typescript
interface Asset {
  id: string;
  categoryId: string;
  name: string;
  assetNumber: string;
  status: AssetStatus;
  location?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  photos: string[]; // Base64 data URLs
  notes?: string;
  customFields: Record<string, unknown>;
  isParent?: boolean;
  parentAssetId?: string;
  childAssetIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### AssetStatus

```typescript
type AssetStatus = 
  | 'available'
  | 'in-use'
  | 'broken'
  | 'in-repair'
  | 'installed'
  | 'sold'
  | 'destroyed';
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  customFields: CustomFieldDefinition[];
  assetCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking

```typescript
interface Booking {
  id: string;
  assetId: string;
  kitId?: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  bookedBy: string;
  bookedByName?: string;
  purpose: string;
  notes?: string;
  checkedOutAt?: Date;
  checkedInAt?: Date;
  asset?: Asset; // Populated in responses
  createdAt: Date;
  updatedAt: Date;
}
```

### BookingStatus

```typescript
type BookingStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'completed'
  | 'overdue'
  | 'cancelled';
```

### Kit

```typescript
interface Kit {
  id: string;
  name: string;
  description?: string;
  type: 'fixed' | 'flexible';
  components?: { assetId: string; assetNumber: string }[]; // For fixed kits
  flexibleComponents?: { categoryId: string; quantity: number }[]; // For flexible kits
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Handling

### EdgeCaseError

Custom error type for business logic violations.

```typescript
class EdgeCaseError extends Error {
  duplicateScan?: DuplicateScanInfo;
  parentDeletionConflict?: ParentDeletionConflict;
  // ... other error contexts
}
```

**Usage**:
```typescript
try {
  await provider.addStockTakeScan(sessionId, assetId);
} catch (error) {
  if (error instanceof EdgeCaseError) {
    if (error.duplicateScan) {
      console.log('Duplicate scan detected');
      console.log(`First scanned: ${error.duplicateScan.scannedAt}`);
      console.log(`Scanned by: ${error.duplicateScan.scannedBy}`);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Standard Errors

All methods may throw:
- `Error('Not found')` - Entity doesn't exist
- `Error('Validation failed')` - Invalid input
- `Error('Conflict')` - Business rule violation
- Network/API errors from ChurchTools

**Best Practice**:
```typescript
try {
  const asset = await provider.getAsset(id);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  // Handle error appropriately
}
```

---

## Usage with TanStack Query

**Example Hook**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { storageProvider } from './services/storage';

export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => storageProvider.getAssets(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

**Example Mutation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Asset, 'id'>) => 
      storageProvider.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
```

---

**End of API Documentation**

For more information:
- [User Guide](user-guide.md) - End-user documentation
- [Component Documentation](components.md) - React component API
- [Storage README](../src/services/storage/README.md) - Photo storage abstraction
