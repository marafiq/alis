# ALIS Fetch - Final Implementation Plan

**ALIS** = AJAX-Like Intelligent System

---

## 1. Overview

A declarative fetch module that enhances native HTML forms and provides programmatic API for third-party controls. Built on pipeline architecture for testability and extensibility.

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| Native First | Forms use `action` + `method`, not custom attributes |
| No Ambiguity | Multiple methods = Error, missing target = defined behavior |
| Pipeline | Each step is pure function, independently testable |
| Extensible | Registries for swap, serialize, inputs, triggers |
| Programmatic | Full JS API for Syncfusion and similar controls |
| Correct | No race conditions, state always restored, errors defined |

---

## 2. Architecture

### 2.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENTRY POINTS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│  │  Declarative │   │ ALIS.trigger │   │   ALIS.request       │    │
│  │  (DOM Event) │   │  (element)   │   │   (options)          │    │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘    │
│         │                  │                      │                 │
│         ▼                  ▼                      ▼                 │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    CREATE CONTEXT                         │      │
│  │         (from element attributes OR options)              │      │
│  └────────────────────────┬─────────────────────────────────┘      │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                      PIPELINE                             │      │
│  └────────────────────────┬─────────────────────────────────┘      │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                   RETURN CONTEXT                          │      │
│  │            (success, body, validation, etc.)              │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Context In                                                          │
│      │                                                               │
│      ▼                                                               │
│  ┌────────────┐                                                      │
│  │  VALIDATE  │───▶ Error? ───▶ ABORT                               │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │  CONFIRM   │───▶ Rejected? ───▶ ABORT (graceful)                 │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │  COORDINATE│───▶ Duplicate? ───▶ Based on strategy               │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │STATE:CAPTURE                                                      │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │STATE:APPLY │ (disable, indicators, aria-busy)                    │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │HOOKS:BEFORE│ (global + element handlers)                         │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │  COLLECT   │ (form, container, field, or provided data)          │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │REQUEST:BUILD                                                      │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐      ┌─────────┐                                    │
│  │REQUEST:EXEC│─────▶│  RETRY  │◀──┐                                │
│  └─────┬──────┘      │  LOOP   │───┘ (if retryable)                 │
│        │             └────┬────┘                                     │
│        ▼                  │                                          │
│  ┌────────────┐◀──────────┘                                         │
│  │RESPONSE:PARSE                                                     │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │RESPONSE:ROUTE                                                     │
│  └─────┬──────┘                                                      │
│        │                                                             │
│        ├───▶ 2xx ───▶ HOOKS:SUCCESS ───▶ SWAP                       │
│        │                                                             │
│        ├───▶ 400 + ProblemDetails ───▶ VALIDATION:DISPLAY           │
│        │                              ───▶ HOOKS:ERROR               │
│        │                                                             │
│        └───▶ Other ───▶ HOOKS:ERROR                                 │
│                                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │STATE:RESTORE (always, even on error)                             │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │HOOKS:AFTER │ (always)                                            │
│  └─────┬──────┘                                                      │
│        ▼                                                             │
│  Context Out                                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Trigger Flow (Declarative)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENT DELEGATION                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Document Event (click, submit, change, focusout)                   │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────┐                       │
│  │  Walk up from event.target               │                       │
│  │                                          │                       │
│  │  At each element:                        │                       │
│  │    ├─ Is ALIS element?                   │                       │
│  │    │   ├─ Event matches trigger? ──▶ FOUND                       │
│  │    │   └─ Event doesn't match? ──▶ STOP (null)                   │
│  │    │                                     │                       │
│  │    ├─ Is interactive (no ALIS)? ──▶ STOP (null)                  │
│  │    │                                     │                       │
│  │    └─ Continue up                        │                       │
│  │                                          │                       │
│  │  Hit body? ──▶ STOP (null)               │                       │
│  └──────────────────────────────────────────┘                       │
│      │                                                               │
│      ▼                                                               │
│  Found ALIS Element?                                                 │
│      │                                                               │
│      ├─ No ───▶ Do nothing                                          │
│      │                                                               │
│      └─ Yes ───▶ Prevent default (if form/link)                     │
│                  ───▶ Create context from element                    │
│                  ───▶ Run pipeline                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Attribute Specification

