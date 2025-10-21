# T103: Child Asset Independence Rules

## Overview
Child assets inherit certain properties from their parent during creation but maintain independence for operational properties. This document defines which properties are inherited vs independent.

## Property Classification

### Inherited Properties (Copied from Parent at Creation)
These properties are copied from the parent asset when children are created. They can later be updated independently on each child, or bulk-updated using the "Propagate Properties" feature.

- **`category`** - Equipment category (e.g., "Projectors", "Microphones")
- **`manufacturer`** - Equipment manufacturer
- **`model`** - Model number or name
- **`description`** - General description
- **`customFieldValues`** - All custom field values defined by the category

### Independent Properties (Child-Specific)
These properties are NOT inherited and can differ between parent and children. Each child manages these independently:

- **`status`** - Operational status
  - Parent can be "available" while some children are "in-use" or "broken"
  - Enables tracking individual unit condition and availability
  - Bulk update available via "Update All Status" action

- **`location`** - Current physical location
  - Children can be stored or deployed in different locations
  - Enables distributed inventory management
  - Example: 10 microphones, 5 in "Main Hall", 3 in "Youth Room", 2 "In Storage"

- **`inUseBy`** - Current user/borrower
  - Each child can be assigned to different people
  - Enables simultaneous bookings of different units
  - Example: Multiple projectors booked by different event coordinators

- **`barcode`** & **`qrCode`** - Unique identifiers
  - Each child has its own barcode for individual tracking
  - Generated sequentially during multi-asset creation

- **`assetNumber`** - Unique asset number
  - Sequential numbering (e.g., CHT-001, CHT-002, CHT-003)
  - Immutable identifier for each unit

### Relationship Properties (System-Managed)
These properties define the parent-child relationship and are managed by the system:

- **`isParent`** - Boolean flag (true for parent, false for children)
- **`parentAssetId`** - UUID reference to parent (only on children)
- **`childAssetIds`** - Array of child UUIDs (only on parent)

### Audit Properties (System-Generated)
Standard audit fields maintained independently for each asset:

- **`createdBy`**, **`createdByName`**, **`createdAt`**
- **`lastModifiedBy`**, **`lastModifiedByName`**, **`lastModifiedAt`**

## Business Rules

### Creation
1. When creating a parent with N children:
   - Parent is created first with `isParent: true`
   - N children are created with inherited properties
   - Sequential asset numbers are assigned
   - Each child gets unique barcode/QR code
   - All children reference parent via `parentAssetId`
   - Parent stores all child IDs in `childAssetIds` array

### Updates
1. **Individual Child Updates**: Any property can be updated on individual children
2. **Bulk Status Update**: Update status on all children simultaneously
3. **Property Propagation**: Selectively copy properties from parent to all children
4. **Parent Updates**: Updating parent properties does NOT automatically update children

### Deletion
1. **Parent Deletion**: Blocked if children exist
   - User must delete all children first OR
   - Future enhancement: Option to delete parent and all children together
2. **Child Deletion**: Allowed independently
   - Child is removed from parent's `childAssetIds` array

### Booking (Future)
1. Each child can have independent bookings
2. Parent availability = aggregate of children's availability
3. Booking conflicts checked per individual child

## UI Indicators

### Asset List
- **Parent Icon**: Blue icon with badge showing child count
- **Child Icon**: Gray up-arrow indicating parent relationship
- **Indent**: Child asset numbers indented for visual hierarchy

### Asset Detail
- **Parent View**: 
  - "Child Assets" card with count and status summary
  - Actions menu with "Update All Status" and "Propagate Properties"
  - List of all children with click navigation
  
- **Child View**:
  - "Parent Asset" card at top linking to parent
  - Shows parent name and asset number

## Examples

### Example 1: Audio Equipment Set
**Parent**: "Wireless Microphone System" (CHT-100)
- Category: Microphones
- Manufacturer: Shure
- Model: BLX4R-H10
- Description: 4-channel wireless mic receiver

**Children** (4 units):
- CHT-101: Status "available", Location "Main Hall"
- CHT-102: Status "in-use", Location "Youth Room", InUseBy "John Smith"
- CHT-103: Status "available", Location "Storage"
- CHT-104: Status "broken", Location "Repair Shop"

### Example 2: Projector Pool
**Parent**: "HD Projector Pool" (CHT-200)
- Category: Video Equipment
- Manufacturer: Epson
- Model: PowerLite L615U

**Children** (3 units):
- CHT-201: Status "in-use", Location "Sanctuary", InUseBy "Event Team"
- CHT-202: Status "available", Location "Conference Room A"
- CHT-203: Status "installed", Location "Lobby"

## Migration Notes

### Existing Assets
- Existing single assets continue to work as before
- No automatic conversion to parent-child structure
- Users can manually create new parent-child sets for bulk equipment

### Data Integrity
- Parent-child relationships enforced via foreign keys
- Orphaned children (parent deleted externally) should be handled gracefully
- System should validate childAssetIds array matches actual children

## Future Enhancements

1. **Bulk Operations**:
   - Bulk location update
   - Bulk custom field update
   - Select specific children for bulk operations

2. **Smart Propagation**:
   - Option to "always propagate" certain fields
   - Undo propagation
   - Propagation history

3. **Relationship Management**:
   - Convert existing assets to children
   - Move child to different parent
   - Split parent into multiple parents
   - Promote child to standalone asset

4. **Reporting**:
   - Parent-child usage statistics
   - Availability reports by parent
   - Maintenance schedules for child groups
