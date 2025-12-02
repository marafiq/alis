# ALIS Code Review & Testing Guide for AI Assistants

This guide is designed for AI assistants (Gemini, Claude, GPT, etc.) to effectively review the ALIS codebase, increase integration test coverage, and find critical bugs.

---

## 🎯 Project Overview

**ALIS** (AJAX-Like Intelligent System) is a declarative fetch module that enhances HTML forms with AJAX capabilities. 

### Key Architecture

```
Entry Points → Context Creation → Pipeline Steps → Response Handling → DOM Updates
```

**Pipeline Steps (in order):**
1. `validateStep` - Validates configuration
2. `confirmStep` - Handles confirmation dialogs
3. `coordinateStep` - Prevents duplicate requests
4. `collectStep` - Gathers form/element data
5. `stateCaptureStep` - Captures original element state
6. `stateApplyStep` - Applies loading states (disable, aria-busy)
7. `hooksBeforeStep` - Runs before hooks
8. `clientValidationStep` - Client-side validation
9. `requestBuildStep` - Builds fetch Request
10. `requestExecuteStep` - Executes fetch with retry
11. `responseParseStep` - Parses response body
12. `responseRouteStep` - Routes based on status code
13. `validationDisplayStep` - Shows server validation errors
14. `swapStep` - Swaps HTML into target
15. `stateRestoreStep` - Restores original state
16. `hooksAfterStep` - Runs after hooks
17. `focusStep` - Manages focus restoration
18. `coordinateCleanupStep` - Cleans up request tracking

---

## 🔍 Critical Areas to Review

### 1. Data Collection (`src/collector/`)

**Files:** `reader.js`, `resolver.js`, `index.js`

**What to test:**
- All HTML input types: text, email, password, number, date, hidden, file, range, color
- Checkboxes: single, groups (same name), checked vs unchecked
- Radio buttons: groups, none selected
- Select: single, multiple, none selected
- Textarea
- Disabled fields (should NOT be collected)
- Fields with `data-alis-value` custom selectors
- Fields with `data-alis-value-fn` custom functions
- Nested property names: `Employee.Address.City`
- Array notation: `Tags[0]`, `Tags[1]`

**Potential bugs to look for:**
```javascript
// Does readValue handle all input types?
// src/collector/reader.js

// Edge case: What if element.selectedOptions is undefined?
if (element instanceof HTMLSelectElement) {
  if (element.multiple) {
    const values = Array.from(element.selectedOptions).map(option => option.value);
    // BUG: selectedOptions might be undefined in some environments
  }
}
```

### 2. Request Building (`src/pipeline/steps/request-build.js`)

**What to test:**
- GET requests append data as query string
- POST/PUT/PATCH/DELETE send body
- Form elements default to FormData serialization
- Non-form elements default to JSON serialization
- `data-alis-serialize="json"` override works
- `data-alis-serialize="urlencoded"` override works
- Headers are set correctly
- Content-Type is set based on serializer

**Potential bugs:**
```javascript
// Does buildQueryString handle arrays correctly?
// Are special characters URL-encoded?
// What happens with nested objects in query string?
```

### 3. Trigger System (`src/trigger/`)

**Files:** `parser.js`, `matcher.js`, `finder.js`, `delegation.js`

**What to test:**
- Default triggers: form→submit, input→change, button→click
- Custom triggers: `data-alis-trigger="change"`
- Debounce: `data-alis-trigger="input delay:500ms"`
- Throttle: `data-alis-trigger="scroll throttle:200ms"`
- Event bubbling and delegation
- Multiple triggers on same element

**Potential bugs:**
```javascript
// Does debounce correctly capture the CURRENT value at execution time?
// Or does it capture stale value from when debounce started?

// src/trigger/delegation.js
function handleDebounce(element, delay, callback) {
  // BUG RISK: If callback captures element.value at definition time,
  // it will be stale when the debounced function executes
}
```

### 4. State Management (`src/state/`)

**Files:** `capture.js`, `apply.js`, `restore.js`, `manager.js`

**What to test:**
- Button disabled during request, re-enabled after
- `aria-busy="true"` set on form during request
- Loading indicators shown/hidden
- State restored even on error
- State restored even on abort
- Debounced requests should NOT disable input elements

**Potential bugs:**
```javascript
// src/state/restore.js
// BUG FOUND: This was clearing select options!
element.textContent = state.textContent || '';
// FIX: Only apply to buttons
if (element instanceof HTMLButtonElement) {
  element.textContent = state.textContent || '';
}
```

### 5. Validation (`src/validation/`)

**What to test:**
- Server-side validation (ProblemDetails JSON)
- Client-side validation with `data-alis-validate="true"`
- All validators: required, email, minlength, maxlength, range, regex, number, url, equalto
- Error display in `data-valmsg-for` spans
- Error clearing on valid input ("forgiving on input")
- Error showing on blur ("angry on blur")
- Case-insensitive field name matching
- Nested field names: `Employee.Address.City`
- Syncfusion component validation

