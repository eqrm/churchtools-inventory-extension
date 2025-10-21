# Change History: Filter Non-Changes

**Date**: 2025-10-20  
**Issue**: Change history showing "changes" where nothing actually changed  
**User Report**: Entries like `{}` → `{}` or identical category objects appearing as changes

## Problem Analysis

### Examples of False Changes

```
Peter Pretix changed customFieldValues
custom fields: {} → {}

Peter Pretix changed category
category: {"id":"323","name":"test2","icon":null} → {"id":"323","name":"test2"}
```

### Root Causes

1. **Reference Comparison**: Using `!==` to compare objects compared references, not values
2. **JSON Formatting**: Objects with `null` vs missing properties treated as different
3. **Key Order**: JSON stringification with different key orders looked different
4. **Empty Objects**: Empty `{}` arrays/objects treated as changes

## Solution Implemented

### 1. Deep Equality Check (`valuesAreEqual`)

```typescript
private valuesAreEqual(a: unknown, b: unknown): boolean {
  // Handles:
  // - Primitives (===)
  // - null/undefined
  // - Arrays (recursive element comparison)
  // - Objects (recursive property comparison, ignoring null/undefined)
}
```

**Features**:
- Recursive comparison for nested objects/arrays
- Filters out `null` and `undefined` properties before comparing
- Handles different object key orders
- Type-safe comparison

### 2. Clean Object Display (`cleanObjectForDisplay`)

```typescript
private cleanObjectForDisplay(obj: unknown): unknown {
  // Removes null/undefined values
  // Recursively cleans nested objects
  // Returns undefined for empty results
}
```

**Purpose**: Normalize objects before formatting to avoid showing meaningless differences

### 3. Enhanced Field Formatting (`formatFieldValue`)

```typescript
private formatFieldValue(value: unknown): string {
  // Special handling for:
  // - Person references → show name only
  // - Category objects → show name only
  // - Empty objects/arrays → return ''
  // - Complex objects → clean then JSON.stringify
}
```

**Improvements**:
- Category objects show just the name instead of full JSON
- Empty `{}` or `[]` returns empty string
- Removes null/undefined before stringifying

### 4. Two-Stage Filtering

```typescript
// Stage 1: Deep comparison
if (!this.valuesAreEqual(oldValue, newValue)) {
  // Stage 2: Formatted comparison
  const formattedOld = this.formatFieldValue(oldValue);
  const formattedNew = this.formatFieldValue(newValue);
  
  if (formattedOld !== formattedNew) {
    // Only NOW record the change
    changes.push({ field, oldValue: formattedOld, newValue: formattedNew });
  }
}
```

**Why Two Stages?**
- Stage 1 catches reference differences (like `{} !== {}`)
- Stage 2 ensures display strings are actually different
- Prevents recording changes that would look identical to users

## Examples of Fixed Behavior

### Before
```
Peter Pretix changed customFieldValues
custom fields: {} → {}
```

### After
```
(No entry recorded - no actual change)
```

---

### Before
```
Peter Pretix changed category
category: {"id":"323","name":"test2","icon":null} → {"id":"323","name":"test2"}
```

### After
```
(No entry recorded - icon:null vs missing icon is not a meaningful change)
```

---

### Before (Actual Change)
```
Peter Pretix changed category
category: {"id":"323","name":"test2"} → {"id":"324","name":"test3"}
```

### After (Shows Readable Format)
```
Peter Pretix changed category
category: test2 → test3
```

## Technical Details

### Files Modified

1. **src/services/storage/ChurchToolsProvider.ts**
   - Updated `recordAssetChanges()` with deep comparison
   - Updated `updateCategory()` change recording with deep comparison
   - Added `valuesAreEqual()` for recursive equality checking
   - Enhanced `formatFieldValue()` with smarter display logic
   - Added `cleanObjectForDisplay()` to normalize objects

### Object Comparison Strategy

**Null/Undefined Handling**:
```typescript
// These are considered EQUAL:
{ icon: null }  ===  {}
{ icon: undefined }  ===  {}

// Only non-null properties matter:
{ name: "test", icon: null }  ===  { name: "test" }
```

**Array Comparison**:
```typescript
// Element-by-element comparison:
[1, 2, 3]  ===  [1, 2, 3]
[1, 2]  !==  [1, 2, 3]
[{id: 1}]  ===  [{id: 1}]
```

**Nested Objects**:
```typescript
// Recursive deep comparison:
{ a: { b: { c: 1 } } }  ===  { a: { b: { c: 1 } } }
```

## Benefits

1. **Cleaner History** ✅
   - No more false-positive change entries
   - Only meaningful changes recorded

2. **Better Performance** ✅
   - Fewer database writes (no empty changes)
   - Smaller change history data

3. **User Experience** ✅
   - Users see only real changes
   - Reduced confusion and clutter
   - More trustworthy audit trail

4. **Accurate Auditing** ✅
   - Change history truly reflects what changed
   - Empty object changes filtered out
   - Null vs missing property treated as same

## Edge Cases Handled

### Empty Custom Fields
```typescript
customFieldValues: {}  // No change recorded
customFieldValues: { field1: "value" }  // Change recorded
```

### Category Icon Changes
```typescript
// These are treated as NO CHANGE:
{ icon: null } → { }
{ icon: undefined } → { }

// This IS a change:
{ icon: "icon1" } → { icon: "icon2" }
```

### Custom Field Arrays
```typescript
// NO CHANGE:
[] → []
[{}, {}] → []  // Empty objects removed

// CHANGE:
[{field: "A"}] → [{field: "B"}]
```

## Testing Recommendations

**Manual Test Cases**:

1. **Update with No Real Change**:
   - Edit asset, change nothing, save
   - Expected: No history entry

2. **Update Empty Custom Fields**:
   - Asset with no custom fields
   - Save without changes
   - Expected: No history entry

3. **Category Update (Icon Null)**:
   - Category with `icon: null`
   - Update name only
   - Expected: Only name change shown

4. **Actual Changes**:
   - Change status: available → in-use
   - Expected: Single history entry with status change

5. **Multiple Changes**:
   - Change status AND location
   - Expected: One history entry with both changes listed

## Future Enhancements (Optional)

- [ ] Add diff highlighting for long text field changes
- [ ] Show array additions/removals separately (+ added, - removed)
- [ ] Track field renames vs value changes
- [ ] Add change impact indicators (minor, major, critical)

## Conclusion

The change history now accurately reflects **actual changes** to data, filtering out:
- Empty object "changes"
- Null vs undefined differences
- Object key order variations
- Reference changes with identical values

This provides a much cleaner, more trustworthy audit trail for users! 🎯