### 3.1 Forms (Native Enhancement)

```html
<form 
  action="/api/users"           <!-- URL (native) -->
  method="post"                 <!-- Method (native) -->
  enctype="..."                 <!-- Encoding (native) -->
  data-alis                     <!-- Enable ALIS handling -->
  data-alis-target="result"     <!-- Where response goes -->
  data-alis-*                   <!-- Other options -->
>
```

| Attribute | Source | Required | Description |
|-----------|--------|----------|-------------|
| `action` | Native | Yes | Request URL |
| `method` | Native | No | HTTP method (default: GET) |
| `enctype` | Native | No | Form encoding |
| `data-alis` | ALIS | Yes | Enables ALIS |

### 3.2 Non-Form Elements

```html
<button 
  data-alis-post="/api/save"    <!-- Method + URL -->
  data-alis-target="result"     <!-- Where response goes -->
  data-alis-*                   <!-- Other options -->
>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-alis-{method}` | Yes (one) | Method + URL combined |

**Methods:** `get`, `post`, `put`, `patch`, `delete`

**Rule:** Only ONE method attribute allowed. Multiple = Error.

### 3.3 Common Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-alis-target` | - | Selector for response (auto-prepends `#`) |
| `data-alis-trigger` | *smart* | Event specification |
| `data-alis-collect` | *smart* | Data collection source |
| `data-alis-indicator` | - | Loading indicator |
| `data-alis-confirm` | - | Confirmation handler |
| `data-alis-swap` | `innerHTML` | Swap strategy |
| `data-alis-retry` | `true` | Retry policy |
| `data-alis-vals` | - | Additional JSON values |

### 3.4 Lifecycle Hooks

| Attribute | When | Description |
|-----------|------|-------------|
| `data-alis-on-before` | Before request | Handler names (comma-separated) |
| `data-alis-on-success` | After 2xx | Handler names |
| `data-alis-on-error` | After 4xx/5xx | Handler names |
| `data-alis-on-after` | Always, end | Handler names |

### 3.5 Smart Defaults

**Trigger:**

| Element | Default |
|---------|---------|
| `form` | `submit` |
| `input`, `select`, `textarea` | `change` |
| All others | `click` |

**Collect:**

| Context | Default |
|---------|---------|
| `form[data-alis]` | Form itself |
| Input/select/textarea with `data-alis-*` | Single field (bulk edit) |
| Button inside `form[data-alis]` | None (form handles it) |
| All others | None |

**Serialize (automatic):**

| Method | Has Files? | enctype | Result |
|--------|-----------|---------|--------|
| GET | - | - | URL query string |
| POST/PUT/PATCH/DELETE | No | (default) | JSON |
| POST/PUT/PATCH/DELETE | Yes | - | FormData |
| POST/PUT/PATCH/DELETE | - | `multipart/form-data` | FormData |
| POST/PUT/PATCH/DELETE | - | `application/x-www-form-urlencoded` | URLEncoded |

**Disable (automatic):**

| Element | Behavior |
|---------|----------|
| `button`, `input[type=submit]` | `disabled` + `aria-busy="true"` |
| `a` | `aria-disabled="true"` + class `alis-disabled` |
| `form` | `aria-busy="true"` |

### 3.6 Trigger Syntax

```
"event"                    → Event on this element
"selector@event"           → Event on matching children
"sel1@event1, sel2@event2" → Multiple triggers
```

**Examples:**

```html
<!-- Default: click -->
<button data-alis-post="/save">Save</button>

<!-- Explicit: form submit -->
<form data-alis data-alis-trigger="submit">

<!-- Delegated: button inside container -->
<div data-alis-get="/load" data-alis-trigger=".load-btn@click">
  <button class="load-btn">Load</button>
  <button onclick="other()">Other</button>
</div>

<!-- Multiple triggers -->
<div data-alis-get="/search" data-alis-trigger=".btn@click, input@keyenter">
```

