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

### 1. Pre-Deployment Checklist

Before building for production, ensure:

- [ ] All TypeScript compile errors are resolved (`npm run build` succeeds)
- [ ] Lint warnings are at acceptable levels (`npm run lint`)
- [ ] Bundle size is under 200 KB gzipped (constitution requirement)
- [ ] Manual testing completed across browsers (Chrome, Firefox, Safari)
- [ ] All user stories are implemented and tested
- [ ] Environment variables are configured correctly
- [ ] Documentation is up-to-date (user guide, API docs, component docs)

### 2. Build the Extension

```bash
# Clean previous builds
rm -rf dist/

# Compile TypeScript and bundle with Vite
npm run build

# Output will be in dist/
# Expected files:
# - dist/index.html (entry point)
# - dist/assets/index-[hash].js (main bundle)
# - dist/assets/index-[hash].css (styles)
# - dist/assets/*.js (code-split chunks)
```

**Build Output Expectations**:
- Main bundle: ~55 KB gzipped (as of Oct 2025)
- Mantine UI: ~120 KB gzipped
- Scanner libraries: ~120 KB gzipped
- Total initial load: ~165 KB gzipped (well under 200 KB budget)

### 3. Verify Bundle Size

```bash
# Check gzipped bundle size
du -sh dist/assets/*.js | awk '{print $1}'

# Or use build output:
npm run build 2>&1 | grep "gzip:"

# Should show all chunks under 120 KB gzipped
# Main bundle should be ~55 KB gzipped
```

**If bundle size exceeds limits**:
```bash
# Analyze bundle composition
npm run build -- --analyze

# Opens interactive bundle analyzer
# Identify large dependencies and consider:
# 1. Dynamic imports for heavy features
# 2. Tree-shaking optimizations
# 3. Replacing large libraries with smaller alternatives
```

### 4. Test Production Build Locally

```bash
# Serve production build locally
npm run preview

# Server starts at http://localhost:4173
# Test all features in production mode
```

**Production Testing Checklist**:
- [ ] Login works correctly
- [ ] All pages load without errors
- [ ] Asset CRUD operations work
- [ ] Barcode scanning works (USB and camera)
- [ ] Stock take sessions work
- [ ] Offline mode works (disconnect network, test stock take)
- [ ] No console errors
- [ ] Performance is acceptable (initial load < 3s on 3G)

### 5. Package for Deployment

```bash
# Create deployment package
npm run package

# Or manually:
cd dist
zip -r ../churchtools-inventory-v1.0.0.zip .
cd ..

# Creates: churchtools-inventory-v1.0.0.zip
```

**Package Contents**:
```
churchtools-inventory-v1.0.0.zip
├── index.html              # Entry point
├── assets/
│   ├── index-[hash].js     # Main application bundle
│   ├── index-[hash].css    # Styles
│   ├── mantine-[hash].js   # Mantine UI chunk
│   ├── scanner-[hash].js   # Scanner libraries chunk
│   └── *.js                # Other code-split chunks
└── manifest.json           # (if applicable for ChurchTools extensions)
```

### 6. Deploy to ChurchTools

#### Option A: ChurchTools Custom Module Upload (Recommended)

1. **Access Admin Panel**:
   - Log in to ChurchTools as administrator
   - Navigate to: **Administration** → **Settings** → **Custom Modules**

2. **Create New Module**:
   - Click "Create Module"
   - Name: "Inventory Management"
   - Type: "Custom Module"
   - Visibility: Select permissions (usually "Internal" or specific groups)

