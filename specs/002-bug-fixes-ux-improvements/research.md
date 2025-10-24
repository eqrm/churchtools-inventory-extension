# Research: Bug Fixes & UX Improvements

**Feature**: 002-bug-fixes-ux-improvements  
**Date**: October 22, 2025  
**Phase**: 0 - Research & Technology Decisions

## Overview

This document consolidates technology decisions and research findings for implementing 33 tasks across 85 functional requirements. Research focused on: (1) Calendar library selection, (2) Icon library migration strategy, (3) Offline storage patterns, (4) Photo storage abstraction, (5) Conflict resolution strategies, (6) Image compression techniques.

---

## Decision 1: Calendar Library for Booking View

**Decision**: Use `@fullcalendar/react` v6

**Rationale**:
- **Mature & Maintained**: 10+ years active development, regular updates, TypeScript support
- **ChurchTools Compatibility**: Already used in ChurchTools core (reduces bundle duplication)
- **Feature Complete**: Day/week/month views, drag-drop, time slots, event rendering out of the box
- **Performance**: Handles 1000+ events without lag, lazy loading support
- **Customization**: Extensive theming API matches ChurchTools design language
- **Bundle Size**: ~45KB gzipped (acceptable within 5MB budget)

**Alternatives Considered**:
- `react-big-calendar`: Good but less feature-complete (no time slots), requires more custom code
- `react-calendar`: Too basic, doesn't support time-based events or drag-drop
- Custom implementation: 2-3 weeks development time not justified, reinventing wheel

**Implementation Notes**:
- Install: `npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid`
- Configure with ChurchTools theme colors
- Map booking status to event colors (Approved=green, Pending=yellow, Declined=red)
- Enable click-to-create and drag-to-resize for new bookings

---

## Decision 2: Icon Library Migration (Tabler Icons → MDI)

**Decision**: Use `@mdi/js` + `@mdi/react` for Material Design Icons

**Rationale**:
- **Larger Icon Set**: 7000+ icons vs Tabler's 4500+, better coverage for domain needs
- **Tree-Shakeable**: Only bundle icons actually used, optimal bundle size
- **ChurchTools Standard**: MDI used in ChurchTools core UI, maintains consistency
- **License**: Apache 2.0 (permissive, no attribution required)
- **Bundle Impact**: ~5KB per 50 icons imported (minimal)
- **Migration Path**: Keep Tabler during transition, remove after full migration

**Alternatives Considered**:
- Keep Tabler Icons: Inconsistent with ChurchTools, smaller icon set
- Font Awesome: Larger bundle size (entire font file), less tree-shaking
- Heroicons: Insufficient icon coverage for asset management domain

**Implementation Notes**:
- Install: `npm install @mdi/js @mdi/react`
- Create icon mapping: `iconMigrationMap.ts` (Tabler → MDI equivalents)
- Update IconPicker component to use MDI
- Update IconDisplay component for backward compatibility
- Phased migration: New features use MDI, update existing gradually

---

## Decision 3: Offline Storage Pattern with Conflict Resolution

**Decision**: Use Dexie.js (IndexedDB wrapper) + manual conflict resolution UI

**Rationale**:
- **IndexedDB Wrapper**: Dexie.js provides promise-based API, easier than raw IndexedDB
- **Offline-First**: Stores stock take scans locally, syncs when online
- **Type Safety**: TypeScript definitions included, follows strict mode requirements
- **Sync Pattern**: Queue-based sync with conflict detection
- **Manual Resolution**: Present conflicts to user with side-by-side comparison (per clarification)
- **Bundle Size**: ~15KB gzipped (acceptable)

**Alternatives Considered**:
- LocalStorage: 5-10MB limit too small for stock take data with images
- Raw IndexedDB: Complex API, more code, higher maintenance burden
- PouchDB/CouchDB: Overkill for simple sync, larger bundle size (~100KB)
- Automatic conflict resolution: Rejected due to audit requirements (clarification Q3)

**Implementation Notes**:
- Install: `npm install dexie`
- Database schema: `StockTakeDB` with tables: `sessions`, `scans`, `syncQueue`
- Sync strategy:
  1. Detect conflicts by comparing timestamps
  2. Show ConflictResolutionModal with offline vs online data side-by-side
  3. User selects which version to keep or merges manually
  4. Mark conflict as resolved, continue sync
- Sync triggers: Connection restored, manual sync button, periodic background check

---

## Decision 4: Photo Storage Abstraction Pattern

**Decision**: Interface-based abstraction with two implementations (Base64 + ChurchTools Files)

**Rationale**:
- **Migration Path**: Enables gradual migration from base64 to Files module
- **Backward Compatibility**: Old base64 photos continue working during/after migration
- **No Breaking Changes**: New installations can use Files from start, old installations migrate at their own pace
- **Type Safety**: Interface ensures both implementations follow same contract
- **Feature Flag**: Simple config switch between implementations

