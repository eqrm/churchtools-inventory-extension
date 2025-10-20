# Bug Fix Plan - MVP Testing Results

**Date**: October 20, 2025  
**Testing Date**: October 20, 2025  
**Branch**: `001-inventory-management`  
**Status**: NEEDS ATTENTION

---

## 📊 Testing Summary

**Tests Executed**: 38/38 (100%)  
**Tests Passed**: 19/38 (50%)  
**Tests Failed**: 19/38 (50%)  
**Critical Issues**: 7  
**High Priority Issues**: 8  
**Medium Priority Issues**: 4

---

## 🔴 Critical Issues (Must Fix Before Production)

### C1: Category/Asset Deletion Returns 405 Error
**Test**: Test 1.4, Test 2.7  
**Severity**: CRITICAL  
**Impact**: Users cannot delete categories or assets  

**Error Message**:
```
POST https://eqrm.church.tools/api/custommodules/16/customdatacategories/284 405 (Method Not Allowed)
```

**Root Cause**: Using POST instead of DELETE HTTP method

**Fix Required**:
- File: `src/services/api/ChurchToolsAPIClient.ts`
- Method: `deleteRequest()`
- Change: Ensure DELETE HTTP method is used, not POST
- Verify: Check if API endpoint requires different permissions

**Estimated Effort**: 2 hours  
**Priority**: P0 - BLOCKING

---

### C2: Change History Completely Unreadable
**Test**: Test 2.6, Test 5.2, Test 5.3  
**Severity**: CRITICAL  
**Impact**: Audit trail unusable, compliance requirement not met

**Current Format**:
```
Oct 20, 2025, 10:23 AM
Peter Pretix
updated
customFieldValues
{"Wattage":10,"DMX Adress":"sajflwjrij","Manual URL":""}
{"Wattage":10,"DMX Adress":"sajflwjrij","Manual URL":"http://not-a-url.de"}
```

**Expected Format**:
```
10/20/25, 10:24 AM User changed Manual URL from "" to "http://not-a-url.de"
```

**Fix Required**:
1. **Create separate History tab in AssetDetail**
   - File: `src/components/assets/AssetDetail.tsx`
   - Add Tabs component with "Details" and "History" tabs
   
2. **Improve change history formatting**
   - File: `src/components/assets/ChangeHistoryList.tsx`
   - Parse JSON objects to extract individual field changes
   - Format: `{date} {user} changed {field} from "{oldValue}" to "{newValue}"`
   - Handle custom fields specially (extract field name from customFieldValues)
   - Show creation as: `{date} {user} created {entity}`

3. **Store granular changes**
   - File: `src/services/storage/ChurchToolsProvider.ts`
   - Method: `recordChange()`
   - Store individual field changes, not entire objects
   - Structure: `{ field: 'status', oldValue: 'Available', newValue: 'In Use' }`

**Estimated Effort**: 8 hours  
**Priority**: P0 - BLOCKING

---

### C3: No Change History for Categories
**Test**: Test 5.1  
**Severity**: HIGH  
**Impact**: Category modifications not tracked, audit gap

**Fix Required**:
- File: `src/services/storage/ChurchToolsProvider.ts`
- Methods: `createCategory()`, `updateCategory()`, `deleteCategory()`
- Add: `recordChange()` calls for all category operations
- Verify: Change history shows in category detail view

**Estimated Effort**: 4 hours  
**Priority**: P0 - BLOCKING

---

### C4: Navigation Breaks on Page Reload
**Test**: Test 6.1  
**Severity**: CRITICAL  
**Impact**: Users get error message, cannot use back/forward buttons

**Error Message**:
```
The server is configured with a public base URL of /ccm/fkoinventorymanagement/ 
- did you mean to visit /ccm/fkoinventorymanagement/assets instead?
```

**Root Cause**: Vite base path not configured for ChurchTools subdirectory

**Fix Required**:
1. **Update Vite config**
   - File: `vite.config.ts`
   - Add: `base: '/ccm/fkoinventorymanagement/'`
   
2. **Update React Router**
   - File: `src/App.tsx`
   - Ensure basename is set correctly in Router

3. **Test embedded mode**
   - Verify routing works when embedded in ChurchTools iframe
   - Verify back/forward buttons work

