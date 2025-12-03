# ALIS Syncfusion Adapter Refactor Plan

## Pre-Requisites

### Git Setup

```bash
# Stash uncommitted changes (reader.js, index.js, delegation.js, finder.js)
git stash save "WIP: Syncfusion experiments before refactor"

# Create feature branch
git checkout -b feature/syncfusion-adapter-refactor

# Verify clean state
git status  # Should show nothing to commit
```

### Current State Summary

**Already Committed** (in HEAD):

- `src/collector/reader.js` lines 31-42: Basic Syncfusion `ej2_instances` detection
- `src/validation/adapters/`: Full adapter system (AdapterRegistry, DefaultAdapter, SyncfusionAdapter)
- Validation uses adapters, Collection has inline SF code

**Uncommitted** (to stash):

- Enhanced hidden select lookup for dropdown names
- Capture phase in delegation.js for SF events
- Modified collector/index.js

---

## Phase 0: Environment & Discovery

### 0.1 Workflow Scripts

Create reliable build harness first:

```json
// package.json - add to scripts
{
  "alis:build": "node scripts/build.js",
  "alis:test": "npm run test:unit && npm run build && npm run test:e2e",
  
  "dotnet:dir": "cd SandboxApp/SeniorLivingPortal",
  "dotnet:build": "cd SandboxApp/SeniorLivingPortal && dotnet build --nologo",
  "dotnet:run": "cd SandboxApp/SeniorLivingPortal && dotnet run --urls=http://localhost:5025",
  "dotnet:copy-alis": "Copy-Item -Path dist/alis.js -Destination SandboxApp/SeniorLivingPortal/wwwroot/lib/alis/alis.js -Force",
  
  "sf:refresh": "npm run alis:build && npm run dotnet:copy-alis"
}
```

### 0.2 Verify .NET App Builds

Before creating catalog, verify .NET app works:

```bash
npm run dotnet:build  # Must succeed
```

### 0.3 Create Syncfusion Control Catalog

Create `SandboxApp/SeniorLivingPortal/Views/Home/SyncfusionCatalog.cshtml`:

Each control with:

- Unique ID and name attribute
- Console log button to inspect `ej2_instances`
- Form submit to test collection

**Controls to catalog**:

| Category | Tag Helper | Test ID |
|----------|------------|---------|
| Text | `<ejs-textbox>` | sf-textbox |
| Text | `<ejs-textarea>` | sf-textarea |
| Text | `<ejs-maskedtextbox>` | sf-masked |
| Numeric | `<ejs-numerictextbox>` | sf-numeric |
| Numeric | `<ejs-slider>` | sf-slider |
| Numeric | `<ejs-rating>` | sf-rating |
| Selection | `<ejs-dropdownlist>` | sf-dropdown |
| Selection | `<ejs-combobox>` | sf-combo |
| Selection | `<ejs-autocomplete>` | sf-auto |
| Selection | `<ejs-multiselect>` | sf-multi |
| Date | `<ejs-datepicker>` | sf-date |
| Date | `<ejs-timepicker>` | sf-time |
| Date | `<ejs-datetimepicker>` | sf-datetime |
| Date | `<ejs-daterangepicker>` | sf-daterange |
| Boolean | `<ejs-checkbox>` | sf-check |
| Boolean | `<ejs-radiobutton>` | sf-radio |
| Boolean | `<ejs-switch>` | sf-switch |
| Complex | `<ejs-colorpicker>` | sf-color |
| Complex | `<ejs-uploader>` | sf-upload |

### 0.4 Document DOM Patterns

Create `SandboxApp/SYNCFUSION_DOM_PATTERNS.md`:

For each control, document:

```markdown
## ejs-dropdownlist

### Tag Helper
<ejs-dropdownlist id="myDrop" name="SelectedId" ... />

### Rendered DOM
- Wrapper: `<span class="e-input-group e-control-wrapper e-ddl">`
- Hidden: `<select id="myDrop_hidden" name="SelectedId" aria-hidden="true">`
- Visible: `<input id="myDrop" class="e-dropdownlist" readonly>`

### ej2_instances
- Location: `document.getElementById('myDrop').ej2_instances[0]`
- Value: `instance.value`
- Text: `instance.text`

### Name Attribute
- On: Hidden select (`#myDrop_hidden`)
- NOT on: Visible input

