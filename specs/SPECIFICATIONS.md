# Functional Specifications

## User Stories

| ID | Priority | Summary | Key Requirements |
| --- | --- | --- | --- |
| US1 | P0 | Reliable navigation | Refreshing any route preserves state; history navigation works. |
| US2 | P0 | Person search for bookings | ChurchTools-backed person lookup with caching and avatars. |
| US3 | P1 | Book on behalf of others | Distinguish "booked by" vs "booking for" persons across UI & API. |
| US4 | P1 | Smart booking dates | Support single-day bookings with time slots and multi-day spans. |
| US5 | P1 | Asset availability | Prevent double-booking; only bookable assets surface in forms. |
| US6 | P3 | Asset imagery | Image upload, compression, gallery view, and featured image selection. |
| US7 | P3 | Schema evolution | Versioned migrations with rollback and retries. |
| US8 | P3 | Photo migration groundwork | Abstractions prepared for future Files API integration. |
| US9 | P2 | Dev & deploy workflow | Documented quickstart, hot reload, build/preview scripts, deployment automation. |
| US10 | P2 | Offline stock take | IndexedDB-backed flows, conflict detection, and manual resolution. |

## Non-Functional Requirements

- **Localization**: English-only UI copy; no German remnants in production.
- **Performance**: Bundle under 5 MB; initial load < 10 s; search < 3 s.
- **Reliability**: All CRUD operations handle API errors gracefully with actionable messages.
- **Compliance**: Respect ChurchTools API limits and authentication model.
- **Extensibility**: Icon sets standardized on Material Design Icons.

## Feature Boundaries

- Photo storage currently uses Base64 in ChurchTools custom data; migration to Files API is future work.
- Offline sync is stubbed for certain flows until Files API and conflict resolution policies are finalised.
- Keyboard shortcut overlays are optional; Quick Scan remains accessible via menu controls.

## Success Criteria Snapshot

- SC-001: 100% of routes survive refresh (✅ implemented).
- SC-002: Person search returns results in <3 s (✅ implemented).
- SC-003: Both booker and recipient visible in booking interfaces (✅ implemented).
- SC-017: Calendar view renders actual bookings with status coloring (🚧 in progress with new calendar implementation).
- SC-020: Build output <5 MB (✅ tracked in build pipeline).

## Data Definitions

See `src/types/entities.ts` for canonical entity contracts:
- **Asset**: includes `bookable`, `photos`, `mainPhotoIndex`, `customFieldValues`.
- **Booking**: includes `bookedById`, `bookingForId`, `bookingMode`, `timeRange`.
- **Schema Migration**: versioned entries with status, timestamps, and rollback metadata.

## External Integrations

- **ChurchTools Search API**: `/search?query=…&domain_types[]=person` executed through `PersonSearchService` with debounce and caching.
- **Dexie.js**: Offline queue storage and conflict snapshots.
- **FullCalendar**: Visual bookings calendar (asset and booking contexts).

## Open Questions

- Permission granularity for booking on behalf of others – waiting on ChurchTools API support.
- Long-term photo storage strategy once Files API roll-out is confirmed.
- Deployment packaging automation (zip pipeline) to reduce manual steps.
