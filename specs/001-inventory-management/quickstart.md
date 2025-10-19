# Developer Quickstart Guide

**Feature**: ChurchTools Inventory Management Extension  
**Date**: 2025-10-18  
**For**: Developers implementing this feature

## Overview

This guide will help you get started developing the ChurchTools Inventory Management Extension. Follow these steps to set up your development environment, understand the architecture, and begin implementation.

---

## Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
- **ChurchTools Instance**: Access to a ChurchTools instance for testing (or use local dev environment)
- **Git**: For version control

---

## Initial Setup

### 1. Clone and Install

```bash
# Navigate to the project root
cd churchtools-inventory-extension

# Install dependencies
npm install

# Verify TypeScript compilation
npx tsc --noEmit
```

### 2. Environment Configuration

Create a `.env` file in the project root (copy from `.env-example` if available):

```env
# ChurchTools Instance
VITE_BASE_URL=https://your-instance.church.tools
VITE_USERNAME=your-dev-username
VITE_PASSWORD=your-dev-password

# Extension Configuration
VITE_KEY=churchtools-inventory
VITE_MODULE_ID=  # Will be populated after first deployment
```

**⚠️ Security Note**: Never commit `.env` files to version control.

### 3. Development Server

```bash
# Start Vite dev server with hot module replacement
npm run dev

# Server will start at http://localhost:5173
```

**CORS Configuration**: You'll need to configure CORS in your ChurchTools instance:
1. Navigate to: **System Settings > Integrations > API > Cross-Origin Resource Sharing**
2. Add `http://localhost:5173` to allowed origins

---

## Project Architecture

### Directory Structure

```
src/
├── components/          # React UI components
│   ├── assets/         # Asset management UI
│   ├── categories/     # Category management UI
│   ├── bookings/       # Booking/reservation UI
│   ├── kits/           # Equipment kit UI
│   ├── maintenance/    # Maintenance scheduling UI
│   ├── stocktake/      # Stock take session UI
│   ├── scanner/        # Barcode/QR scanning UI
│   ├── reports/        # Reporting and views UI
│   └── common/         # Shared components
│
├── services/           # Business logic layer
│   ├── storage/        # Storage abstraction
│   │   ├── IStorageProvider.ts
│   │   ├── ChurchToolsProvider.ts
│   │   └── OfflineProvider.ts
│   ├── barcode/        # Barcode generation/scanning
│   ├── api/            # ChurchTools API client
│   └── utils/          # Helper utilities
│
├── hooks/              # Custom React hooks
│   ├── useAssets.ts    # TanStack Query hooks
│   ├── useCategories.ts
│   └── useBookings.ts
│
├── stores/             # Zustand state stores
│   ├── uiStore.ts      # UI state (filters, prefs)
│   └── scannerStore.ts # Scanner session state
│
├── types/              # TypeScript definitions
│   ├── entities.ts     # Core entity types
│   ├── api.ts          # API types
│   └── storage.ts      # Storage provider types
│
└── main.ts             # Application entry point
```

### Technology Stack

- **React 18**: UI framework with hooks and concurrent features
- **TypeScript 5**: Strict type safety (constitution requirement)
- **Vite 5**: Build tool with fast HMR
- **Mantine UI v7**: Component library (~100KB gzipped)
- **TanStack Query v5**: Server state management with caching
- **Zustand v4**: Client UI state management
- **JsBarcode v3**: Barcode generation
- **html5-qrcode v2**: QR code scanning
- **Dexie.js**: IndexedDB wrapper for offline support

---

## Development Workflow

### Step 1: Implement Storage Provider Interface

Start by implementing the storage abstraction layer:

```typescript
// src/services/storage/IStorageProvider.ts
// Already defined in specs/001-inventory-management/contracts/storage-provider.ts
// Copy this to src/types/storage.ts

// src/services/storage/ChurchToolsProvider.ts
import { IStorageProvider } from '../../types/storage'
import { ChurchToolsAPIClient } from '../api/ChurchToolsAPIClient'

export class ChurchToolsStorageProvider implements IStorageProvider {
  constructor(
    private moduleId: string,
    private apiClient: ChurchToolsAPIClient
  ) {}
  
  async getAssets(filters?: AssetFilters): Promise<Asset[]> {
    // 1. Get or create "Assets" data category
    const assetsCategory = await this.ensureDataCategory('Assets')
    
    // 2. Fetch all values
    const response = await this.apiClient.getDataValues(
      this.moduleId,
      assetsCategory.id
    )
    
    // 3. Map to Asset type
    return response.map(this.mapToAsset)
  }
  
  // ... implement all other IStorageProvider methods
}
```