### Events
- Native: Does NOT fire standard `change` on visible input
- Syncfusion: `instance.change` callback
```

### 0.5 Discovery Outcome Review

After documenting all controls, review findings:

- Which patterns are common?
- Which controls need special handling?
- Does architecture need adjustment?

**Gate**: Do NOT proceed to Phase 1 until DOM patterns are documented and reviewed.

---

## Phase 1: Architecture Decision

Based on Phase 0 findings, finalize approach.

### 1.1 Decision: Keep Adapters in validation/adapters/

**Rationale**: Moving files breaks tests. Instead:

- Keep `src/validation/adapters/` location
- Export shared registry from there
- Collection imports from validation/adapters/

### 1.2 Adapter Interface Extension

Current interface:

```typescript
interface Adapter {
  name: string;
  matches(element): boolean;
  getValue(element): unknown;
  getVisibleElement(element): Element;
  getBlurTarget(element): Element;
}
```

Add for collection:

```typescript
interface Adapter {
  // ... existing
  getName(element): string | null;  // NEW: For collection
}
```

### 1.3 Shared Registry Export

```javascript
// src/validation/adapters/index.js (NEW)
import { AdapterRegistry } from './AdapterRegistry.js';
import { DefaultAdapter } from './DefaultAdapter.js';
import { SyncfusionAdapter } from './SyncfusionAdapter.js';

// Shared instance
export const adapterRegistry = new AdapterRegistry();

// Auto-register default (always available)
// Syncfusion registered via ALIS.adapters.enableSyncfusion()

export { AdapterRegistry, DefaultAdapter, SyncfusionAdapter };
```

### 1.4 Syncfusion Registration Strategy

**Decision**: Syncfusion is OPT-IN, not auto-registered.

```javascript
// User enables in their app:
ALIS.adapters.enableSyncfusion();

// Or registers custom adapter:
ALIS.adapters.register(MyCustomAdapter);
```

---

## Phase 2: Implementation (TDD)

### 2.1 Add getName to types.js

```javascript
// src/validation/adapters/types.js
/**
 * @typedef {Object} Adapter
 * @property {string} name
 * @property {(element: Element) => boolean} matches
 * @property {(element: Element) => unknown} getValue
 * @property {(element: Element) => string|null} getName  // ADD
 * @property {(element: Element) => Element} getVisibleElement
 * @property {(element: Element) => Element} getBlurTarget
 */
```

### 2.2 Add getName to DefaultAdapter

Test first:

```typescript
// tests/unit/validation/adapters/DefaultAdapter.test.ts
it('getName returns name attribute', () => {
  const input = document.createElement('input');
  input.setAttribute('name', 'email');
  expect(DefaultAdapter.getName(input)).toBe('email');
});

it('getName returns null if no name', () => {
  const input = document.createElement('input');
  expect(DefaultAdapter.getName(input)).toBeNull();
});
```

Implementation:

```javascript
// src/validation/adapters/DefaultAdapter.js
getName(element) {
  return element.getAttribute('name');
}
```

### 2.3 Add getName to SyncfusionAdapter

Test first:

```typescript
// tests/unit/validation/adapters/SyncfusionAdapter.test.ts
it('getName returns name from element', () => {
  const input = createSyncfusionInput('test');
  input.input.setAttribute('name', 'fieldName');
  expect(SyncfusionAdapter.getName(input.input)).toBe('fieldName');
});

