# Testing Guide

## Overview

This project uses **Vitest** for testing with **React Testing Library** for component tests and **MSW (Mock Service Worker)** for API mocking.

## Running Tests

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
└── tests/
    ├── setup.ts                    # Global test configuration
    ├── utils/
    │   ├── custom-render.tsx       # Custom render with providers
    │   ├── test-data-factory.ts    # Factory functions for test data
    │   ├── test-users.ts           # Safe test user IDs
    │   └── test-utils.ts           # Additional test utilities
    ├── mocks/
    │   ├── handlers.ts             # MSW API handlers
    │   └── server.ts               # MSW server setup
    └── **/*.test.{ts,tsx}          # Test files
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '../tests/utils/custom-render';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
    it('should render correctly', () => {
        render(<MyComponent title="Test" />);
        expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle user interactions', async () => {
        const user = userEvent.setup();
        render(<MyComponent />);
        
        const button = screen.getByRole('button', { name: /click me/i });
        await user.click(button);
        
        expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
});
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
    it('should return data', async () => {
        const { result } = renderHook(() => useMyHook());
        
        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });
    });
});
```

### API Tests with MSW

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../tests/mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockInventoryItem } from '../tests/utils/test-data-factory';

describe('API Tests', () => {
    beforeEach(() => {
        // Reset handlers after each test
        server.resetHandlers();
    });

    it('should handle API responses', async () => {
        // Test uses default handlers from handlers.ts
        const response = await fetch('/api/modules/test-fkoinventorymanagement/items');
        const data = await response.json();
        expect(data.data).toHaveLength(3);
    });

    it('should handle API errors', async () => {
        // Override handler for this test
        server.use(
            http.get('/api/modules/test-fkoinventorymanagement/items', () => {
                return HttpResponse.json(
                    { error: 'Not found' },
                    { status: 404 }
                );
            })
        );

        const response = await fetch('/api/modules/test-fkoinventorymanagement/items');
        expect(response.status).toBe(404);
    });
});
```

## Test Data Factory

Use factory functions to create test data with sensible defaults:

```typescript
import {
    createMockInventoryItem,
    createMockPerson,
    TEST_USER_IDS,
} from '../tests/utils/test-data-factory';

// Create with defaults
const item = createMockInventoryItem();

// Override specific fields
const customItem = createMockInventoryItem({
    name: 'Custom Item',
    status: 'maintenance',
});

// Use safe test user IDs
const testPerson = createMockPerson({ id: TEST_USER_IDS[0] });
```

## Environment Configuration

Tests automatically use the `test` environment:
- Module prefix: `test-fkoinventorymanagement`
- API base URL: `https://test.church.tools`
- Test user IDs: `[4618, 6465, 11672, 6462]`

## Coverage Targets

- **Services/Hooks/Utils**: 90%+
- **Components**: 80%+
- **Integration**: 70%+

## Best Practices

1. **Use `custom-render` instead of `render`** - It wraps components with necessary providers
2. **Use test data factories** - Consistent test data across tests
3. **Test user behavior, not implementation** - Focus on what users see and do
4. **Use semantic queries** - `getByRole`, `getByLabelText`, not `getByTestId`
5. **Mock at the network level with MSW** - More realistic than mocking modules
6. **Use safe test user IDs** - Don't spam real users with test emails

## Common Patterns

### Testing Async Code

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
    render(<MyComponent />);
    
    await waitFor(() => {
        expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
});
```

### Testing Forms

```typescript
import { userEvent } from '@testing-library/user-event';

it('should submit form', async () => {
    const user = userEvent.setup();
    render(<MyForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

### Testing Error States

```typescript
it('should handle errors', async () => {
    server.use(
        http.get('/api/items', () => {
            return HttpResponse.json(
                { error: 'Server error' },
                { status: 500 }
            );
        })
    );
    
    render(<MyComponent />);
    
    await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
});
```

## Debugging Tests

```bash
# Run tests with UI for interactive debugging
npm run test:ui

# Run specific test file
npm test -- path/to/test.test.tsx

# Run tests matching pattern
npm test -- --grep "MyComponent"

# Run with verbose output
npm test -- --reporter=verbose
```

## CI/CD Integration

Tests run automatically in CI/CD:

```yaml
- name: Run tests
  run: npm run test:run

- name: Upload coverage
  run: npm run test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
