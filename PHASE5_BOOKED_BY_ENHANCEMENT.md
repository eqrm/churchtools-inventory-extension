# Phase 5 Enhancement: Advanced "Booked By" Override

## Overview
Added an optional feature to allow users (especially admins) to change the "Booked By" person when creating bookings. This enables scenarios where:
- An admin creates a booking on behalf of someone who requested it (phone call, email request)
- A team lead books equipment for their team member
- A secretary creates bookings for multiple people

## Implementation

### UI/UX Design

#### Default Mode (Normal Users)
```
┌─────────────────────────────────────────┐
│ Booking For: [🧑 Select person...]      │
└─────────────────────────────────────────┘

Booked by: 🧑 Current User
└─ Book on behalf of someone else (link)
```

#### Advanced Mode (When Activated)
```
┌─────────────────────────────────────────┐
│ Booking For: [🧑 Select person...]      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Booked By (Advanced):                   │
│ [🧑 Select who requested this...]       │
└─────────────────────────────────────────┘
└─ Use my account instead (link)
```

### Features

1. **Two-State Toggle**
   - Default: Shows "Booked by" as current user with avatar
   - Advanced: Shows PersonPicker to select different person

2. **Easy Activation**
   - Click "Book on behalf of someone else" link
   - Switches to PersonPicker mode

3. **Easy Reset**
   - Click "Use my account instead" link
   - Returns to default (current user)

4. **Full Person Search**
   - Same PersonPicker component used for "Booking For"
   - Search with autocomplete and debouncing
   - Shows avatar and name

5. **Backward Compatibility**
   - Updates both new fields (`bookedById`, `bookedByName`)
   - Updates deprecated fields (`requestedBy`, `requestedByName`)
   - Works with existing booking data

### Technical Implementation

#### State Management
```typescript
// Toggle between display and picker
const [showBookedByPicker, setShowBookedByPicker] = useState(false)

// Store selected "booked by" person
const [bookedByPerson, setBookedByPerson] = useState<PersonSearchResult | null>(
  booking && booking.bookedById !== currentUser?.id ? {
    // Load existing if different from current user
    ...
  } : null
)
```

#### Default View (Current User)
```tsx
<Stack gap="xs">
  <Group gap="xs">
    <Text size="sm" fw={500}>Booked by:</Text>
    <PersonDisplay 
      personId={form.values.bookedById} 
      personName={form.values.bookedByName} 
      size="sm" 
      textSize="sm"
    />
  </Group>
  <Text 
    size="xs" 
    c="dimmed" 
    style={{ cursor: 'pointer', textDecoration: 'underline' }}
    onClick={() => setShowBookedByPicker(true)}
  >
    Book on behalf of someone else
  </Text>
</Stack>
```

#### Advanced View (Person Picker)
```tsx
<Stack gap="xs">
  <PersonPicker
    label="Booked By (Advanced)"
    placeholder="Search for person who requested this booking..."
    value={bookedByPerson}
    onChange={(person) => {
      setBookedByPerson(person)
      if (person) {
        // Update all relevant fields
        form.setFieldValue('bookedById', person.id)
        form.setFieldValue('bookedByName', person.displayName)
        form.setFieldValue('requestedBy', person.id)
        form.setFieldValue('requestedByName', person.displayName)
      } else {
        // Reset to current user
        ...
      }
    }}
  />
  <Text 
    size="xs" 
    c="dimmed" 
    style={{ cursor: 'pointer', textDecoration: 'underline' }}
    onClick={() => {
      setShowBookedByPicker(false)
      // Reset to current user
      ...
    }}
  >
    Use my account instead
  </Text>
</Stack>
```

### Use Cases

#### Use Case 1: Admin Creates Booking from Phone Request
1. User calls: "Can you book the projector for me next week?"
2. Admin opens booking form
3. Admin selects user in "Booking For" field
4. Admin clicks "Book on behalf of someone else"
5. Admin searches for and selects the user in "Booked By" field
6. Result: Both "Booked By" and "Booking For" show the requesting user
7. Booking history correctly shows who requested it

#### Use Case 2: Self-Service Booking
1. User opens booking form
2. User selects themselves in "Booking For" field
3. "Booked By" defaults to current user
4. Result: Simple self-booking flow (default behavior)

#### Use Case 3: Team Lead Books for Team Member
1. Team lead opens booking form
2. Team lead selects team member in "Booking For" field
3. "Booked By" shows team lead
4. Result: Clear audit trail - team lead booked equipment for team member

#### Use Case 4: Secretary Books for Multiple People
1. Secretary receives multiple booking requests via email
2. For each request:
   - Select recipient in "Booking For"
   - Click "Book on behalf of someone else"
   - Select original requester in "Booked By"
