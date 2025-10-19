# Implementation Plan: ChurchTools Inventory Management Extension

**Branch**: `001-inventory-management` | **Date**: 2025-10-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-inventory-management/spec.md`

**Note**: This plan documents the technical approach for implementing comprehensive inventory management within ChurchTools, including asset tracking, booking, barcode/QR integration, kit management, maintenance scheduling, and stock take functionality.

## Summary

This feature implements a complete inventory management system as a ChurchTools extension, enabling churches and organizations to track physical assets, manage bookings, perform stock takes with barcode/QR scanning, schedule maintenance, and generate reports. The system leverages ChurchTools Custom Modules API for data storage, integrates with ChurchTools' existing permission system, and provides offline-capable stock take functionality with queue-based synchronization.

## Technical Context

**Language/Version**: TypeScript 5.9.2 with strict mode (13+ strict compiler checks enabled)  
**Primary Dependencies**: 
- React 18.3.1 + React DOM (UI framework)
- Mantine UI v7.13.5 (component library, ChurchTools-compatible styling)
- TanStack Query v5.59.20 (server state management)
- Zustand v4.5.5 (client state management)
- ChurchTools Client v1.4.0 (API integration)
- Dexie v4.0.8 (IndexedDB wrapper for offline storage)
- JsBarcode v3.11.6 (Code-128 barcode generation)
- qrcode v1.5.4 (QR code generation)
- html5-qrcode v2.3.8 (barcode/QR scanning)
- date-fns v3.6.0 (date manipulation)

**Storage**: ChurchTools Custom Modules API (primary), IndexedDB via Dexie (offline queue)  
**Testing**: Manual testing in development + production modes (automated tests for complex logic as needed)  
**Target Platform**: Web (embedded in ChurchTools, modern browsers: Chrome, Safari, Firefox)
**Project Type**: Single-page web application (SPA) embedded as ChurchTools extension  
**Performance Goals**: 
- Bundle size < 200 KB gzipped
- Initial load < 1s on 3G
- UI interactions < 100ms
- Search/filter < 2s for 5,000 assets
- Barcode scanning 95%+ first-scan success rate

**Constraints**: 
- Must integrate with ChurchTools Custom Modules API
- Must use ChurchTools permission system
- Must support offline stock take with sync
- Must follow ChurchTools UI/UX patterns
- German localization for user-facing strings

**Scale/Scope**: 
- Target: 5,000+ assets per organization
- 9 user stories (P1: 2 stories, P2: 3 stories, P3: 4 stories)
- ~60 functional requirements
- Multi-entity data model (10+ entity types)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Type Safety**: TypeScript 5.9.2 strict mode enabled with 13+ strict checks (noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis, alwaysStrict, noUnusedLocals, noUnusedParameters, noImplicitReturns, noFallthroughCasesInSwitch, noUncheckedIndexedAccess, noImplicitOverride). Contract types use `any` intentionally for flexibility (documented justification).
- [x] **UX Consistency**: Mantine UI v7 provides ChurchTools-compatible components. Theme configured with ChurchTools blue (#0080FF) as primary color. German localization for all user-facing strings. Responsive design for all screen sizes.
- [x] **Code Quality**: ESLint configured with TypeScript strict rules (@typescript-eslint/recommended, react-hooks/recommended), max 50 lines per function enforced, no-console warnings in production, consistent formatting via Prettier integration.
- [x] **Performance Budget**: Current bundle size 138.50 KB gzipped (69.2% of 200 KB budget), leaving 61.50 KB (30.8%) remaining. Vite code splitting configured (6 chunks: vendor, mantine, state, scanner, index, CSS). Terser minification enabled.
- [x] **Testing Strategy**: Manual testing performed for Phase 1-2 infrastructure (TypeScript compilation, build verification, bundle size check). Automated tests planned for Phase 3+ user story implementation (TanStack Query hooks, form validation, business logic).
- [x] **Environment Config**: `.env-example` documents all required variables (VITE_BASE_URL, VITE_USERNAME, VITE_PASSWORD, VITE_KEY, VITE_MODULE_ID). No secrets committed. Development-only imports conditionally loaded (main.tsx pattern).

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── components/          # React components
│   └── common/         # Reusable components (LoadingState, ErrorState, EmptyState, ConfirmDialog)
├── hooks/              # Custom React hooks (useStorageProvider, useOnlineStatus, useCurrentUser)
├── services/           # Business logic and external integrations
│   ├── api/           # ChurchTools API client (ChurchToolsAPIClient, ChurchToolsAPIError)
│   └── storage/       # Storage abstraction layer (Factory, ChurchToolsProvider, OfflineProvider, InventoryDB)
├── stores/             # Zustand state management (uiStore, scannerStore)
├── types/              # TypeScript type definitions (entities, storage, api)
├── utils/              # Utility functions (formatters, validators, assetNumbers)
│   └── ct-types.d.ts  # ChurchTools client type definitions
├── App.tsx             # Root application component
├── main.tsx            # Application entry point
├── theme.ts            # Mantine theme configuration
└── vite-env.d.ts       # Vite environment type definitions

specs/001-inventory-management/
├── spec.md             # Feature specification (COMPLETED)
├── plan.md             # This implementation plan (IN PROGRESS)
├── research.md         # Technology research and decisions (TO BE CREATED)
├── data-model.md       # Entity relationship diagram (TO BE CREATED)
├── quickstart.md       # Developer quickstart guide (TO BE CREATED)
├── contracts/          # API contracts and interfaces (TO BE CREATED)
└── tasks.md            # Task breakdown (COMPLETED - 256 tasks)

# Build configuration
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration (strict mode)
├── tsconfig.node.json  # Node tooling TypeScript config
├── eslint.config.js    # ESLint configuration
├── vite.config.ts      # Vite build configuration
└── .env-example        # Environment variable documentation
```