**Estimated Effort**: 4 hours  
**Priority**: P0 - BLOCKING

---

### C5: No Network Error Handling
**Test**: Test 6.3  
**Severity**: HIGH  
**Impact**: Users have no feedback when offline, appears broken

**Fix Required**:
1. **Add global error boundary for network errors**
   - File: `src/App.tsx`
   - Catch TanStack Query errors
   - Display friendly message: "Keine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung."

2. **Add retry logic**
   - File: `src/main.tsx` (QueryClient config)
   - Configure retry: `retry: 3` with exponential backoff

3. **Add offline indicator**
   - File: `src/components/layout/Navigation.tsx`
   - Use `useOnlineStatus` hook
   - Show banner when offline

**Estimated Effort**: 6 hours  
**Priority**: P1

---

## 🟡 High Priority Issues

### H1: No Barcode Display (Only QR Code)
**Test**: Test 2.1  
**Severity**: HIGH  
**Impact**: Feature gap - barcode option advertised but not implemented

**Fix Required**:
1. **Add barcode/QR toggle**
   - File: `src/components/assets/AssetDetail.tsx`
   - Add segmented control: "QR Code" | "Barcode"
   - State: `const [codeType, setCodeType] = useState<'qr' | 'barcode'>('qr')`

2. **Implement barcode generation**
   - File: Create `src/services/barcode/BarcodeService.ts`
   - Use JsBarcode library
   - Generate Code-128 barcode from asset number

3. **Create BarcodeDisplay component**
   - File: Create `src/components/scanner/BarcodeDisplay.tsx`
   - Render barcode as SVG or canvas

**Estimated Effort**: 6 hours  
**Priority**: P1

---

### H2: Number Field Validation Auto-Corrects Without Error
**Test**: Test 2.3, Test 3.3  
**Severity**: HIGH  
**Impact**: Users don't understand why their input changed

**Current Behavior**:
- Enter `5` (min=10) → silently changes to `10`
- Enter `6000` (max=5000) → silently changes to `5000`
- Enter `-10` (min=0) → silently changes to `0`

**Expected Behavior**:
- Enter `5` → show error "Wert muss mindestens 10 sein"
- Enter `6000` → show error "Wert darf höchstens 5000 sein"
- Prevent submission until valid value entered

**Fix Required**:
- File: `src/components/assets/CustomFieldInput.tsx`
- Component: NumberInput
- Remove: Auto-correction behavior (remove `min`/`max` props from NumberInput)
- Add: Manual validation in `onBlur` handler
- Set error: `form.setFieldError()` if out of range
- Let user fix it themselves

**Estimated Effort**: 3 hours  
**Priority**: P1

---

### H3: Date Fields Display ISO Format Instead of Readable Format
**Test**: Test 3.4  
**Severity**: MEDIUM  
**Impact**: Poor UX, dates hard to read

**Current**: `2025-10-20T00:00:00.000Z`  
**Expected**: `20. Oktober 2025` or `20.10.2025`

**Fix Required**:
- File: `src/components/assets/AssetDetail.tsx`
- Import: `import { formatDate } from '@/utils/formatters'`
- Change: Use `formatDate(value)` for display
- Storage: Keep ISO format in database (correct)

**Estimated Effort**: 2 hours  
**Priority**: P1

---

### H4: URL Fields Not Clickable
**Test**: Test 3.8  
**Severity**: MEDIUM  
**Impact**: Users must copy-paste URLs manually

**Fix Required**:
- File: `src/components/assets/CustomFieldInput.tsx`
- Add display mode check
- When viewing (not editing), render as hyperlink:
  ```tsx
  {isViewing && value ? (
    <Anchor href={value} target="_blank" rel="noopener noreferrer">
      {value}
    </Anchor>
  ) : (
    <TextInput {...props} />
  )}
  ```

**Estimated Effort**: 2 hours  
**Priority**: P2

---

### H5: No Empty State Call-to-Actions
**Test**: Test 7.3  
**Severity**: LOW  
**Impact**: New users don't know what to do first

**Fix Required**:
1. **Categories empty state**
   - File: `src/components/categories/AssetCategoryList.tsx`
   - Add: "Erstellen Sie Ihre erste Kategorie" button
   - Current: Just shows empty table