it('getName finds hidden select for dropdowns', () => {
  const input = document.createElement('input');
  input.id = 'myDropdown';
  input['ej2_instances'] = [{ value: '42' }];
  
  const hidden = document.createElement('select');
  hidden.id = 'myDropdown_hidden';
  hidden.setAttribute('name', 'selectedId');
  document.body.appendChild(hidden);
  document.body.appendChild(input);
  
  expect(SyncfusionAdapter.getName(input)).toBe('selectedId');
});
```

Implementation:

```javascript
// src/validation/adapters/SyncfusionAdapter.js
getName(element) {
  // Direct name attribute
  const name = element.getAttribute('name');
  if (name) return name;
  
  // Hidden select pattern (dropdowns)
  if (element.id) {
    const hidden = document.getElementById(element.id + '_hidden');
    if (hidden) return hidden.getAttribute('name');
  }
  
  return null;
}
```

### 2.4 Create Shared Registry Export

```javascript
// src/validation/adapters/index.js (NEW FILE)
import { AdapterRegistry } from './AdapterRegistry.js';
import { DefaultAdapter } from './DefaultAdapter.js';
import { SyncfusionAdapter } from './SyncfusionAdapter.js';

// Singleton registry instance
const adapterRegistry = new AdapterRegistry();

export { adapterRegistry, AdapterRegistry, DefaultAdapter, SyncfusionAdapter };
```

### 2.5 Update ValidationEngine

```javascript
// src/validation/ValidationEngine.js
import { adapterRegistry, SyncfusionAdapter } from './adapters/index.js';

export class ValidationEngine {
  #validators = new ValidatorRegistry();
  #adapters = adapterRegistry;  // Use shared, not new
  #display = new ErrorDisplay();

  constructor() {
    // Register validators only
    for (const validator of builtInValidators) {
      this.#validators.register(validator.name, validator.validate);
    }
    // REMOVE: this.#adapters.register(SyncfusionAdapter);
  }
```

### 2.6 Refactor collector/reader.js

Test first:

```typescript
// tests/unit/collector/reader.test.ts
describe('Syncfusion via adapter', () => {
  it('reads value from Syncfusion component', () => {
    const input = document.createElement('input');
    input.setAttribute('name', 'field');
    input['ej2_instances'] = [{ value: 'test-value' }];
    
    // Register Syncfusion adapter
    adapterRegistry.register(SyncfusionAdapter);
    
    expect(readValue(input)).toEqual({ name: 'field', value: 'test-value' });
  });
});
```

Implementation:

```javascript
// src/collector/reader.js
import { adapterRegistry } from '../validation/adapters/index.js';

export function readValue(element) {
  if (!element || !element.getAttribute) return null;

  const adapter = adapterRegistry.getAdapter(element);
  const name = adapter.getName(element);
  
  if (!name) return null;
  if ('disabled' in element && element.disabled) return null;

  // Custom value selectors (keep existing)
  const customValueAttr = element.getAttribute('data-alis-value');
  if (customValueAttr) {
    return { name, value: readCustomValue(customValueAttr) };
  }
  
  const customValueFn = element.getAttribute('data-alis-value-fn');
  if (customValueFn && typeof window !== 'undefined') {
    const fn = window[customValueFn];
    if (typeof fn === 'function') {
      return { name, value: fn(element) };
    }
  }

  // Get value via adapter
  const value = adapter.getValue(element);
  
  // Handle unchecked checkbox/radio (native behavior)
  if (element instanceof HTMLInputElement) {
    if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
      return null;
    }
  }
  
  return value !== null ? { name, value } : null;
}

// REMOVE: Lines 31-42 (old inline Syncfusion code)
// KEEP: readFormValues, readContainerValues, readCustomValue
```

### 2.7 Update collector/index.js

```javascript
// src/collector/index.js
import { adapterRegistry } from '../validation/adapters/index.js';
// ... rest of imports

export function collect(element, options = {}) {
  const source = resolveCollectSource(element, options.collect);
  if (!source) return { data: null, source: null };

  if (source instanceof HTMLFormElement) {
    return { source, data: readFormValues(source) };
  }

  // Self-collection: check if adapter can handle
  if (source === element && element) {
    const adapter = adapterRegistry.getAdapter(element);
    const name = adapter.getName(element);
    
    if (name) {
      const field = readValue(element);
      return { source: element, data: field ? { [field.name]: field.value } : null };
    }
  }

  return { source, data: readContainerValues(source) };
}
```

### 2.8 Update Public API

```javascript
// src/index.js
import { adapterRegistry, SyncfusionAdapter } from './validation/adapters/index.js';

