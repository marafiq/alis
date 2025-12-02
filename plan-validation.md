# ALIS Validation Module - Implementation Plan

## 🔬 Analysis of Current Architecture

### What Already Exists
1. **Serializers** (`src/registry/serialize.js`): `json`, `formdata`, `urlencoded` - all working
2. **Validation Display** (`src/validation/display.js`): Basic `displayErrors` and `clearErrors`
3. **Config attribute** (`data-alis-serialize`): Already parsed in `requestBuildStep`
4. **Pipeline architecture**: Extensible step-based design

### Key Insight from Requirements
The plan correctly identifies that **ASP.NET Core model binding** works with:
- `application/x-www-form-urlencoded` → Handles `Employee.FirstName` dot notation ✅
- `application/json` → Expects `{ "Employee": { "FirstName": "..." } }` nested objects ❌

**Current default is `json`** - needs to be `formdata` for form submissions.

---

## 🎯 Implementation Strategy

### Phase 0: Core Fixes (Pre-requisite)
Fix the serialization default and enhance error display for case-insensitive matching.

### Phase 1: Client-Side Validation Infrastructure
Build the validation module following the same patterns as existing ALIS code.

---

## 📦 Development Units

### Phase 0: ALIS Core Fixes

#### Unit 0a: Form Serialization Default (6 tests)
**File**: `src/pipeline/steps/request-build.js` (modify)

| # | Test | Description |
|---|------|-------------|
| 1 | Form element uses `formdata` serializer by default | Not `json` |
| 2 | Non-form element uses `json` serializer by default | Buttons, divs, etc. |
| 3 | `data-alis-serialize="json"` overrides to JSON | Explicit opt-in |
| 4 | `data-alis-serialize="urlencoded"` works | Explicit choice |
| 5 | FormData preserves dot-notation keys | `Employee.FirstName` stays as-is |
| 6 | FormData handles file inputs | Blob/File support |

**Implementation**:
```javascript
// In requestBuildStep, change line 36:
// FROM: const serializerName = typeof ctx.config.serialize === 'string' ? ctx.config.serialize : 'json';
// TO:
const isFormElement = ctx.element instanceof HTMLFormElement;
const defaultSerializer = isFormElement ? 'formdata' : 'json';
const serializerName = typeof ctx.config.serialize === 'string' ? ctx.config.serialize : defaultSerializer;
```

#### Unit 0b: Case-Insensitive Field Matching (6 tests)
**File**: `src/validation/display.js` (modify), `src/validation/field-matcher.js` (new)

| # | Test | Description |
|---|------|-------------|
| 1 | Exact match found | `Employee.FirstName` → `Employee.FirstName` |
| 2 | Case-insensitive fallback | `Employee.FirstName` → `employee.firstname` |
| 3 | Prefers exact over case-insensitive | When both exist |
| 4 | Array notation matches | `Contacts[0].Name` |
| 5 | Returns null if no match | Graceful handling |
| 6 | Handles null/undefined input | Edge cases |

**Implementation**:
```javascript
// src/validation/field-matcher.js
export function findFieldByName(form, serverFieldName) {
  if (!form || !serverFieldName) return null;
  
  // 1. Exact match
  let field = form.querySelector(`[name="${serverFieldName}"]`);
  if (field) return field;
  
  // 2. Case-insensitive fallback
  const lowerName = serverFieldName.toLowerCase();
  const fields = form.querySelectorAll('[name]');
  return Array.from(fields).find(f => 
    f.getAttribute('name')?.toLowerCase() === lowerName
  ) || null;
}

export function findValidationSpan(form, serverFieldName) {
  if (!form || !serverFieldName) return null;
  
  // 1. Exact match
  let span = form.querySelector(`[data-valmsg-for="${serverFieldName}"]`);
  if (span) return span;
  
  // 2. Case-insensitive fallback
  const lowerName = serverFieldName.toLowerCase();
  const spans = form.querySelectorAll('[data-valmsg-for]');
  return Array.from(spans).find(s => 
    s.dataset.valmsgFor?.toLowerCase() === lowerName
  ) || null;
}
```

#### Unit 0c: Enhanced Error Display (6 tests)
**File**: `src/validation/display.js` (modify)