2. **Assets empty state**
   - File: `src/components/assets/AssetList.tsx`
   - Add: "Erstellen Sie Ihr erstes Asset" button
   - Show: "Zuerst müssen Sie eine Kategorie erstellen" if no categories

**Estimated Effort**: 3 hours  
**Priority**: P2

---

### H6: Asset Filtering Performance Issue
**Test**: Test 6.1  
**Severity**: MEDIUM  
**Impact**: Slow filtering creates poor UX perception

**Description**: "Asset filtering takes too long"

**Fix Required**:
1. **Add debouncing to search input**
   - File: `src/components/assets/AssetList.tsx`
   - Use: `useDebouncedValue` from Mantine hooks
   - Delay: 300ms

2. **Optimize filter queries**
   - File: `src/services/storage/ChurchToolsProvider.ts`
   - Method: `getAssets()`
   - Add pagination support (limit, offset)
   - Consider server-side filtering if possible

3. **Add loading skeletons**
   - File: `src/components/assets/AssetList.tsx`
   - Show: Skeleton rows while filtering

**Estimated Effort**: 6 hours  
**Priority**: P2

---

## 🟢 Medium Priority Issues

### M1: No Restore Deleted Assets Feature
**Test**: Test 2.7  
**Severity**: MEDIUM  
**Impact**: Accidental deletion is permanent, data loss risk

**Current**: Asset deleted → gone forever, no history visible

**Expected**:
- Soft delete: Mark as deleted, don't remove from database
- View deleted assets: Filter toggle "Show Deleted"
- Restore option: "Restore" button on deleted assets
- History preserved: Change history accessible for deleted assets

**Fix Required**:
1. **Add soft delete**
   - File: `src/types/entities.ts`
   - Add: `deletedAt?: Date` to Asset
   - File: `src/services/storage/ChurchToolsProvider.ts`
   - Method: `deleteAsset()` - Set deletedAt instead of removing

2. **Add filter toggle**
   - File: `src/components/assets/AssetList.tsx`
   - Add: Checkbox "Gelöschte anzeigen"
   - Filter: Exclude where `deletedAt !== null` by default

3. **Add restore function**
   - File: `src/services/storage/ChurchToolsProvider.ts`
   - Method: `restoreAsset(id)` - Set `deletedAt = null`
   - File: `src/hooks/useAssets.ts`
   - Hook: `useRestoreAsset`

**Estimated Effort**: 8 hours  
**Priority**: P2

---

### M2: ChurchTools String Length Constraint
**Test**: Test 7.4  
**Severity**: LOW  
**Impact**: Long text fields limited by API, not documented

**Description**: ChurchTools imposes 10,000 character limit on data values

**Fix Required**:
1. **Add validation**
   - File: `src/utils/validators.ts`
   - Function: `validateTextField()`
   - Add: `maxLength: 10000` check with error message

2. **Document limitation**
   - File: `src/components/assets/CustomFieldInput.tsx`
   - Add: Character counter for long-text fields
   - Show: "9,845 / 10,000" below textarea

3. **Update custom field form**
   - File: `src/components/categories/CustomFieldDefinitionInput.tsx`
   - Add: Warning when maxLength > 10000
   - Message: "ChurchTools limitiert Textfelder auf 10.000 Zeichen"

**Estimated Effort**: 4 hours  
**Priority**: P3

---

## 📋 Implementation Order

### Phase 1: Critical Blocking Issues (Week 1)
**Must complete before any production use**

1. **C1: Fix deletion 405 error** (2h)
2. **C4: Fix navigation/routing** (4h)
3. **C2: Fix change history readability** (8h)
4. **C3: Add category change history** (4h)
5. **C5: Add network error handling** (6h)

**Total**: 24 hours (3 days)

### Phase 2: High Priority UX Issues (Week 2)
**Significant UX improvements**

6. **H1: Add barcode display option** (6h)
7. **H2: Fix number field validation** (3h)
8. **H3: Fix date display format** (2h)
9. **H4: Make URLs clickable** (2h)
10. **H5: Add empty state CTAs** (3h)
11. **H6: Improve filtering performance** (6h)

**Total**: 22 hours (3 days)