### 3.7 Indicator Syntax

```
"className"                → Class on trigger element
"#selector"                → Show element (remove hidden)
"className@target"         → Class on data-alis-target
"className@#selector"      → Class on specific element
"is-loading, #spinner"     → Multiple (comma-separated)
```

### 3.8 Collect Syntax

```
"self"                     → This element (form or field)
"none"                     → No collection
"#selector"                → Specific element
"closest:form"             → Walk up, find form (error if not found)
"closest:.panel"           → Walk up, find .panel (error if not found)
```

---

## 4. Public API

### 4.1 Initialization

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

### 4.2 Process (for Dynamic Content)

```javascript
// Process container for ALIS elements (validation, init hooks)
const count = ALIS.process(container);

// Events already work via delegation
```

### 4.3 Programmatic API

```javascript
// Trigger element's ALIS config
const ctx = await ALIS.trigger(element);

// Full programmatic request
const ctx = await ALIS.request({
  url: '/api/items',
  method: 'POST',
  data: { name: 'Test' },
  target: '#result',
  onSuccess: (ctx) => showToast('Saved!')
});

// Use element as base, override
const ctx = await ALIS.from(element).execute({
  url: '/api/override',
  data: { extra: 'data' }
});
```

### 4.4 Request Options

```typescript
interface RequestOptions {
  // Required
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  // Data
  data?: object;
  serialize?: 'json' | 'formdata' | 'urlencoded';
  
  // Target
  target?: string | Element;
  swap?: 'innerHTML' | 'outerHTML' | 'none' | string;
  
  // Indicators
  element?: Element;          // For disable/aria-busy
  indicator?: string | Element;
  indicatorClass?: string;
  
  // Handlers (inline functions)
  onBefore?: (ctx) => void | false;
  onSuccess?: (ctx) => void;
  onError?: (ctx) => void;
  onAfter?: (ctx) => void;
  
  // Options
  confirm?: () => Promise<boolean>;
  retry?: boolean | RetryOptions;
  headers?: Record<string, string>;
  timeout?: number;
}
```

### 4.5 Context (Return Value)

```typescript
interface Context {
  // Identity
  id: string;
  
  // Request
  request: { url, method, headers, body };
  
  // Response
  response: Response | null;
  body: any;
  success: boolean;
  
  // Status
  aborted: boolean;
  error: Error | null;
  validation: ProblemDetails | null;
  
  // Timing
  startTime: number;
  endTime: number;
  duration: number;
  attempts: number;
}
```

### 4.6 Registries

```javascript
// Swap strategies
ALIS.swap.register('morph', (target, content) => {
  morphdom(target, content);
  return target;
});

// Serializers
ALIS.serialize.register('xml', (data) => ({
  body: toXML(data),
  contentType: 'application/xml'
}));

// Input readers (for custom elements)
ALIS.inputs.register('my-datepicker', (element) => ({
  name: element.name,
  value: element.dataset.isoValue
}));

// Retry policies
ALIS.retry.register('aggressive', {
  maxAttempts: 5,
  statusCodes: [500, 502, 503, 504, 429],
  baseDelay: 500
});
```

### 4.7 Hooks & Handlers

```javascript
// Global hooks (all requests)
ALIS.on('before', (ctx) => {
  ctx.request.headers.set('X-Request-Id', uuid());
});

ALIS.on('error', (ctx) => {
  if (ctx.response?.status === 401) {
    window.location = '/login';
  }
});

// Named handlers (for attributes)
ALIS.handlers.register('showToast', (ctx) => {
  toast.success('Saved!');
});

ALIS.handlers.register('clearForm', (ctx) => {
  ctx.element?.reset();
});

// Confirm handlers
ALIS.confirm.register('deleteConfirm', async (ctx) => {
  return await modal.confirm('Delete this item?');
});
```

### 4.8 Abort

```javascript
ALIS.abort(contextId);  // Abort specific
ALIS.abortAll();        // Abort all pending
```

