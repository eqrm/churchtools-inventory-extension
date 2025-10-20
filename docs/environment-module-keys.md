# Environment-Based Module Key Configuration

## Overview
The application now automatically constructs the ChurchTools custom module key based on the `VITE_ENVIRONMENT` setting in your `.env` file.

## How It Works

### Configuration in .env
```properties
# Base module key (without prefix)
VITE_KEY=fkoinventorymanagement

# Environment setting
VITE_ENVIRONMENT=development  # or 'production'
```

### Automatic Prefix Application

The system automatically adds the correct prefix:

| Environment | VITE_ENVIRONMENT | Resulting Module Key |
|------------|------------------|---------------------|
| **Development** | `development` | `dev-fkoinventorymanagement` |
| **Production** | `production` | `prod-fkoinventorymanagement` |
| **Testing** | (auto-detected) | `test-fkoinventorymanagement` |

### Code Implementation

In `src/hooks/useStorageProvider.ts`:

```typescript
const baseKey = import.meta.env.VITE_KEY ?? 'fkoinventorymanagement';
const environment = import.meta.env.VITE_ENVIRONMENT ?? 'development';
const isTest = import.meta.env.VITEST === 'true';

// Construct module key with environment prefix
let moduleKey: string;
if (isTest) {
    moduleKey = `test-${baseKey}`;
} else if (environment === 'production') {
    moduleKey = `prod-${baseKey}`;
} else {
    moduleKey = `dev-${baseKey}`;
}
```

## ChurchTools Setup Required

You need to create separate custom modules in ChurchTools for each environment:

### Development Environment
1. Go to ChurchTools Admin Panel
2. Navigate to Custom Modules
3. Create a new module with key: `dev-fkoinventorymanagement`

### Production Environment
1. Go to ChurchTools Admin Panel
2. Navigate to Custom Modules
3. Create a new module with key: `prod-fkoinventorymanagement`

### Test Environment (Optional)
1. Create a module with key: `test-fkoinventorymanagement`
2. This is used automatically when running tests

## Benefits

✅ **Environment Isolation**: Development and production data are completely separate
✅ **Safe Testing**: Test environment uses dedicated module
✅ **No Manual Switching**: Environment detected automatically
✅ **Type-Safe**: Full TypeScript support with proper types

## Migration from Old Setup

If you previously used a single module without prefixes:

**Old (.env):**
```properties
VITE_KEY=fkoinventorymanagement
```

**New (.env):**
```properties
VITE_KEY=fkoinventorymanagement
VITE_ENVIRONMENT=development  # Add this line
```

The system will now use `dev-fkoinventorymanagement` instead of `fkoinventorymanagement`.

## Troubleshooting

### Error: "Custom module not found"

**Problem:** ChurchTools returns 404 when fetching the module

**Solution:** 
1. Check your `.env` file has `VITE_ENVIRONMENT` set
2. Create the custom module in ChurchTools with the correct prefixed key
3. Example: If `VITE_ENVIRONMENT=development`, create module `dev-fkoinventorymanagement`

### Verify Current Module Key

Check the browser console - the error message will show the exact module key being requested:
```
Could not fetch module via API: /custommodules/dev-fkoinventorymanagement
```

## Files Modified

- `src/hooks/useStorageProvider.ts` - Added automatic prefix logic
- `src/vite-env.d.ts` - Added VITE_ENVIRONMENT and VITEST to type definitions
- `src/tests/setup.ts` - Uses `test-` prefix automatically for tests

## Related Documentation

- Phase 2.5 Testing Infrastructure: Environment configuration
- `.env-example`: Template with all required variables
- `docs/TESTING.md`: Testing environment setup

---

**Last Updated**: 2025-10-20
**Feature**: Automatic Environment-Based Module Key Prefixing