3. **Upload Files**:
   - Upload `index.html` to module root
   - Upload `assets/` folder contents to module assets directory
   - Configure module settings:
     - Set base path
     - Configure permissions
     - Note the **Module ID** (you'll need this for `.env`)

4. **Update Module ID**:
   ```env
   # Update .env in your project
   VITE_CHURCHTOOLS_MODULE_ID=<module-id-from-churchtools>
   ```

5. **Rebuild with Module ID**:
   ```bash
   # Rebuild with correct module ID
   npm run build
   
   # Re-upload dist/ contents to ChurchTools
   ```

#### Option B: Direct File Upload to Web Server

If your ChurchTools instance allows custom file hosting:

1. **Upload to Web Directory**:
   ```bash
   # SSH into server
   ssh user@yourserver.com
   
   # Navigate to web root
   cd /var/www/churchtools/custom-modules/
   
   # Create directory
   mkdir inventory
   cd inventory
   
   # Upload files (from local machine)
   # Use SCP or SFTP
   scp -r dist/* user@yourserver.com:/var/www/churchtools/custom-modules/inventory/
   ```

2. **Configure Web Server**:
   ```nginx
   # nginx configuration
   location /custom-modules/inventory {
       alias /var/www/churchtools/custom-modules/inventory;
       try_files $uri $uri/ /custom-modules/inventory/index.html;
       
       # Enable gzip compression
       gzip on;
       gzip_types text/css application/javascript;
   }
   ```

3. **Access Extension**:
   - URL: `https://your-instance.church.tools/custom-modules/inventory`

### 7. Post-Deployment Configuration

#### Initial Setup in ChurchTools

1. **Create Data Categories** (if not auto-created):
   - Assets
   - Asset Categories
   - Bookings
   - Kits
   - Maintenance Schedules
   - Maintenance Records
   - Stock Take Sessions

2. **Configure Permissions**:
   - Asset Managers: Full CRUD access
   - Regular Users: Read access, create bookings
   - Maintenance Team: Access to maintenance module
   - Admin: Full access

3. **Set Up First Category**:
   - Log in to inventory extension
   - Create first category (e.g., "Audio Equipment")
   - Add custom fields if needed
   - Create first asset to verify everything works

4. **Import Existing Data** (if applicable):
   - Use CSV import feature (if implemented)
   - Or create assets manually
   - Or use ChurchTools API to bulk import

### 8. Rollback Procedure

If deployment fails or issues arise:

```bash
# Keep previous version backed up
mv dist/ dist-v1.0.0-backup/

# Restore previous version from backup
cp -r dist-v0.9.0/ dist/

# Or revert to previous git tag
git checkout v0.9.0
npm run build

# Re-upload to ChurchTools
```

**Rollback Checklist**:
- [ ] Backup current module files before deployment
- [ ] Document module ID and settings
- [ ] Keep database backup (if custom tables used)
- [ ] Test rollback procedure in staging first

### 9. Monitoring and Maintenance

#### Check Application Health

```bash
# Monitor JavaScript errors
# In ChurchTools, check browser console for errors

# Monitor API calls
# Check ChurchTools API logs for errors

# Monitor performance
# Use browser Performance tab
# Check initial load time < 3 seconds
```

#### Regular Maintenance Tasks

**Weekly**:
- [ ] Check for JavaScript errors in browser console
- [ ] Verify no broken features reported by users
- [ ] Check API error rates in ChurchTools logs

**Monthly**:
- [ ] Review bundle size (should stay under 200 KB)
- [ ] Update dependencies: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review performance metrics

**Quarterly**:
- [ ] Major dependency updates: `npm outdated`
- [ ] Review and refactor deprecated code
- [ ] Performance optimization pass
- [ ] User feedback review and feature planning

### 10. Troubleshooting Production Issues

#### Issue: Extension doesn't load in ChurchTools

**Symptoms**: Blank page, 404 errors

**Solutions**:
1. Verify files uploaded correctly to ChurchTools
2. Check module base path configuration
3. Verify index.html is in correct location
4. Check browser console for 404 errors
5. Ensure assets/ path is correct in index.html

#### Issue: API calls fail with CORS errors

**Symptoms**: Network errors, CORS policy violations

**Solutions**:
1. Verify production domain is in ChurchTools CORS whitelist
2. Check API base URL is correct (not localhost)
3. Verify authentication token is valid
4. Check ChurchTools API permissions for module

#### Issue: Performance degradation over time

**Symptoms**: Slow page loads, unresponsive UI

**Solutions**:
1. Clear TanStack Query cache: Refresh page
2. Check for memory leaks: Use Chrome Memory profiler
3. Review slow API calls: Use Network tab
4. Consider pagination if dataset is large

#### Issue: Users can't see inventory data

**Symptoms**: Empty lists, permission errors

**Solutions**:
1. Verify user has permissions in ChurchTools
2. Check module visibility settings
3. Verify data exists in correct categories
4. Check API authentication is working

### 11. Version Management

**Versioning Strategy** (follow semantic versioning):
- `v1.0.0` - Initial production release
- `v1.0.1` - Bug fixes only
- `v1.1.0` - New features, backward compatible
- `v2.0.0` - Breaking changes

**Tagging Releases**:
```bash
# Tag current version
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Update version in package.json
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

**Release Notes Template**:
```markdown
## v1.0.0 - 2025-10-21

### Features
- Complete asset management system
- Barcode scanning (USB and camera)
- Booking calendar with conflict detection
- Stock take sessions with offline support
- Maintenance scheduling

### Bug Fixes
- Fixed issue #123: Asset deletion validation
- Fixed issue #124: Duplicate scan prevention

### Performance
- Bundle size: 55.72 KB gzipped (main)
- Initial load: <3 seconds on 3G
- Lighthouse score: 95+

### Breaking Changes
- None (initial release)
```

---

## Deployment Environments

### Development
- **URL**: http://localhost:5173
- **Purpose**: Active development with HMR
- **Data**: Test data in development ChurchTools instance

### Staging (Optional)
- **URL**: https://staging.your-church.org/inventory
- **Purpose**: Pre-production testing
- **Data**: Copy of production data (anonymized)
- **Testing**: Full integration testing, user acceptance testing

### Production
- **URL**: https://your-church.org/inventory
- **Purpose**: Live production environment
- **Data**: Real church inventory data
- **Monitoring**: Error tracking, performance monitoring

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