### 4.9 Telemetry

```javascript
ALIS.debug('info');     // Set level
ALIS.debug(true);       // Alias for 'debug'
ALIS.debug(false);      // Alias for 'none'

ALIS.telemetry.setAdapter(customAdapter);
ALIS.telemetry.flush();
```

---

## 5. Module Structure

```
alis-fetch/
├── src/
│   ├── index.js                      → Public API
│   │
│   ├── api/
│   │   ├── trigger.js                → ALIS.trigger()
│   │   ├── request.js                → ALIS.request()
│   │   └── from.js                   → ALIS.from()
│   │
│   ├── config/
│   │   ├── defaults.js               → Default values
│   │   └── merger.js                 → Merge global + element
│   │
│   ├── registry/
│   │   ├── base.js                   → Base registry class
│   │   ├── swap.js                   → Swap strategies
│   │   ├── serialize.js              → Serializers
│   │   ├── inputs.js                 → Input readers
│   │   ├── triggers.js               → Trigger types
│   │   └── retry.js                  → Retry policies
│   │
│   ├── pipeline/
│   │   ├── runner.js                 → Execute pipeline
│   │   ├── context.js                → Context factory
│   │   └── steps/
│   │       ├── validate.js
│   │       ├── confirm.js
│   │       ├── coordinate.js
│   │       ├── state-capture.js
│   │       ├── state-apply.js
│   │       ├── hooks-before.js
│   │       ├── collect.js
│   │       ├── request-build.js
│   │       ├── request-execute.js
│   │       ├── response-parse.js
│   │       ├── response-route.js
│   │       ├── validation-display.js
│   │       ├── swap.js
│   │       ├── state-restore.js
│   │       └── hooks-after.js
│   │
│   ├── trigger/
│   │   ├── parser.js                 → Parse trigger attribute
│   │   ├── defaults.js               → Default triggers
│   │   ├── matcher.js                → Match event to trigger
│   │   ├── finder.js                 → Find ALIS element from event
│   │   └── delegation.js             → Setup document listeners
│   │
│   ├── collector/
│   │   ├── resolver.js               → Resolve collect source
│   │   ├── reader.js                 → Read input values
│   │   └── index.js                  → Main collection entry
│   │
│   ├── serializers/
│   │   ├── json.js
│   │   ├── formdata.js
│   │   └── urlencoded.js
│   │
│   ├── swap/
│   │   ├── inner-html.js
│   │   ├── outer-html.js
│   │   └── none.js
│   │
│   ├── retry/
│   │   ├── backoff.js                → Calculate delays
│   │   └── executor.js               → Retry loop
│   │
│   ├── validation/
│   │   ├── problem-details.js        → Parse RFC 7807
│   │   └── display.js                → Display errors on fields
│   │
│   ├── confirm/
│   │   ├── registry.js               → Confirm handlers
│   │   └── element.js                → Element-based confirm
│   │
│   ├── hooks/
│   │   ├── global.js                 → Global hooks
│   │   └── handlers.js               → Named handlers
│   │
│   ├── coordinator/
│   │   └── index.js                  → Request coordination
│   │
│   ├── state/
│   │   ├── manager.js                → Safe state management
│   │   ├── capture.js                → Capture original state
│   │   ├── apply.js                  → Apply effects
│   │   └── restore.js                → Restore state
│   │
│   ├── telemetry/
│   │   ├── levels.js                 → Level definitions
│   │   ├── emitter.js                → Emit events
│   │   └── adapters/
│   │       ├── console.js            → Console adapter
│   │       └── noop.js               → No-op adapter
│   │
│   ├── errors/
│   │   ├── types.js                  → Error classes
│   │   └── strategy.js               → Error handling
│   │
│   └── utils/
│       ├── attribute-reader.js       → Read data-alis-* attributes
│       └── element-utils.js          → DOM utilities
│
└── tests/
    ├── unit/
    │   └── (mirrors src/)
    └── integration/
        └── flows/
```

---

## 6. Error Strategy

### 6.1 Error Types