**Alternatives Considered**:
- Direct migration: Requires downtime, risk of data loss, rejected
- Dual storage always: Wastes space storing same photo twice, rejected
- No abstraction: Future migration would require extensive refactoring, rejected

**Implementation Notes**:
- Interface: `IPhotoStorage` with methods: `uploadPhoto()`, `deletePhoto()`, `getPhotoUrl()`, `isBase64Photo()`
- Implementation 1: `Base64PhotoStorage` (current) - converts File → data URL
- Implementation 2: `ChurchToolsPhotoStorage` (future) - uploads to Files API
- Factory pattern: `createPhotoStorage(config)` returns appropriate implementation
- Migration script: `migrateAssetPhotos()` converts base64 → Files in background

---

## Decision 5: Image Compression Strategy

**Decision**: Two-tier compression using `browser-image-compression` library

**Rationale**:
- **Quality vs Size**: Thumbnails (gallery) need less quality, full-size (detail) needs more (per clarification Q4)
- **Client-Side**: Compression before upload reduces API bandwidth and storage
- **Library Choice**: `browser-image-compression` - 15KB, TypeScript support, Promise-based API
- **Compression Targets**:
  - Thumbnails: 70% JPEG quality, 400px max width (~30KB result)
  - Full-size: 85% JPEG quality, 2048px max width (~200-300KB result)
- **Format**: Always convert to JPEG (PNG/WebP converted), consistent format

**Alternatives Considered**:
- Server-side compression: Increases server load, slower feedback, requires API changes
- Single compression level: Either wastes bandwidth (thumbnails) or sacrifices quality (full-size)
- Canvas API directly: More code to maintain, `browser-image-compression` handles edge cases
- No compression: 5MB photos would quickly exceed storage, rejected

**Implementation Notes**:
- Install: `npm install browser-image-compression`
- Compression function:
  ```typescript
  async function compressImage(file: File, options: { maxWidth: number, quality: number }): Promise<File>
  ```
- Generate both versions on upload: thumbnail + full-size
- Store both in AssetImage entity (thumbnailId, fullSizeId)
- Gallery view loads thumbnails only (lazy load full-size on demand)

---

## Decision 6: Booking Conflict Resolution Strategy

**Decision**: Last-write-wins with validation at submission time (per clarification Q1)

**Rationale**:
- **Simple Implementation**: No distributed locking, no held reservations
- **Clear User Feedback**: Second user gets friendly error with available dates suggestion
- **Race Condition Handling**: Validation happens in single transaction at API level
- **No False Reservations**: Assets not held during form filling (optimistic locking rejected)
- **Audit Trail**: Both attempts logged with timestamps for analysis

**Alternatives Considered**:
- First-come-first-served with notifications: Requires real-time system, complexity not justified
- Optimistic locking with holds: Assets temporarily unavailable during form, user frustration
- Queue/waitlist system: Adds workflow complexity, not requested in requirements

**Implementation Notes**:
- Validation flow:
  1. User submits booking form
  2. Backend checks asset availability for date range (within transaction)
  3. If available: Create booking, return success
  4. If unavailable: Return 409 Conflict with error message and available date suggestions
  5. Frontend shows friendly error: "Asset already booked for these dates. Try [suggested dates]"
- Implement in `ChurchToolsProvider.createBooking()` with transaction
- Add availability check endpoint: `GET /api/assets/{id}/availability?start={date}&end={date}`

---

## Decision 7: Schema Migration Rollback Strategy

**Decision**: Automatic rollback with retry on next load (per clarification Q5)

**Rationale**:
- **Data Safety**: Rollback prevents corruption, preserves all data (critical per FR-057)
- **Automatic Recovery**: Retry on next load enables fixes to be deployed without manual intervention
- **Detailed Logging**: Error details help diagnose migration issues
- **No Downtime**: Application continues with old schema, not blocked by failed migration
- **Testing**: Migrations can be tested in development before production deployment

**Alternatives Considered**:
- Fail-fast: Leaves app broken, requires immediate manual fix, rejected
- Manual recovery only: Delays recovery until admin available, rejected
- Dual-schema: Complex to maintain, inconsistent data model, rejected

**Implementation Notes**:
- Migration system components:
  1. `SchemaVersion` entity (version: string, appliedAt: Date)
  2. `MigrationRegistry` (map of version → migration function)
  3. `runMigrations()` function (checks version, runs pending, handles errors)
- Error handling:
  ```typescript
  try {
    await migration.up(data);
    await saveSchemaVersion(newVersion);
  } catch (error) {
    await migration.down(data); // Rollback
    logError('Migration failed', { version, error });
    // App continues with old schema
  }
  ```
