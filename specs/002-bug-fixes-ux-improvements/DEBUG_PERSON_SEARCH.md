# Debug Guide - Person Search Not Showing Results

**Date**: October 22, 2025  
**Status**: Debugging in progress

---

## Symptoms

- ✅ ChurchTools API returns data (confirmed - 13 results for "Felix")
- ✅ Network tab shows 200 OK response
- ❌ PersonPicker UI shows "No persons found matching..."
- ❌ Dropdown doesn't appear with results

---

## Debug Logging Added

Added console.warn statements at each step of the data flow:

### 1. PersonSearchService (After API Call)
**Location**: `src/services/person/PersonSearchService.ts` Line ~148

```typescript
console.warn('[PersonSearchService] Search response:', {
  query,
  resultCount: response.data.length,
  totalCount: response.meta.count,
  firstResult: response.data[0]
})
```

**What to Check**:
- Does `resultCount` match the API response? (should be 13 for "Felix")
- Does `firstResult` show the raw ChurchTools data?

### 2. PersonSearchService (After Transformation)
**Location**: `src/services/person/PersonSearchService.ts` Line ~157

```typescript
console.warn('[PersonSearchService] Transformed results:', {
  resultsCount: results.length,
  firstTransformed: results[0]
})
```

**What to Check**:
- Does `resultsCount` still match? (should still be 13)
- Does `firstTransformed` show our `PersonSearchResult` format?
  ```javascript
  {
    id: "6465",
    firstName: "Baby-Doe",
    lastName: "Doe",
    email: "",
    avatarUrl: null,
    displayName: "Baby-Doe Doe"
  }
  ```

### 3. usePersonSearch Hook
**Location**: `src/hooks/usePersonSearch.ts` Line ~67

```typescript
console.warn('[usePersonSearch] Got response:', {
  query,
  resultsCount: response.results.length,
  fromCache: response.fromCache,
  firstResult: response.results[0]
})
```

**What to Check**:
- Does `resultsCount` still match? (should still be 13)
- Does `firstResult` match the transformed format?
- Is `fromCache` false on first search?

### 4. PersonPicker Component
**Location**: `src/components/common/PersonPicker.tsx` Line ~44

```typescript
console.warn('[PersonPicker] State:', {
  resultsCount: results.length,
  loading,
  searchError,
  searchQuery,
  open,
  firstResult: results[0]
})
```

**What to Check**:
- Does `resultsCount` match? (should be 13)
- Is `loading` false after search completes?
- Is `searchError` null (no error)?
- Is `open` true (dropdown should open)?
- Is `searchQuery` the text you typed?

---

## Testing Steps

1. **Rebuild with debug logging**:
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12 → Console tab)

3. **Navigate to test page**:
   - Bookings → New Booking (PersonPicker in "Booking For" field)
   - OR Assets → New Asset with person-reference custom field

4. **Type "Felix"** in the person search field

5. **Check console output** - Should see 4 warning messages in order:
   ```
   [PersonSearchService] Search response: ...
   [PersonSearchService] Transformed results: ...
   [usePersonSearch] Got response: ...
   [PersonPicker] State: ...
   ```

6. **Share the full console output** from all 4 warnings

---

## Common Issues & What They Mean

### Scenario 1: No console logs at all
**Meaning**: Search function not being called
**Likely Cause**: Event handler not wired up correctly

### Scenario 2: Only Step 1 log appears
**Meaning**: API call succeeds but transformation fails
**Check**: Error thrown during `transformPerson()`?

### Scenario 3: Steps 1-2 appear but not 3
**Meaning**: Service returns data but hook doesn't receive it
**Check**: Promise rejection? Error in try-catch?

### Scenario 4: Steps 1-3 appear but not 4
**Meaning**: Hook has data but component doesn't re-render
**Check**: React state not updating?

### Scenario 5: All 4 steps appear
**Meaning**: Data flows correctly!
**Check Step 4 values**:
- If `resultsCount > 0` but dropdown doesn't show:
  - Check `open` value (should be `true`)
  - Check render condition: `{open && results.length > 0 && (`
- If `resultsCount = 0`:
  - Check previous steps - where did data get lost?

### Scenario 6: Steps 1-2 show 13 results, Step 3-4 show 0
**Meaning**: Response transformation or state setting issue
**Check**: Are we setting state correctly in the hook?

---

## Expected Data Flow