### Step 2: Implement ChurchTools API Client

```typescript
// src/services/api/ChurchToolsAPIClient.ts
import { churchtoolsClient } from '@churchtools/churchtools-client'

export class ChurchToolsAPIClient {
  private personCache = new Map<string, PersonInfo>()
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await churchtoolsClient.get(endpoint)
    return response.data
  }
  
  async getCurrentUser(): Promise<PersonInfo> {
    const response = await this.get<Person>('/whoami')
    return {
      id: response.id.toString(),
      firstName: response.firstName,
      lastName: response.lastName,
      name: `${response.firstName} ${response.lastName}`,
      email: response.email,
      avatarUrl: response.imageUrl
    }
  }
  
  // ... implement all other API methods
}
```

### Step 3: Create TanStack Query Hooks

```typescript
// src/hooks/useAssets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStorageProvider } from './useStorageProvider'

export function useAssets(filters?: AssetFilters) {
  const storage = useStorageProvider()
  
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => storage.getAssets(filters),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  })
}

export function useCreateAsset() {
  const storage = useStorageProvider()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (asset: AssetCreate) => storage.createAsset(asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}

export function useUpdateAsset() {
  const storage = useStorageProvider()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, asset }: { id: string; asset: AssetUpdate }) => 
      storage.updateAsset(id, asset),
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.setQueryData(['assets', asset.id], asset)
    }
  })
}
```

### Step 4: Create UI Components

```typescript
// src/components/assets/AssetList.tsx
import { DataTable } from 'mantine-datatable'
import { useAssets } from '../../hooks/useAssets'

export function AssetList() {
  const { data: assets, isLoading } = useAssets()
  
  return (
    <DataTable
      columns={[
        { accessor: 'assetNumber', title: 'Asset #' },
        { accessor: 'name', title: 'Name' },
        { accessor: 'status', title: 'Status' },
        { accessor: 'location', title: 'Location' },
      ]}
      records={assets}
      fetching={isLoading}
    />
  )
}
```

### Step 5: Implement Barcode Generation

```typescript
// src/services/barcode/BarcodeService.ts
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

export class BarcodeService {
  generateBarcode(assetNumber: string): string {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, assetNumber, {
      format: 'CODE128',
      displayValue: true,
      fontSize: 14,
      height: 50
    })
    return canvas.toDataURL()
  }
  
  async generateQRCode(assetNumber: string): Promise<string> {
    return await QRCode.toDataURL(assetNumber, {
      width: 200,
      margin: 2
    })
  }
}
```

### Step 6: Implement Scanner Component

```typescript
// src/components/scanner/BarcodeScanner.tsx
import { useEffect, useRef } from 'react'
import { TextInput, Stack } from '@mantine/core'
import { Html5Qrcode } from 'html5-qrcode'

export function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  // USB/Bluetooth scanner (keyboard emulation)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputRef.current) {
      onScan(inputRef.current.value)
      inputRef.current.value = ''
    }
  }
  
  // Camera scanner
  useEffect(() => {
    const scanner = new Html5Qrcode('scanner-container')
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText) => onScan(decodedText),
      (error) => console.warn('Scan error:', error)
    )
    
    return () => scanner.stop()
  }, [onScan])
  
  return (
    <Stack>
      <TextInput
        ref={inputRef}
        autoFocus
        placeholder="Scan barcode or enter asset number..."
        onKeyPress={handleKeyPress}
      />
      <div id="scanner-container" />
    </Stack>
  )
}
```

---

## Testing

### Manual Testing Checklist

Per constitution, manual testing is required for all features:

1. **Asset Management**:
   - [ ] Create asset with custom fields
   - [ ] Edit asset properties
   - [ ] Change asset status
   - [ ] Delete asset
   - [ ] Create parent asset with 5 children
   - [ ] Verify asset numbers are sequential

2. **Barcode Scanning**:
   - [ ] Generate barcode for asset
   - [ ] Scan with USB scanner
   - [ ] Scan with phone camera (QR code)
   - [ ] Manual entry fallback

3. **Bookings**:
   - [ ] Create booking for available asset
   - [ ] Verify calendar shows booking
   - [ ] Attempt to double-book (should fail)
   - [ ] Check out asset
   - [ ] Check in asset with condition assessment