- Retry logic: On next app load, check if migration pending, attempt again
- User notification: Optional banner "System update pending, will retry automatically"

---

## Decision 8: Permission Abstraction for Future Role-Based Access

**Decision**: Simple interface now, ChurchTools permission API integration later (per clarification Q2)

**Rationale**:
- **Current**: Any authenticated user can book for anyone (no roles available in ChurchTools plugins yet)
- **Future**: When ChurchTools adds plugin permission API, switch to role-based (admin + booking coordinators)
- **Abstraction**: Interface prevents hard-coded permission checks throughout codebase
- **Zero Breaking Changes**: Same interface, different implementation

**Implementation Notes**:
- Interface: `IPermissionService` with methods: `canBookForOthers(userId): Promise<boolean>`
- Current implementation: `SimplePermissionService` - always returns `true` for authenticated users
- Future implementation: `ChurchToolsPermissionService` - checks user roles via API
- Usage: `if (await permissions.canBookForOthers(userId)) { /* show "booking for" field */ }`
- Comment in code: `// TODO: Update when ChurchTools adds plugin permission API`

---

## Decision 9: React Router Base Path Configuration

**Decision**: Configure `base` in both Vite and React Router to match ChurchTools module path

**Rationale**:
- **Root Cause**: ChurchTools embeds extensions at `/ccm/fkoinventorymanagement/`, app expects `/`
- **Two Configuration Points**:
  - Vite `base`: Tells build system where assets (JS/CSS) are served from
  - React Router `basename`: Tells router where app is mounted
- **Must Match**: Both must use same base path or routing breaks on refresh
- **Environment Variable**: Use `import.meta.env.BASE_URL` for consistency

**Alternatives Considered**:
- Hash router: Would work but breaks deep linking, not recommended for modern SPAs
- Proxy/rewrite: Requires server changes, can't control ChurchTools infrastructure

**Implementation Notes**:
- `vite.config.ts`:
  ```typescript
  export default defineConfig({
    base: '/ccm/fkoinventorymanagement/',
    // ... rest of config
  });
  ```
- `src/App.tsx`:
  ```typescript
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    {/* routes */}
  </BrowserRouter>
  ```
- Test all scenarios: refresh, back/forward, deep links, external links

---

## Decision 10: English Localization Strategy

**Decision**: Direct string replacement now, i18n library preparation for future

**Rationale**:
- **Current Need**: Replace German strings with English in booking components (simple)
- **Future-Proofing**: Structure code to easily add i18n library later (don't block it)
- **No Over-Engineering**: Don't add i18n library now if only one language needed
- **Search Strategy**: Grep for German strings, replace with English, document locations

**Implementation Notes**:
- Find German strings: `grep -r "Buchung\|Anfrage\|Genehmigt\|Abgelehnt" src/components/bookings/`
- Replace with English equivalents: Booking, Request, Approved, Declined, etc.
- Create constants file: `src/i18n/bookingStrings.ts` with English strings
- Import strings: `import { BOOKING_LABELS } from '@/i18n/bookingStrings';`
- Future: Replace with `import { t } from 'i18next';` when multi-language needed

---

## Technology Stack Summary

| Category | Technology | Version | Bundle Impact | Rationale |
|----------|-----------|---------|---------------|-----------|
| Calendar | @fullcalendar/react | ^6.0 | ~45KB | Feature-complete, ChurchTools compatible |
| Icons | @mdi/js + @mdi/react | ^7.0 | ~5KB/50 icons | Tree-shakeable, ChurchTools standard |
| Offline Storage | Dexie.js | ^4.0 | ~15KB | IndexedDB wrapper, TypeScript support |
| Image Compression | browser-image-compression | ^2.0 | ~15KB | Client-side, Promise-based |
| Permissions | Custom interface | N/A | ~1KB | Future-proof abstraction |
| Photo Storage | Custom interface | N/A | ~2KB | Migration path for Files API |

**Total New Dependencies**: ~83KB gzipped (well within 5MB budget)

---

## Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Calendar library breaking changes | Low | Medium | Lock version, test thoroughly, check changelog |
| Offline sync data loss | Medium | High | Extensive testing, manual conflict resolution, rollback capability |
| Photo migration failures | Medium | Medium | Gradual migration, backward compatibility, migration script with retry |
| Schema migration corruption | Low | Critical | Automatic rollback, detailed logging, extensive testing |
| Permission API never released | Medium | Low | Abstraction allows fallback to current behavior |
| Bundle size exceeds limit | Low | High | Tree-shaking, code splitting, monitor build output |

---

## Open Questions

**None remaining.** All technical decisions resolved through:
- Clarification session (5 questions answered)
- Analysis of existing codebase patterns
- Research of proven libraries and patterns
- Alignment with ChurchTools architecture

Ready to proceed to Phase 1: Design & Contracts.