const ALIS = {
  // ... existing
  
  adapters: {
    register: (adapter) => adapterRegistry.register(adapter),
    enableSyncfusion: () => adapterRegistry.register(SyncfusionAdapter),
    
    // Expose for custom adapters
    Syncfusion: SyncfusionAdapter
  }
};
```

---

## Phase 3: Testing

### 3.1 Unit Test Checklist

| Test File | New Tests | Status |
|-----------|-----------|--------|
| `DefaultAdapter.test.ts` | +2 (getName) | |
| `SyncfusionAdapter.test.ts` | +3 (getName, hidden select) | |
| `reader.test.ts` | +5 (adapter integration) | |
| `collector/index.test.ts` | +2 (adapter integration) | |

### 3.2 Run Unit Tests

```bash
npm run test:unit
# ALL MUST PASS before proceeding
```

### 3.3 Build

```bash
npm run build
# Must succeed
```

### 3.4 Run E2E Tests

```bash
npm run test:e2e
# ALL MUST PASS before proceeding
```

---

## Phase 4: .NET Integration

### 4.1 ValidationBuilder.cs

```csharp
// SandboxApp/SeniorLivingPortal/Infrastructure/ValidationBuilder.cs
public class ValidationBuilder
{
    private readonly Dictionary<string, object> _attrs = new()
    {
        ["data-val"] = "true"
    };

    public ValidationBuilder Required(string message)
    {
        _attrs["data-val-required"] = message;
        return this;
    }

    public ValidationBuilder MinLength(int min, string message)
    {
        _attrs["data-val-minlength"] = message;
        _attrs["data-val-minlength-min"] = min;
        return this;
    }

    public ValidationBuilder MaxLength(int max, string message)
    {
        _attrs["data-val-maxlength"] = message;
        _attrs["data-val-maxlength-max"] = max;
        return this;
    }

    public ValidationBuilder Regex(string pattern, string message)
    {
        _attrs["data-val-regex"] = message;
        _attrs["data-val-regex-pattern"] = pattern;
        return this;
    }

    public Dictionary<string, object> Build() => new(_attrs);
}
```

### 4.2 Shared Validation Messages

```csharp
// SandboxApp/SeniorLivingPortal/Validation/ResidentValidationRules.cs
public static class ResidentValidationRules
{
    public static class FirstName
    {
        public const string FieldName = "First Name";
        public const string Required = "First name is required";
        public const string MinLength = "Minimum 2 characters";
        public const string MaxLength = "Maximum 50 characters";
        public const int Min = 2;
        public const int Max = 50;

        public static Dictionary<string, object> HtmlAttributes() =>
            new ValidationBuilder()
                .Required(Required)
                .MinLength(Min, MinLength)
                .MaxLength(Max, MaxLength)
                .Build();
    }
    
    // ... other fields
}
```

### 4.3 Update FluentValidation

```csharp
// SandboxApp/SeniorLivingPortal/Validators/ResidentFormValidator.cs
public ResidentFormValidator()
{
    RuleFor(x => x.FirstName)
        .NotEmpty().WithMessage(ResidentValidationRules.FirstName.Required)
        .MinimumLength(ResidentValidationRules.FirstName.Min)
            .WithMessage(ResidentValidationRules.FirstName.MinLength)
        .MaximumLength(ResidentValidationRules.FirstName.Max)
            .WithMessage(ResidentValidationRules.FirstName.MaxLength);
}
```

### 4.4 Update Razor Views

```html
@{
    var firstNameAttrs = ResidentValidationRules.FirstName.HtmlAttributes();
}

<ejs-textbox id="firstName" 
             name="FirstName" 
             value="@Model.FirstName"
             htmlAttributes="firstNameAttrs">