4. **Cross-Browser**:
   - [ ] Test in Chrome
   - [ ] Test in Safari
   - [ ] Test in Firefox

### Automated Testing (Optional)

If implementing automated tests:

```bash
# Install Vitest
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

Example unit test:

```typescript
// src/services/storage/__tests__/AssetNumberService.test.ts
import { describe, it, expect } from 'vitest'
import { AssetNumberService } from '../AssetNumberService'

describe('AssetNumberService', () => {
  it('generates sequential asset numbers', async () => {
    const service = new AssetNumberService(mockStorage)
    const number1 = await service.generateAssetNumber('SOUND')
    expect(number1).toBe('SOUND-001')
    
    const number2 = await service.generateAssetNumber('SOUND')
    expect(number2).toBe('SOUND-002')
  })
})
```

---

## Building for Production

### 1. Build the Extension

```bash
# Compile TypeScript and bundle with Vite
npm run build

# Output will be in dist/
```

### 2. Verify Bundle Size

```bash
# Check gzipped bundle size
du -sh dist/*.js | awk '{print $1}'

# Should be < 200 KB (constitution requirement)
```

### 3. Package for Deployment

```bash
# Run deployment script
npm run deploy

# Creates package in releases/ directory
```

### 4. Deploy to ChurchTools

1. Navigate to ChurchTools admin panel
2. Go to **Extensions** or **Custom Modules**
3. Upload the packaged extension
4. Configure module ID and permissions
5. Update `.env` with `VITE_MODULE_ID`

---

## Common Development Tasks

### Adding a New Entity Type

1. Define entity type in `src/types/entities.ts`
2. Add storage provider methods to `IStorageProvider`
3. Implement in `ChurchToolsProvider`
4. Create TanStack Query hooks in `src/hooks/`
5. Build UI components in `src/components/`

### Adding a Custom Field Type

1. Update `CustomFieldType` enum in `src/types/entities.ts`
2. Add validation logic in `src/services/validation/`
3. Create input component in `src/components/common/CustomFieldInput.tsx`
4. Update category form to include new field type option

### Optimizing Performance

1. **Code Splitting**:
   ```typescript
   const StockTake = lazy(() => import('./components/stocktake/StockTake'))
   ```

2. **Memoization**:
   ```typescript
   const filteredAssets = useMemo(() => 
     assets.filter(/* ... */), [assets, filters]
   )
   ```

3. **Debounced Search**:
   ```typescript
   const debouncedQuery = useDebouncedValue(searchQuery, 300)
   ```

---

## Troubleshooting

### Issue: TypeScript errors in ChurchTools client types

**Solution**: Copy `ct-types.d.ts` from `src/utils/` to your workspace and ensure it's included in `tsconfig.json`.

### Issue: CORS errors in development

**Solution**: Verify CORS configuration in ChurchTools admin panel includes `http://localhost:5173`.

### Issue: Bundle size exceeds 200 KB

**Solution**:
1. Run `npm run build -- --analyze`
2. Identify large dependencies
3. Use dynamic imports for heavy features
4. Consider removing or replacing large libraries

### Issue: Safari cookie issues (login works in Chrome but not Safari)

**Solution**: See README.md for Vite proxy configuration and HTTPS setup with mkcert.

---

## Resources

- **ChurchTools API Documentation**: https://api.church.tools/
- **Mantine UI Docs**: https://mantine.dev/
- **TanStack Query Docs**: https://tanstack.com/query/latest
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Project Constitution**: `.specify/memory/constitution.md`
- **Feature Specification**: `specs/001-inventory-management/spec.md`
- **Data Model**: `specs/001-inventory-management/data-model.md`

---

## Getting Help

1. Check existing documentation in `specs/001-inventory-management/`
2. Review ChurchTools Forum: https://forum.church.tools
3. Inspect ChurchTools API responses using browser dev tools
4. Check constitution for coding standards and requirements

---

## Next Steps

After completing the quickstart:

1. Review the [Feature Specification](./spec.md) for full requirements
2. Review the [Data Model](./data-model.md) for entity relationships
3. Review the [Research Document](./research.md) for technical decisions
4. Start implementing user stories in priority order (P1 → P2 → P3)
5. Follow the constitution's code quality standards
6. Test thoroughly before deployment

**Happy coding! 🚀**