| # | Test | Description |
|---|------|-------------|
| 1 | Uses case-insensitive span lookup | Integration |
| 2 | Uses case-insensitive input lookup | For aria-invalid |
| 3 | Adds `field-validation-error` class to span | Standard class |
| 4 | Adds `input-validation-error` class to input | Standard class |
| 5 | Clears classes on `clearErrors` | Clean slate |
| 6 | Handles Syncfusion wrapper visibility | Add error class to visible wrapper |

---

### Phase 1: Validation Core Infrastructure

#### Unit 1: ValidationResult (8 tests)
**File**: `src/validation/ValidationResult.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Creates valid result | `ValidationResult.valid()` |
| 2 | Creates invalid result with message | `ValidationResult.invalid("Required")` |
| 3 | `isValid` property returns boolean | Getter |
| 4 | `message` property returns string or null | Getter |
| 5 | Immutable - cannot modify after creation | Frozen object |
| 6 | `combine` merges multiple results | Static method |
| 7 | Combined result is invalid if any invalid | Logic |
| 8 | Combined result collects all messages | Array |

#### Unit 2: ValidatorRegistry (8 tests)
**File**: `src/validation/ValidatorRegistry.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Registers a validator | `register('required', fn)` |
| 2 | Retrieves a validator | `get('required')` |
| 3 | Returns undefined for unknown | Graceful |
| 4 | Lists all validators | `keys()` |
| 5 | Allows override with flag | `register(..., { override: true })` |
| 6 | Throws on duplicate without flag | Protection |
| 7 | Validator receives (value, params, element) | Signature |
| 8 | Validator returns ValidationResult | Contract |

#### Unit 3: AttributeParser (10 tests)
**File**: `src/validation/AttributeParser.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Parses `data-val="true"` | Validation enabled |
| 2 | Parses `data-val-required` | Required validator |
| 3 | Parses `data-val-required="Custom msg"` | Custom message |
| 4 | Parses `data-val-minlength` + `data-val-minlength-min` | With params |
| 5 | Parses `data-val-range-min` + `data-val-range-max` | Multiple params |
| 6 | Parses `data-val-regex-pattern` | Regex pattern |
| 7 | Parses `data-val-equalto-other` | Field reference |
| 8 | Returns empty if `data-val` is not "true" | Disabled |
| 9 | Handles multiple validators on one field | Array |
| 10 | Ignores non-validation attributes | Filter |

#### Unit 4: shouldValidate (10 tests)
**File**: `src/validation/utils/shouldValidate.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Visible input returns true | Standard case |
| 2 | `display:none` input returns false | Hidden |
| 3 | `type="hidden"` returns false | Hidden type |
| 4 | `visibility:hidden` returns false | Invisible |
| 5 | `data-val-always="true"` overrides hidden | Force validate |
| 6 | Disabled input returns false | Skip disabled |
| 7 | Readonly input returns true | Still validate |
| 8 | Syncfusion: hidden input with visible wrapper returns true | Adapter case |
| 9 | Syncfusion: hidden input with hidden wrapper returns false | Adapter case |
| 10 | Checks at validation time, not setup | Dynamic |

---

### Phase 2: Adapters

#### Unit 5: AdapterRegistry (6 tests)
**File**: `src/validation/adapters/AdapterRegistry.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Registers an adapter | `register('syncfusion', adapter)` |
| 2 | Retrieves adapter for element | `getAdapter(element)` |
| 3 | Returns DefaultAdapter if no match | Fallback |
| 4 | Adapter has `getValue(element)` | Contract |
| 5 | Adapter has `getVisibleElement(element)` | Contract |
| 6 | Adapter has `getBlurTarget(element)` | Contract |

#### Unit 6: DefaultAdapter (8 tests)
**File**: `src/validation/adapters/DefaultAdapter.js`

| # | Test | Description |
|---|------|-------------|
| 1 | `getValue` returns input.value | Text input |
| 2 | `getValue` returns checkbox.checked | Checkbox |
| 3 | `getValue` returns select.value | Select |
| 4 | `getValue` returns textarea.value | Textarea |
| 5 | `getVisibleElement` returns element itself | Native |
| 6 | `getBlurTarget` returns element itself | Native |
| 7 | Handles radio buttons | Checked value |
| 8 | Handles select multiple | Array |

#### Unit 7: SyncfusionAdapter (10 tests)
**File**: `src/validation/adapters/SyncfusionAdapter.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Detects Syncfusion element | `ej2_instances` check |
| 2 | `getValue` from DropDownList | `ej2_instances[0].value` |
| 3 | `getValue` from NumericTextBox | `ej2_instances[0].value` |
| 4 | `getValue` from DatePicker | `ej2_instances[0].value` |
| 5 | `getValue` from CheckBox | `ej2_instances[0].checked` |
| 6 | `getVisibleElement` returns wrapper | `.e-input-group` or similar |
| 7 | `getBlurTarget` returns focusable element | `.e-input` |
| 8 | Handles null `ej2_instances` | Graceful |
| 9 | Falls back to DefaultAdapter if not Syncfusion | Safety |
| 10 | Works with multiple Syncfusion controls in form | Isolation |