```
User types "Felix" (min 2 chars)
  ↓
useEffect triggers (after 300ms debounce)
  ↓
personSearchService.search({ query: "Felix", limit: 10 })
  ↓
churchtoolsClient.get('/search', { query: "Felix", 'domain_types[]': 'person' })
  ↓
[LOG 1] Raw API response: { data: [...13 persons...], meta: { count: 13 } }
  ↓
Transform each person: transformPerson(raw)
  ↓
[LOG 2] Transformed: [{ id: "6465", firstName: "Baby-Doe", ... }, ...]
  ↓
Return: { results: [...], totalCount: 13, fromCache: false, query: "Felix" }
  ↓
[LOG 3] Hook receives response
  ↓
setResults(response.results) → React state update
  ↓
PersonPicker re-renders
  ↓
[LOG 4] Component state: results.length = 13, open = true
  ↓
Render condition: open (true) && results.length > 0 (true) → Show dropdown
  ↓
Map over results and render each person
```

---

## Specific Checks

### Check 1: API Response Structure
From your provided API response, verify:
```json
{
  "data": [
    {
      "title": "Baby-Doe Doe",              ✅ Used for displayName
      "domainIdentifier": "6465",            ✅ Used for id
      "domainAttributes": {
        "firstName": "Baby-Doe",            ✅ Used for firstName
        "lastName": "Doe"                   ✅ Used for lastName
      },
      "imageUrl": null                      ✅ Used for avatarUrl (null is ok)
    }
  ],
  "meta": {
    "count": 13                             ✅ Used for totalCount
  }
}
```

### Check 2: Transformation
After transformation, first result should be:
```javascript
{
  id: "6465",
  firstName: "Baby-Doe",
  lastName: "Doe",
  email: "",
  avatarUrl: undefined,  // null → undefined
  displayName: "Baby-Doe Doe"
}
```

### Check 3: React State
PersonPicker component should have:
```javascript
results = [13 PersonSearchResult objects]
loading = false
searchError = null
open = true
searchQuery = "Felix"
```

### Check 4: Render Condition
```tsx
{open && results.length > 0 && (
  // Dropdown JSX
)}
```
- `open` must be `true`
- `results.length` must be `> 0`
- Both conditions must be met simultaneously

---

## Next Actions Based on Findings

### If data appears in Log 1 & 2 but not Log 3:
→ Issue in the hook's try-catch block
→ Check if error is being thrown and caught

### If data appears in Log 1-3 but not Log 4:
→ Issue with React state update
→ Check if `setResults()` is being called
→ Check if component is re-rendering

### If data appears in all logs but UI doesn't show:
→ Issue with render logic
→ Check `open` state value
→ Check if dropdown is rendered but invisible (CSS/z-index issue)

### If data count changes between logs:
→ Issue with data transformation or state mutation
→ Check if `.map()` is returning correct array
→ Check if state is being set correctly

---

## Manual Override Test

If you want to bypass the API and test with hardcoded data:

**In `usePersonSearch.ts`, temporarily replace the executeSearch function**:

```typescript
const executeSearch = async () => {
  setLoading(true)
  setError(null)

  try {
    // TEMPORARY: Hardcoded test data
    const mockResults: PersonSearchResult[] = [
      {
        id: "6465",
        firstName: "Baby-Doe",
        lastName: "Doe",
        email: "",
        avatarUrl: undefined,
        displayName: "Baby-Doe Doe"
      },
      {
        id: "193",
        firstName: "Felix",
        lastName: "Kotschenreuther",
        email: "",
        avatarUrl: "https://eqrm.church.tools/images/3689/...",
        displayName: "Felix Kotschenreuther"
      }
    ]
    
    console.warn('[usePersonSearch] Using mock data')
    setResults(mockResults)
    setFromCache(false)
    
    // Original code:
    // const response = await personSearchService.search({ query, limit })
    // setResults(response.results)
    // setFromCache(response.fromCache)
  } catch (err) {
    // ... error handling
  }
}
```

**If mock data shows in dropdown**: Problem is in PersonSearchService  
**If mock data doesn't show**: Problem is in PersonPicker component

---

## Status

🔍 **Awaiting console output from test with debug logging**

Once you provide the console output, we can pinpoint exactly where the data flow is breaking.

---

**Files Modified for Debugging**:
1. `src/services/person/PersonSearchService.ts` - Added 2 console.warn statements
2. `src/hooks/usePersonSearch.ts` - Added 1 console.warn statement
3. `src/components/common/PersonPicker.tsx` - Added 1 console.warn statement

**To Remove Debug Logging Later**:
Search for `console.warn('[Person` and remove all those statements once issue is resolved.
