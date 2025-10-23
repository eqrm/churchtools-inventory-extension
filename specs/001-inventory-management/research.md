# Research Document: ChurchTools Inventory Management Extension

**Feature**: 001-inventory-management  
**Date**: 2025-10-18  
**Status**: Complete

## Overview

This document consolidates technical research and design decisions for implementing a comprehensive inventory management system as a ChurchTools extension. All NEEDS CLARIFICATION items from the Technical Context have been resolved through analysis of ChurchTools architecture, available APIs, and modern web development best practices.

---

## 1. UI Framework Selection

### Decision: Mantine UI v7.x

**Rationale**:
- **Lightweight**: ~100KB gzipped meets our 200KB bundle budget with room for business logic
- **Comprehensive**: 100+ components including forms, tables, calendars, modals - covers all our UI needs
- **TypeScript-first**: Excellent type definitions align with Type Safety First principle
- **ChurchTools consistency**: Clean, modern design language that can match ChurchTools aesthetics
- **Built-in features**: Dark mode, form management, date pickers, notifications, dropzone all included
- **Tree-shakeable**: Only import what we use, keeping bundle size minimal
- **Active maintenance**: v7.x is current stable, good community support

**Alternatives Considered**:
- **Material-UI (MUI)**: Rejected - too heavy (~300KB+ gzipped), would exceed bundle budget
- **Ant Design**: Rejected - similar weight issues, less tree-shakeable
- **Headless UI + Tailwind**: Rejected - would require building too many components from scratch, slowing development
- **ChakraUI**: Rejected - larger bundle size, less comprehensive table/calendar components

**Key Packages**:
```json
{
  "@mantine/core": "^7.x",        // Core components
  "@mantine/hooks": "^7.x",       // Utility hooks (useMediaQuery, useDebounce, etc.)
  "@mantine/form": "^7.x",        // Form state management with validation
  "@mantine/dates": "^7.x",       // Date pickers and calendars
  "@mantine/notifications": "^7.x", // Toast notifications
  "@mantine/dropzone": "^7.x",    // File uploads for maintenance photos
  "mantine-datatable": "^7.x"     // Advanced data tables with filtering/sorting
}
```

---

## 2. State Management Architecture

### Decision: TanStack Query v5 + Zustand v4

**Rationale**:
- **Separation of concerns**: TanStack Query for server state (assets, bookings), Zustand for UI state (filters, preferences)
- **Caching strategy**: TanStack Query provides automatic caching, reducing API calls (Performance Budget compliance)
- **Optimistic updates**: Built-in support for immediate UI feedback before server confirmation
- **Offline support**: Query persistence layer can work with Dexie.js for stock take sessions
- **Type safety**: Both libraries have excellent TypeScript support
- **Bundle size**: Combined ~20KB gzipped, very efficient

**TanStack Query Use Cases**:
- Asset CRUD operations
- Category management
- Booking lifecycle
- Maintenance records
- User/Person data fetching
- Automatic background refetching
- Cache invalidation on mutations

**Zustand Use Cases**:
- Filter selections (category, status, date range)
- View mode preferences (table, gallery, calendar)
- Saved view configurations
- Scanner session state (current scans, session metadata)
- UI modal/drawer state
- User preferences (theme, language if supported)

**Alternatives Considered**:
- **Redux Toolkit**: Rejected - too heavy, unnecessary boilerplate for this scale
- **React Context + useReducer**: Rejected - lacks caching/fetching logic, would need manual implementation
- **SWR**: Considered but TanStack Query has better TypeScript support and more features
- **Jotai/Recoil**: Rejected - less mature, smaller ecosystems

---

## 3. Barcode/QR Code Implementation

### Decision: JsBarcode v3 (generation) + html5-qrcode v2 (scanning)

**Barcode Generation - JsBarcode**:
- **Rationale**: 11k+ stars, zero dependencies, supports Code-128 format (industry standard for inventory)
- **Bundle**: ~10KB, very lightweight
- **Usage**: Generate barcode images from asset numbers, display in UI, export to PDF labels