**Structure Decision**: Single-page web application structure selected. This is a frontend-only extension that integrates with ChurchTools via the existing ChurchTools Client library. No backend needed since ChurchTools Custom Modules API provides data storage. The structure follows React best practices with clear separation of concerns: components (UI), services (business logic), stores (state), types (contracts), and utils (helpers).

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Contract types use `any` | ChurchTools API and Custom Modules API return dynamic/flexible data structures that cannot be fully typed without runtime validation | Strict typing would require extensive type guards and validation logic that would be brittle and difficult to maintain as the ChurchTools API evolves |
| Storage provider abstraction | Need to support both online (ChurchTools API) and offline (IndexedDB) storage with identical interface for business logic | Direct API calls would require duplicating all business logic for offline mode, making the codebase significantly more complex and error-prone |

## Phase 0: Research & Technology Decisions

**Status**: ✅ COMPLETE (Completed during initial project setup)

### Technology Research Summary

All technical decisions have been validated through initial implementation (Phase 1-2 complete):

1. **TypeScript 5.9.2 with Strict Mode**
   - Decision: TypeScript with all 13 strict checks enabled
   - Rationale: Maximum type safety, prevents runtime errors, excellent IDE support
   - Verified: Successfully compiling with zero errors

2. **React 18.3.1 + Mantine UI v7.13.5**
   - Decision: React for UI framework, Mantine for component library
   - Rationale: Mantine provides ChurchTools-compatible styling, comprehensive component set, excellent TypeScript support
   - Verified: Theme configured with ChurchTools colors, responsive components working

3. **TanStack Query v5 + Zustand v4**
   - Decision: TanStack Query for server state, Zustand for client state
   - Rationale: TanStack Query handles caching/refetching/mutations elegantly, Zustand provides lightweight client state
   - Verified: Query client configured with 5min stale time, Zustand stores created (uiStore, scannerStore)