### Phase 3: Medium Priority Enhancements (Week 3)
**Nice-to-have improvements**

12. **M1: Add soft delete + restore** (8h)
13. **M2: Add text length validation** (4h)

**Total**: 12 hours (1.5 days)

---

## 🧪 Regression Testing Plan

After each fix, re-run affected tests:

### After C1 (Deletion Fix):
- ✅ Test 1.4: Delete Empty Category
- ✅ Test 2.7: Delete Asset
- ✅ Test 1.5: Prevent Deletion with Assets (should still work)

### After C2 (Change History):
- ✅ Test 2.6: Edit Asset
- ✅ Test 5.2: Asset Update History
- ✅ Test 5.3: Custom Field Update History
- ✅ Test 3.5: Checkbox Field (history)

### After C3 (Category History):
- ✅ Test 5.1: Category Creation History
- ✅ Test 1.3: Edit Category

### After C4 (Navigation):
- ✅ Test 6.1: Navigation (all parts)
- ✅ Manual test: Reload page at /assets
- ✅ Manual test: Browser back/forward

### After C5 (Network Errors):
- ✅ Test 6.3: Error Handling (airplane mode test)

### After H2 (Number Validation):
- ✅ Test 2.3: Validation - Number Field Min/Max
- ✅ Test 3.3: Number Field

### After M1 (Soft Delete):
- ✅ Test 2.7: Delete Asset (modified expectations)
- ✅ New test: Restore Deleted Asset

---

## 📊 Success Metrics

### Definition of Done (Phase 1)
- [ ] All Critical issues (C1-C5) resolved
- [ ] Regression tests passed
- [ ] ESLint/TypeScript clean
- [ ] Bundle size < 200 KB
- [ ] Manual smoke test in embedded ChurchTools

### Definition of Done (Phase 2)
- [ ] All High Priority issues (H1-H6) resolved
- [ ] Test pass rate ≥ 95% (36+/38)
- [ ] Performance: Filtering < 2s for 1,000 assets
- [ ] No console errors in production build

### Definition of Done (Phase 3)
- [ ] All Medium Priority issues (M1-M2) resolved
- [ ] Test pass rate = 100% (38/38)
- [ ] User acceptance testing complete
- [ ] Production deployment ready

---

## 🚀 Deployment Strategy

### After Phase 1 (Critical Fixes)
**Deploy to TEST environment only**
- Run full regression test suite
- Get stakeholder sign-off on change history format
- Validate routing in real ChurchTools iframe
- Do NOT deploy to production yet

### After Phase 2 (High Priority Fixes)
**Deploy to PRODUCTION**
- All blocking issues resolved
- UX acceptable for daily use
- Document known limitations (Phase 3 items)
- Monitor for errors in first 48 hours

### After Phase 3 (Medium Priority Enhancements)
**Production update**
- Announce new features (soft delete, restore)
- Update user documentation
- Training for administrators

---

## 📝 Notes

### Design Decisions Needed

1. **Change History Format** (C2)
   - Preferred format: `{date} {user} changed {field} from "{old}" to "{new}"`
   - Alternative: Table with columns (Date, User, Field, Old Value, New Value)
   - **Decision needed from stakeholder**

2. **Soft Delete UI** (M1)
   - Option A: Checkbox filter "Show Deleted" (simpler)
   - Option B: Separate "Deleted Assets" page (clearer)
   - **Decision needed from stakeholder**

3. **Barcode vs QR Default** (H1)
   - Which should be default: Barcode or QR?
   - Should choice persist per user?
   - **Decision needed from stakeholder**

### Testing Gaps

Based on testing results, these areas need more coverage:
- Concurrent editing (two users editing same asset)
- Large datasets (1,000+ assets performance)
- Mobile device testing (camera scanning)
- Offline mode functionality
- Permission system integration

### Technical Debt

Items to address after MVP stable:
- Extract change history logic into separate service
- Add TypeScript strict typing for ChurchTools API responses
- Implement proper error boundary with error reporting
- Add automated E2E tests for critical paths
- Optimize bundle size further (consider lazy loading more components)

---

**Document Version**: 1.0  
**Last Updated**: October 20, 2025  
**Next Review**: After Phase 1 completion