```javascript
// src/errors/types.js
export class ALISError extends Error {
  constructor(message, code, context) {
    super(message);
    this.code = code;
    this.context = context;
  }
}

export class ValidationError extends ALISError {}
export class ConfigError extends ALISError {}
export class NetworkError extends ALISError {}
export class AbortError extends ALISError {}
```

### 6.2 Error Configuration

```javascript
ALIS.init({
  errors: {
    handlerThrows: 'continue',    // 'continue', 'abort'
    targetNotFound: 'warn',       // 'error', 'warn', 'ignore'
    collectFails: 'abort',        // 'abort', 'continue-empty'
    duplicateRequest: 'ignore'    // 'ignore', 'abort-previous', 'queue'
  }
});
```

### 6.3 Defined Behaviors

| Scenario | Behavior |
|----------|----------|
| Multiple method attributes | Error immediately |
| Empty URL | Error immediately |
| `closest:x` not found | Error immediately |
| `#target` not found | Based on config (default: warn) |
| Handler throws | Based on config (default: continue) |
| Element removed during request | State restore skipped safely |
| Duplicate request on element | Based on config (default: ignore) |
| Network error | Retry (if configured), then error |
| Timeout | Retry (if configured), then error |

---

## 7. Telemetry

### 7.1 Levels

| Level | Events |
|-------|--------|
| `none` | Nothing |
| `error` | Errors, timeouts, aborts |
| `warn` | + Handler missing, retries, validation errors |
| `info` | + Request start/complete, swap, complete |
| `debug` | + Everything (state, handlers, collect, etc.) |

### 7.2 Events

```
trigger              → Element found, event matched
validate:error       → Configuration invalid
confirm:start        → Before confirm
confirm:complete     → After confirm (result)
coordinate:duplicate → Duplicate request detected
state:capture        → Original state captured
state:apply          → Effects applied
state:restore        → Effects restored
hooks:before:start   → Before handlers starting
hooks:before:handler → Individual handler
hooks:before:complete
collect:start        → Before collection
collect:complete     → Collection result
request:build        → Request built
request:start        → Fetch starting
request:retry        → Retry attempt
request:timeout      → Request timed out
request:abort        → Request aborted
request:complete     → Fetch complete
response:parse       → Response parsed
response:route       → Routing decision
validation:parse     → Problem Details found
validation:display   → Errors displayed
hooks:success:*      → Success handlers
hooks:error:*        → Error handlers
swap:start           → Before swap
swap:complete        → After swap
hooks:after:*        → After handlers
complete             → Pipeline complete
error                → Any error
```

---

## 8. Implementation Phases

### Phase 1: Foundation (No DOM)

**Week 1**

| File | Functions | Tests |
|------|-----------|-------|
| `config/defaults.js` | `DEFAULTS`, `METHODS`, `ALIS_SELECTOR` | 3 |
| `config/merger.js` | `mergeConfig(global, element)` | 5 |
| `errors/types.js` | Error classes | 4 |
| `errors/strategy.js` | `handleError(error, strategy)` | 6 |
| `registry/base.js` | `createRegistry()` | 5 |
| `telemetry/levels.js` | `LEVELS`, `getEventLevel`, `shouldLog` | 8 |
| `telemetry/emitter.js` | `emit`, `setLevel`, `setAdapter` | 6 |

**Total: ~37 tests**

### Phase 2: Registries (No DOM)

**Week 2**

| File | Functions | Tests |
|------|-----------|-------|
| `serializers/json.js` | `serialize(data)` | 4 |
| `serializers/formdata.js` | `serialize(data)` | 5 |
| `serializers/urlencoded.js` | `serialize(data)` | 4 |
| `registry/serialize.js` | Registry + built-ins | 6 |
| `swap/inner-html.js` | `swap(target, content)` | 3 |
| `swap/outer-html.js` | `swap(target, content)` | 3 |
| `swap/none.js` | `swap(target, content)` | 2 |
| `registry/swap.js` | Registry + built-ins | 5 |
| `registry/inputs.js` | Registry | 4 |
| `registry/triggers.js` | Registry | 4 |
| `retry/backoff.js` | `calculateDelay`, `addJitter` | 6 |
| `registry/retry.js` | Registry + built-in policies | 5 |

