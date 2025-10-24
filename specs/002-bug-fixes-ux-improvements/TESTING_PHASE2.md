# Phase 2 Manual Testing Guide

**Feature**: 002-bug-fixes-ux-improvements  
**Phase**: 2 - Foundational  
**Tasks**: T016-T018, T020  
**Purpose**: Verify base path configuration and offline database initialization

---

## Prerequisites

Before running these tests:

1. ✅ All code tasks T001-T015, T019 must be complete
2. ✅ Application must build successfully: `npm run build`
3. ✅ Development server must be running: `npm run dev`
4. ✅ Browser DevTools must be available (Chrome/Edge/Firefox)

---

## Test Environment Setup

```bash
# Start development server
npm run dev

# The app should be accessible at:
# http://localhost:5173/ccm/fkoinventorymanagement/
```

**Note**: The base path `/ccm/fkoinventorymanagement/` is critical - without it, page refreshes will fail with 404 errors.

---

## T016: Route Refresh Test (Critical P0 Bug Fix)

**Bug Being Fixed**: FR-001, FR-004 - Page refresh causes 404 errors  
**Success Criteria**: All routes work after F5 refresh

### Test Steps

1. **Navigate to Dashboard**
   - URL should be: `http://localhost:5173/ccm/fkoinventorymanagement/`
   - Press `F5` to refresh
   - ✅ **Expected**: Page reloads successfully, stays on Dashboard
   - ❌ **Failure**: 404 error or redirect to homepage

2. **Navigate to Assets Page**
   - Click "Assets" in navigation menu
   - URL should be: `http://localhost:5173/ccm/fkoinventorymanagement/assets`
   - Press `F5` to refresh
   - ✅ **Expected**: Page reloads successfully, stays on Assets
   - ❌ **Failure**: 404 error or redirect to homepage

3. **Navigate to Kits Page**
   - Click "Kits" in navigation menu
   - URL should be: `http://localhost:5173/ccm/fkoinventorymanagement/kits`
   - Press `F5` to refresh
   - ✅ **Expected**: Page reloads successfully, stays on Kits
   - ❌ **Failure**: 404 error or redirect to homepage

4. **Navigate to Bookings Page**
   - Click "Bookings" in navigation menu
   - URL should be: `http://localhost:5173/ccm/fkoinventorymanagement/bookings`
   - Press `F5` to refresh
   - ✅ **Expected**: Page reloads successfully, stays on Bookings
   - ❌ **Failure**: 404 error or redirect to homepage

5. **Navigate to Reports Page**
   - Click "Reports" in navigation menu
   - URL should be: `http://localhost:5173/ccm/fkoinventorymanagement/reports`
   - Press `F5` to refresh
   - ✅ **Expected**: Page reloads successfully, stays on Reports
   - ❌ **Failure**: 404 error or redirect to homepage

6. **Navigate to Settings Page**
   - Click "Settings" in navigation menu
   - URL should be: `http://localhost:5173/ccm/fkoinventorymanagement/settings`
   - Press `F5` to refresh
   - ✅ **Expected**: Page reloads successfully, stays on Settings
   - ❌ **Failure**: 404 error or redirect to homepage

### Pass/Fail Criteria

- ✅ **PASS**: All 6 pages refresh successfully without 404 errors
- ❌ **FAIL**: Any page shows 404 error after refresh

---

## T017: Browser Back/Forward Navigation Test

**Bug Being Fixed**: FR-001 - Navigation history broken after refresh  
**Success Criteria**: Back/forward buttons work correctly

### Test Steps

1. **Navigate through pages**
   - Start at Dashboard
   - Click Assets → Kits → Bookings (3 forward navigations)
   - Browser history should have: Dashboard → Assets → Kits → Bookings

2. **Test Back Button**
   - Click browser back button
   - ✅ **Expected**: Returns to Kits page
   - Click back again
   - ✅ **Expected**: Returns to Assets page
   - Click back again
   - ✅ **Expected**: Returns to Dashboard

3. **Test Forward Button**
   - Click browser forward button
   - ✅ **Expected**: Returns to Assets page
   - Click forward again
   - ✅ **Expected**: Returns to Kits page
   - Click forward again
   - ✅ **Expected**: Returns to Bookings page

4. **Refresh and Test Navigation**
   - While on Bookings page, press `F5`
   - ✅ **Expected**: Stays on Bookings page
   - Click browser back button
   - ✅ **Expected**: Returns to Kits page (history preserved)

### Pass/Fail Criteria

- ✅ **PASS**: Back/forward buttons navigate correctly through history
- ❌ **FAIL**: Back/forward causes incorrect navigation or errors

---

## T018: Deep Link Test

**Bug Being Fixed**: FR-004 - Deep links fail with 404  
**Success Criteria**: Direct URL access works for all routes

### Test Steps

1. **Test Direct URL Access**
   - Close browser completely (or use incognito window)
   - Paste URL directly: `http://localhost:5173/ccm/fkoinventorymanagement/assets`
   - Press Enter
   - ✅ **Expected**: Assets page loads directly without 404
   - ❌ **Failure**: 404 error or redirect to homepage