---

### Phase 3: Validators (10 validators, ~60 tests)

Each validator follows the same pattern:

```javascript
// src/validation/validators/required.js
import { ValidationResult } from '../ValidationResult.js';

export const name = 'required';

export function validate(value, params, element) {
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return ValidationResult.invalid(params.message || 'This field is required.');
  }
  return ValidationResult.valid();
}
```

| Validator | Tests | Key Cases |
|-----------|-------|-----------|
| required | 6 | Empty string, null, undefined, whitespace, array |
| minlength | 6 | Below min, at min, above min, null |
| maxlength | 6 | Below max, at max, above max |
| length | 6 | Combined min/max |
| range | 6 | Numeric range validation |
| regex | 6 | Pattern matching |
| email | 6 | Valid/invalid email formats |
| number | 6 | Numeric validation |
| equalto | 6 | Field comparison |
| url | 6 | URL format validation |

---

### Phase 4: Display & Triggers

#### Unit 18: ErrorDisplay (10 tests)
**File**: `src/validation/ErrorDisplay.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Shows error message in span | `data-valmsg-for` |
| 2 | Adds error class to span | `field-validation-error` |
| 3 | Adds error class to input | `input-validation-error` |
| 4 | Sets `aria-invalid="true"` | Accessibility |
| 5 | Clears error message | On valid |
| 6 | Removes error classes | On valid |
| 7 | Removes `aria-invalid` | On valid |
| 8 | Handles Syncfusion wrapper | Adds class to visible element |
| 9 | Handles multiple errors per field | Join messages |
| 10 | Case-insensitive field matching | Uses field-matcher |

#### Unit 19: FieldTriggers (10 tests)
**File**: `src/validation/triggers/FieldTriggers.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Validates on blur | First touch |
| 2 | Re-validates on input if has error | Forgiving |
| 3 | Does NOT validate on input if no error | Don't interrupt |
| 4 | Tracks "touched" state per field | Map |
| 5. | Uses adapter's blur target | Syncfusion |
| 6 | Debounces rapid input events | Performance |
| 7 | Clears error immediately when valid | UX |
| 8 | Shows error immediately on blur | UX |
| 9 | Handles dynamic fields | Added after init |
| 10 | Cleans up on form removal | Memory |

---

### Phase 5: Engine & Integration

#### Unit 20: ValidationEngine (10 tests)
**File**: `src/validation/ValidationEngine.js`

| # | Test | Description |
|---|------|-------------|
| 1 | Validates single field | `validateField(field)` |
| 2 | Validates entire form | `validateForm(form)` |
| 3 | Skips fields where `shouldValidate` is false | Hidden/disabled |
| 4 | Runs all validators for a field | Multiple rules |
| 5 | Stops on first error (configurable) | Performance option |
| 6 | Returns combined ValidationResult | Aggregate |
| 7 | Uses correct adapter per field | Mixed form |
| 8 | Caches parsed attributes | Performance |
| 9 | Emits validation events | `alis:validation` |
| 10 | Integrates with ErrorDisplay | Shows/clears |

#### Unit 21: ALIS Integration (8 tests)
**File**: `src/validation/integration/alis-integration.js`

| # | Test | Description |
|---|------|-------------|
| 1 | `data-alis-validate="true"` enables validation | Opt-in |
| 2 | Prevents form submit if invalid | `event.preventDefault()` |
| 3 | Shows all errors on submit attempt | UX |
| 4 | Allows submit if all valid | Happy path |
| 5 | Integrates with existing ALIS pipeline | `validateStep` |
| 6 | Works with `data-alis-post`, `data-alis-put`, etc. | All methods |
| 7 | Respects `data-alis-validate="false"` | Disable |
| 8 | Server errors still display | ProblemDetails |