**Total: ~51 tests**

### Phase 3: Pipeline Core (Minimal DOM)

**Week 3**

| File | Functions | Tests |
|------|-----------|-------|
| `pipeline/context.js` | `createContext`, `createContextFromOptions` | 8 |
| `pipeline/runner.js` | `runPipeline(context)` | 6 |
| `pipeline/steps/validate.js` | `validateStep(ctx)` | 8 |
| `pipeline/steps/confirm.js` | `confirmStep(ctx)` | 6 |
| `pipeline/steps/coordinate.js` | `coordinateStep(ctx)` | 6 |
| `pipeline/steps/hooks-before.js` | `hooksBeforeStep(ctx)` | 5 |
| `pipeline/steps/hooks-after.js` | `hooksAfterStep(ctx)` | 5 |
| `hooks/global.js` | `on`, `off`, `executeGlobal` | 6 |
| `hooks/handlers.js` | `register`, `execute` | 6 |

**Total: ~56 tests**

### Phase 4: Collection (DOM Required)

**Week 4**

| File | Functions | Tests |
|------|-----------|-------|
| `utils/attribute-reader.js` | `getMethodAndUrl`, `getAttribute`, `normalizeSelector`, `getAllAttributes` | 14 |
| `utils/element-utils.js` | `isInteractiveElement`, `isFormField`, `resolveElement` | 10 |
| `collector/reader.js` | `readValue`, `readFormValues`, `readContainerValues` | 18 |
| `collector/resolver.js` | `resolveCollectSource` | 12 |
| `collector/index.js` | `collect(element, url, method)` | 8 |
| `pipeline/steps/collect.js` | `collectStep(ctx)` | 6 |

**Total: ~68 tests**

### Phase 5: Request/Response

**Week 5**

| File | Functions | Tests |
|------|-----------|-------|
| `pipeline/steps/request-build.js` | `requestBuildStep(ctx)` | 8 |
| `pipeline/steps/request-execute.js` | `requestExecuteStep(ctx)` | 10 |
| `retry/executor.js` | `executeWithRetry(request, ctx, options)` | 8 |
| `pipeline/steps/response-parse.js` | `responseParseStep(ctx)` | 6 |
| `pipeline/steps/response-route.js` | `responseRouteStep(ctx)` | 6 |
| `validation/problem-details.js` | `parseProblemDetails`, `isProblemDetails` | 6 |
| `validation/display.js` | `displayErrors`, `clearErrors` | 8 |
| `pipeline/steps/validation-display.js` | `validationDisplayStep(ctx)` | 4 |

**Total: ~56 tests**

### Phase 6: State & Swap

**Week 6**

| File | Functions | Tests |
|------|-----------|-------|
| `state/capture.js` | `captureState(element, config)` | 6 |
| `state/apply.js` | `applyEffects(element, config, captured)` | 8 |
| `state/restore.js` | `restoreState(element, captured)` | 8 |
| `state/manager.js` | `createStateManager(element)` | 6 |
| `pipeline/steps/state-capture.js` | Step | 4 |
| `pipeline/steps/state-apply.js` | Step | 4 |
| `pipeline/steps/state-restore.js` | Step | 4 |
| `pipeline/steps/swap.js` | `swapStep(ctx)` | 6 |
| `state/indicator-parser.js` | `parseIndicator(attr, target)` | 8 |

**Total: ~54 tests**

### Phase 7: Triggers

**Week 7**

| File | Functions | Tests |
|------|-----------|-------|
| `trigger/parser.js` | `parseTrigger`, `parseOne` | 8 |
| `trigger/defaults.js` | `getDefaultTrigger(element)` | 7 |
| `trigger/matcher.js` | `matchesTrigger`, `normalizeEventType` | 10 |
| `trigger/finder.js` | `findTriggerElement(event)` | 12 |
| `trigger/delegation.js` | `setupDelegation`, `teardownDelegation` | 6 |
| `coordinator/index.js` | `canStart`, `markStarted`, `markCompleted` | 8 |

