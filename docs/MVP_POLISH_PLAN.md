# MVP Polish Plan (Phase 12 - MVP Subset)

**Goal**: Polish Phases 1-4 (Setup + Foundation + Testing + US1 + US2) to production-ready quality

**Current Status**: 
- ✅ Phase 1: Setup (15 tasks complete)
- ✅ Phase 2: Foundational (26 tasks complete)
- ✅ Phase 2.5: Testing Infrastructure (21 tasks complete)
- ✅ Phase 3: User Story 1 (22 tasks complete)
- ✅ Phase 4: User Story 2 (11/12 tasks complete - T071 deferred)

**Scope**: Asset management with categories, custom fields, filtering, icons, and templates

---

## Phase 12 MVP Polish Tasks (Priority Order)

### 🔴 Critical (Blocking Production)

1. **T242: Remove Debug Statements** (5 min)
   - Status: ✅ Verified - only error logging in appropriate places
   - Action: Keep error logging, remove any debug console.logs

2. **T243: Add .env Validation** (15 min)
   - Create src/utils/envValidation.ts
   - Check required variables: VITE_BASE_URL, VITE_USERNAME, VITE_PASSWORD, VITE_KEY
   - Show helpful error message if missing
   - Call from main.tsx before app initialization

3. **T249: TypeScript Compilation Check** (2 min)
   - Run: `npx tsc --noEmit`
   - Fix any type errors

4. **T250: ESLint Final Check** (2 min)
   - Run: `npm run lint`
   - Ensure 0 warnings/errors

### 🟡 High Priority (UX & Error Handling)

5. **T221: Global Error Boundary** (20 min)
   - Create src/components/common/ErrorBoundary.tsx
   - Wrap app in App.tsx
   - Show friendly error page with reload button
   - Log errors to console for debugging

6. **T223: Loading Skeletons** (30 min)
   - Add Mantine Skeleton to:
     - AssetList (table skeleton)
     - AssetCategoryList (table skeleton)
     - AssetDetail (content skeleton)
   - Replace loading spinners with skeletons for better UX

7. **T224: Empty States** (20 min)
   - Verify EmptyState component usage in:
     - AssetList (no assets)
     - AssetCategoryList (no categories)
     - ChangeHistoryList (no history)
   - Add helpful action buttons (e.g., "Create First Category")

8. **T222: API Error Retry Logic** (25 min)
   - Update TanStack Query config in main.tsx
   - Add retry: 3 with exponential backoff
   - Add retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)

### 🟢 Medium Priority (Code Quality)

9. **T228: JSDoc Comments** (45 min)
   - Add JSDoc to all services:
     - ChurchToolsAPIClient methods
     - ChurchToolsStorageProvider methods
     - Utility functions (formatting, validation, assetNumbers)
   - Document parameters, return types, throws

10. **T229: Inline Comments** (30 min)
    - Add comments for complex logic:
      - Custom field filtering in ChurchToolsProvider
      - Asset number generation algorithm
      - Category duplication logic
      - Custom field validation rules

11. **T215: Code Splitting** (15 min)
    - Add React.lazy to routes in App.tsx:
      - AssetsPage
      - CategoriesPage
      - AssetDetailPage
    - Add Suspense with loading spinner

12. **T216: React.memo Optimization** (20 min)
    - Add React.memo to expensive components:
      - AssetList (large table)
      - AssetCategoryList (table)
      - CustomFieldInput (re-renders frequently)

### 🔵 Nice to Have (Documentation)

13. **T230: API Documentation** (30 min)
    - Create docs/API.md
    - Document ChurchToolsStorageProvider interface
    - List all CRUD methods with examples
    - Document error handling

14. **T233: User Guide** (60 min)
    - Create docs/USER_GUIDE.md
    - Section 1: Getting Started
      - Creating categories
      - Defining custom fields
      - Using templates
    - Section 2: Managing Assets
      - Creating assets
      - Filtering and searching
      - Custom field values
    - Section 3: Category Management
      - Icons
      - Templates
      - Duplication