---

## 📊 Test Summary

| Phase | Units | Tests |
|-------|-------|-------|
| 0 - Core Fixes | 3 | 18 |
| 1 - Infrastructure | 4 | 36 |
| 2 - Adapters | 3 | 24 |
| 3 - Validators | 10 | 60 |
| 4 - Display & Triggers | 2 | 20 |
| 5 - Engine & Integration | 2 | 18 |
| **Total** | **24** | **176** |

---

## 🔄 Development Sequence

```
Phase 0: Core Fixes (MUST COMPLETE FIRST)
────────────────────────────────────────
Unit 0a: Form Serialization Default    ──► 6 tests pass  ──►
Unit 0b: Case-Insensitive Matching     ──► 6 tests pass  ──►
Unit 0c: Enhanced Error Display        ──► 6 tests pass  ──►

Phase 1: Infrastructure
───────────────────────
Unit 1:  ValidationResult              ──► 8 tests pass  ──►
Unit 2:  ValidatorRegistry             ──► 8 tests pass  ──►
Unit 3:  AttributeParser               ──► 10 tests pass ──►
Unit 4:  shouldValidate                ──► 10 tests pass ──►

Phase 2: Adapters
─────────────────
Unit 5:  AdapterRegistry               ──► 6 tests pass  ──►
Unit 6:  DefaultAdapter                ──► 8 tests pass  ──►
Unit 7:  SyncfusionAdapter             ──► 10 tests pass ──►

Phase 3: Validators (one at a time)
───────────────────────────────────
Units 8-17: 10 validators              ──► 60 tests pass ──►

Phase 4: Display & Triggers
───────────────────────────
Unit 18: ErrorDisplay                  ──► 10 tests pass ──►
Unit 19: FieldTriggers                 ──► 10 tests pass ──►

Phase 5: Engine & Integration
─────────────────────────────
Unit 20: ValidationEngine              ──► 10 tests pass ──►
Unit 21: ALIS Integration              ──► 8 tests pass  ──►

✅ COMPLETE: 176 tests, all passing
```

---

## 🏗️ File Structure

```
src/validation/
├── index.js                     # Public API: ALIS.validation
├── ValidationResult.js          # Immutable result object
├── ValidatorRegistry.js         # Validator storage
├── AttributeParser.js           # Parse data-val-* attributes
├── ValidationEngine.js          # Core orchestration
├── ErrorDisplay.js              # DOM error rendering (enhanced)
├── field-matcher.js             # Case-insensitive field lookup
├── utils/
│   └── shouldValidate.js        # Visibility/state checks
├── validators/
│   ├── index.js                 # Auto-register all
│   ├── required.js
│   ├── minlength.js
│   ├── maxlength.js
│   ├── length.js
│   ├── range.js
│   ├── regex.js
│   ├── email.js
│   ├── number.js
│   ├── equalto.js
│   └── url.js
├── triggers/
│   └── FieldTriggers.js         # Blur/input handling
├── adapters/
│   ├── AdapterRegistry.js
│   ├── DefaultAdapter.js
│   └── SyncfusionAdapter.js
└── integration/
    └── alis-integration.js      # Pipeline step
```

---

## 📝 Quality Rules (Same as Main Plan)

| Rule | Enforcement |
|------|-------------|
| **TDD First** | Write failing tests → Implement → Pass → Refactor |
| **One Unit at a Time** | Complete unit N before starting unit N+1 |
| **No Forward Movement** | All tests MUST pass before proceeding |
| **No Hacks** | No workarounds - use correct approach |
| **No Dead Code** | Every line executes |
| **No Backup Copies** | No `_old`, `_backup` files |
| **Modular & Functional** | Pure functions, single responsibility |

---

## 🎯 Key Decisions

| Issue | Decision | Rationale |
|-------|----------|-----------|
| Form serialization | FormData default for forms | Matches jQuery Unobtrusive, ASP.NET model binder |
| JSON body | `data-alis-serialize="json"` opt-in | Explicit for API endpoints |
| Field name case | Case-insensitive fallback | Safety net, prefer exact match |
| Syncfusion | Adapter pattern | Clean separation, extensible |
| Validation trigger | "Angry on blur, forgiving on input" | Industry standard UX |
| Dynamic fields | Check visibility at validation time | No MutationObserver needed |