2. **Test Asset Detail Deep Link**
   - Copy URL of any asset detail page (e.g., `/assets/550e8400-e29b-41d4-a716-446655440000`)
   - Close browser completely
   - Paste URL directly and press Enter
   - ✅ **Expected**: Asset detail page loads directly
   - ❌ **Failure**: 404 error

3. **Test Booking Detail Deep Link**
   - Copy URL of any booking detail page
   - Close browser completely
   - Paste URL directly and press Enter
   - ✅ **Expected**: Booking detail page loads directly
   - ❌ **Failure**: 404 error

4. **Test from External Link**
   - Create a bookmark or send link via email: `http://localhost:5173/ccm/fkoinventorymanagement/bookings`
   - Click the bookmark/link
   - ✅ **Expected**: Bookings page loads directly
   - ❌ **Failure**: 404 error

### Pass/Fail Criteria

- ✅ **PASS**: All direct URL accesses work correctly
- ❌ **FAIL**: Any direct URL shows 404 error

---

## T020: IndexedDB Initialization Test

**Feature**: FR-077-082 - Offline stocktake support  
**Success Criteria**: Database created with all required tables

### Test Steps

1. **Open Browser DevTools**
   - Chrome/Edge: Press `F12` → "Application" tab → "Storage" → "IndexedDB"
   - Firefox: Press `F12` → "Storage" tab → "Indexed DB"

2. **Verify Database Exists**
   - Look for database named: `churchtools-inventory-offline`
   - ✅ **Expected**: Database appears in the list
   - ❌ **Failure**: Database not found

3. **Verify Tables (Object Stores)**
   - Expand `churchtools-inventory-offline` database
   - Should see 4 tables:
     1. ✅ `stockTakeSessions`
     2. ✅ `stockTakeScans`
     3. ✅ `syncConflicts`
     4. ✅ `personCache`
   - ❌ **Failure**: Any table missing

4. **Verify Table Schemas**
   - Click on `stockTakeSessions` table
   - Should see indexes: `id`, `status`, `startedAt`, `startedBy`
   - Click on `stockTakeScans` table
   - Should see indexes: `id`, `sessionId`, `assetId`, `scannedAt`, `synced`
   - Click on `syncConflicts` table
   - Should see indexes: `id`, `entityType`, `detectedAt`, `resolvedAt`
   - Click on `personCache` table
   - Should see indexes: `id`, `lastUsed`, `searchText`

5. **Test Database Initialization**
   - Open browser console (DevTools → "Console" tab)
   - Type: `await window.offlineDb?.open()`
   - ✅ **Expected**: No errors, database opens successfully
   - ❌ **Failure**: Error message appears

6. **Test Database Statistics (Optional)**
   - In console, import the stats function:
   ```javascript
   const { getOfflineDbStats } = await import('/src/utils/offline-db.ts')
   await getOfflineDbStats()
   ```
   - ✅ **Expected**: Returns object with counts: `{stockTakeSessions: 0, stockTakeScans: 0, syncConflicts: 0, personCache: 0}`
   - ❌ **Failure**: Error or unexpected output

### Pass/Fail Criteria

- ✅ **PASS**: Database exists with all 4 tables and correct indexes
- ❌ **FAIL**: Database missing, tables missing, or initialization errors

---

## Troubleshooting

### Issue: 404 Errors on Refresh

**Cause**: Base path not configured correctly

**Solutions**:
1. Verify `vite.config.ts` has: `base: '/ccm/${process.env.VITE_KEY}/'`
2. Verify `src/App.tsx` has: `<BrowserRouter basename={import.meta.env.BASE_URL}>`
3. Check `.env` file has: `VITE_KEY=fkoinventorymanagement`
4. Restart dev server: `npm run dev`

### Issue: IndexedDB Not Found

**Cause**: Database initialization failed or not called

**Solutions**:
1. Check browser console for errors
2. Verify `src/main.tsx` calls `await initializeOfflineDb()`
3. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear IndexedDB manually in DevTools and refresh

### Issue: Browser Back Button Doesn't Work

**Cause**: React Router not using correct history

**Solutions**:
1. Verify using `BrowserRouter` (not `HashRouter`)
2. Check `basename` prop is set correctly
3. Verify no conflicting history listeners in code

---

## Test Results Checklist

Mark each test as you complete it:

- [ ] T016: All 6 pages refresh successfully (Dashboard, Assets, Kits, Bookings, Reports, Settings)
- [ ] T017: Browser back/forward navigation works correctly
- [ ] T018: Deep links work for all routes (main pages + detail pages)
- [ ] T020: IndexedDB database created with all 4 tables

**Overall Phase 2 Status**:
- [ ] ✅ ALL TESTS PASS - Phase 2 complete, ready for Phase 3
- [ ] ❌ SOME TESTS FAIL - Review troubleshooting guide and fix issues

---

## Next Steps After Phase 2

Once all tests pass:

1. **Mark T016-T018, T020 as complete** in tasks.md
2. **Commit changes** with message: "feat: Complete Phase 2 foundational setup"
3. **Proceed to Phase 3**: User Story 1 - Navigation (T021-T031)

**Note**: Type errors in build are expected - they will be fixed during user story implementation (Phase 3+).
