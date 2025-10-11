# Testing Guide - Baba Mara

Comprehensive testing setup for the Baba Mara platform with unit tests, integration tests, and E2E tests.

## Testing Stack

### Unit & Integration Testing
- **Jest** v30.2.0 - Test runner and framework
- **React Testing Library** v16.3.0 - Component testing
- **ts-jest** v29.4.5 - TypeScript support for Jest
- **@testing-library/jest-dom** v6.9.1 - DOM matchers

### E2E Testing
- **Playwright** v1.56.0 - Cross-browser end-to-end testing
- Browser support: Chromium, Firefox, WebKit
- Mobile testing: Pixel 5, iPhone 12

## Test Scripts

```bash
# Unit & Integration Tests
npm test                    # Run all Jest tests
npm run test:watch          # Run Jest in watch mode
npm run test:coverage       # Run tests with coverage report

# E2E Tests
npm run test:e2e            # Run Playwright tests
npm run test:e2e:ui         # Run Playwright with UI mode
npm run test:e2e:debug      # Run Playwright in debug mode

# All Tests
npm run test:all            # Run all unit and E2E tests
```

## Project Structure

```
/baba-mara.com
├── __tests__/               # Unit & integration tests
│   ├── lib/
│   │   └── auth/
│   │       └── admin.test.ts    # Admin auth tests
│   └── components/              # Component tests (future)
├── e2e/                     # End-to-end tests
│   ├── auth/
│   │   └── signin.spec.ts       # Auth flow tests
│   └── dashboard/
│       └── reading-flow.spec.ts # Dashboard tests
├── jest.config.ts           # Jest configuration
├── jest.setup.ts            # Jest setup and mocks
└── playwright.config.ts     # Playwright configuration
```

## Jest Configuration

### Coverage Thresholds

```typescript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 80,
    statements: 80,
  },
}
```

### Mock Setup

**Automatically mocked:**
- `next/navigation` - Router and navigation hooks
- `next-intl` - Translation hooks
- `@/lib/supabase/client` - Supabase client
- Environment variables

**Custom mocks:**
Define in `jest.setup.ts` for global mocks
Define in test files for test-specific mocks

## Writing Unit Tests

### Admin Authentication Test Example

```typescript
import { isUserAdmin } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('Admin Authentication', () => {
  it('should return true for admin user', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { is_admin: true },
                error: null,
              })
            ),
          })),
        })),
      })),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const result = await isUserAdmin('test-user-id')
    expect(result).toBe(true)
  })
})
```

### Best Practices

1. **Test File Naming**: `*.test.ts` or `*.test.tsx`
2. **Mock External Dependencies**: Always mock Supabase, API calls, etc.
3. **Clear Test Names**: Use descriptive `it()` statements
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Clean Up**: Use `beforeEach()` and `afterEach()` for setup/teardown

## Writing E2E Tests

### Signin Flow Test Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Authentication', () => {
  test('should display signin page', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await expect(page).toHaveTitle(/Baba Mara/)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })
})
```

### E2E Best Practices

1. **Test File Naming**: `*.spec.ts`
2. **User-Centric**: Test from user's perspective
3. **Stable Selectors**: Use roles, labels, text over CSS selectors
4. **Independent Tests**: Each test should be standalone
5. **Clean State**: Reset state between tests

## Test Coverage

### Current Coverage (Phase 8 - Initial)

```
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

**Covered Areas:**
- ✅ Admin authentication utilities
- ✅ E2E auth flows (signin, signup, guest)
- ✅ E2E dashboard navigation
- ✅ E2E payment flow
- ✅ E2E admin panel access

**To Be Covered:**
- Reading creation logic
- Payment processing
- Voice call functionality
- AI response generation
- Transaction handling
- Error logging
- User credit management

### Coverage Goals

**Unit Tests:**
- Auth utilities: 100%
- Payment utilities: 90%+
- Reading utilities: 90%+
- Helper functions: 80%+

