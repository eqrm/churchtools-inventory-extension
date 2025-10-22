# Implementation Plan: Bug Fixes & UX Improvements

**Branch**: `002-bug-fixes-ux-improvements` | **Date**: October 22, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-bug-fixes-ux-improvements/spec.md` + PHASE13-IMPROVEMENTS.md + repository documentation

## Summary

This plan addresses 33 tasks from user testing organized into 85 functional requirements across 10 user stories. Primary focus areas: (1) Fix critical routing/navigation bugs blocking all pages, (2) Implement ChurchTools person search API for booking system, (3) Enhance booking workflow with flexible date/time options and availability filtering, (4) Resolve API errors (400/500) for asset prefixes and maintenance, (5) Fix kit and report navigation issues, (6) Improve UX with English localization, clickable tables, and better date pickers, (7) Add photo storage abstraction for future migration, (8) Implement offline stock take with conflict resolution, (9) Consolidate 224+ scattered markdown files into organized specs/ structure.

Technical approach: Leverages existing TypeScript 5.x + React + Vite architecture with ChurchTools Custom Modules API. Introduces abstraction layers for permissions (future role-based), photo storage (base64 → Files module migration), and offline sync (IndexedDB). Implements last-write-wins conflict resolution for bookings, manual resolution for offline sync conflicts, two-tier image compression (thumbnails 70%/400px, full-size 85%/2048px), and automatic rollback for failed schema migrations.

## Terminology Clarifications

**Asset Prefix** (canonical term): Configuration that defines the automatic numbering format for assets (e.g., "AUDIO-001", "VIDEO-001"). Replaces legacy term "Asset Numbering".

**Base Path** (canonical term): The URL path prefix `/ccm/fkoinventorymanagement/` where the application is hosted within ChurchTools.
- In Vite config: `base: '/ccm/fkoinventorymanagement/'`
- In React Router: `basename={import.meta.env.BASE_URL}`
- NOT "base URL" (which implies full URL with domain)
- Code-level synonyms: `basename` (React Router), `base` (Vite config)

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled  
**Primary Dependencies**: React 18, Vite 5, ChurchTools Custom Modules API, IndexedDB (Dexie.js for offline)  
**Storage**: ChurchTools Custom Modules API (data categories/values), IndexedDB (offline cache), Base64 photos (current) → ChurchTools Files API (future)  
**Testing**: Vitest (unit), Manual testing (all features), E2E (critical booking/stock take flows)  
**Target Platform**: Web (embedded in ChurchTools), browsers: Chrome, Safari, Firefox  
**Project Type**: Web application (single-page React app embedded as ChurchTools extension)  
**Performance Goals**: Bundle <5MB (warning threshold), load <10s, person search <3s, hot-reload development  
**Constraints**: 20MB ChurchTools deployment limit, 100% route refresh capability, zero console errors/warnings, backward compatibility for photos  
**Scale/Scope**: 172+ existing components, 85 new requirements, 10 user stories (P0-P3), 30 success criteria, ~6 weeks timeline

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Type Safety**: TypeScript strict mode already enabled (tsconfig.json), all new code will use explicit types, no `any` without justification
- [x] **UX Consistency**: Maintains existing ChurchTools component patterns (see existing UI integration), English localization addresses consistency
- [x] **Code Quality**: ESLint configured, existing code passes linting, modular structure planned (services/hooks/components separation)
- [x] **Performance Budget**: Current bundle ~200KB warning, updating to 5MB threshold per requirements, load time targets defined (SC-022, SC-025)
- [x] **Testing Strategy**: Manual testing documented in spec (all user stories), automated tests for critical paths (offline sync, booking conflicts)
- [x] **Environment Config**: .env pattern already established, no new secrets needed (ChurchTools API uses existing module key)

**Notes**: All gates pass. Project already follows constitution; this phase extends existing patterns. Performance budget update justified by ChurchTools 20MB limit (current warning at 200KB too conservative).

## Project Structure

### Documentation (this feature)

```
specs/002-bug-fixes-ux-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (entities + storage)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── person-search.ts
│   ├── booking-conflicts.ts
│   ├── offline-sync.ts
│   └── photo-storage.ts
├── tasks.md             # Phase 2 output (/speckit.tasks)
└── checklists/
    └── requirements.md  # Already created