15. **T232: Deployment Instructions** (20 min)
    - Update docs/quickstart.md
    - Add ChurchTools module deployment section
    - Document environment variables
    - Add troubleshooting tips

### 🎯 Quality Gates (Final Validation)

16. **T252: Manual Testing - Dev Mode** (30 min)
    - Test checklist:
      - ✅ Create category with 5 custom fields (all types)
      - ✅ Use template to create category
      - ✅ Duplicate category
      - ✅ Create asset with all custom fields
      - ✅ Filter assets by category and custom fields
      - ✅ View change history
      - ✅ Test icon picker
      - ✅ Test all validation rules
      - ✅ Test error states (network disconnect)

17. **T239: Cross-Browser Testing** (15 min)
    - Test in Chrome ✅
    - Test in Firefox
    - Test in Safari (if available)

18. **T251: Bundle Size Check** (5 min)
    - Run: `npm run build`
    - Check dist size
    - Verify < 200 KB gzipped (MVP target)

19. **T255: Performance Check** (10 min)
    - Test with 50+ assets
    - Verify table filtering < 100ms
    - Verify page load < 2s
    - Check for memory leaks (DevTools)

---

## Estimated Total Time: 6-8 hours

### Priority Breakdown:
- 🔴 Critical: 24 min (must complete)
- 🟡 High: 115 min (~2 hours)
- 🟢 Medium: 110 min (~2 hours)
- 🔵 Nice to Have: 110 min (~2 hours)
- 🎯 Quality Gates: 60 min (1 hour)

### Recommended Approach:
1. **Session 1 (1 hour)**: Critical + High Priority (T242-T243, T249-T250, T221)
2. **Session 2 (1.5 hours)**: High Priority UX (T223-T224, T222)
3. **Session 3 (2 hours)**: Medium Priority Code Quality (T228-T229, T215-T216)
4. **Session 4 (2 hours)**: Documentation (T230, T233, T232)
5. **Session 5 (1.5 hours)**: Quality Gates & Testing (T252, T239, T251, T255)

---

## Not Included (Deferred to Post-MVP)

These Phase 12 tasks are deferred as they're not critical for MVP:

- T214: Virtualized tables (only needed for 1000+ assets)
- T217: useMemo optimizations (premature optimization)
- T218: TanStack Query cache tuning (current defaults work well)
- T219: Bundle analysis (T251 covers size check)
- T220: Bundle size verification (covered by T251)
- T225: Undo functionality (complex, low priority)
- T226: Keyboard shortcuts docs (few shortcuts currently)
- T227: Accessibility audit (should be Phase 13)
- T227a-f: Settings page (not in MVP scope)
- T231: Component documentation (JSDoc covers it)
- T234-T237: Unit tests (comprehensive tests exist)
- T238: Quickstart validation (will do in T232)
- T240: Mobile testing (desktop-first MVP)
- T241: Offline testing (not in MVP scope)
- T241a-i: Edge cases (Phase 5+ features)
- T244: Rate limiting (ChurchTools handles this)
- T245: CSP headers (deployment concern)
- T246: Security audit (pre-deployment)
- T247: Version bump (pre-deployment)
- T248: CHANGELOG (pre-deployment)
- T253: Production testing (deployment phase)
- T254: More browsers (T239 covers basics)
- T256: Constitution gates (covered by T249-T255)

---

## Success Criteria

MVP is production-ready when:
- ✅ All critical tasks complete (T242-T243, T249-T250)
- ✅ All high priority tasks complete (T221-T224, T222)
- ✅ Manual testing passes all scenarios (T252)
- ✅ Cross-browser tested in 2+ browsers (T239)
- ✅ Bundle size < 200 KB gzipped (T251)
- ✅ Performance targets met (T255)
- ✅ Basic documentation exists (T230, T233, T232)

**Ready to deploy**: Users can manage asset categories with custom fields, create assets, filter/search, and have a polished, professional experience.
