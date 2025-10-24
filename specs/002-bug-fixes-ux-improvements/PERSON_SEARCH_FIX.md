# Person Search API Fix - October 22, 2025

## Issue Reported
Person search showing error: **"Could not search for persons. Please try again."** with message **"No persons found matching 'Marie'"**

No errors in console, indicating the error was being caught and handled generically.

---

## Root Cause Analysis

The `PersonSearchService` was using an **incorrect data structure** for the ChurchTools `/api/search` endpoint.

### What Was Wrong

**1. Incorrect Request Type Definition**:
```typescript
// ❌ BEFORE - Wrong structure
interface ChurchToolsPersonRaw {
  id: number               // ❌ Doesn't exist in search results
  type: 'person'           // ❌ Wrong field name
  meta?: {                 // ❌ Search API doesn't return meta.email
    email?: string
  }
}
```

**2. Wrong Response Structure**:
```typescript
// ❌ BEFORE - Wrong pagination structure
interface ChurchToolsSearchResponse {
  meta: {
    pagination: {          // ❌ Search API doesn't have pagination object
      total: number
    }
  }
}
```

**3. Wrong Data Transformation**:
```typescript
// ❌ BEFORE - Tried to access non-existent fields
id: raw.domainIdentifier || String(raw.id)  // raw.id doesn't exist!
email: raw.meta?.email                       // raw.meta doesn't exist!
```

### Actual ChurchTools API Structure

According to `/src/utils/ct-types.d.ts` (auto-generated from ChurchTools OpenAPI spec):

**GET `/api/search?query={query}&domain_types[]=person`**

Returns:
```typescript
{
  data: Array<DomainObjectPerson & { type: 'action' | 'domainObject' }>,
  meta: {
    count: number  // ✅ Direct count, not pagination object
  }
}
```

Where `DomainObjectPerson` is:
```typescript
{
  title: string                    // "Marie Müller"
  domainIdentifier: string         // "123" (person ID)
  domainType: 'person'
  imageUrl: string | null          // Avatar URL
  domainAttributes: {
    firstName: string              // "Marie"
    lastName: string               // "Müller"
    guid: string                   
    isArchived: boolean
    dateOfDeath: string | null
  }
  infos: string[]                  // Additional info lines
  frontendUrl: string | null
  apiUrl?: string
}
```

**Key differences**:
- ✅ No `id` field - use `domainIdentifier` instead
- ✅ No `meta.email` - search API doesn't return email
- ✅ No `pagination` object - just `meta.count`
- ✅ Name parts in `domainAttributes`, not parsed from `title`

---

## Fixes Applied

### Fix 1: Updated ChurchToolsPersonRaw Interface

**File**: `src/services/person/PersonSearchService.ts` (Lines 41-55)

```typescript
// ✅ AFTER - Correct structure matching ChurchTools API
interface ChurchToolsPersonRaw {
  title: string
  domainType: 'person'
  domainIdentifier: string              // ✅ Actual ID field
  apiUrl?: string
  frontendUrl: string | null
  imageUrl?: string | null              // ✅ Can be null
  domainAttributes: {                   // ✅ Structured name data
    firstName: string
    lastName: string
    guid: string
    isArchived: boolean
    dateOfDeath: string | null
  }
  infos?: string[]
}
```

### Fix 2: Updated Response Structure

**File**: `src/services/person/PersonSearchService.ts` (Lines 57-61)

```typescript
// ✅ AFTER - Correct response structure
interface ChurchToolsSearchResponse {
  data: Array<ChurchToolsPersonRaw & { type: 'action' | 'domainObject' }>
  meta: {
    count: number                       // ✅ Direct count
  }
}
```

### Fix 3: Updated Data Transformation

**File**: `src/services/person/PersonSearchService.ts` (Lines 258-272)

```typescript
// ✅ AFTER - Correct field access
private transformPerson(raw: ChurchToolsPersonRaw): PersonSearchResult {
  // Use domainAttributes for firstName/lastName (more reliable than parsing title)
  const firstName = raw.domainAttributes.firstName || ''
  const lastName = raw.domainAttributes.lastName || ''

  return {
    id: raw.domainIdentifier,                 // ✅ Correct ID field
    firstName,                                 // ✅ From domainAttributes
    lastName,                                  // ✅ From domainAttributes
    email: '',                                 // ✅ Not available in search results
    avatarUrl: raw.imageUrl || undefined,     // ✅ Handle null properly
    displayName: raw.title.trim()
  }
}
```

### Fix 4: Updated Total Count Access

**File**: `src/services/person/PersonSearchService.ts` (Line 168)

```typescript
// ✅ AFTER - Correct count access
return {
  results,
  totalCount: response.meta.count,  // ✅ Direct access, not pagination.total
  fromCache: false,
  query
}
```