**QR Code Generation - qrcode v1**:
- **Rationale**: Lightweight (~8KB), simple API, widely used
- **Usage**: Generate QR codes for mobile-friendly scanning, asset labels

**Scanning - html5-qrcode v2**:
- **Rationale**: 
  - Camera-based scanning for mobile devices
  - USB/Bluetooth scanner support (keyboard emulation mode)
  - Works across browsers (Chrome, Safari, Firefox)
  - Handles lighting variations well (95%+ success rate goal)
- **Bundle**: ~45KB, acceptable for critical feature
- **Fallback**: Manual entry field if scanning fails

**Alternatives Considered**:
- **QuaggaJS**: Rejected - larger bundle, less maintained, browser compatibility issues
- **ZXing browser**: Considered but html5-qrcode has better mobile support
- **Native camera APIs**: Rejected - too low-level, browser inconsistencies

**Scanner Integration Pattern**:
```typescript
// USB/Bluetooth scanners work as keyboard input - no special handling needed
<TextInput
  ref={scannerInputRef}
  autoFocus
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      handleScan(e.currentTarget.value)
      e.currentTarget.value = ''
    }
  }}
/>

// Camera scanning for mobile
import { Html5Qrcode } from 'html5-qrcode'
const scanner = new Html5Qrcode('scanner-container')
scanner.start(
  { facingMode: 'environment' },
  { fps: 10, qrbox: 250 },
  onScanSuccess,
  onScanFailure
)
```

---

## 4. Storage Abstraction Layer Design

### Decision: Interface-based abstraction with ChurchTools and Offline implementations

**Rationale**:
- **Future-proof**: Allows switching backend from ChurchTools Custom Modules API to dedicated database later
- **Testability**: Can mock storage provider for unit tests
- **Offline support**: Enables Dexie.js implementation for stock take sessions
- **Type safety**: Interface enforces consistent API across implementations

**Interface Design**:
```typescript
interface IStorageProvider {
  // Asset Categories (ChurchTools: customdatacategories)
  getCategories(): Promise<Category[]>
  getCategory(id: string): Promise<Category>
  createCategory(category: CategoryCreate): Promise<Category>
  updateCategory(id: string, category: CategoryUpdate): Promise<Category>
  deleteCategory(id: string): Promise<void>
  
  // Assets (ChurchTools: customdatavalues under Assets category)
  getAssets(filters?: AssetFilters): Promise<Asset[]>
  getAsset(id: string): Promise<Asset>
  getAssetByNumber(assetNumber: string): Promise<Asset | null>
  createAsset(asset: AssetCreate): Promise<Asset>
  updateAsset(id: string, asset: AssetUpdate): Promise<Asset>
  deleteAsset(id: string): Promise<void>
  
  // Bookings (ChurchTools: customdatavalues under Bookings category)
  getBookings(filters?: BookingFilters): Promise<Booking[]>
  createBooking(booking: BookingCreate): Promise<Booking>
  updateBooking(id: string, booking: BookingUpdate): Promise<Booking>
  deleteBooking(id: string): Promise<void>
  
  // Kits, Maintenance, Stock Takes follow same pattern
  // ... (abbreviated for clarity)
  
  // Utility methods
  searchAssets(query: string): Promise<Asset[]>
  getCurrentUser(): Promise<PersonInfo>
  getPersonInfo(personId: string): Promise<PersonInfo>
}
```

**ChurchTools Implementation Mapping**:
```
Extension Module ID: [configured at deployment]

Data Categories within Module:
├── AssetCategories (stores asset category definitions)
│   └── customdatavalues: [{ name, icon, customFields, ... }]
├── Assets (stores individual assets)
│   └── customdatavalues: [{ assetNumber, name, status, categoryId, ... }]
├── Kits (stores equipment kits)
│   └── customdatavalues: [{ name, type, components, ... }]
├── Bookings (stores reservations)
│   └── customdatavalues: [{ assetId, startDate, endDate, status, ... }]
├── MaintenanceRecords
│   └── customdatavalues: [{ assetId, date, type, notes, ... }]
└── StockTakeSessions
    └── customdatavalues: [{ startDate, scope, scannedAssets, ... }]
```