3. Result: Each booking shows correct requester and recipient

### Benefits

1. **Flexibility**
   - Supports both self-service and admin-assisted bookings
   - Handles various organizational workflows

2. **Audit Trail**
   - Clear record of who requested booking
   - Clear record of who will use equipment
   - Tracks who actually created the booking (via system audit)

3. **Progressive Disclosure**
   - Default: Simple, clean interface for most users
   - Advanced: Additional control when needed
   - No UI clutter for common use case

4. **Discoverability**
   - Clear link text: "Book on behalf of someone else"
   - Easy to undo: "Use my account instead"
   - No hidden features or complex menus

5. **Consistency**
   - Uses same PersonPicker component
   - Same search and selection experience
   - Familiar UI patterns

### Data Flow

```
Default Mode:
  User opens form
    → bookedById = currentUser.id
    → bookedByName = currentUser.displayName
    → PersonDisplay shows current user

Advanced Mode (Activated):
  User clicks "Book on behalf of..."
    → showBookedByPicker = true
    → PersonPicker appears
    → User searches and selects person
    → bookedById = selected person.id
    → bookedByName = selected person.displayName
    → requestedBy/requestedByName also updated (backward compat)

Reset to Default:
  User clicks "Use my account instead"
    → showBookedByPicker = false
    → bookedByPerson = null
    → bookedById = currentUser.id
    → bookedByName = currentUser.displayName
```

### Editing Existing Bookings

When editing a booking:
- If `bookedById` === current user: Shows default mode
- If `bookedById` !== current user: Automatically shows advanced mode with person selected
- Preserves existing "Booked By" person
- Can switch to default mode if needed

### Security Considerations

**Current Implementation**:
- All users can use this feature
- Per spec clarification Q2: All users allowed to book for others
- No permission restrictions currently

**Future Enhancement**:
When ChurchTools adds granular permissions:
```typescript
// Check if user has permission to override "Booked By"
const canOverrideBookedBy = await permissionService.canBookOnBehalfOfOthers()

// Show/hide link based on permission
{canOverrideBookedBy && (
  <Text onClick={() => setShowBookedByPicker(true)}>
    Book on behalf of someone else
  </Text>
)}
```

### Visual Design

**Link Styling**:
- Color: Dimmed (subtle, not primary action)
- Size: Extra small (xs)
- Cursor: Pointer
- Text decoration: Underline (indicates clickable)

**PersonPicker Label**:
- "Booked By (Advanced)" - Indicates optional/advanced feature
- Helps users understand this is not typically changed

### Testing Scenarios

1. **Default Behavior**
   - ✅ Opens with current user as "Booked By"
   - ✅ Shows PersonDisplay with avatar
   - ✅ Shows "Book on behalf of..." link

2. **Advanced Mode Activation**
   - ✅ Click link switches to PersonPicker
   - ✅ PersonPicker works correctly
   - ✅ Shows "Use my account instead" link

3. **Person Selection**
   - ✅ Search finds persons
   - ✅ Select updates form values
   - ✅ Avatar + name display correctly
   - ✅ Both new and deprecated fields updated

4. **Reset to Default**
   - ✅ Click link returns to default mode
   - ✅ Current user restored
   - ✅ Form values reset correctly

5. **Editing Existing Booking**
   - ✅ If bookedBy is current user: Default mode
   - ✅ If bookedBy is different: Advanced mode with person loaded
   - ✅ Can switch modes while editing

6. **Form Submission**
   - ✅ Correct person IDs saved
   - ✅ Backward compatible fields saved
   - ✅ Booking history shows correct data

## Files Modified

- `src/components/bookings/BookingForm.tsx`
  - Added `showBookedByPicker` state
  - Added `bookedByPerson` state
  - Added conditional render for default/advanced mode
  - Added toggle links
  - Updated form field logic

## Related Features

This enhancement complements:
- Phase 4: Person search and selection
- Phase 5: Dual person tracking (booker + recipient)
- Future: Permission system integration

## Documentation

Users should be informed:
- Default: Booking records you as the person who created it
- Advanced: Use "Book on behalf of..." to record the actual requester
- Use cases: Phone requests, email requests, team bookings

## Future Enhancements

1. **Permission Control**: Restrict to admins only
2. **Quick Presets**: "Book for my team" quick action
3. **Bulk Booking**: Create multiple bookings with different bookers
4. **Delegation**: Set default delegate for automated switching
5. **Notification**: Different notifications based on booker vs recipient

---

**Status**: ✅ **IMPLEMENTED**  
**Phase**: 5 Enhancement  
**Priority**: Medium (Nice-to-have, not blocking)  
**User Benefit**: Flexibility for various booking workflows
