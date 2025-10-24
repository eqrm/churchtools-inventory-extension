# Phase 4 Manual Testing Guide

**Feature**: 002-bug-fixes-ux-improvements  
**Phase**: 4 - User Story 2 (Person Search for Bookings)  
**Tasks**: T043-T046  
**Purpose**: Verify person search integration with ChurchTools API

---

## Prerequisites

Before running these tests:

1. ✅ All code tasks T032-T042 must be complete
2. ✅ Development server must be running: `npm run dev`
3. ✅ Must be authenticated with ChurchTools (check browser console)
4. ✅ ChurchTools instance must have person data
5. ✅ Browser DevTools open (F12) for network inspection

---

## Test Environment Setup

```bash
# Start development server
npm run dev

# Application runs at:
# http://localhost:5174/ccm/fkoinventorymanagement/
```

**Important**: Ensure you're logged into ChurchTools before testing. The person search uses your active session.

---

## T043: Search for Person Test

**Goal**: Verify ChurchTools person search returns real results

### Test Steps

1. **Navigate to Booking Form**
   - Go to Bookings page (`/bookings`)
   - Click "New Booking" or "Create Booking" button
   - Booking form should open

2. **Locate PersonPicker Field**
   - Look for "Booking For" field at top of form
   - Should have search icon and placeholder "Search for person..."

3. **Search for Common Name**
   - Type "John" (or any common first name in your ChurchTools)
   - Wait 300ms (debounce delay)
   - ✅ **Expected**: Dropdown appears with matching persons from ChurchTools
   - ❌ **Failure**: No dropdown appears, or shows "No persons found"

4. **Verify Search Results**
   - Results should show:
     - Person's full name
     - Person's email (if available)
     - Person's avatar (if available, or initials)
   - ✅ **Expected**: 1-10 results matching search query
   - ❌ **Failure**: Empty results, error message, or fake/mock data

5. **Verify API Call (Network Tab)**
   - Open DevTools → Network tab
   - Filter by "search" or "api"
   - Should see: `GET /api/search?query=John&domain_types[]=person`
   - ✅ **Expected**: 200 OK response with person data
   - ❌ **Failure**: 401 (not authenticated), 403 (no permission), or network error

### Pass/Fail Criteria

- ✅ **PASS**: Real ChurchTools persons appear in dropdown
- ❌ **FAIL**: No results, error message, or fake data appears

---

## T044: Avatar Display Test

**Goal**: Verify person avatars display correctly

### Test Steps

1. **Search and Select Person**
   - Search for a person: "John Smith"
   - Click on person in dropdown
   - ✅ **Expected**: Dropdown closes, selected person displays above search field

2. **Verify Selected Person Display**
   - Should show:
     - Avatar image (if person has photo) OR initials (e.g., "JS")
     - Full name in bold
     - Email address (dimmed text)
     - Clear button (X icon) on right
   - ✅ **Expected**: Avatar or initials visible, name and email shown
   - ❌ **Failure**: Missing avatar, broken image, or no person info

3. **Test Avatar Image**
   - If person has ChurchTools photo:
     - ✅ **Expected**: Photo loads and displays
     - ❌ **Failure**: Broken image icon
   - If person has no photo:
     - ✅ **Expected**: Circle with initials (first + last name)
     - ❌ **Failure**: Empty circle or placeholder icon

4. **Test Clear Button**
   - Click X button on selected person
   - ✅ **Expected**: Selected person removed, defaults to current user
   - ❌ **Failure**: Clear button doesn't work or causes error

### Pass/Fail Criteria

- ✅ **PASS**: Avatars display correctly (image or initials)
- ❌ **FAIL**: Broken images, missing avatars, or display errors

---

## T045: Debounce Test

**Goal**: Verify debouncing prevents excessive API calls

### Test Steps

1. **Open Network Tab**
   - DevTools → Network tab
   - Clear existing entries (Clear button or Ctrl+R)
   - Filter by "search" or "api"

2. **Type Quickly**
   - In PersonPicker search field, type: "J-o-h-n" quickly (within 1 second)
   - Do NOT pause between letters
   - ✅ **Expected**: Only 1 API call after typing stops for 300ms
   - ❌ **Failure**: 4+ API calls (one per letter)

3. **Verify Debounce Timing**
   - Type "Jo" → wait 200ms → type "hn"
   - ✅ **Expected**: 2 API calls (one for "Jo", one for "John")
   - ❌ **Failure**: More than 2 calls or immediate calls

4. **Check Network Log**
   - Count number of `/api/search` requests
   - ✅ **Expected**: Minimal requests (1 per pause > 300ms)
   - ❌ **Failure**: Many requests (one per keystroke)

5. **Verify Performance**
   - Type very quickly: "JohnSmith" (no pauses)
   - ✅ **Expected**: Only 1 request after you stop typing
   - ❌ **Failure**: Multiple requests during typing

### Pass/Fail Criteria