**Offline Implementation** (Dexie.js for stock take):
- Syncs relevant assets to IndexedDB at session start
- Tracks scans locally during offline operation
- Syncs changes back to ChurchTools when online
- Only used for stock take feature (per constraints)

---

## 5. ChurchTools API Integration Patterns

### Decision: Typed API client wrapper with person caching

**API Client Architecture**:
```typescript
class ChurchToolsAPIClient {
  private baseUrl: string
  private personCache: Map<string, PersonInfo> = new Map()
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  
  // Generic methods
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data: unknown): Promise<T>
  async put<T>(endpoint: string, data: unknown): Promise<T>
  async delete(endpoint: string): Promise<void>
  
  // Person info with caching (reduces API calls)
  async getCurrentUser(): Promise<PersonInfo> {
    const response = await this.get<Person>('/whoami')
    return {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      name: `${response.firstName} ${response.lastName}`,
      email: response.email,
      avatarUrl: response.imageUrl
    }
  }
  
  async getPersonInfo(personId: string): Promise<PersonInfo> {
    if (this.personCache.has(personId)) {
      return this.personCache.get(personId)!
    }
    
    const response = await this.get<Person>(`/persons/${personId}`)
    const personInfo = {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      name: `${response.firstName} ${response.lastName}`,
      email: response.email,
      avatarUrl: response.imageUrl
    }
    
    this.personCache.set(personId, personInfo)
    return personInfo
  }
  
  // Error handling
  private handleError(error: unknown): never {
    if (error instanceof Response) {
      throw new APIError(error.status, error.statusText)
    }
    throw error
  }
}
```

**Custom Modules API Usage Pattern**:
```typescript
class ChurchToolsStorageProvider implements IStorageProvider {
  constructor(
    private moduleId: string,
    private apiClient: ChurchToolsAPIClient
  ) {}
  
  async getAssets(filters?: AssetFilters): Promise<Asset[]> {
    // 1. Get or create "Assets" data category
    const assetsCategory = await this.ensureDataCategory('Assets')
    
    // 2. Fetch all values from that category
    const response = await this.apiClient.get<CustomDataValue[]>(
      `/custommodules/${this.moduleId}/customdatacategories/${assetsCategory.id}/customdatavalues`
    )
    
    // 3. Transform to internal Asset type
    let assets = response.map(this.mapToAsset)
    
    // 4. Apply client-side filters if needed
    if (filters?.categoryId) {
      assets = assets.filter(a => a.category.id === filters.categoryId)
    }
    if (filters?.status) {
      assets = assets.filter(a => a.status === filters.status)
    }
    
    return assets
  }
  
  async createAsset(asset: AssetCreate): Promise<Asset> {
    const currentUser = await this.apiClient.getCurrentUser()
    const assetsCategory = await this.ensureDataCategory('Assets')
    
    // Generate asset number if not provided
    const assetNumber = asset.assetNumber || await this.generateAssetNumber(asset.prefix)
    
    const dataValue = {
      ...this.mapFromAsset({ ...asset, assetNumber }),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      lastModifiedBy: currentUser.id,
      lastModifiedByName: currentUser.name,
      lastModifiedAt: new Date().toISOString()
    }
    
    const response = await this.apiClient.post<CustomDataValue>(
      `/custommodules/${this.moduleId}/customdatacategories/${assetsCategory.id}/customdatavalues`,
      dataValue
    )
    
    return this.mapToAsset(response)
  }
  
  // Helper to ensure data category exists
  private async ensureDataCategory(name: string): Promise<CustomDataCategory> {
    const categories = await this.apiClient.get<CustomDataCategory[]>(
      `/custommodules/${this.moduleId}/customdatacategories`
    )
    
    let category = categories.find(c => c.name === name)
    if (!category) {
      category = await this.apiClient.post<CustomDataCategory>(
        `/custommodules/${this.moduleId}/customdatacategories`,
        { name }
      )
    }
    
    return category
  }
}
```

