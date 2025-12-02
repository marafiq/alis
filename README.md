# ALIS - AJAX-Like Intelligent System

<div align="center">

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/marafiq/alis)
[![Tests](https://img.shields.io/badge/tests-446%20passing-brightgreen)](https://github.com/marafiq/alis)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

**A declarative fetch module that enhances native HTML forms with zero configuration.**

[Quick Start](#-quick-start) • [Features](#-features) • [Examples](#-examples) • [API Reference](#-api-reference) • [Demos](#-live-demos)

</div>

---

## ✨ What is ALIS?

ALIS transforms your HTML forms into AJAX-powered interfaces with a single attribute. No JavaScript required for common patterns.

```html
<!-- Before: Full page reload -->
<form action="/api/users" method="post">
  <input name="email" type="email">
  <button type="submit">Save</button>
</form>

<!-- After: AJAX with automatic UI updates -->
<form action="/api/users" method="post" data-alis data-alis-target="result">
  <input name="email" type="email">
  <button type="submit">Save</button>
</form>
<div id="result"></div>
```

**That's it.** ALIS automatically:
- ✅ Prevents default form submission
- ✅ Collects form data as `FormData` (ASP.NET Core compatible)
- ✅ Disables the submit button during request
- ✅ Shows loading indicators
- ✅ Swaps the response HTML into `#result`
- ✅ Displays validation errors from `ProblemDetails` responses
- ✅ Restores button state on completion

---

## 🚀 Quick Start

### Installation

```html
<!-- CDN (recommended for quick start) -->
<script src="https://unpkg.com/alis-fetch/dist/alis.min.js"></script>

<!-- Or download and self-host -->
<script src="/path/to/alis.min.js"></script>
```

### Initialize

```html
<script>
  ALIS.init();
</script>
```

### Your First ALIS Form

```html
<!DOCTYPE html>
<html>
<head>
  <script src="alis.min.js"></script>
</head>
<body>
  <form action="/api/contact" method="post" data-alis data-alis-target="message">
    <input name="email" type="email" placeholder="Your email">
    <textarea name="message" placeholder="Your message"></textarea>
    <button type="submit">Send</button>
  </form>
  
  <div id="message"></div>
  
  <script>ALIS.init();</script>
</body>
</html>
```

---

## 🎯 Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Declarative** | Configure via HTML attributes, no JavaScript needed |
| **Form Enhancement** | Works with native `<form>` elements |
| **Button Actions** | Any element can trigger requests with `data-alis-{method}` |
| **Auto Disable** | Buttons disabled during request, restored after |
| **Loading Indicators** | Show spinners or loading classes automatically |
| **Target Swap** | Response HTML swapped into target element |
| **Validation Display** | Server validation errors shown next to fields |
| **Client Validation** | Full client-side validation with `.NET` conventions |
| **Debounce/Throttle** | Built-in support for search inputs |
| **Confirmation** | Confirm dialogs before destructive actions |
| **Retry Logic** | Automatic retry on network failures |
| **Concurrency Control** | Prevent duplicate requests |

### Advanced Features

| Feature | Description |
|---------|-------------|
| **Programmatic API** | Full JavaScript API for complex scenarios |
| **Custom Serializers** | JSON, FormData, URL-encoded, or custom |
| **Hooks System** | Before/After hooks for custom logic |
| **Syncfusion Support** | Adapters for third-party controls |
| **Focus Management** | Preserves focus during swaps |
| **Cascading Dropdowns** | Easy dependent select implementation |

---

## 📖 Examples

### 1. Form Submission with Target Swap

```html
<form action="/api/users" method="post" 
      data-alis 
      data-alis-target="user-list">
  <input name="name" placeholder="Name">
  <input name="email" type="email" placeholder="Email">
  <button type="submit">Add User</button>
</form>

<div id="user-list">
  <!-- Server response HTML will be swapped here -->
</div>
```

### 2. Button Click Actions

```html
<!-- GET request -->
<button data-alis-get="/api/users" data-alis-target="users">
  Load Users
</button>

<!-- POST request -->
<button data-alis-post="/api/refresh" data-alis-target="data">
  Refresh Data
</button>

<!-- DELETE with confirmation -->
<button data-alis-delete="/api/users/123" 
        data-alis-target="result"
        data-alis-confirm-message="Delete this user?">
  Delete
</button>
```

### 3. Debounced Search

```html
<input type="text" 
       name="query"
       placeholder="Search..."
       data-alis-get="/api/search"
       data-alis-trigger="input delay:500ms"
       data-alis-target="search-results"
       data-alis-collect="self">

<div id="search-results"></div>
```

The search request is debounced by 500ms - only fires after the user stops typing.

### 4. Loading Indicators

```html
<!-- Add class to button during request -->
<button data-alis-post="/api/save" 
        data-alis-target="result"
        data-alis-indicator="is-loading">
  <span class="spinner"></span> Save
</button>

<!-- Show a hidden element -->
<button data-alis-post="/api/save" 
        data-alis-target="result"
        data-alis-indicator="#loading-spinner">
  Save
</button>
<div id="loading-spinner" hidden>Loading...</div>
```

### 5. Server-Side Validation (ProblemDetails)

ALIS automatically displays validation errors from RFC 7807 ProblemDetails responses:

```html
<form action="/api/register" method="post" data-alis data-alis-target="result">
  <div>
    <input name="email" type="email">
    <span data-valmsg-for="email"></span> <!-- Error appears here -->
  </div>
  <div>
    <input name="password" type="password">
    <span data-valmsg-for="password"></span>
  </div>
  <button type="submit">Register</button>
</form>
```

Server returns:
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation failed",
  "status": 400,
  "errors": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### 6. Client-Side Validation

Enable client-side validation with `data-alis-validate="true"`:

```html
<form action="/api/register" method="post" 
      data-alis 
      data-alis-target="result"
      data-alis-validate="true">
  
  <input name="email" type="email"
         data-val="true"
         data-val-required="Email is required"
         data-val-email="Please enter a valid email">
  <span data-valmsg-for="email"></span>
  
  <input name="password" type="password"
         data-val="true"
         data-val-required="Password is required"
         data-val-minlength="Password must be at least 8 characters"
         data-val-minlength-min="8">
  <span data-valmsg-for="password"></span>
  
  <input name="confirmPassword" type="password"
         data-val="true"
         data-val-equalto="Passwords must match"
         data-val-equalto-other="password">
  <span data-valmsg-for="confirmPassword"></span>
  
  <button type="submit">Register</button>
</form>
```

**Available Validators:**
- `data-val-required` - Field is required
- `data-val-email` - Valid email format
- `data-val-minlength` / `data-val-maxlength` - String length
- `data-val-length` - Combined min/max length
- `data-val-range` - Numeric range
- `data-val-regex` - Custom pattern
- `data-val-number` - Numeric value
- `data-val-url` - Valid URL
- `data-val-equalto` - Match another field

### 7. Cascading Dropdowns

```html
<select name="country" 
        data-alis-get="/api/states"
        data-alis-trigger="change"
        data-alis-target="state-container"
        data-alis-collect="self">
  <option value="">Select Country</option>
  <option value="US">United States</option>
  <option value="CA">Canada</option>
</select>

<div id="state-container">
  <select name="state">
    <option value="">Select State</option>
  </select>
</div>
```

### 8. Hooks for Custom Logic

```html
<form action="/api/users" method="post" 
      data-alis 
      data-alis-target="result"
      data-alis-on-before="showLoading"
      data-alis-on-after="hideLoading, refreshGrid">
  <!-- form fields -->
</form>

<script>
  window.showLoading = function(ctx) {
    document.body.classList.add('loading');
  };
  
  window.hideLoading = function(ctx) {
    document.body.classList.remove('loading');
  };
  
  window.refreshGrid = function(ctx) {
    if (ctx.success) {
      myGrid.refresh();
    }
  };
</script>
```

### 9. Confirm Before Action

```html
<!-- Using browser confirm -->
<button data-alis-delete="/api/items/1" 
        data-alis-target="result"
        data-alis-confirm-message="Are you sure you want to delete this item?">
  Delete
</button>

<!-- Using custom confirm handler -->
<button data-alis-delete="/api/items/1" 
        data-alis-target="result"
        data-alis-confirm="customConfirm">
  Delete
</button>

<script>
  ALIS.confirm.register('customConfirm', async (ctx) => {
    return await showMyCustomModal('Delete this item?');
  });
</script>
```

### 10. Programmatic API

```javascript
// Trigger an element's ALIS configuration
await ALIS.trigger(document.querySelector('#my-button'));

// Make a request programmatically
const ctx = await ALIS.request({
  url: '/api/users',
  method: 'POST',
  data: { name: 'John', email: 'john@example.com' },
  target: '#result'
});

if (ctx.success) {
  console.log('User created:', ctx.body);
}

// Use an element as base, with overrides
const ctx = await ALIS.from(myElement).execute({
  data: { extra: 'data' }
});
```

---

## 📚 API Reference

### HTML Attributes

#### Core Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-alis` | Enable ALIS on a form | `<form data-alis>` |
| `data-alis-get` | GET request URL | `data-alis-get="/api/items"` |
| `data-alis-post` | POST request URL | `data-alis-post="/api/items"` |
| `data-alis-put` | PUT request URL | `data-alis-put="/api/items/1"` |
| `data-alis-patch` | PATCH request URL | `data-alis-patch="/api/items/1"` |
| `data-alis-delete` | DELETE request URL | `data-alis-delete="/api/items/1"` |
| `data-alis-target` | CSS selector for response | `data-alis-target="result"` |

#### Behavior Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-alis-trigger` | Event to trigger request | `data-alis-trigger="change"` |
| `data-alis-collect` | Data collection source | `data-alis-collect="self"` |
| `data-alis-swap` | Swap strategy | `data-alis-swap="outerHTML"` |
| `data-alis-indicator` | Loading indicator | `data-alis-indicator="is-loading"` |
| `data-alis-confirm` | Confirm handler name | `data-alis-confirm="deleteConfirm"` |
| `data-alis-confirm-message` | Browser confirm message | `data-alis-confirm-message="Sure?"` |
| `data-alis-validate` | Enable client validation | `data-alis-validate="true"` |
| `data-alis-retry` | Retry configuration | `data-alis-retry="false"` |

#### Hook Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-alis-on-before` | Before request hooks | `data-alis-on-before="fn1, fn2"` |
| `data-alis-on-after` | After request hooks | `data-alis-on-after="cleanup"` |

### Trigger Syntax

```
"event"                     → Event on this element
"event delay:Xms"           → Debounced event
"event throttle:Xms"        → Throttled event
```

**Examples:**
```html
data-alis-trigger="click"
data-alis-trigger="change"
data-alis-trigger="input delay:500ms"
data-alis-trigger="scroll throttle:200ms"
```

### Collect Syntax

```
"self"                      → This element only
"none"                      → No data collection
"closest:form"              → Nearest ancestor form
"closest:.container"        → Nearest ancestor with class
"#selector"                 → Specific element
```

### Swap Strategies

| Strategy | Description |
|----------|-------------|
| `innerHTML` | Replace inner content (default) |
| `outerHTML` | Replace entire element |
| `none` | Don't swap, just make request |

### JavaScript API

```typescript
// Initialize ALIS
ALIS.init(config?: ALISConfig): void

// Trigger element's ALIS config
ALIS.trigger(element: Element): Promise<Context>

// Programmatic request
ALIS.request(options: RequestOptions): Promise<Context>

// Build from element
ALIS.from(element: Element).execute(overrides?: object): Promise<Context>

// Register confirm handler
ALIS.confirm.register(name: string, handler: (ctx) => Promise<boolean>): void

// Validation API
ALIS.validation.validateField(field: Element): ValidationResult
ALIS.validation.validateForm(form: HTMLFormElement): ValidationResult
```

---

## 🎨 Styling

### CSS Classes Applied by ALIS

```css
/* Applied to trigger element during request */
.alis-disabled { }

/* Applied to invalid fields */
.input-validation-error { }
.input-validation-valid { }

/* Applied to validation message spans */
.field-validation-error { }
.field-validation-valid { }
```

### Example Styles

```css
/* Loading state */
button[aria-busy="true"] {
  opacity: 0.7;
  cursor: wait;
}

/* Validation errors */
.input-validation-error {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.field-validation-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Loading indicator */
.is-loading .spinner {
  display: inline-block;
}

.spinner {
  display: none;
}
```

---

## 🔧 Configuration

### Global Configuration

```javascript
ALIS.init({
  // Request defaults
  timeout: 30000,
  credentials: 'same-origin',
  
  // Retry defaults
  retry: {
    maxAttempts: 3,
    statusCodes: [408, 429, 500, 502, 503, 504],
    baseDelay: 1000,
    maxDelay: 30000
  },
  
  // Coordination
  duplicateRequest: 'ignore',  // 'ignore', 'abort-previous', 'queue'
  
  // Errors
  errors: {
    handlerThrows: 'continue',
    targetNotFound: 'warn',
    collectFails: 'abort'
  },
  
  // Telemetry
  telemetry: 'none'  // 'none', 'error', 'warn', 'info', 'debug'
});
```

---

## 🌐 Live Demos

Run the demos locally:

```bash
# Clone the repository
git clone https://github.com/marafiq/alis.git
cd alis

# Install dependencies
npm install

# Build the library
npm run build

# Start demo server
npm run demo:serve
```

Then open http://localhost:4173 in your browser.

### Available Demos

| Demo | Description |
|------|-------------|
| `/demos/form-submit/` | Basic form submission |
| `/demos/debounce/` | Debounced search input |
| `/demos/client-validation/` | Client-side validation |
| `/demos/syncfusion-validation/` | Syncfusion component validation |
| `/demos/methods/` | HTTP methods (GET, POST, PUT, DELETE) |
| `/demos/indicators/` | Loading indicators |
| `/demos/hooks-advanced/` | Hooks, modals, and toasts |
| `/demos/confirm-delete/` | Confirmation dialogs |
| `/demos/islands/` | Dynamic content islands |
| `/demos/comprehensive-form/` | All form control types |

---

## 🧪 Testing

ALIS has comprehensive test coverage:

```bash
# Run unit tests (Vitest + happy-dom)
npm run test:unit

# Run E2E tests (Playwright)
npm run test:e2e

# Run all tests
npm test
```

**Test Coverage:**
- 335 unit tests
- 111 E2E integration tests
- All happy paths covered
- Edge cases and regressions tested

---

## 📦 Bundle Sizes

| Bundle | Size | Gzipped |
|--------|------|---------|
| `alis.min.js` | ~25KB | ~8KB |
| `alis.esm.js` | ~35KB | ~10KB |

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

```bash
# Clone and install
git clone https://github.com/marafiq/alis.git
cd alis
npm install

# Run tests before making changes
npm run lint
npm run test:unit
npm run build
npm run test:e2e

# Make your changes, then run tests again
npm run lint && npm run test:unit && npm run build && npm run test:e2e
```

---

## 📄 License

MIT © [Adnan Rafiq](https://github.com/marafiq)

---

## 🙏 Acknowledgments

- Inspired by [htmx](https://htmx.org/) and [Turbo](https://turbo.hotwired.dev/)
- Built with modern JavaScript, no dependencies
- Designed for ASP.NET Core integration

---

<div align="center">

**[⬆ Back to Top](#alis---ajax-like-intelligent-system)**

Made with ❤️ for the web development community

</div>