**Potential bugs:**
```javascript
// Does equalto validator find the other field correctly?
// src/validation/validators/equalto.js
const otherField = element.form?.querySelector(`[name="${params.other}"]`);
// BUG RISK: What if params.other contains special characters?
// What if the field is outside the form?
```

### 6. Swap Strategies (`src/swap/`, `src/pipeline/steps/swap.js`)

**What to test:**
- `innerHTML` swap (default)
- `outerHTML` swap
- `none` swap (no DOM modification)
- JSON response stringified for swap
- Focus preservation during swap
- Cursor position preservation in text inputs

**Potential bugs:**
```javascript
// Does outerHTML swap break event listeners?
// Does innerHTML swap preserve form state in other fields?
// What happens if target element is removed during request?
```

### 7. Concurrency (`src/pipeline/steps/coordinate.js`)

**What to test:**
- Default behavior: ignore duplicate requests
- `abort-previous` strategy
- `queue` strategy (if implemented)
- Cleanup after request completes
- Cleanup after request errors

---

## 🧪 Integration Test Patterns

### Pattern 1: Form Submission Flow

```typescript
test('complete form submission flow', async ({ page }) => {
  // 1. Setup route mock
  await page.route('**/api/endpoint', async (route) => {
    // Capture request details
    const method = route.request().method();
    const body = route.request().postData();
    const contentType = route.request().headers()['content-type'];
    
    // Verify request
    expect(method).toBe('POST');
    expect(contentType).toContain('multipart/form-data');
    
    // Return response
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<div>Success</div>'
    });
  });

  // 2. Navigate and wait for ALIS
  await page.goto('/test-page.html');
  await page.waitForFunction(() => window.__ALIS_INIT === true);

  // 3. Fill form
  await page.fill('[name="field"]', 'value');

  // 4. Submit
  await page.click('button[type="submit"]');

  // 5. Verify result
  await expect(page.locator('#result')).toContainText('Success');
});
```

### Pattern 2: Validation Error Flow

```typescript
test('displays validation errors from ProblemDetails', async ({ page }) => {
  await page.route('**/api/endpoint', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Validation failed',
        status: 400,
        errors: {
          email: ['Email is required'],
          'Address.City': ['City is required']  // Test nested
        }
      })
    });
  });

  await page.goto('/test-page.html');
  await page.waitForFunction(() => window.__ALIS_INIT === true);
  await page.click('button[type="submit"]');

  // Verify errors appear next to fields
  await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Email is required');
  await expect(page.locator('[data-valmsg-for="Address.City"]')).toContainText('City is required');
  
  // Verify aria-invalid is set
  await expect(page.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
});
```

### Pattern 3: Debounce Flow

```typescript
test('debounces input events correctly', async ({ page }) => {
  let requestCount = 0;
  let lastValue = '';

  await page.route('**/api/search**', async (route) => {
    requestCount++;
    const url = new URL(route.request().url());
    lastValue = url.searchParams.get('query') || '';
    await route.fulfill({ status: 200, body: `Results: ${lastValue}` });
  });

  await page.goto('/debounce-test.html');
  await page.waitForFunction(() => window.__ALIS_INIT === true);

  // Type rapidly (faster than debounce delay)
  await page.locator('#search').pressSequentially('hello', { delay: 50 });

  // Wait for debounce (500ms) + buffer
  await page.waitForTimeout(700);

  // Should only make ONE request with final value
  expect(requestCount).toBe(1);
  expect(lastValue).toBe('hello');
  
  // Input should still have focus
  await expect(page.locator('#search')).toBeFocused();
  
  // Input should NOT be disabled
  await expect(page.locator('#search')).toBeEnabled();
});
```

### Pattern 4: Array Parameters in GET

```typescript
test('handles array parameters in GET requests', async ({ page }) => {
  let capturedUrl = '';

  await page.route('**/api/filter**', async (route) => {
    capturedUrl = route.request().url();
    await route.fulfill({ status: 200, body: 'OK' });
  });

  await page.goto('/filter-test.html');
  await page.waitForFunction(() => window.__ALIS_INIT === true);

  // Check multiple checkboxes with same name
  await page.check('[name="ids"][value="1"]');
  await page.check('[name="ids"][value="3"]');
  await page.check('[name="ids"][value="5"]');

  await page.click('button[type="submit"]');
  await expect(page.locator('#result')).toContainText('OK');

  // Verify URL has multiple ids params
  const url = new URL(capturedUrl);
  const ids = url.searchParams.getAll('ids');
  expect(ids).toEqual(['1', '3', '5']);
});
```

---

## 🐛 Bug Hunting Checklist

### Race Conditions
- [ ] What happens if user clicks submit twice rapidly?
- [ ] What happens if response arrives after element is removed from DOM?
- [ ] What happens if user navigates away during request?
- [ ] Does debounce capture current or stale values?

### Edge Cases
- [ ] Empty form submission
- [ ] Form with only disabled fields
- [ ] Form with no fields
- [ ] Select with no options
- [ ] Multi-select with no selection
- [ ] Checkbox group with none checked
- [ ] Radio group with none selected
- [ ] Hidden input with empty value
- [ ] Input with special characters: `&`, `=`, `?`, `#`, `<`, `>`
- [ ] Input with unicode characters
- [ ] Input with newlines (textarea)
- [ ] Very long input values
- [ ] Nested forms (invalid HTML but should handle gracefully)

