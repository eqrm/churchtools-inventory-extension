# Developer Quickstart: Bug Fixes & UX Improvements

**Feature**: 002-bug-fixes-ux-improvements  
**Branch**: `002-bug-fixes-ux-improvements`  
**Estimated Implementation Time**: 6 weeks (130 hours)

## Prerequisites

Before starting development, ensure you have:

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **Git**: For version control
- **VS Code**: Recommended IDE
- **ChurchTools Account**: With admin access for testing
- **Browser**: Chrome/Firefox with DevTools

## Quick Setup (5 minutes)

### 1. Clone and Switch to Feature Branch

```bash
# Clone repository (if not already cloned)
git clone <repository-url>
cd churchtools-inventory-extension

# Switch to feature branch
git checkout 002-bug-fixes-ux-improvements

# Verify you're on the correct branch
git branch --show-current
# Should output: 002-bug-fixes-ux-improvements
```

### 2. Install Dependencies

```bash
npm install
```

**New Dependencies Added** (from research.md):
- `@fullcalendar/react` v6 (~45KB) - Calendar library for bookings
- `@mdi/js` + `@mdi/react` (~5KB) - Material Design Icons
- `dexie` v3 (~15KB) - IndexedDB wrapper for offline storage
- `browser-image-compression` (~15KB) - Client-side image compression

**Total New Bundle Size**: ~83KB gzipped (well within 5MB budget)

### 3. Configure Environment

Create `.env` file in project root:

```bash
# ChurchTools instance URL
VITE_CHURCHTOOLS_URL=https://your-church.church.tools

# Development mode
VITE_ENV=development

# Enable debug logging
VITE_DEBUG=true
```

**Important**: Replace `your-church.church.tools` with your actual ChurchTools domain.

### 4. Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Hot Reload**: Enabled - changes auto-refresh browser  
**Startup Time**: <10 seconds (per constitution)

## Project Structure

```
churchtools-inventory-extension/
├── src/
│   ├── main.ts                    # Entry point
│   ├── App.tsx                    # Main app component (TO MODIFY: T300, T330)
│   ├── components/
│   │   ├── forms/
│   │   │   ├── BookingForm.tsx    # (TO MODIFY: T307, T312)
│   │   │   ├── AssetForm.tsx      # (TO MODIFY: T309, T327)
│   │   │   └── StockTakeForm.tsx  # (TO MODIFY: T315)
│   │   ├── lists/
│   │   │   └── AssetList.tsx      # (TO MODIFY: T304, T319)
│   │   └── common/
│   │       └── Scanner.tsx        # (TO MODIFY: T317)
│   ├── services/                  # (NEW DIRECTORY)
│   │   ├── PersonSearchService.ts # (NEW: T301)
│   │   ├── BookingConflictService.ts # (NEW: T307)
│   │   ├── OfflineSyncService.ts  # (NEW: T310)
│   │   ├── PhotoStorageService.ts # (NEW: T327, T328)
│   │   └── SchemaVersioningService.ts # (NEW: T329)
│   ├── hooks/                     # (NEW DIRECTORY)
│   │   ├── usePersonSearch.ts     # (NEW: T301)
│   │   ├── useOfflineSync.ts      # (NEW: T310)
│   │   └── usePhotoUpload.ts      # (NEW: T327)
│   ├── pages/
│   │   ├── KitDetailPage.tsx      # (TO MODIFY: T305)
│   │   ├── ReportsPage.tsx        # (TO MODIFY: T316)
│   │   └── SettingsPage.tsx       # (NEW: T318, T329)
│   ├── utils/
│   │   ├── ct-types.d.ts          # ChurchTools types
│   │   └── offline-db.ts          # (NEW: IndexedDB setup)
│   └── vite-env.d.ts
├── specs/
│   └── 002-bug-fixes-ux-improvements/
│       ├── spec.md                # Requirements (85 FRs, 10 user stories)
│       ├── plan.md                # Implementation plan
│       ├── research.md            # Technology decisions
│       ├── data-model.md          # Entity definitions
│       ├── contracts/             # API contracts
│       └── checklists/            # Validation checklists
├── tests/                         # (TO CREATE: automated tests)
├── vite.config.ts                 # (TO MODIFY: T300 - base path)
├── package.json
├── tsconfig.json                  # TypeScript config (strict mode)
└── README.md
```

## Development Workflow

### Daily Workflow