4. **ChurchTools Client v1.4.0**
   - Decision: Official ChurchTools API client library
   - Rationale: Provides authentication, HTTP methods, ChurchTools-specific functionality
   - Verified: API client wrapped with person caching (30min TTL), custom error handling

5. **Dexie v4 for Offline Storage**
   - Decision: Dexie.js as IndexedDB wrapper
   - Rationale: Best-in-class IndexedDB library, TypeScript support, elegant API
   - Verified: Database schema created (stockTakeSessions, scannedAssets, syncQueue tables)

6. **Barcode/QR Libraries**
   - Decision: JsBarcode (generation), qrcode (generation), html5-qrcode (scanning)
   - Rationale: Industry-standard libraries, proven reliability, good browser support
   - Verified: Installed and ready for Phase 3 implementation

7. **Vite 7 for Build Tooling**
   - Decision: Vite for development server and production builds
   - Rationale: Fast dev server with HMR, excellent code splitting, optimized production builds
   - Verified: Build successful, bundle size 138.50 KB (30.8% budget remaining)

**Key Findings**:
- Bundle budget well-maintained: 138.50 KB / 200 KB (69.2% used)
- Code splitting strategy effective: 6 optimized chunks
- TypeScript strict mode viable with proper type definitions
- ChurchTools integration patterns established (permission system, API client wrapper)
- Offline-first architecture feasible with Dexie + sync queue pattern

### Research Document

Full research details documented in: [`research.md`](./research.md) ✅ COMPLETE

---

## Phase 1: Data Model & Contracts

**Status**: ✅ COMPLETE

All Phase 1 artifacts have been created and validated:

### Data Model
- **File**: [`data-model.md`](./data-model.md) ✅
- **Content**: Complete entity relationship diagram with 10 core entities
- **Validation Rules**: Field types, constraints, relationships documented
- **State Machines**: Asset status transitions, booking lifecycle defined

### API Contracts
- **Directory**: [`contracts/`](./contracts/) ✅
- **Files Created**:
  - `entities.ts` - Core entity type definitions (500+ lines)
  - `storage-provider.ts` - IStorageProvider interface (60+ methods)
  - `churchtools-api.ts` - IChurchToolsAPIClient interface
- **Validation**: All contracts copied to `src/types/` and successfully compiling

### Developer Quickstart
- **File**: [`quickstart.md`](./quickstart.md) ✅
- **Content**: Environment setup, development workflow, testing procedures
- **Validation**: Instructions verified through Phase 1-2 implementation

### Agent Context Update
Agent-specific context files have been updated with technology stack from this plan (see `.github/copilot-instructions.md`)

---

## Phase 2: Implementation Status

**Status**: ✅ COMPLETE (T001-T041 all verified 2025-10-19)

### Completed Work

**Setup Infrastructure** (T001-T015): ✅ COMPLETE
- ✅ Package dependencies installed (307 packages)
- ✅ TypeScript strict mode configured (tsconfig.json)
- ✅ ESLint with strict rules (eslint.config.js)
- ✅ Vite build optimization (vite.config.ts)
- ✅ Mantine theme (ChurchTools colors)
- ✅ TanStack Query setup (main.tsx)
- ✅ Build verification: 138.50 KB < 200 KB budget

**Type Definitions** (T016-T018): ✅ COMPLETE
- ✅ `src/types/entities.ts` - Copied from contracts (613 lines, `any`→`unknown` for type safety)
- ✅ `src/types/storage.ts` - Copied from contracts (501 lines, `any`→`unknown` for type safety)
- ✅ `src/types/api.ts` - Copied from contracts (400 lines, `any`→`unknown` for type safety)

**API Client** (T019-T021): ✅ COMPLETE
- ✅ `src/services/api/ChurchToolsAPIClient.ts` - HTTP methods, person caching (30min TTL)
- ✅ `src/services/api/ChurchToolsAPIError.ts` - Custom error with status codes
- ✅ Singleton pattern, type-safe wrappers