---

## 6. Asset Number Generation Strategy

### Decision: Server-side sequence with prefix support

**Rationale**:
- **Uniqueness guaranteed**: Server manages sequence, prevents collisions
- **Org customization**: Different prefixes for different asset types (SOUND-, CAM-, etc.)
- **Human-readable**: Format [PREFIX]-[SEQUENCE] (e.g., SOUND-001, CAM-042)
- **Sortable**: Zero-padded numbers maintain sort order

**Implementation**:
```typescript
class AssetNumberService {
  private sequenceCache: Map<string, number> = new Map()
  
  async generateAssetNumber(prefix: string): Promise<string> {
    // 1. Fetch latest asset with this prefix
    const existingAssets = await this.storage.getAssets({ prefix })
    
    // 2. Extract highest sequence number
    let maxSequence = 0
    for (const asset of existingAssets) {
      const match = asset.assetNumber.match(/^[A-Z]+-(\d+)$/)
      if (match) {
        const sequence = parseInt(match[1], 10)
        if (sequence > maxSequence) maxSequence = sequence
      }
    }
    
    // 3. Increment and format
    const nextSequence = maxSequence + 1
    return `${prefix}-${String(nextSequence).padStart(3, '0')}`
  }
}
```

**Prefix Management**:
- Default prefix: "ASSET"
- Users can configure custom prefixes per organization
- Stored in extension configuration (ChurchTools settings or environment)

---

## 7. Custom Fields Schema Design

### Decision: JSON schema stored with category, values in customdatavalues

**Rationale**:
- **Flexibility**: Each organization defines their own field types
- **Type safety**: JSON schema validates field values at runtime
- **Searchable**: Custom field values stored as properties, queryable
- **Extensible**: Easy to add new field types in future

**Custom Field Definition Schema**:
```typescript
type CustomFieldType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'multi-select' 
  | 'date' 
  | 'checkbox' 
  | 'long-text' 
  | 'url' 
  | 'person-reference'

interface CustomFieldDefinition {
  id: string
  name: string
  type: CustomFieldType
  required: boolean
  options?: string[]  // For select/multi-select
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface Category {
  id: string
  name: string
  icon?: string
  customFields: CustomFieldDefinition[]
}
```

**Storage in ChurchTools**:
```typescript
// Category stored in AssetCategories data category
{
  id: 'cat-123',
  name: 'Electronic Devices',
  icon: 'device-laptop',
  customFields: [
    {
      id: 'field-1',
      name: 'Serial Number',
      type: 'text',
      required: true
    },
    {
      id: 'field-2',
      name: 'Warranty Until',
      type: 'date',
      required: false
    },
    {
      id: 'field-3',
      name: 'Screen Size',
      type: 'number',
      required: false,
      validation: { min: 0, max: 100 }
    }
  ]
}

// Asset with custom field values
{
  id: 'asset-456',
  assetNumber: 'DEVICE-001',
  name: 'MacBook Pro 16"',
  categoryId: 'cat-123',
  customFieldValues: {
    'field-1': 'C02ABC123XYZ',
    'field-2': '2026-12-31',
    'field-3': 16
  }
}
```

**Validation Strategy**:
- Client-side validation using Mantine form with custom validators
- Server-side validation in storage provider before persisting
- Type coercion for numbers, dates to handle string inputs

---

## 8. Offline Support Strategy (Stock Take Only)

### Decision: Dexie.js with sync queue

**Rationale**:
- **Requirement**: Only stock take needs offline support (per constraints)
- **Dexie.js**: Clean API over IndexedDB, good TypeScript support, ~25KB
- **Sync queue**: Track changes made offline, sync when connection returns
- **Conflict resolution**: Last-write-wins for stock take (simple, acceptable)

