# Project Constitution

## Mission

Deliver a ChurchTools inventory extension that manages assets, bookings, and maintenance with a responsive, English-language UI that works equally well online and offline.

## Technology Baseline

- **Language**: TypeScript 5.x with `strict` mode enabled.
- **Framework**: React 18 with Vite 5 tooling.
- **UI Toolkit**: Mantine Components + @mdi/react iconography.
- **State & Data**: TanStack Query for server state, Zustand stores for UI state, Dexie.js for offline cache.
- **Backend Integration**: ChurchTools Custom Modules API with ChurchTools-authenticated requests.
- **Build Target**: Embedded single-page app served from `/ccm/fkoinventorymanagement/`.

## Architectural Pillars

1. **Type Safety First** – no unchecked `any`; APIs and data models live in `src/types`.
2. **Modularity** – services, hooks, and components are isolated, tested, and reusable.
3. **Performance Discipline** – production bundle stays <5 MB and lazy-loads heavy views.
4. **Offline-Friendly** – all read/write operations route through providers that can swap between online and offline implementations.
5. **Future-Proofing** – abstractions exist for photo storage, permissions, and migrations even if current builds provide stub logic.
6. **User Clarity** – UI copy is English-only, concise, and actionable.

## Quality Gates

| Gate | Expectation |
| --- | --- |
| TypeScript | `npm run type-check` passes with zero errors. |
| ESLint | `npm run lint` passes without warnings. |
| Build | `npm run build` succeeds; bundle < 5 MB; no console warnings. |
| Tests | Vitest suites run green when present; manual smoke checklist maintained. |
| Performance | Initial load under 10 s on ChurchTools, interactions <100 ms. |
| Accessibility | Clickable rows, keyboard focus, and descriptive text for icons. |

## Documentation Strategy

- Canonical specs live in `specs/` organized by phase (`001`, `002`, …) and shared references in this folder.
- Each feature branch contributes to `specs/SPECIFICATIONS.md`, `specs/IMPLEMENTATION.md`, and `specs/CHANGELOG.md`.
- Task backlogs are unified in `specs/TASKS.md`; ad-hoc root-level markdown files are discouraged.

## Change Management

- Maintain semantic commits tying back to task IDs where applicable.
- Update CHANGELOG and Implementation notes after each milestone or release.
- Archive deprecated behaviour via documentation rather than lingering dead UI.

## Governance

- **Owner**: ChurchTools Inventory Maintainers
- **Review Cadence**: Weekly triage of open tasks + monthly audit of bundle size and UX regressions.
- **Decision Log**: Significant architectural choices noted in `specs/IMPLEMENTATION.md` under "Design Decisions".