**Total: ~51 tests**

### Phase 8: Confirm & API

**Week 8**

| File | Functions | Tests |
|------|-----------|-------|
| `confirm/registry.js` | `register`, `execute` | 6 |
| `confirm/element.js` | `executeElementConfirm(selector, ctx)` | 6 |
| `api/trigger.js` | `trigger(element, event)` | 6 |
| `api/request.js` | `request(options)` | 8 |
| `api/from.js` | `from(element).execute(overrides)` | 6 |
| `index.js` | Public API | 8 |
| `telemetry/adapters/console.js` | Console adapter | 4 |
| `telemetry/adapters/noop.js` | No-op adapter | 2 |

**Total: ~46 tests**

### Phase 9: Integration Tests

**Week 9**

| Test Suite | Scenarios |
|------------|-----------|
| Form submit flow | Success, validation error, server error |
| Button click flow | Success, error, retry |
| Inline edit flow | Change, blur, PATCH |
| Confirm flow | Accept, reject, element-based |
| Indicator flow | Class, show element, target |
| Programmatic flow | trigger, request, from |
| Concurrent request flow | Ignore, abort-previous |
| Error handling flow | Each error scenario |

**Total: ~30 integration tests**

---

## 9. Test Infrastructure

### 9.1 Setup

```javascript
// tests/setup.js
import { JSDOM } from 'jsdom';

let dom;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost'
  });
  
  global.document = dom.window.document;
  global.window = dom.window;
  global.Element = dom.window.Element;
  global.HTMLFormElement = dom.window.HTMLFormElement;
  global.FormData = dom.window.FormData;
  global.Headers = dom.window.Headers;
  global.Request = dom.window.Request;
  global.Response = dom.window.Response;
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});
```

### 9.2 Helpers

```javascript
// tests/helpers.js
export function createElement(tag, attrs = {}, children = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (children) el.innerHTML = children;
  document.body.appendChild(el);
  return el;
}

export function createForm(attrs = {}, fields = []) {
  const form = createElement('form', attrs);
  fields.forEach(f => {
    const input = document.createElement(f.tag || 'input');
    Object.entries(f).forEach(([k, v]) => {
      if (k !== 'tag') input.setAttribute(k, v);
    });
    form.appendChild(input);
  });
  return form;
}

export function mockFetch(responses) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  
  global.fetch = jest.fn(() => {
    const next = queue.shift() || queue[0];
    return Promise.resolve(new Response(
      typeof next.body === 'string' ? next.body : JSON.stringify(next.body),
      { status: next.status || 200, headers: next.headers }
    ));
  });
}

export function fireEvent(element, eventType, options = {}) {
  const event = new window.Event(eventType, { bubbles: true, ...options });
  element.dispatchEvent(event);
  return event;
}

export async function submitForm(selector) {
  const form = document.querySelector(selector);
  const event = new window.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);
  await flushPromises();
}

export function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
```

### 9.3 Example Unit Test

```javascript
// tests/unit/collector/reader.test.js
import { readValue, readFormValues } from '../../../src/collector/reader.js';
import { createElement, createForm } from '../../helpers.js';

describe('readValue', () => {
  test('returns name and value for text input', () => {
    const input = createElement('input', { 
      type: 'text', 
      name: 'email', 
      value: 'test@example.com' 
    });
    
    const result = readValue(input);
    
    expect(result).toEqual({ 
      name: 'email', 
      value: 'test@example.com' 
    });
  });
  
  test('returns null for input without name', () => {
    const input = createElement('input', { 
      type: 'text', 
      value: 'test' 
    });
    
    const result = readValue(input);
    
    expect(result).toBeNull();
  });
  
  test('returns null for disabled input', () => {
    const input = createElement('input', { 
      type: 'text', 
      name: 'email', 
      value: 'test', 
      disabled: 'disabled' 
    });
    
    const result = readValue(input);
    
    expect(result).toBeNull();
  });
  
  test('returns checked value for checkbox', () => {
    const input = createElement('input', { 
      type: 'checkbox', 
      name: 'agree', 
      checked: 'checked' 
    });
    
    const result = readValue(input);
    
    expect(result).toEqual({ name: 'agree', value: true });
  });
  
  test('returns null for unchecked checkbox', () => {
    const input = createElement('input', { 
      type: 'checkbox', 
      name: 'agree' 
    });
    
    const result = readValue(input);
    
    expect(result).toBeNull();
  });
});
```