1. **Pull Latest Changes**
   ```bash
   git pull origin 002-bug-fixes-ux-improvements
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Make Changes**
   - Edit files in `src/`
   - Hot reload shows changes immediately
   - Check browser console for errors

4. **Test Locally**
   - Test in ChurchTools context: `http://localhost:5173/`
   - Test direct access: `http://localhost:5173/ccm/fkoinventorymanagement/`

5. **Commit Changes**
   ```bash
   git add <files>
   git commit -m "feat: <description> (T<task-id>)"
   git push origin 002-bug-fixes-ux-improvements
   ```

### Code Quality Checks

Before committing, run:

```bash
# TypeScript type checking
npm run type-check

# Linting
npm run lint

# Fix auto-fixable lint issues
npm run lint:fix

# Run tests (when implemented)
npm test
```

**Pre-commit Hook**: Automatically runs `lint` and `type-check` on staged files.

### Testing Strategy

**Manual Testing** (All features):
1. Test in ChurchTools iframe context
2. Test all user stories from spec.md
3. Test edge cases from spec.md (15 scenarios)
4. Test on mobile (responsive design)
5. Test offline mode (stock take)

**Automated Testing** (Critical paths only):
- Unit tests: Services, hooks
- Integration tests: API contracts
- E2E tests: Booking flow, stock take flow