**Storage Infrastructure** (T022-T025): ✅ COMPLETE
- ✅ `src/services/storage/StorageProviderFactory.ts` - Factory pattern
- ✅ `src/services/storage/ChurchToolsProvider.ts` - Stub (Phase 3 implementation)
- ✅ `src/services/storage/OfflineProvider.ts` - Stub (Phase 9 implementation)
- ✅ `src/services/storage/InventoryDB.ts` - Dexie schema

**Utilities** (T026-T028): ✅ COMPLETE
- ✅ `src/utils/formatters.ts` - Date, currency, status labels (German)
- ✅ `src/utils/validators.ts` - Asset numbers, barcodes, QR, emails, dates
- ✅ `src/utils/assetNumbers.ts` - Generation, padding, suggestions

**State Management** (T029-T030): ✅ COMPLETE
- ✅ `src/stores/uiStore.ts` - Sidebar, theme, modals, loading
- ✅ `src/stores/scannerStore.ts` - Scanner state, camera selection
- ✅ `src/stores/index.ts` - Store exports
- ✅ Zustand with persist middleware

**Common Components** (T031-T034): ✅ COMPLETE
- ✅ `src/components/common/LoadingState.tsx`
- ✅ `src/components/common/ErrorState.tsx`
- ✅ `src/components/common/EmptyState.tsx`
- ✅ `src/components/common/ConfirmDialog.tsx`

**Custom Hooks** (T035-T037): ✅ COMPLETE
- ✅ `src/hooks/useStorageProvider.ts` - Factory-based provider access
- ✅ `src/hooks/useOnlineStatus.ts` - Network connectivity detection
- ✅ `src/hooks/useCurrentUser.ts` - TanStack Query hook

**Constitution Verification** (T038-T041): ✅ COMPLETE
- ✅ TypeScript compilation: PASSED (`npx tsc --noEmit` zero errors)
- ✅ ESLint: PASSED (fixed 24 issues: `any`→`unknown`, removed unnecessary type assertions, moved constants to `src/config/constants.ts`)
- ✅ Environment variables: VERIFIED (`.env-example` complete with all required variables)
- ✅ Bundle size: 138.50 KB / 200 KB (30.7% remaining budget, code splitting configured)

### Bundle Analysis

| Chunk | Size (gzipped) | % of Budget |
|-------|----------------|-------------|
| CSS | 33.31 KB | 16.7% |
| Vendor | 45.04 KB | 22.5% |
| Mantine | 22.41 KB | 11.2% |
| State (Zustand) | 7.09 KB | 3.5% |
| Index | 30.65 KB | 15.3% |
| Scanner | 0.02 KB | 0.0% |
| **Total** | **138.50 KB** | **69.3%** |

**Budget Remaining**: 61.50 KB (30.7%)

### File Structure Created

```
src/
├── components/common/      # 4 reusable components
├── hooks/                  # 3 custom hooks
├── services/
│   ├── api/               # 2 files (client + error)
│   └── storage/           # 4 files (factory + providers + DB)
├── stores/                 # 2 Zustand stores (+ index)
├── types/                  # 3 contract files
├── utils/                  # 3 utility modules (+ ct-types.d.ts)
├── App.tsx
├── main.tsx
├── theme.ts
└── vite-env.d.ts

Total: 27 TypeScript/TSX files created
```

---

## Phase 3+: User Story Implementation

**Status**: READY TO BEGIN

All foundational infrastructure is in place. Next steps:

**Phase 3 - User Story 1**: Basic Asset Creation and Tracking (P1 - MVP)
- Tasks: T042-T063 (22 tasks)
- Implement: Full ChurchToolsProvider, TanStack Query hooks, asset CRUD UI
- Estimated: 16-24 hours

See [`tasks.md`](./tasks.md) for complete task breakdown (256 tasks total across 9 user stories).