**Offline Storage Schema**:
```typescript
// Dexie database schema
class InventoryDB extends Dexie {
  stockTakeSessions!: Table<StockTakeSession>
  scannedAssets!: Table<ScannedAsset>
  syncQueue!: Table<SyncQueueItem>
  
  constructor() {
    super('ChurchToolsInventory')
    this.version(1).stores({
      stockTakeSessions: 'id, startDate, status',
      scannedAssets: 'id, sessionId, assetNumber, scannedAt',
      syncQueue: 'id, operation, entity, timestamp'
    })
  }
}
```

**Stock Take Offline Flow**:
1. **Start Session** (online required):
   - Create session record in ChurchTools
   - Download relevant assets to IndexedDB
   - Store session metadata locally

2. **Scanning** (offline capable):
   - Scan assets using barcode/QR
   - Store scans in local IndexedDB
   - Add to sync queue
   - Visual confirmation of scan

3. **Sync** (when online):
   - Check network connectivity
   - Process sync queue in order
   - Update ChurchTools with all scans
   - Mark session as complete
   - Clear local data (optional, based on retention policy)

**Network Detection**:
```typescript
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}
```

---

## 9. Performance Optimization Strategies

### Goal: Meet 200KB bundle size and <1s load time requirements

**Bundle Size Optimization**:

1. **Code Splitting by Route**:
   ```typescript
   const AssetList = lazy(() => import('./components/assets/AssetList'))
   const BookingCalendar = lazy(() => import('./components/bookings/Calendar'))
   const StockTake = lazy(() => import('./components/stocktake/StockTake'))
   
   // Only load what's needed for current view
   ```

2. **Tree Shaking**:
   - Import only needed Mantine components
   - Use named imports: `import { Button, TextInput } from '@mantine/core'`
   - Avoid default imports of large libraries

3. **Dynamic Imports**:
   - Load barcode scanner only when needed
   - Load PDF generation only when exporting labels
   - Load date-fns locale files on demand

4. **Bundle Analysis**:
   ```bash
   npm run build -- --analyze
   # Review output, identify large dependencies
   # Replace or eliminate heavy imports
   ```

**Load Time Optimization**:

1. **Critical CSS Inline**:
   - Inline minimal Mantine styles for initial render
   - Defer non-critical stylesheets

2. **Asset Optimization**:
   - Compress images (icons, logos)
   - Use SVG for icons (Tabler icons are SVG)
   - Optimize fonts (subset if possible)

3. **Caching Strategy**:
   ```typescript
   // TanStack Query cache times
   {
     staleTime: 5 * 60 * 1000,  // 5 minutes
     cacheTime: 30 * 60 * 1000, // 30 minutes
     refetchOnWindowFocus: false,
     refetchOnMount: false
   }
   ```

4. **Lazy Data Loading**:
   - Virtualized tables for large asset lists (mantine-datatable supports this)
   - Pagination for bookings, maintenance records
   - Infinite scroll for filtered views

**Runtime Performance**:

1. **Memoization**:
   ```typescript
   const filteredAssets = useMemo(() => {
     return assets.filter(asset => {
       // Complex filtering logic
     })
   }, [assets, filters])
   ```

2. **Debounced Search**:
   ```typescript
   const debouncedSearch = useDebouncedValue(searchQuery, 300)
   
   useQuery({
     queryKey: ['assets', 'search', debouncedSearch],
     queryFn: () => searchAssets(debouncedSearch)
   })
   ```

3. **Optimistic Updates**:
   ```typescript
   const mutation = useMutation({
     mutationFn: updateAsset,
     onMutate: async (newAsset) => {
       // Update UI immediately
       queryClient.setQueryData(['assets', newAsset.id], newAsset)
     }
   })
   ```