**Integration Tests:**
- API routes: 80%+
- Database operations: 80%+

**E2E Tests:**
- Critical user flows: 100%
- Payment flows: 100%
- Admin flows: 90%+

## Continuous Integration

### Pre-commit Checks

```bash
# Recommended pre-commit hook
npm run lint
npm test
npm run build
```

### CI/CD Pipeline (Vercel)

```yaml
# Automatic on push to main
- Install dependencies
- Run linting
- Run unit tests
- Run build
- Deploy if all pass
```

### E2E in CI

```bash
# Run headless in CI environment
CI=true npm run test:e2e
```

## Debugging Tests

### Jest Debugging

```bash
# Run specific test file
npm test -- __tests__/lib/auth/admin.test.ts

# Run specific test
npm test -- --testNamePattern="should return true for admin"

# Update snapshots
npm test -- -u
```

### Playwright Debugging

```bash
# Debug mode with browser
npm run test:e2e:debug

# UI mode for interactive debugging
npm run test:e2e:ui

# Generate test code
npx playwright codegen http://localhost:3000
```

### Common Issues

**Issue: Tests timeout**
- Increase timeout in test: `test.setTimeout(30000)`
- Check for unresolved promises
- Verify mocks are properly configured

**Issue: Snapshot mismatch**
- Review snapshot diff
- Update if change is intentional: `npm test -- -u`
- Check for dynamic data (dates, IDs)

**Issue: E2E tests fail locally**
- Ensure dev server is running: `npm run dev`
- Check browser installation: `npx playwright install`
- Verify environment variables

## Mock Data

### Test User Data

```typescript
// Admin user
{
  id: 'admin-user-id',
  email: 'admin@test.com',
  is_admin: true,
  credits: 100
}

// Regular user
{
  id: 'regular-user-id',
  email: 'user@test.com',
  is_admin: false,
  credits: 5
}

// Guest user
{
  id: 'guest-user-id',
  email: null,
  is_guest: true,
  credits: 1
}
```

### Test Transaction Data

```typescript
{
  id: 'transaction-id',
  user_id: 'user-id',
  amount: 1.99,
  credits_purchased: 1,
  transaction_type: 'single',
  status: 'completed',
  payment_id: 'payten-payment-id',
}
```

## Environment Variables for Testing

```bash
# .env.test (create for test environment)
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Performance Testing

### Load Testing (Future)

```bash
# Using Artillery or K6
npm run test:load
```

### Lighthouse CI (Future)

```bash
# Performance metrics in CI
npm run test:lighthouse
```

## Accessibility Testing

### Playwright Accessibility

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/en')

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

## Visual Regression Testing (Future)

```typescript
test('should match homepage screenshot', async ({ page }) => {
  await page.goto('/en')
  await expect(page).toHaveScreenshot('homepage.png')
})
```

## Test Maintenance

### Regular Tasks

1. **Weekly**: Review test coverage
2. **Monthly**: Update dependencies
3. **Per Feature**: Add corresponding tests
4. **Per Bug Fix**: Add regression test

### Updating Tests

When updating application code:
1. Run all tests to identify failures
2. Update test assertions if behavior changed intentionally
3. Fix bugs if tests reveal issues
4. Add new tests for new functionality

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Next Steps

### Phase 8 Testing Tasks

1. ✅ Testing infrastructure setup
2. ⏳ Write unit tests for all utilities
3. ⏳ Write integration tests for API routes
4. ⏳ Write E2E tests for all critical flows
5. ⏳ Achieve 80% code coverage
6. ⏳ Set up CI/CD test pipeline
7. ⏳ Add visual regression tests

### Future Enhancements

- Component visual testing with Chromatic
- Performance testing with Lighthouse CI
- Load testing with K6
- Security testing with OWASP ZAP
- Mutation testing with Stryker
