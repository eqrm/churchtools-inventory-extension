# Change History UX Improvements

**Date**: 2025-10-20  
**Enhancement**: Visual improvements to change history display  
**User Request**: "Show only actual changes, highlight old vs new values, highlight the date"

## What Changed

### Before
- Timeline showed full sentences like: "2025-10-20 14:30 Jane Doe changed status from 'available' to 'in-use' and location from 'Office' to 'Warehouse'"
- All information was inline in the title
- Hard to distinguish old vs new values
- Date was part of the text flow

### After
- **Date is highlighted** in a badge (gray badge at the start)
- **Action description** is concise: "Jane Doe changed status and location"
- **Only changed values shown** below the main text in a clean format:
  - Field name on the left (dimmed text)
  - Old value in **red badge** (what it was before)
  - Arrow separator `→`
  - New value in **green badge** (what it is now)
- Empty values shown as "(empty)" instead of blank

## Visual Structure

```
🔵 [2025-10-20 14:30] Jane Doe changed status and location
     status:     [available] → [in-use]
     location:   [Office]    → [Warehouse]

🔵 [2025-10-20 15:00] John Smith changed description
     description: [(empty)] → [New description text]
```

## Implementation Details

### Files Modified

1. **src/utils/historyFormatters.ts**
   - Changed `formatChangeEntry()` return type from `string` to `FormattedHistoryEntry`
   - Returns structured data: `{ text, date, user, action, changes }`
   - Removed verbose old/new value text from main description
   - Added `formatFieldChangesList()` to list only field names
   - Exported `formatFieldName()` for component use

2. **src/components/assets/ChangeHistoryList.tsx**
   - Date displayed in a **Badge** component (gray, light variant)
   - Old values in **red badges** (light variant)
   - New values in **green badges** (light variant)
   - Arrow separator `→` between old and new
   - Field names left-aligned with 80px min-width
   - Changes displayed in a Stack below the main title
   - Only shows changes section when `formatted.changes` exists

### Color Coding

- **Date**: Gray badge (neutral, informational)
- **Old Value**: Red badge (removed/previous state)
- **New Value**: Green badge (added/current state)
- **Field Name**: Dimmed text (secondary information)
- **Arrow**: Dimmed text (separator)

### Benefits

1. **Scanability**: Date badges immediately show when changes occurred
2. **Clarity**: Red/green color coding makes it obvious what changed
3. **Conciseness**: Main text focuses on who and what, not the values
4. **Detail on Demand**: Expanded view below shows exact changes
5. **Empty Handling**: Clear indication of empty → value or value → empty changes

## User Experience Impact

### Before (Problems)
- Hard to scan dates quickly
- Old/new values mixed into long sentences
- Multiple changes created very long text
- No visual distinction between old and new values

### After (Solutions)
- ✅ Dates are visually prominent badges
- ✅ Old/new values clearly separated and color-coded
- ✅ Multiple changes displayed in clean rows
- ✅ Red = old, Green = new (universal pattern)
- ✅ Easy to scan and understand at a glance

## Examples

### Single Field Change
```
[2025-10-20 14:30] Jane Doe changed status
  status: [available] → [in-use]
```

### Multiple Field Changes
```
[2025-10-20 15:45] John Smith changed name, status, and location
  name:     [Old Name]    → [New Name]
  status:   [available]   → [in-use]
  location: [Office]      → [Warehouse]
```

### Creation/Deletion (No Changes Shown)
```
[2025-10-20 10:00] Jane Doe created this asset
```

### Empty to Value
```
[2025-10-20 16:00] Jane Doe changed description
  description: [(empty)] → [Added description]
```

## Technical Notes

- Uses Mantine `Badge` component for visual consistency
- Color scheme matches ChurchTools theme
- Responsive layout with `wrap="nowrap"` for field rows
- Accessible with proper color contrast (light variants)
- Works with all change types (created, updated, deleted, etc.)

## Future Enhancements (Optional)

- [ ] Add tooltips showing exact timestamp on date hover
- [ ] Add expand/collapse for entries with many changes
- [ ] Add diff highlighting for long text values
- [ ] Add icons for different action types (create, update, delete)
- [ ] Add filtering by field name or action type

## Testing

**Manual Testing Required**:
1. Create an asset
2. Update multiple fields
3. View History tab in AssetDetail
4. Verify:
   - Date is in a gray badge
   - Old values are in red badges
   - New values are in green badges
   - Arrow separator is visible
   - Field names are properly formatted
   - Empty values show as "(empty)"

## Conclusion

The change history is now much more scannable and user-friendly. The visual improvements make it easy to:
- Quickly scan when changes occurred (date badges)
- Understand what changed (field names)
- See exactly what was changed (red → green badges)
- Distinguish multiple changes in one update

This completes the UX improvements for readable change history! 🎉