**Target Bundle Sizes** (after optimization):
- Core bundle: ~80-100 KB (React, Mantine core, routing)
- Asset management: ~30-40 KB
- Barcode/scanning: ~45 KB
- Booking/calendar: ~20-30 KB
- Reports/views: ~15-20 KB
- **Total**: ~190-235 KB (before gzip)
- **Gzipped**: ~70-80 KB (well under 200 KB budget)

---

## 10. Testing Strategy

### Decision: Manual testing required, automated tests for complex logic only

**Rationale** (per constitution):
- Manual testing is minimum requirement
- Automated tests only if feature warrants investment
- This inventory system has complex logic (asset numbering, booking conflicts, parent-child relationships) that benefits from automated tests

**Manual Testing Plan**:

1. **Cross-browser** (Chrome, Safari, Firefox):
   - Asset CRUD operations
   - Barcode scanning (camera and USB scanner)
   - Booking creation and check-in/out
   - Stock take session flow
   - Responsive behavior on mobile

2. **ChurchTools Integration**:
   - Verify in both dev (standalone) and production (embedded) modes
   - Test with real ChurchTools instance
   - Confirm user references display correctly
   - Validate API error handling

3. **Performance Testing**:
   - Load 1,000+ assets, verify <2s search time
   - Check bundle size after build
   - Test on throttled 3G connection
   - Profile memory usage during long sessions

**Automated Testing** (Vitest + Testing Library):

1. **Unit Tests** (recommended for):
   - Asset number generation logic
   - Custom field validation
   - Date/time formatting utilities
   - Filter/sort algorithms
   - Storage provider mappers

2. **Integration Tests** (recommended for):
   - Storage provider CRUD operations (mock ChurchTools API)
   - Booking conflict detection
   - Parent-child asset relationship logic
   - Offline sync queue processing

**Not Testing** (manual only):
- UI component rendering (low value, high maintenance)
- E2E workflows (manual testing sufficient for MVP)
- Visual regression (not critical for this project)

**Example Unit Test**:
```typescript
describe('AssetNumberService', () => {
  it('generates sequential asset numbers with prefix', async () => {
    const service = new AssetNumberService(mockStorage)
    const number1 = await service.generateAssetNumber('SOUND')
    expect(number1).toBe('SOUND-001')
    
    const number2 = await service.generateAssetNumber('SOUND')
    expect(number2).toBe('SOUND-002')
  })
  
  it('handles existing assets correctly', async () => {
    mockStorage.getAssets.mockResolvedValue([
      { assetNumber: 'CAM-001' },
      { assetNumber: 'CAM-005' }
    ])
    
    const service = new AssetNumberService(mockStorage)
    const number = await service.generateAssetNumber('CAM')
    expect(number).toBe('CAM-006')
  })
})
```

---

## 11. Error Handling and User Feedback

### Decision: Toast notifications + inline validation

**Error Handling Strategy**:

1. **API Errors**:
   ```typescript
   try {
     await createAsset(asset)
     notifications.show({
       title: 'Success',
       message: 'Asset created successfully',
       color: 'green'
     })
   } catch (error) {
     if (error instanceof APIError) {
       notifications.show({
         title: 'Error',
         message: `Failed to create asset: ${error.message}`,
         color: 'red'
       })
     }
   }
   ```

2. **Validation Errors**:
   ```typescript
   const form = useForm({
     initialValues: { name: '', model: '' },
     validate: {
       name: (value) => value.length < 3 ? 'Name must be at least 3 characters' : null,
       model: (value) => !value ? 'Model is required' : null
     }
   })
   ```

3. **Network Errors**:
   - Detect offline status
   - Show banner: "You're offline. Stock take scans will sync when connection returns."
   - Disable features that require online access
   - Auto-retry failed requests with exponential backoff

4. **User Feedback**:
   - Loading states on all async operations
   - Success confirmations for mutations
   - Clear error messages with actionable advice
   - Undo functionality for destructive actions (delete asset)

---

## 12. ChurchTools UI Consistency

### Decision: Match ChurchTools design language with Mantine customization