### 9.4 Example Integration Test

```javascript
// tests/integration/flows/form-submit.test.js
import { ALIS } from '../../../src/index.js';
import { createForm, mockFetch, submitForm, flushPromises } from '../../helpers.js';

describe('Form Submit Flow', () => {
  beforeEach(() => {
    ALIS.init();
  });
  
  test('successful form submit swaps target', async () => {
    mockFetch({ status: 200, body: '<p>Success</p>' });
    
    createForm({
      action: '/api/users',
      method: 'post',
      'data-alis': '',
      'data-alis-target': 'result'
    }, [
      { name: 'email', value: 'test@example.com' }
    ]);
    
    document.body.innerHTML += '<div id="result">Old</div>';
    
    await submitForm('form');
    
    expect(document.querySelector('#result').innerHTML).toBe('<p>Success</p>');
  });
  
  test('validation error displays on fields', async () => {
    mockFetch({ 
      status: 400, 
      body: {
        type: 'validation',
        title: 'Validation Error',
        errors: {
          email: ['Email is required']
        }
      },
      headers: { 'Content-Type': 'application/problem+json' }
    });
    
    createForm({
      action: '/api/users',
      method: 'post',
      'data-alis': ''
    }, [
      { name: 'email', value: '' }
    ]);
    
    document.body.innerHTML += '<span data-valmsg-for="email"></span>';
    
    await submitForm('form');
    
    expect(document.querySelector('[data-valmsg-for="email"]').textContent)
      .toBe('Email is required');
  });
  
  test('button disabled during request', async () => {
    let resolveRequest;
    global.fetch = jest.fn(() => new Promise(r => { resolveRequest = r; }));
    
    const form = createForm({
      action: '/api/users',
      method: 'post',
      'data-alis': ''
    }, [
      { name: 'email', value: 'test@example.com' }
    ]);
    
    form.innerHTML += '<button type="submit">Submit</button>';
    const button = form.querySelector('button');
    
    submitForm('form');  // Don't await
    await flushPromises();
    
    expect(button.disabled).toBe(true);
    
    resolveRequest(new Response('OK'));
    await flushPromises();
    
    expect(button.disabled).toBe(false);
  });
});
```

---

## 10. Rules

### Development Rules

1. **Test first** - Write test, see it fail, implement, see it pass
2. **One function at a time** - Complete with tests before moving on
3. **No hacks** - If test fails, fix properly or redesign
4. **Delete old code** - No dead code, no commented code
5. **Run all tests** - Before moving to next function
6. **Small commits** - Each function is one logical unit

### Code Rules

1. **Pure functions** - No side effects where possible
2. **Single responsibility** - One function does one thing
3. **Explicit errors** - No undefined behavior
4. **No globals** - Pass dependencies explicitly
5. **TypeScript-friendly** - Clear interfaces even in JS

### Refactoring Rules

1. **Tests must pass before refactor**
2. **Delete old implementation completely**
3. **Tests must pass after refactor**
4. **No "temporary" code**

---

## 11. Summary

**Total Tests:** ~450

**Total Files:** ~55

**Timeline:** ~9 weeks

**Key Decisions:**

| Decision | Reason |
|----------|--------|
| Native forms first | Progressive enhancement, less duplication |
| Pipeline architecture | Testable, extensible steps |
| Registry pattern | Extend without modifying core |
| Explicit error strategy | No undefined behavior |
| Programmatic API | Third-party control integration |
| Coordinator | Handle concurrent requests |
| Safe state manager | Handle edge cases |

---

