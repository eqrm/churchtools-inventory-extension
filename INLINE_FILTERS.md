# Inline Column Filters & Sorting (Notion-Style)

## Overview

The inventory table now features **inline filter and sort menus** similar to Notion's interface. Users can click on any column header to access sorting and filtering options in a clean popup menu.

## Features

### 🎯 Click-to-Filter
- Click any column header to open a popup menu
- Visual indicators show active filters (blue badge with count)
- Click outside to close the popup

### ⬆️⬇️ Sorting
Available on all columns:
- **Sort Ascending** (A→Z, 0→9, oldest→newest)
- **Sort Descending** (Z→A, 9→0, newest→oldest)
- Active sort shown with ▲ or ▼ indicator

### 🔍 Filtering
Available on these columns:
- **Manufacturer** - Filter by specific manufacturers
- **Model** - Filter by model names
- **Location** - Filter by storage locations
- **Status** - Filter by status (Available, Broken, etc.)
- **Assigned To** - Filter by person name

### Filter Features
- **Multi-select**: Check multiple values to show items matching any
- **Clear filter**: One-click to remove all filters for that column
- **Visual feedback**: Blue badge shows number of active filters
- **Smart options**: Only shows values that exist in your data

## Usage

### To Sort:
1. Click on any column header
2. Select "↑ Sort ascending" or "↓ Sort descending"
3. Table updates immediately

### To Filter:
1. Click on a filterable column (Manufacturer, Model, Location, Status, Assigned To)
2. Check the boxes for values you want to see
3. Table filters in real-time as you check/uncheck
4. Click "✕ Clear filter" to remove all filters for that column

### Multiple Filters:
- You can filter by multiple columns at once
- Items must match ALL active filters (AND logic)
- Within a column, items match ANY checked value (OR logic)

## Example Workflows

### Find Available Cameras
1. Click "Status" header
2. Check "Available"
3. Click "Manufacturer" header  
4. Check "Canon" and "Sony"
→ Shows all available Canon or Sony items

### See What's Assigned to a Person
1. Click "Assigned To" header
2. Check the person's name
→ Shows everything assigned to them

### Items in Storage Room A
1. Click "Location" header
2. Check "Storage Room A"
→ Shows all items in that location

## UI Design

### Popup Menu Style
- Clean white background with subtle shadow
- Hover effects on all interactive elements
- Organized sections: SORT and FILTER
- Scrollable if many filter options
- Positioned directly below the column header

### Visual Indicators
- **Sort arrow**: ▲ ascending, ▼ descending
- **Filter badge**: Blue circle with count (e.g., "2" means 2 filters active)
- **Checkbox state**: Checked = included in filter

## Technical Implementation

### State Management
```typescript
let currentSort: { column: SortColumn; direction: SortDirection }
let filters: Record<string, Set<string>>
```

### Popup Lifecycle
1. Click header → Create popup
2. Position below header
3. Add click-outside listener
4. User interacts → Update state → Re-render table
5. Click outside or select action → Close popup

### Performance
- Filters and sorts run on each change
- Efficient Set-based filtering
- Only re-renders table rows, not entire component

## Customization

To add filtering to a new column:
1. Set `filterable: true` in column definition
2. Add case in filter value extraction switch
3. That's it! The popup system handles the rest

To add a new sort column:
1. Add to `SortColumn` type
2. Add case in sort comparison switch
3. Column automatically gets sort menu

## Future Enhancements
- [ ] Search within filter options
- [ ] "Select all" / "Deselect all" for filters
- [ ] Save filter presets
- [ ] Export filtered view
- [ ] Advanced filters (date ranges, numeric comparisons)
- [ ] Keyboard shortcuts (Esc to close, Arrow keys to navigate)