**Approach**:

1. **Color Scheme**:
   - Extract ChurchTools primary colors via CSS variables
   - Apply to Mantine theme
   ```typescript
   const theme = createTheme({
     primaryColor: 'ct-blue', // Match ChurchTools blue
     colors: {
       'ct-blue': [/* ChurchTools blue shades */]
     }
   })
   ```

2. **Typography**:
   - Use ChurchTools font stack (likely system fonts)
   - Match font sizes, weights, line heights

3. **Spacing**:
   - Follow ChurchTools spacing scale (8px grid likely)
   - Use consistent padding/margins

4. **Component Behavior**:
   - Modal patterns match ChurchTools modals
   - Form layouts similar to ChurchTools forms
   - Navigation aligns with ChurchTools sidebar/tabs

5. **Icons**:
   - Use Tabler Icons (Mantine-compatible)
   - Match icon style to ChurchTools (likely outline style)

**Development Process**:
1. Review ChurchTools UI in browser dev tools
2. Extract key CSS variables and patterns
3. Create Mantine theme override
4. Test side-by-side with ChurchTools
5. Iterate based on visual comparison

---

## Summary of Key Technical Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| UI Framework | Mantine UI v7.x | Lightweight (~100KB), comprehensive components, TypeScript-first |
| State Management | TanStack Query + Zustand | Server state caching + UI state separation, <20KB combined |
| Barcode Generation | JsBarcode v3 | Industry-standard Code-128, zero dependencies, 10KB |
| QR Generation | qrcode v1 | Simple, lightweight, 8KB |
| Barcode Scanning | html5-qrcode v2 | Camera + USB/Bluetooth support, 45KB, 95%+ accuracy |
| Storage Abstraction | IStorageProvider interface | Future-proof, testable, enables offline support |
| Backend Integration | ChurchTools Custom Modules API | Native integration, uses existing auth, no additional infrastructure |
| Offline Support | Dexie.js (stock take only) | Clean IndexedDB API, 25KB, sync queue pattern |
| Date Utilities | date-fns v3 | Lightweight vs Moment.js, tree-shakeable |
| PDF Generation | jsPDF v2 | Client-side label printing, ~70KB |
| Testing | Manual + selective automated | Constitution-compliant, pragmatic for MVP |
| Bundle Target | <200 KB gzipped | Constitution requirement, achievable with code splitting |

---

## Risk Mitigation

### Identified Risks:

1. **Bundle Size Overrun**:
   - Mitigation: Continuous bundle analysis, lazy loading, tree shaking
   - Fallback: Remove non-critical features (advanced reports, PDF export)

2. **ChurchTools API Limitations**:
   - Risk: Custom Modules API may not support all needed operations
   - Mitigation: Storage abstraction allows switching to direct DB access if needed
   - Fallback: Request ChurchTools API enhancements or use workarounds

3. **Barcode Scanning Reliability**:
   - Risk: Camera scanning may not achieve 95% success rate in all conditions
   - Mitigation: Provide manual entry as primary fallback
   - Fallback: Focus on USB scanner support if camera unreliable

4. **Performance at Scale**:
   - Risk: 5,000 assets may cause performance issues
   - Mitigation: Virtualized tables, pagination, indexed search
   - Fallback: Implement server-side filtering/pagination

5. **Offline Sync Conflicts**:
   - Risk: Multiple users performing stock takes offline may conflict
   - Mitigation: Last-write-wins strategy acceptable for stock take
   - Fallback: Warn users to complete stock takes online when possible

---

## Next Steps

With all technical decisions resolved, we can now proceed to:

1. **Phase 1**: Create detailed data models (`data-model.md`)
2. **Phase 1**: Define API contracts (`contracts/`)
3. **Phase 1**: Write developer quickstart guide (`quickstart.md`)
4. **Phase 2**: Generate implementation tasks (`tasks.md`)

All NEEDS CLARIFICATION items have been resolved. Implementation can proceed with confidence.