- ✅ **PASS**: Maximum 1-2 API calls despite fast typing
- ❌ **FAIL**: Many API calls (one per keystroke)

---

## T046: Cache Test

**Goal**: Verify caching works (memory + localStorage)

### Test Steps

1. **First Search (Cold Cache)**
   - Clear cache: Open DevTools → Console → Type:
     ```javascript
     localStorage.clear()
     ```
   - Search for "John Smith"
   - Note the response time in Network tab (e.g., 150ms)
   - ✅ **Expected**: API call made, dropdown appears after delay

2. **Second Search (Warm Cache)**
   - Clear the search field
   - Search for "John Smith" again (exact same query)
   - Check Network tab
   - ✅ **Expected**: 
     - NO new API call (cached)
     - Dropdown appears instantly (<50ms)
     - Results identical to first search
   - ❌ **Failure**: New API call made, or slow response

3. **Verify Memory Cache**
   - Search for "Jane Doe"
   - Clear search field
   - Search for "John Smith" again
   - ✅ **Expected**: Instant results (memory cache)
   - ❌ **Failure**: New API call

4. **Verify localStorage Cache**
   - Refresh page (F5) to clear memory cache
   - Search for "John Smith" (same person from earlier)
   - Check Network tab
   - ✅ **Expected**: 
     - NO API call (localStorage cache still valid)
     - Results appear quickly
   - ❌ **Failure**: New API call made

5. **Test Cache Expiration**
   - Open Console → Type:
     ```javascript
     // Check localStorage cache
     for (let i = 0; i < localStorage.length; i++) {
       const key = localStorage.key(i)
       if (key.startsWith('person_cache_')) {
         console.log(key, JSON.parse(localStorage.getItem(key)))
       }
     }
     ```
   - ✅ **Expected**: See cached persons with expiresAt timestamps
   - ❌ **Failure**: No cache entries found

### Pass/Fail Criteria

- ✅ **PASS**: Second search instant (< 50ms), no API call
- ❌ **FAIL**: Every search makes API call, slow responses

---

## Troubleshooting

### Issue: No Search Results

**Cause**: Not authenticated or no persons in ChurchTools

**Solutions**:
1. Check browser console for authentication errors
2. Verify logged into ChurchTools: `/whoami` should return user info
3. Check ChurchTools has person records (admin panel)
4. Verify API permissions (need access to person search)

### Issue: Avatars Not Loading

**Cause**: CORS issues or invalid image URLs

**Solutions**:
1. Check Network tab for image load failures (404, 403)
2. Verify ChurchTools base URL is correct
3. Check browser console for CORS errors
4. Test image URLs directly in browser

### Issue: Debounce Not Working

**Cause**: Hook implementation issue or React re-renders

**Solutions**:
1. Verify `usePersonSearch` hook uses `useEffect` with debounce
2. Check `debounceMs` prop is 300
3. Verify no duplicate search calls in component code
4. Check React DevTools for unnecessary re-renders

### Issue: Cache Not Working

**Cause**: localStorage disabled or cache expiration

**Solutions**:
1. Check localStorage is enabled (not in incognito mode)
2. Verify cache TTL settings (5 min memory, 24 hours storage)
3. Check browser console for storage quota errors
4. Clear cache and test fresh: `localStorage.clear()`

---

## Test Results Checklist

Mark each test as you complete it:

- [ ] T043: Search returns real ChurchTools persons (not fake data)
- [ ] T044: Avatars display correctly (image or initials)
- [ ] T045: Debounce prevents excessive API calls (< 2 calls per query)
- [ ] T046: Cache works (second search instant, no API call)

**Overall Phase 4 Status**:
- [ ] ✅ ALL TESTS PASS - Phase 4 complete, ready for Phase 5
- [ ] ❌ SOME TESTS FAIL - Review troubleshooting guide and fix issues

---

## Expected Performance Metrics

**Success Criteria** (from spec.md SC-002):
- ✅ Person search completes in < 3 seconds
- ✅ Debounced to prevent spam (300ms delay)
- ✅ Cached for instant subsequent searches

**Actual Performance** (fill in after testing):
- First search time: _____ ms
- Cached search time: _____ ms
- API calls per query: _____
- Cache hit rate: _____%

---

## Next Steps After Phase 4

Once all tests pass:

1. **Mark T043-T046 as complete** in tasks.md
2. **Commit changes** with message:
   ```
   feat: Complete Phase 4 - Person Search for Bookings (US2)
   
   - Integrated PersonPicker into BookingForm
   - Added avatar display for selected persons
   - Implemented user-friendly error handling
   - All manual tests passed
   
   Phase 4 complete: 16/16 tasks (100%)
   ```

3. **Proceed to Phase 5**: User Story 3 - Book Asset for Another Person
   - Tasks: T047-T056 (10 tasks)
   - Duration: ~1 hour
   - Focus: Allow booking on behalf of others

---

**Phase 4 Status**: Code complete, manual testing required ✅
