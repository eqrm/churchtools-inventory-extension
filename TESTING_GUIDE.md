# MVP Testing Guide - User Stories 1 & 2

**Version**: 1.0  
**Date**: October 20, 2025  
**Status**: Ready for Testing  
**Branch**: `001-inventory-management`

---

## 🎯 Testing Objectives

Validate that the MVP (User Stories 1 & 2) is production-ready by testing:
1. **Category Management** - Create, edit, delete categories with custom fields
2. **Asset Management** - Create, edit, delete assets with validation
3. **Custom Field Validation** - Verify all field types work correctly
4. **Data Integrity** - Ensure system prevents invalid operations
5. **Change History** - Verify audit trail is complete
6. **User Experience** - Confirm UI is intuitive and error-free

---

## 🔧 Prerequisites

### Environment Setup
```bash
# 1. Ensure you're on the correct branch
git checkout 001-inventory-management

# 2. Install dependencies (if not already done)
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your ChurchTools credentials:
# - VITE_BASE_URL=https://your-church.church.tools
# - VITE_USERNAME=your-username
# - VITE_PASSWORD=your-password
# - VITE_KEY=your-api-key
# - VITE_MODULE_ID=your-module-id

# 4. Start development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:5173
```

### Test Data Preparation
- Have ChurchTools credentials ready
- Access to a test ChurchTools instance (don't test on production!)
- Note the custom module ID you'll be using

---

## ✅ Test Scenarios

## Scenario 1: Category Management

### Test 1.1: Create Basic Category
**Objective**: Verify basic category creation works

**Steps**:
1. Navigate to Categories page
2. Click "New Category" button
3. Enter category name: "Audio Equipment"
4. Click "Save"

**Expected Results**:
- ✅ Category appears in categories list
- ✅ Green success notification appears
- ✅ Category has unique ID
- ✅ Creation timestamp recorded

**Pass/Fail**: Pass

---

### Test 1.2: Create Category with Custom Fields
**Objective**: Verify custom field definitions work

**Steps**:
1. Click "New Category"
2. Enter name: ""
3. Add custom field:
   - Name: "Wattage"
   - Type: Number
   - Required: Yes
   - Min: 10
   - Max: 5000
4. Add custom field:
   - Name: "DMX Address"
   - Type: Text
   - Required: No
   - Min Length: 3
   - Max Length: 10
5. Add custom field:
   - Name: "Manual URL"
   - Type: URL
   - Required: No
6. Click "Save"

**Expected Results**:
- ✅ Category created successfully
- ✅ All 3 custom fields saved
- ✅ Validation rules saved correctly
- ✅ Fields appear when creating assets in this category

**Pass/Fail**: Pass

---

### Test 1.3: Edit Category
**Objective**: Verify category editing works

**Steps**:
1. Find "Audio Equipment" category
2. Click "Edit" button
3. Change name to "Audio & Sound Equipment"
4. Add new custom field: "Serial Number" (Text, Required)
5. Click "Save"

**Expected Results**:
- ✅ Category name updated
- ✅ New custom field added
- ✅ Existing data preserved
- ✅ Change recorded in history

**Pass/Fail**: Pass

---

### Test 1.4: Delete Empty Category
**Objective**: Verify deletion works when no assets exist

**Steps**:
1. Create new category: "Test Category"
2. Immediately try to delete it
3. Confirm deletion

**Expected Results**:
- ✅ Category deleted successfully
- ✅ No longer appears in list
- ✅ Deletion recorded in change history

**Pass/Fail**: Fail
chunk-NXESFFTV.js?v=ec25e372:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
ChurchToolsAPIClient.ts:66  POST https://eqrm.church.tools/api/custommodules/16/customdatacategories/284 405 (Method Not Allowed)
dispatchXhrRequest @ @churchtools_churchtools-client.js?v=ec25e372:1598
xhr @ @churchtools_churchtools-client.js?v=ec25e372:1478
dispatchRequest @ @churchtools_churchtools-client.js?v=ec25e372:1943
Promise.then
_request @ @churchtools_churchtools-client.js?v=ec25e372:2140
request @ @churchtools_churchtools-client.js?v=ec25e372:2049
httpMethod @ @churchtools_churchtools-client.js?v=ec25e372:2187
wrap @ @churchtools_churchtools-client.js?v=ec25e372:11
(anonymous) @ @churchtools_churchtools-client.js?v=ec25e372:4795
Promise.then
(anonymous) @ @churchtools_churchtools-client.js?v=ec25e372:4793
value @ @churchtools_churchtools-client.js?v=ec25e372:4689
(anonymous) @ @churchtools_churchtools-client.js?v=ec25e372:4788
value @ @churchtools_churchtools-client.js?v=ec25e372:4787
deleteRequest @ ChurchToolsAPIClient.ts:66
deleteDataCategory @ ChurchToolsAPIClient.ts:172
deleteCategory @ ChurchToolsProvider.ts:172
await in deleteCategory
mutationFn @ useCategories.ts:103
fn @ chunk-U7X4RYWR.js?v=ec25e372:1963
run @ chunk-U7X4RYWR.js?v=ec25e372:773
start @ chunk-U7X4RYWR.js?v=ec25e372:815
execute @ chunk-U7X4RYWR.js?v=ec25e372:2002
await in execute
mutate @ chunk-U7X4RYWR.js?v=ec25e372:2325
handleDelete @ AssetCategoryList.tsx:80
onClick @ AssetCategoryList.tsx:203
(anonymous) @ chunk-OY5PL3SJ.js?v=ec25e372:1136
callCallback2 @ chunk-NXESFFTV.js?v=ec25e372:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=ec25e372:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=ec25e372:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-NXESFFTV.js?v=ec25e372:3742
executeDispatch @ chunk-NXESFFTV.js?v=ec25e372:7046
processDispatchQueueItemsInOrder @ chunk-NXESFFTV.js?v=ec25e372:7066
processDispatchQueue @ chunk-NXESFFTV.js?v=ec25e372:7075
dispatchEventsForPlugins @ chunk-NXESFFTV.js?v=ec25e372:7083
(anonymous) @ chunk-NXESFFTV.js?v=ec25e372:7206
batchedUpdates$1 @ chunk-NXESFFTV.js?v=ec25e372:18966
batchedUpdates @ chunk-NXESFFTV.js?v=ec25e372:3585
dispatchEventForPluginEventSystem @ chunk-NXESFFTV.js?v=ec25e372:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NXESFFTV.js?v=ec25e372:5484
dispatchEvent @ chunk-NXESFFTV.js?v=ec25e372:5478
dispatchDiscreteEvent @ chunk-NXESFFTV.js?v=ec25e372:5455

---

### Test 1.5: Prevent Deletion of Category with Assets
**Objective**: Verify data integrity protection

**Steps**:
1. Create category: "Video Equipment"
2. Create 2 assets in that category (see Asset tests)
3. Try to delete "Video Equipment" category

**Expected Results**:
- ❌ Deletion prevented
- ✅ Error message shows: "Cannot delete category: 2 asset(s) are still using this category"
- ✅ Error suggests to delete or reassign assets
- ✅ Category remains in list

**Pass/Fail**: Pass

---

## Scenario 2: Asset Management

### Test 2.1: Create Asset with Required Fields
**Objective**: Verify basic asset creation

**Steps**:
1. Navigate to Assets page
2. Click "New Asset"
3. Fill in:
   - Name: "Shure SM58 Microphone"
   - Category: "Audio & Sound Equipment"
   - Status: "Available"
   - Serial Number: "SM58-001" (custom field, required)
4. Click "Save"

**Expected Results**:
- ✅ Asset created successfully
- ✅ Unique asset number generated (e.g., "SOUND-001")
- ✅ Barcode and QR code generated
- ✅ Creation timestamp and user recorded
- ✅ Change history entry created

**Pass/Fail**: Fail. There is only a rendered QR Code and no option to change it to a rendered barcode for an asset. 

---

### Test 2.2: Validation - Required Field Missing
**Objective**: Verify required field validation

**Steps**:
1. Click "New Asset"
2. Select category: "Lighting Equipment"
3. Enter Name: "LED Spotlight"
4. Leave "Wattage" field empty (required field)
5. Try to submit

**Expected Results**:
- ❌ Submission prevented
- ✅ Error message appears: "Wattage ist erforderlich"
- ✅ Error displayed in red under Wattage field
- ✅ Form focus moves to error field

**Pass/Fail**: Pass

---

### Test 2.3: Validation - Number Field Min/Max
**Objective**: Verify number validation rules

**Steps**:
1. Create asset in "Lighting Equipment" category
2. Enter Name: "LED Par Can"
3. Enter Wattage: 5 (below minimum of 10)
4. Try to submit
5. See error, change to 6000 (above maximum of 5000)
6. Try to submit
7. See error, change to 250
8. Submit

**Expected Results**:
- ❌ Wattage=5: Error "must be at least 10"
- ❌ Wattage=6000: Error "must be at most 5000"
- ✅ Wattage=250: Accepted and saved

**Pass/Fail**: Fail. It changes it to either 10 5000 with no error message.

---

### Test 2.4: Validation - Text Field Length
**Objective**: Verify text length validation

**Steps**:
1. Create asset in "Lighting Equipment" category
2. Enter Name: "Moving Head"
3. Enter Wattage: 500
4. Enter DMX Address: "AB" (below min length of 3)
5. Try to submit
6. Change to "ABCDEFGHIJK" (above max length of 10)
7. Try to submit
8. Change to "DMX-001"
9. Submit

**Expected Results**:
- ❌ "AB": Error "must be at least 3 characters"
- ❌ "ABCDEFGHIJK": Error "must be at most 10 characters"
- ✅ "DMX-001": Accepted and saved

**Pass/Fail**: Pass

---

### Test 2.5: Validation - URL Field
**Objective**: Verify URL validation

**Steps**:
1. Create asset in "Lighting Equipment" category
2. Enter required fields
3. Enter Manual URL: "not-a-url"
4. Try to submit
5. Change to "ftp://example.com"
6. Try to submit
7. Change to "https://example.com/manual.pdf"
8. Submit

**Expected Results**:
- ❌ "not-a-url": Error shown
- ❌ "ftp://example.com": Error (only http/https allowed)
- ✅ "https://example.com/manual.pdf": Accepted

**Pass/Fail**: pass.

---

### Test 2.6: Edit Asset
**Objective**: Verify asset editing and change history

**Steps**:
1. Find "Shure SM58 Microphone" asset
2. Click to view details
3. Click "Edit"
4. Change Status from "Available" to "In Use"
5. Add Location: "Main Sanctuary"
6. Save
7. View change history

**Expected Results**:
- ✅ Asset updated successfully
- ✅ Change history shows 2 entries:
  - Status changed: "Available" → "In Use"
  - Location changed: null → "Main Sanctuary"
- ✅ Each entry shows user and timestamp
- ✅ Old and new values displayed

**Pass/Fail**: Fail. 
The change history should be in a extra tab in the asset view. Called "History". 
A change should look like this:
10/20/25, 10:24 AM User changed FIELD from VALUE to VALUE


This is how it currently is, it is very hard to see the actual change:
Oct 20, 2025, 10:23 AM

Peter Pretix

updated
customFieldValues

{"Wattage":10,"DMX Adress":"sajflwjrij","Manual URL":""}

{"Wattage":10,"DMX Adress":"sajflwjrij","Manual URL":"http://not-a-url.de"}

Oct 20, 2025, 10:23 AM

Peter Pretix

updated
category

{"id":"281","name":"Lighting Equipment"}

{"id":"281","name":"Lighting Equipment"}

Oct 20, 2025, 10:23 AM

Peter Pretix

created
—

—

---

### Test 2.7: Delete Asset
**Objective**: Verify asset deletion

**Steps**:
1. Create a test asset: "Test Asset to Delete"
2. Save it
3. Go to asset detail
4. Click "Delete"
5. Confirm deletion
6. Check change history (before it's deleted)

**Expected Results**:
- ✅ Asset deleted successfully
- ✅ No longer appears in asset list
- ✅ Deletion recorded in change history before removal
- ✅ Success notification shown

**Pass/Fail**: Fail. Delete throws 405 error. Also since the history is shown in the asset view. When a asset is deleted there is no history of it anymore. There should be a option to view deleted assets and restore them.

---

## Scenario 3: Custom Field Types

### Test 3.1: Text Field
**Objective**: Test single-line text input

**Steps**:
1. Create category with text field "Model Number"
2. Create asset with Model Number: "XLR-2024-Pro"
3. Verify it saves and displays correctly

**Expected Results**:
- ✅ Text saved exactly as entered
- ✅ No line breaks allowed
- ✅ Displays in asset detail

**Pass/Fail**: Pass.

---

### Test 3.2: Long Text Field
**Objective**: Test multi-line text input

**Steps**:
1. Create category with long-text field "Notes"
2. Create asset with multi-line notes:
   ```
   Line 1: Purchased from Vendor X
   Line 2: Warranty expires 2026-01-15
   Line 3: Requires annual calibration
   ```
3. Save and view

**Expected Results**:
- ✅ All lines preserved
- ✅ Line breaks maintained
- ✅ Textarea shows all content

**Pass/Fail**: Pass.

---

### Test 3.3: Number Field
**Objective**: Test numeric input

**Steps**:
1. Create category with number field "Price" (min=0)
2. Try entering "abc" - should not allow
3. Try entering "-10" - should show error
4. Enter "299.99" - should accept

**Expected Results**:
- ✅ Only numbers accepted
- ✅ Decimal values allowed
- ✅ Min/max validation works
- ✅ Stored as number type

**Pass/Fail**: Fail. when entering -10 it changes it to 0 without showing error.

---

### Test 3.4: Date Field
**Objective**: Test date picker

**Steps**:
1. Create category with date field "Purchase Date"
2. Create asset and click date field
3. Select date from calendar
4. Save and verify format

**Expected Results**:
- ✅ Calendar picker appears
- ✅ Date stored in ISO format
- ✅ Displays in readable format
- ✅ Can be edited

**Pass/Fail**: Fail. Date is stored in ISO Format but also displayed in ISO Format and not in readable format.

---

### Test 3.5: Checkbox Field
**Objective**: Test boolean toggle

**Steps**:
1. Create category with checkbox "Under Warranty"
2. Create asset, check the box
3. Save
4. Edit and uncheck
5. Save again

**Expected Results**:
- ✅ Checkbox toggles on/off
- ✅ Stored as boolean true/false
- ✅ Change history shows: false → true → false
- ✅ Visual state matches stored value

**Pass/Fail**: Fail. As noted earlier, history is not easy to read.

---

### Test 3.6: Select Field
**Objective**: Test single selection dropdown

**Steps**:
1. Create category with select field "Condition"
   - Options: Excellent, Good, Fair, Poor
2. Create asset
3. Select "Good"
4. Save
5. Verify can only select one value

**Expected Results**:
- ✅ Dropdown shows all options
- ✅ Only one value can be selected
- ✅ Selected value saved
- ✅ Displays correctly in detail view

**Pass/Fail**: Pass.

---

### Test 3.7: Multi-Select Field
**Objective**: Test multiple selection

**Steps**:
1. Create category with multi-select "Features"
   - Options: Wireless, Battery, Weatherproof, Portable
2. Create asset
3. Select: Wireless, Battery, Portable
4. Save
5. Verify all 3 values saved

**Expected Results**:
- ✅ Can select multiple values
- ✅ All selections saved as array
- ✅ Displays as list/tags
- ✅ Can remove individual selections

**Pass/Fail**: Pass.

---

### Test 3.8: URL Field
**Objective**: Test URL validation (already tested above, but verify display)

**Steps**:
1. Create asset with URL field containing valid URL
2. View asset detail
3. Verify URL is clickable link

**Expected Results**:
- ✅ URL displayed as hyperlink
- ✅ Clicking opens in new tab
- ✅ Validation prevents invalid URLs

**Pass/Fail**: Fail, url is not clickable.

---

### Test 3.9: Person Reference Field
**Objective**: Test person ID field (placeholder for Phase 9)

**Steps**:
1. Create category with person-reference field "Assigned To"
2. Create asset
3. Enter person ID manually (since picker not yet implemented)
4. Save

**Expected Results**:
- ✅ Field accepts text input
- ✅ Shows note about Phase 9 implementation
- ✅ Value saved
- ✅ No errors thrown

**Pass/Fail**: Pass.

---

## Scenario 4: Filtering and Sorting

### Test 4.1: Filter by Category
**Objective**: Verify category filtering

**Steps**:
1. Create assets in multiple categories
2. Go to Assets list
3. Open filter panel
4. Select "Audio & Sound Equipment" category
5. Apply filter

**Expected Results**:
- ✅ Only assets in selected category shown
- ✅ Asset count updates
- ✅ Other categories' assets hidden
- ✅ Can clear filter to show all

**Pass/Fail**: Pass.

---

### Test 4.2: Filter by Status
**Objective**: Verify status filtering

**Steps**:
1. Create assets with different statuses
2. Filter by status: "Available"
3. Verify results
4. Change to "In Use"
5. Verify different results

**Expected Results**:
- ✅ Only assets with selected status shown
- ✅ Status badge color-coded
- ✅ Filter state persists during session
- ✅ Can combine with other filters

**Pass/Fail**: Pass.

---

### Test 4.3: Search by Name
**Objective**: Verify text search

**Steps**:
1. Enter "Microphone" in search box
2. Verify only assets with "Microphone" in name shown
3. Clear search
4. Search for "LED"
5. Verify results

**Expected Results**:
- ✅ Search is case-insensitive
- ✅ Partial matches work
- ✅ Search updates as you type
- ✅ Shows message if no results

**Pass/Fail**: Pass

---

### Test 4.4: Sort by Asset Number
**Objective**: Verify sorting functionality

**Steps**:
1. Click "Asset Number" column header
2. Verify ascending sort
3. Click again
4. Verify descending sort

**Expected Results**:
- ✅ Assets sorted numerically
- ✅ Sort indicator (arrow) shown
- ✅ Toggle between asc/desc works
- ✅ Sorting persists with filtering

**Pass/Fail**: Pass

---

### Test 4.5: Sort by Name
**Objective**: Verify alphabetical sorting

**Steps**:
1. Click "Name" column header
2. Verify A-Z sort
3. Click again for Z-A

**Expected Results**:
- ✅ Alphabetical sorting works
- ✅ Case-insensitive
- ✅ Special characters handled
- ✅ Numbers sorted logically

**Pass/Fail**: Pass

---

## Scenario 5: Change History & Audit Trail

### Test 5.1: Category Creation History
**Objective**: Verify category changes tracked

**Steps**:
1. Create new category
2. Navigate to change history view (if available)
3. Or check backend data directly

**Expected Results**:
- ✅ "Created" entry exists
- ✅ User ID and name recorded
- ✅ Timestamp accurate
- ✅ Entity type is "category"

**Pass/Fail**: Fail. No change history for categories avaible yet.

---

### Test 5.2: Asset Update History
**Objective**: Verify field changes tracked

**Steps**:
1. Create asset
2. Edit asset: change name, status, add location
3. Save
4. View asset detail change history

**Expected Results**:
- ✅ Creation entry shown
- ✅ 3 update entries shown (name, status, location)
- ✅ Each shows old → new values
- ✅ Each has user and timestamp
- ✅ Sorted newest first

**Pass/Fail**: Fail, look up previous recomendation how to improve readibility

---

### Test 5.3: Custom Field Update History
**Objective**: Verify custom field changes tracked

**Steps**:
1. Create asset with custom fields
2. Edit: change a custom field value
3. Save
4. View change history

**Expected Results**:
- ✅ Custom field change recorded
- ✅ Field name shown
- ✅ Old and new values shown
- ✅ Tracked same as standard fields

**Pass/Fail**: Fail, look up previous recomendation how to improve readibility

---

## Scenario 6: User Experience & UI

### Test 6.1: Navigation
**Objective**: Verify navigation works smoothly

**Steps**:
1. Use main menu to navigate between:
   - Categories
   - Assets
   - Asset Detail
2. Use browser back/forward buttons
3. Use breadcrumbs (if available)

**Expected Results**:
- ✅ Navigation is instant
- ✅ Active page highlighted
- ✅ Browser back/forward work
- ✅ No page reloads
- ✅ URLs update correctly

**Pass/Fail**: Fail, Asset filtering takes to long. Realoding page breaks view "The server is configured with a public base URL of /ccm/fkoinventorymanagement/ - did you mean to visit /ccm/fkoinventorymanagement/assets instead?"
Same no back /forward worksing.

---

### Test 6.2: Loading States
**Objective**: Verify loading indicators work

**Steps**:
1. Clear cache/refresh page
2. Navigate to Assets (large list)
3. Observe loading state
4. Create new asset
5. Observe submission loading

**Expected Results**:
- ✅ Loading spinner shows during data fetch
- ✅ Skeleton loaders shown (if implemented)
- ✅ Button shows loading state on submit
- ✅ No UI jump/flash
- ✅ Smooth transitions

**Pass/Fail**: Pass

---

### Test 6.3: Error Handling
**Objective**: Verify errors displayed properly

**Steps**:
1. Disconnect network (airplane mode)
2. Try to load assets
3. Reconnect
4. Try invalid form submission
5. Try deleting category with assets

**Expected Results**:
- ✅ Network errors show friendly message
- ✅ Validation errors show on fields
- ✅ Business logic errors show clear message
- ✅ Error notifications dismissable
- ✅ Can recover from errors

**Pass/Fail**: Fail, No network error show.

---

### Test 6.4: Success Notifications
**Objective**: Verify success feedback

**Steps**:
1. Create category - watch for notification
2. Create asset - watch for notification
3. Edit asset - watch for notification
4. Delete asset - watch for notification

**Expected Results**:
- ✅ Green success notification shows
- ✅ Message is descriptive
- ✅ Auto-dismisses after 5 seconds
- ✅ Can manually dismiss
- ✅ Doesn't block UI

**Pass/Fail**: Pass.

---

### Test 6.5: Responsive Design
**Objective**: Verify mobile/tablet layouts

**Steps**:
1. Resize browser to mobile width (375px)
2. Navigate all pages
3. Try creating/editing
4. Resize to tablet (768px)
5. Test again

**Expected Results**:
- ✅ Layout adapts to screen size
- ✅ No horizontal scrolling
- ✅ Touch targets large enough
- ✅ Forms usable on mobile
- ✅ Tables scroll horizontally if needed

**Pass/Fail**: Pass.

---

## Scenario 7: Data Integrity & Edge Cases

### Test 7.1: Duplicate Prevention
**Objective**: Verify system handles duplicates

**Steps**:
1. Create category "Test Category"
2. Try to create another "Test Category"
3. Observe behavior

**Expected Results**:
- System behavior documented
- Either prevents duplicate or allows (by design)
- If allowed, can distinguish between them

**Pass/Fail**: Pass. Allows and distinguishes.

---

### Test 7.2: Special Characters
**Objective**: Verify special characters handled

**Steps**:
1. Create category with name: "Audio & Video @ 2025 (Test)"
2. Create asset with special chars in custom fields
3. Verify display and search

**Expected Results**:
- ✅ Special characters saved correctly
- ✅ No encoding issues
- ✅ Search works with special chars
- ✅ No XSS vulnerabilities

**Pass/Fail**: Pass.

---

### Test 7.3: Empty States
**Objective**: Verify empty state messages

**Steps**:
1. Fresh install with no data
2. View categories list
3. View assets list
4. Apply filter that returns no results

**Expected Results**:
- ✅ "No categories yet" message shown
- ✅ "Create your first category" CTA
- ✅ "No assets found" for empty list
- ✅ "No results" for empty filter
- ✅ Messages are helpful and actionable

**Pass/Fail**: Fail, No CTA for Categories and Assets

---

### Test 7.4: Long Text Handling
**Objective**: Verify long content handled gracefully

**Steps**:
1. Create asset with very long name (200 chars)
2. Create long description (1000 chars)
3. View in list and detail

**Expected Results**:
- ✅ Long names truncated in list with ellipsis
- ✅ Full name visible in detail view
- ✅ Long text wraps properly
- ✅ No layout breaking
- ✅ Scrollable if needed

**Pass/Fail**: Fail. Churchtools imposes a 10000 max string length in the data values

---

## 🐛 Bug Tracking

Use this section to track any issues found during testing:

### Bug #1
**Severity**: [Critical / High / Medium / Low]  
**Status**: [Open / Fixed / Wont Fix]  
**Description**:  
**Steps to Reproduce**:  
**Expected**:  
**Actual**:  
**Screenshot/Video**:  

---

### Bug #2
**Severity**:  
**Status**:  
**Description**:  
**Steps to Reproduce**:  
**Expected**:  
**Actual**:  
**Screenshot/Video**:  

---

## 📊 Test Summary

**Test Date**: _______________  
**Tested By**: _______________  
**Environment**: _______________  
**Browser**: _______________  

### Results

| Test Scenario | Passed | Failed | Blocked | Notes |
|---------------|--------|--------|---------|-------|
| 1. Category Management | __/5 | __/5 | __/5 | |
| 2. Asset Management | __/7 | __/7 | __/7 | |
| 3. Custom Field Types | __/9 | __/9 | __/9 | |
| 4. Filtering & Sorting | __/5 | __/5 | __/5 | |
| 5. Change History | __/3 | __/3 | __/3 | |
| 6. User Experience | __/5 | __/5 | __/5 | |
| 7. Edge Cases | __/4 | __/4 | __/4 | |
| **TOTAL** | __/38 | __/38 | __/38 | |

### Pass Rate
- **Target**: ≥ 95% (36/38 tests passing)
- **Actual**: ____%

### Critical Issues Found
1. 
2. 
3. 

### Recommendations
- [ ] Ready for production deployment
- [ ] Needs minor fixes (list above)
- [ ] Needs major rework (explain why)
- [ ] Additional testing needed (specify)

---

## 🚀 Deployment Checklist

Before deploying to production:

### Pre-Deployment
- [ ] All critical tests passed
- [ ] All high-severity bugs fixed
- [ ] Performance acceptable (pages load < 2s)
- [ ] No console errors in production build
- [ ] ESLint passes with no warnings
- [ ] TypeScript compiles with no errors

### Configuration
- [ ] Production .env configured
- [ ] Correct ChurchTools module ID set
- [ ] API credentials secured
- [ ] Bundle size < 200 KB gzipped

### Documentation
- [ ] User guide created/updated
- [ ] Known issues documented
- [ ] Release notes prepared
- [ ] Support contact provided

### Deployment
- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Deploy to test environment first
- [ ] Smoke test in test environment
- [ ] Deploy to production
- [ ] Smoke test in production

---

## 📞 Support & Questions

If you encounter issues during testing:
1. Check the bug tracking section above
2. Review PHASE4_COMPLETE.md for implementation details
3. Check console for error messages
4. Document the issue with steps to reproduce

---

**Document Version**: 1.0  
**Last Updated**: October 20, 2025  
**Next Review**: After testing completion