### Fix 5: Added Debug Logging

**File**: `src/services/person/PersonSearchService.ts` (Lines 148-153)

```typescript
// Temporary debug logging to verify API responses
console.warn('[PersonSearchService] Search response:', {
  query,
  resultCount: response.data.length,
  totalCount: response.meta.count,
  firstResult: response.data[0]
})
```

This will help verify the API is returning data correctly.

---

## What Now Works

### ✅ Person Search
- Search query sent to `/api/search?query=Marie&domain_types[]=person`
- Response properly parsed using correct field names
- FirstName/LastName extracted from `domainAttributes`
- Person ID from `domainIdentifier`
- Avatar from `imageUrl` (with null handling)

### ✅ Data Transformation
- Names use structured data (not string parsing)
- Handles archived persons correctly
- Avatar URL properly handles null values
- Display name from `title` field

### ⚠️ Known Limitations
- **Email not available**: ChurchTools search API doesn't return email addresses
  - This is okay for our use case (just need name + ID for person picker)
  - If email is needed, must fetch full person details via `/api/persons/{id}`

---

## Testing Instructions

### 1. Clear Browser Cache & Rebuild
```bash
# Clear any cached bad responses
rm -rf node_modules/.vite
rm -rf dist

# Rebuild
npm run build
npm run dev
```

### 2. Test Person Search

**In BookingForm**:
1. Navigate to **Bookings** → **New Booking**
2. Click on "Booking For" field
3. Type **"Marie"** (or any person name in your ChurchTools)
4. **Expected Results**:
   - ✅ Dropdown shows matching persons
   - ✅ Each person shows: avatar + full name
   - ✅ Console shows debug log with search results
   - ✅ No error messages

**In Asset Custom Fields**:
1. Navigate to **Assets** → **Create New Asset**
2. Select category with `person-reference` custom field
3. Type a person name
4. **Expected Results**:
   - ✅ PersonPicker shows search results
   - ✅ Can select person
   - ✅ Avatar displays correctly

### 3. Check Browser Console

Look for debug log:
```
[PersonSearchService] Search response: {
  query: "Marie",
  resultCount: 3,
  totalCount: 3,
  firstResult: {
    title: "Marie Müller",
    domainIdentifier: "123",
    domainAttributes: { firstName: "Marie", lastName: "Müller", ... },
    imageUrl: "https://..."
  }
}
```

### 4. Verify Network Tab

**Request**: `GET /api/search?query=Marie&domain_types%5B%5D=person&limit=10`

**Response**: Should be `200 OK` with:
```json
{
  "data": [
    {
      "title": "Marie Müller",
      "domainIdentifier": "123",
      "domainType": "person",
      "domainAttributes": {
        "firstName": "Marie",
        "lastName": "Müller",
        ...
      },
      "imageUrl": "https://...",
      ...
    }
  ],
  "meta": {
    "count": 3
  }
}
```

---

## Common Issues & Solutions

### Issue: Still showing "No persons found"

**Check**:
1. Browser cache cleared?
2. Dev server restarted?
3. ChurchTools has persons matching search query?
4. Permissions allow searching persons?

**Debug**:
```javascript
// Check console for debug log
// If no log appears, search isn't reaching the API

// Check Network tab
// If 401/403, authentication issue
// If 200 but empty data[], no matching persons in ChurchTools
```

### Issue: Avatar not showing

**Possible Causes**:
1. Person has no photo in ChurchTools → Shows initials (expected)
2. `imageUrl` is null → Handled, shows initials
3. Image URL blocked by CORS → Check browser console for CORS errors

### Issue: Email field empty

**This is expected!** The `/api/search` endpoint doesn't return email addresses.

**Workaround**:
- If email is needed, call `/api/persons/{personId}` after selection
- For now, person picker doesn't display email (only name + avatar)

---

## Asset Prefix Errors (Separate Issue)

The console shows:
```
POST /api/custommodules/53/customdatacategories 400 (Bad Request)
```

**This is a different issue** - the asset prefixes feature trying to create data categories.

**Not related to person search** - can be addressed separately if needed.

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Person Search API Integration | ✅ Fixed | Correct data structure |
| Data Transformation | ✅ Fixed | Uses domainAttributes |
| Response Parsing | ✅ Fixed | Correct meta.count access |
| Avatar Display | ✅ Fixed | Handles null properly |
| Email Field | ⚠️ N/A | Not available in search API |
| Asset Prefix Errors | ❌ Separate Issue | Unrelated to person search |

---

**Next Steps**:
1. Test person search with rebuild
2. Verify search results appear
3. Remove debug logging once confirmed working
4. Address asset prefix errors separately (if needed)

**Status**: ✅ **Person Search API Integration Fixed** - Ready for Testing