</ejs-textbox>
<span data-valmsg-for="FirstName" class="text-danger"></span>
```

### 4.5 Enable Syncfusion in site.js

```javascript
// wwwroot/js/site.js
document.addEventListener('DOMContentLoaded', () => {
    ALIS.init({ telemetry: { level: 'debug' } });
    ALIS.adapters.enableSyncfusion();
});
```

---

## Phase 5: Event Bridge

For Syncfusion events that need ALIS trigger:

```javascript
// wwwroot/js/alis-syncfusion-bridge.js
const ALIS_SyncfusionBridge = {
    init(container = document.body) {
        this.bindAllControls(container);
    },
    
    reinit(container) {
        this.bindAllControls(container);
    },
    
    bindAllControls(container) {
        container.querySelectorAll('[id]').forEach(el => {
            if (el.ej2_instances?.length && !el._alisBound) {
                this.bindControl(el);
            }
        });
    },
    
    bindControl(element) {
        const instance = element.ej2_instances[0];
        const trigger = element.getAttribute('data-alis-trigger');
        
        // Only hook if using alis:trigger
        if (!trigger?.includes('alis:trigger')) return;
        
        const original = instance.change;
        instance.change = (args) => {
            if (original) original.call(instance, args);
            ALIS.forceTrigger(element);
        };
        
        element._alisBound = true;
    }
};

window.ALIS_SyncfusionBridge = ALIS_SyncfusionBridge;
```

---

## Phase 6: Documentation

### 6.1 Update README.md

Add section:

```markdown
## Syncfusion Integration

ALIS supports Syncfusion EJ2 controls via an optional adapter.

### Enable Syncfusion Support
```javascript
ALIS.init();
ALIS.adapters.enableSyncfusion();
```

### Event Triggers

For change events, use the bridge:

```javascript
ALIS_SyncfusionBridge.init();
```
```

### 6.2 Update GAPS.md

Document final solution, remove outdated entries.

### 6.3 Commit & PR

```bash
git add -A
git commit -m "feat: Unified adapter system for Syncfusion integration"
git push origin feature/syncfusion-adapter-refactor
# Create PR to main
```

---

## Execution Checklist

| Phase | Task | Gate |
|-------|------|------|
| Pre | `git stash` uncommitted changes | Clean working dir |
| Pre | `git checkout -b feature/...` | On feature branch |
| 0.1 | Create workflow scripts | Scripts work |
| 0.2 | Verify .NET builds | `dotnet build` succeeds |
| 0.3 | Create SyncfusionCatalog.cshtml | Page renders |
| 0.4 | Document DOM patterns | MD file complete |
| 0.5 | Review findings | Architecture confirmed |
| 2.1 | Add getName to types.js | N/A |
| 2.2 | Add getName to DefaultAdapter + tests | Tests pass |
| 2.3 | Add getName to SyncfusionAdapter + tests | Tests pass |
| 2.4 | Create adapters/index.js | No errors |
| 2.5 | Update ValidationEngine | Tests pass |
| 2.6 | Refactor reader.js + tests | Tests pass |
| 2.7 | Update collector/index.js | Tests pass |
| 2.8 | Update public API | Tests pass |
| 3.1 | Run all unit tests | ALL PASS |
| 3.2 | Run build | SUCCESS |
| 3.3 | Run all e2e tests | ALL PASS |
| 4.x | .NET integration | Manual test |
| 5.x | Event bridge | Manual test |
| 6.x | Documentation | Complete |
| Final | PR to main | Merged |

---

## Rollback Plan

If things go wrong:

```bash
# Abandon feature branch
git checkout main
git branch -D feature/syncfusion-adapter-refactor

# Restore stashed changes if needed
git stash pop
```

---

## Quality Rules

1. **TDD**: Write test BEFORE implementation
2. **One unit at a time**: Complete each step before next
3. **Gate checks**: ALL tests must pass before proceeding
4. **No hacks**: Clean, maintainable code only
5. **Delete old code**: Remove inline SF logic from reader.js
6. **Small commits**: One logical change per commit

