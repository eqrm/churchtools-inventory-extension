# Clarification Session Report: October 20, 2025

**Feature**: ChurchTools Inventory Management Extension  
**Branch**: `001-inventory-management`  
**Session Date**: October 20, 2025  
**Questions Resolved**: 6 of 6

## Session Summary

This clarification session successfully resolved 6 critical ambiguities in the specification, covering booking workflows, data storage, resource allocation, collaboration features, schema evolution, and location management.

---

## Questions & Answers

### Q1: Booking Approval Workflow

**Category**: Functional Scope - Workflow States

**Question**: Who can approve bookings and what is the approval workflow?

**Answer**: Users with "edit data in categories" permission can approve any booking (including their own for now). Design the permission checking system to be easily changeable when ChurchTools adds more granular extension permissions. Note: ChurchTools handles permissions internally through its permission system API - query permissions at runtime rather than caching them.

**Impact**:
- Phase 7 (Booking & Reservation) implementation
- Permission checking architecture
- Approval UI components

**Functional Requirements Updated**:
- FR-029a: Approval permission definition
- FR-029b: Runtime permission checking (new)
- FR-029c: Future granular permissions planning (new)

---

### Q2: Maintenance Photo Storage

**Category**: Integration Points - Data Storage

**Question**: How should maintenance photos be stored and accessed?

**Answer**: Store photos as base64 strings (compressed) in Custom Module data category fields for now. Implement client-side compression before encoding (max 1920px width, 85% quality JPEG). Design the storage layer to be easily replaceable when ChurchTools extensions get better access to the Files module and file permissions.

**Impact**:
- Phase 10 (Maintenance Scheduling) implementation
- T172a (photo upload) implementation approach
- Storage architecture design

**Functional Requirements Updated**:
- FR-045: Photo upload specification
- FR-045a: Compression and storage method (new)
- FR-045b: Replaceable storage layer design (new)

---

### Q3: Flexible Kit Asset Allocation

**Category**: Functional Scope - Business Logic

**Question**: When should flexible kit assets be allocated - at booking creation (Pending) or at approval?

**Answer**: Use lazy allocation. Flexible kit bookings in "Pending" status do NOT allocate specific assets. System validates sufficient pool assets exist at booking creation. Actual asset allocation happens when booking is approved. If insufficient assets available at approval time, show error requiring re-booking. Administrators can manually select specific assets during approval process.

**Impact**:
- Phase 8 (Equipment Kits) implementation
- Database schema for kit bookings
- Availability calculation logic

**Functional Requirements Updated**:
- FR-026: Validation at booking creation (modified)
- FR-026a: Allocation at approval (new)
- FR-026b: Insufficient availability handling (new)

---

### Q4: Stock Take Session Concurrency

**Category**: Functional Scope - Multi-User Scenarios

**Question**: Should stock take sessions support multiple concurrent users?

**Answer**: Use shared sessions model. Multiple users can contribute scans to a single stock take session for team-based audits. Implement real-time collaboration with optimistic updates showing "Scanned by [User] at [Time]" for each asset. Session creator owns the session and can close it to generate the final report. All users with view permissions can see live scan progress.

**Impact**:
- Phase 9 (Stock Take) implementation
- Real-time collaboration UI
- Session ownership and permissions

**Functional Requirements Updated**:
- FR-036a: Shared session support (new)
- FR-036b: Real-time scan progress display (new)
- FR-036c: Session ownership and closure (new)
- FR-037: User attribution in scans (modified)

---

### Q5: Custom Field Schema Evolution

**Category**: Data Model - Schema Evolution

**Question**: How should custom field schema changes be handled (deleting fields, changing types, adding required fields)?

**Answer**: Use permissive with warnings approach. Deleting fields: show warning with count of affected assets, allow deletion, data is soft-deleted (retained but hidden). Changing field types: prevent if incompatible (e.g., Text→Number with non-numeric data), allow with validation warning otherwise. Adding required fields to categories with existing assets: allow but existing assets get null value, show banner prompting bulk update. Renaming fields: allow freely (internal field ID remains constant, only display name changes).

**Impact**:
- Phase 4 (Custom Categories and Fields) implementation
- Data migration strategy
- Validation and warning UI

**Functional Requirements Updated**:
- FR-012a: Custom field deletion with warnings (new)
- FR-012b: Field type change validation (new)
- FR-012c: Adding required fields to existing categories (new)
- FR-012d: Field renaming (new)

---

### Q6: Asset Location Management

**Category**: UX Flow - Data Entry

**Question**: How should asset locations be managed and entered?

**Answer**: Locations should be pre-defined and managed in a dedicated settings menu (similar to asset prefix configuration). When entering an asset's location field, provide searchable autocomplete from existing locations with option to create new location inline if not found. This ensures consistency while allowing flexibility.

**Impact**:
- Phase 12 (System Configuration) - settings implementation
- Phase 3/4 (Asset Management) - location field UI
- Location consistency and data quality

**Functional Requirements Updated**:
- FR-007b: Location management interface in settings (new)
- FR-007c: Searchable autocomplete for location field (new)
- FR-007d: Inline location creation (new)

---

## Specification Updates Summary

### Files Modified
- `spec.md`: Updated with Session 2025-10-20 clarifications and 16 new/modified functional requirements

### Functional Requirements Added/Modified

**New Requirements**: 16
- FR-029b, FR-029c (booking approval)
- FR-045a, FR-045b (photo storage)
- FR-026a, FR-026b (kit allocation)
- FR-036a, FR-036b, FR-036c (stock take collaboration)
- FR-012a, FR-012b, FR-012c, FR-012d (schema evolution)
- FR-007b, FR-007c, FR-007d (location management)