**Test Commands**:
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
```

## Building for Production

### Build Command

```bash
npm run build
```

**Output**: `dist/` directory with optimized bundle

**Expected Bundle Size**: ~500KB gzipped (including new dependencies)

### Deployment to ChurchTools

```bash
npm run deploy
```

**Deployment Steps** (automated by script):
1. Build production bundle (`npm run build`)
2. Package into zip file (`scripts/package.js`)
3. Upload to ChurchTools via API
4. Clear ChurchTools module cache

**ChurchTools Path**: `/ccm/fkoinventorymanagement/`

### Verify Deployment

1. Go to ChurchTools admin panel
2. Navigate to Settings → Modules → Custom Modules
3. Find "FKO Inventory Management"
4. Click "View" to open module
5. Test critical features (booking, stock take, offline sync)

## Key Implementation Tasks

### Phase 1: Critical Bugs (Week 1) - P0 Priority

**T300**: Fix route refresh bug (Highest Impact)
- **Files**: `vite.config.ts`, `src/App.tsx`
- **Changes**: Add `base: '/ccm/fkoinventorymanagement/'` to Vite config, add `basename` to React Router
- **Test**: Refresh on any route, should not show 404

**T301**: Real person search in booking forms
- **Files**: `src/services/PersonSearchService.ts` (NEW), `src/hooks/usePersonSearch.ts` (NEW)
- **Contract**: `contracts/person-search.ts`
- **Test**: Search for person, should return real results from ChurchTools API

**T302**: Fix API error handling
- **Files**: All files with ChurchTools API calls
- **Changes**: Add try-catch, show user-friendly error messages
- **Test**: Disconnect network, should show "Network error" instead of crash

**T303**: Fix kit grouping bug
- **Files**: `src/pages/KitDetailPage.tsx`
- **Changes**: Fix grouped/ungrouped mode toggle
- **Test**: Toggle between modes, asset list should update correctly

**T304**: Fix stock take sorting
- **Files**: `src/components/lists/AssetList.tsx`
- **Changes**: Sort by asset number by default
- **Test**: Open stock take, assets should be sorted by number (INV-001, INV-002, ...)

**T305**: Fix report text contrast (Accessibility)
- **Files**: `src/pages/ReportsPage.tsx`, `src/utils/styles.css`
- **Changes**: Increase contrast ratio to meet WCAG AA (4.5:1)
- **Test**: Generate report, text should be clearly readable on all backgrounds

### Phase 2: Booking Enhancements (Week 2-3) - P1 Priority

**T306**: Add calendar view for bookings
- **Library**: `@fullcalendar/react` (~45KB)
- **Files**: `src/components/BookingCalendar.tsx` (NEW)
- **Test**: View bookings in calendar, should show all bookings with date ranges

**T307**: Add booking conflict detection
- **Files**: `src/services/BookingConflictService.ts` (NEW)
- **Contract**: `contracts/booking-conflicts.ts`
- **Strategy**: Last-write-wins with validation (Clarification Q1)
- **Test**: Try to book already-booked asset, should show conflict error

**T308**: Add booking approval states
- **Files**: `src/components/forms/BookingForm.tsx`
- **Changes**: Add "Requested", "Approved", "Declined", "Cancelled" states (per data-model.md)
- **Test**: Create booking, should start in "Requested" state

**T309**: Add bookable asset flag
- **Files**: `src/components/forms/AssetForm.tsx`
- **Changes**: Add "Bookable" checkbox (default: true)
- **Test**: Uncheck "Bookable", asset should not appear in booking form

**T312**: Add single-day/date-range booking modes
- **Files**: `src/components/forms/BookingForm.tsx`
- **Changes**: Add mode toggle, show different date/time fields based on mode
- **Test**: Toggle modes, form fields should update accordingly

**T313**: Add German labels for booking states
- **Files**: `src/utils/i18n.ts` (NEW - constants file)
- **Changes**: Add German translations for all booking states
- **Test**: Change language to German, booking states should show in German

### Phase 3: UX Improvements (Week 4) - P2 Priority

**T314-T323**: Various UX polish tasks
- Collapse/expand child assets
- View mode persistence
- Custom asset category labels
- Scanner preference storage
- Search debouncing
- Error boundaries
- Offline indicators
- Language refinements

See `plan.md` for detailed task breakdown.

### Phase 4: Advanced Features (Week 5-6) - P3 Priority

**T327**: Multiple asset photos
- **Library**: `browser-image-compression` (~15KB)
- **Files**: `src/services/PhotoStorageService.ts` (NEW), `src/hooks/usePhotoUpload.ts` (NEW)
- **Contract**: `contracts/photo-storage.ts`
- **Test**: Upload multiple photos to asset, should show in gallery

**T328**: Photo compression
- **Strategy**: Two-tier (Clarification Q4)
  - Thumbnails: 70% JPEG, 400px max width
  - Full-size: 85% JPEG, 2048px max width
- **Test**: Upload 5MB photo, should compress to ~20KB thumbnail + ~100KB full-size

**T329**: Schema versioning
- **Files**: `src/services/SchemaVersioningService.ts` (NEW)
- **Strategy**: Automatic rollback with retry (Clarification Q5)
- **Test**: Trigger migration, if fails should rollback and retry on next load

**T310**: Offline stock take
- **Library**: `dexie` v3 (~15KB)
- **Files**: `src/services/OfflineSyncService.ts` (NEW), `src/utils/offline-db.ts` (NEW)
- **Contract**: `contracts/offline-sync.ts`
- **Strategy**: Manual conflict resolution (Clarification Q3)
- **Test**: Start stock take offline, scan assets, go online, sync, should detect conflicts

## Common Issues & Solutions

### Issue: Hot reload not working
**Solution**: Restart dev server (`Ctrl+C`, then `npm run dev`)

### Issue: ChurchTools API 401 Unauthorized
**Solution**: 
1. Check you're logged into ChurchTools in same browser
2. Clear browser cache and cookies
3. Re-login to ChurchTools

### Issue: TypeScript errors after pulling changes
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build size exceeds 5MB warning
**Solution**:
1. Check bundle analyzer: `npm run build -- --analyze`
2. Review imports, ensure tree-shaking working
3. Check for duplicate dependencies
4. Consider code splitting for large features

### Issue: IndexedDB not working in iframe
**Solution**: ChurchTools must allow storage access. Check Content Security Policy (CSP) headers.

### Issue: Photos not displaying
**Solution**:
1. Check if base64 or file ID format
2. Verify `getPhotoUrl()` logic in PhotoStorageService
3. Check browser console for CORS errors
4. Verify ChurchTools Files API permissions

## Documentation

- **Spec**: `specs/002-bug-fixes-ux-improvements/spec.md` - All requirements
- **Plan**: `specs/002-bug-fixes-ux-improvements/plan.md` - Implementation plan
- **Research**: `specs/002-bug-fixes-ux-improvements/research.md` - Technology decisions
- **Data Model**: `specs/002-bug-fixes-ux-improvements/data-model.md` - Entity definitions
- **Contracts**: `specs/002-bug-fixes-ux-improvements/contracts/` - API interfaces
- **Constitution**: `.specify/memory/constitution.md` - Core principles

## Support

**Questions?** 
- Check spec.md for requirements clarification
- Check research.md for technology choices
- Check data-model.md for entity structure
- Check contracts/ for API interfaces

**Need Help?**
- Open GitHub issue with `[002-bug-fixes-ux-improvements]` prefix
- Reference task ID (T300-T332) in issue title
- Include error logs and screenshots

---

**Ready to Start?** Pick a task from Phase 1 (T300-T305) and start coding! 🚀