### Error Handling
- [ ] Network failure
- [ ] Timeout
- [ ] 500 server error
- [ ] 404 not found
- [ ] Invalid JSON response
- [ ] Empty response body
- [ ] Response without Content-Type header
- [ ] CORS errors

### State Management
- [ ] Button re-enabled after success
- [ ] Button re-enabled after error
- [ ] Button re-enabled after abort
- [ ] aria-busy removed after completion
- [ ] Loading indicator hidden after completion
- [ ] Focus restored correctly
- [ ] Cursor position preserved in text inputs

### Validation
- [ ] Server errors display correctly
- [ ] Server errors clear on re-submit
- [ ] Client errors prevent submission
- [ ] Client errors clear when fixed
- [ ] Case-insensitive field matching works
- [ ] Nested field names work: `Employee.Address.City`
- [ ] Array field names work: `Items[0].Name`

---

## 📁 Test File Locations

```
tests/
├── unit/                           # Vitest unit tests
│   ├── api/                        # API entry points
│   ├── collector/                  # Data collection
│   ├── pipeline/steps/             # Pipeline steps
│   ├── state/                      # State management
│   ├── trigger/                    # Trigger system
│   ├── validation/                 # Validation module
│   │   ├── adapters/               # UI adapters
│   │   ├── validators/             # Individual validators
│   │   └── triggers/               # Field triggers
│   └── ...
│
├── integration/
│   ├── flows/                      # Playwright E2E tests
│   │   ├── happy-paths.spec.ts     # 90% use cases
│   │   ├── comprehensive-controls.spec.ts  # All form controls
│   │   ├── client-validation.spec.ts
│   │   ├── debounce.spec.ts
│   │   ├── form-edge-cases.spec.ts
│   │   └── ...
│   │
│   └── pages/                      # HTML fixtures
│       ├── form-submit.html
│       ├── form-submit-validation.html
│       ├── comprehensive-controls.html
│       └── ...
│
└── setup/                          # Test setup files
```

---

## 🚀 Running Tests

```bash
# Unit tests (fast, no browser)
npm run test:unit

# E2E tests (requires build first)
npm run build
npm run test:e2e

# Specific test file
npm run test:e2e -- tests/integration/flows/happy-paths.spec.ts

# With grep filter
npm run test:e2e -- --grep "debounce"

# Full CI pipeline
npm run lint && npm run test:unit && npm run build && npm run test:e2e
```

---

## 📝 Adding New Tests

### Unit Test Template

```typescript
// tests/unit/feature/feature.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { myFunction } from '../../../src/feature/feature.js';

describe('myFunction', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does something specific', () => {
    // Arrange
    const input = createTestElement();
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe(expected);
  });

  it('handles edge case', () => {
    // Test edge case
  });

  it('throws on invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### E2E Test Template

```typescript
// tests/integration/flows/feature.spec.ts
import { test, expect } from '@playwright/test';

async function waitForALIS(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const w = window as typeof window & { __ALIS_INIT?: boolean };
    return w.__ALIS_INIT === true;
  });
}

test.describe('Feature Name', () => {
  test('scenario description', async ({ page }) => {
    // Setup mock
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, body: 'OK' });
    });

    // Navigate
    await page.goto('/tests/integration/pages/fixture.html');
    await waitForALIS(page);

    // Interact
    await page.fill('[name="field"]', 'value');
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('#result')).toContainText('OK');
  });
});
```

---

## 🎯 Priority Areas for Coverage Increase

1. **High Priority:**
   - File uploads (FormData with files)
   - Abort controller integration
   - Custom serializers
   - Error recovery scenarios

2. **Medium Priority:**
   - Hooks with async functions
   - Multiple hooks on same element
   - Dynamic element addition (islands)
   - Memory leak prevention

3. **Lower Priority:**
   - Telemetry/logging
   - Custom swap strategies
   - Input reader registry

---

## ✅ Quality Rules

1. **No hacks** - Clean, maintainable solutions only
2. **TDD** - Write failing test first, then implement
3. **One unit at a time** - Complete each test before moving on
4. **Delete dead code** - Remove unused code immediately
5. **No skipped tests** - All tests must pass
6. **Explicit assertions** - Test specific behaviors, not implementation

---

## 🔗 Key Files to Understand

| File | Purpose |
|------|---------|
| `src/index.js` | Public API entry point |
| `src/api/pipeline.js` | Pipeline step orchestration |
| `src/pipeline/runner.js` | Pipeline execution engine |
| `src/pipeline/context.js` | Request context factory |
| `src/trigger/delegation.js` | Event delegation setup |
| `src/collector/reader.js` | Form data collection |
| `src/validation/ValidationEngine.js` | Client validation orchestration |
| `src/validation/display.js` | Error display logic |

---

Good luck with your review! Focus on the critical paths first, then expand coverage to edge cases.