```

### Source Code (repository root)

```
src/
├── services/
│   ├── person/
│   │   ├── PersonSearchService.ts      # NEW: T301
│   │   └── PersonAvatarCache.ts        # NEW: T316
│   ├── storage/
│   │   ├── ChurchToolsProvider.ts      # MODIFY: Fix API errors T302, T303
│   │   ├── OfflineStorageProvider.ts   # MODIFY: Conflict resolution T310
│   │   ├── IPhotoStorage.ts            # NEW: Abstraction interface T327
│   │   ├── Base64PhotoStorage.ts       # NEW: Current implementation
│   │   └── ChurchToolsPhotoStorage.ts  # NEW: Future implementation
│   └── migrations/
│       ├── SchemaVersioning.ts         # NEW: T329
│       └── v1.0.0-to-v1.1.0.ts        # NEW: Example migration
├── hooks/
│   ├── usePersonSearch.ts              # NEW: T301
│   ├── useAssetAvailability.ts         # NEW: T310
│   ├── useOfflineSync.ts               # NEW: T310 (offline)
│   └── useScannerPreference.ts         # NEW: T318
├── components/
│   ├── common/
│   │   ├── PersonPicker.tsx            # NEW: T301
│   │   ├── PersonAvatar.tsx            # NEW: T316
│   │   ├── ImageUpload.tsx             # NEW: T327
│   │   └── CreatableSelect.tsx         # NEW: T323
│   ├── bookings/
│   │   ├── BookingForm.tsx             # MODIFY: T306-T312 (English, dates, times)
│   │   ├── BookingCalendar.tsx         # MODIFY: T319 (actual calendar)
│   │   └── BookingStatusBadge.tsx      # MODIFY: T313 (Declined vs Cancelled)
│   ├── assets/
│   │   ├── AssetForm.tsx               # MODIFY: T323 (manufacturer/model), T327 (images)
│   │   ├── AssetGalleryView.tsx        # MODIFY: T327 (display images)
│   │   └── AssetCalendarView.tsx       # MODIFY: T319 (calendar library)
│   ├── stocktake/
│   │   ├── StockTakeReport.tsx         # MODIFY: T314 (fix keys)
│   │   └── StartStockTakeForm.tsx      # MODIFY: T315 (Name/Reason)
│   ├── scanner/
│   │   └── QuickScanModal.tsx          # MODIFY: T318 (scanner dropdown)
│   └── settings/
│       ├── ManufacturerList.tsx        # NEW: T330
│       └── ModelList.tsx               # NEW: T330
├── pages/
│   ├── KitDetailPage.tsx               # MODIFY: T304 (fix not found)
│   ├── ReportsPage.tsx                 # MODIFY: T305 (fix navigation)
│   ├── SettingsPage.tsx                # MODIFY: T317, T322 (remove tabs)
│   ├── ManufacturersPage.tsx           # NEW: T330
│   └── ModelsPage.tsx                  # NEW: T330
├── utils/
│   ├── assetNameGenerator.ts           # NEW: T324
│   └── envValidation.ts                # MODIFY: T325 (remove warning)
├── App.tsx                             # MODIFY: T300 (basename), T330 (routes)
└── types/
    └── entities.ts                     # MODIFY: Many (new fields, types)

vite.config.ts                          # MODIFY: T300 (base), T331 (bundle warning)
package.json                            # MODIFY: Add libraries (calendar, MDI icons)

specs/
├── 001-inventory-management/           # KEEP
├── 002-bug-fixes-ux-improvements/     # This feature
├── CONSTITUTION.md                     # NEW: T332 (consolidate)
├── SPECIFICATIONS.md                   # NEW: T332
├── IMPLEMENTATION.md                   # NEW: T332
├── TASKS.md                           # NEW: T332
└── CHANGELOG.md                        # NEW: T332

[Root .md files to DELETE after consolidation - T332]
PHASE*.md, IMPLEMENTATION*.md, UI-*.md, T*_*.md, etc. (25+ files)
```

**Structure Decision**: Existing single-project web application structure maintained. Key additions: (1) Person search service layer, (2) Photo storage abstraction, (3) Offline sync with conflict resolution, (4) Schema migration system, (5) Master data management pages. All new code follows established patterns: services for business logic, hooks for React state, components for UI, clear separation of concerns.

## Complexity Tracking

*No Constitution violations. This table documents justified design decisions that add complexity.*

| Design Decision | Why Needed | Simpler Alternative Rejected Because |
|-----------------|------------|-------------------------------------|
| Photo Storage Abstraction (IPhotoStorage) | Enable migration from base64 to Files module without breaking existing photos | Direct implementation would require breaking changes and potential data loss for existing installations |
| Permission Abstraction Layer | Prepare for future role-based permissions when ChurchTools adds plugin permission API | Hardcoding current behavior would require significant refactoring when ChurchTools adds permissions |
| Two-Tier Image Compression | Balance quality vs size for thumbnails (gallery) and full-size (detail view) | Single compression level either wastes bandwidth (thumbnails) or sacrifices quality (full-size) |
| Manual Conflict Resolution (offline sync) | Stock take data is audit-critical, automatic resolution could lose information | Server-wins or offline-wins strategies risk data loss; manual resolution ensures accuracy |
| Automatic Migration Rollback | Protect data integrity during schema changes across versions | Fail-fast approach would break application for users; rollback enables recovery |