**Modified Requirements**: 4
- FR-026 (kit validation)
- FR-029a (approval permissions)
- FR-037 (scan attribution)
- FR-045 (photo upload)

### Total Requirements: 74
- Original: 61 FRs
- Session 2025-10-19 additions: 10 FRs (FR-007a, FR-062-070)
- Session 2025-10-20 additions: 16 FRs
- Total: 61 + 10 + 16 - 4 (modified, not added) = 74 FRs

---

## Tasks Impacted

### New Tasks Required

None - all clarifications refine existing task implementations.

### Tasks with Implementation Changes

**Phase 4** (User Story 2 - Custom Fields):
- T068-T075: Add schema evolution warnings and validation

**Phase 7** (User Story 5 - Booking):
- T105-T128a: Implement runtime permission checking
- T122: Clarify approval workflow specifics

**Phase 8** (User Story 6 - Kits):
- T129-T146: Implement lazy allocation logic

**Phase 9** (User Story 7 - Stock Take):
- T147-T166: Add real-time collaboration features

**Phase 10** (User Story 8 - Maintenance):
- T172a: Implement base64 photo storage with compression

**Phase 12** (Polish & System Configuration):
- T227a-T227c: Add location management to settings page
  - T227a: Update SettingsPage with location management tab
  - T227b: Create LocationSettings component (similar to AssetPrefixSettings)
  - T227c: Update location field in AssetForm with searchable autocomplete + inline creation

### Estimated Additional Effort

**Total**: +12-16 hours across affected phases

- Phase 4: +2 hours (schema evolution warnings)
- Phase 7: +2 hours (permission checking refactor)
- Phase 8: +2 hours (lazy allocation)
- Phase 9: +4 hours (real-time collaboration UI)
- Phase 10: +2 hours (photo compression implementation)
- Phase 12: +2-4 hours (location management UI)

---

## Design Principles Established

### 1. **Extensibility Over Optimization**
- Runtime permission checks (not cached)
- Replaceable photo storage layer
- Designed for future ChurchTools API improvements

### 2. **Collaboration First**
- Shared stock take sessions with multi-user support
- Real-time updates with user attribution
- Clear session ownership model

### 3. **User-Friendly Constraints**
- Permissive schema changes with warnings
- Inline data creation (locations)
- Searchable autocomplete for consistency

### 4. **Lazy Resource Allocation**
- Kit assets allocated at approval, not creation
- Validates availability without locking resources
- Manual administrator control when needed

---

## Quality Metrics

### Specification Completeness

✅ **All questions answered**: 6 of 6  
✅ **No remaining [NEEDS CLARIFICATION] markers**: 0  
✅ **All functional requirements testable**: Yes  
✅ **Success criteria technology-agnostic**: Yes  
✅ **Edge cases identified**: Yes (FR-062-070 from previous session)

### Coverage by Taxonomy

| Category | Status |
|----------|--------|
| Functional Scope | ✅ Complete |
| Data Model | ✅ Complete |
| UX Flow | ✅ Complete |
| Non-Functional | ✅ Complete |
| Integration | ✅ Complete |
| Edge Cases | ✅ Complete |
| Constraints | ✅ Complete |
| Terminology | ✅ Complete |
| Completion Signals | ✅ Complete |

---

## Recommendations

### Immediate Next Steps

1. ✅ **Review all Session 2025-10-20 clarifications** in spec.md
2. 🔄 **Continue Phase 5**: Address 13 bugs from BUG_FIX_PLAN.md (58 hours estimated)
3. 📋 **Plan Phase 12 updates**: Add location management tasks to T227a-c

### Implementation Priorities

**High Priority** (affects multiple phases):
- Runtime permission checking architecture (Phase 7)
- Location management UI (Phase 12, used by Phases 3-10)
- Photo compression utilities (Phase 10)

**Medium Priority** (phase-specific):
- Real-time collaboration features (Phase 9)
- Lazy kit allocation (Phase 8)
- Schema evolution warnings (Phase 4)

### Long-Term Considerations

- **ChurchTools API Evolution**: Monitor for:
  - Granular extension permissions
  - Native file storage access
  - WebSocket support for real-time features

- **Performance Optimization**:
  - Base64 photo storage is temporary - plan migration when Files API available
  - Real-time collaboration may require WebSocket or polling strategy

- **Data Migration**:
  - Schema evolution design supports long-term system maintenance
  - Soft-delete approach preserves data integrity

---

## Session Statistics

**Duration**: Single clarification session  
**Questions Asked**: 6  
**Questions Answered**: 6  
**Functional Requirements Added**: 16  
**Functional Requirements Modified**: 4  
**Tasks Impacted**: 6 phases  
**Additional Effort**: +12-16 hours  
**Specification Version**: Updated to include comprehensive Session 2025-10-20 clarifications

---

## Approval & Sign-Off

**Specification Status**: ✅ Ready for implementation  
**Next Phase**: Phase 5 (Bug Fixes) or continue with Phase 6-12 implementation  
**Validated By**: Clarification process completed successfully  
**Date**: October 20, 2025

---

**Document Version**: 1.0  
**Last Updated**: October 20, 2025  
**Related Documents**:
- `spec.md` - Feature specification with all clarifications
- `tasks.md` - Implementation task breakdown (271 tasks)
- `plan.md` - Implementation plan with architecture
- `BUG_FIX_PLAN.md` - Phase 5 bug fixes (13 issues)
