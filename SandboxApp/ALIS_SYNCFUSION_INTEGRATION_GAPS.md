# ALIS + Syncfusion Integration Gaps & Review Notes

This document captures the integration points between ALIS framework and Syncfusion Essential JS 2 controls that need attention for smooth operation.

## Key Finding: `<ejs-scripts>` in Partial Views

**Issue:** When partial views containing Syncfusion controls are rendered (either on initial page load or via ALIS swap), they need `<ejs-scripts>` to initialize the controls. However:

1. **Initial Page Load:** Partial views render their `<ejs-scripts>` BEFORE the main Syncfusion CDN script loads (which is at the bottom of `_Layout.cshtml`). This causes `ejs is not defined` errors.

2. **ALIS Swap:** When ALIS swaps content that includes `<ejs-scripts>`, the generated JavaScript runs immediately and correctly initializes the controls (since Syncfusion JS is already loaded).

**Solution:** Load Syncfusion CDN script synchronously in `<head>` section of `_Layout.cshtml`.

**Status:** ✅ FIXED - Syncfusion full bundle is now loaded in `<head>`:
```html
<script src="https://cdn.syncfusion.com/ej2/31.2.16/dist/ej2.min.js"></script>
```

This ensures `ejs.*` namespace is available when partial views render their `<ejs-scripts>` content.

**Remaining Issue:** ✅ FIXED - When ALIS swaps content containing `<script>` tags from `<ejs-scripts>`, those scripts don't auto-execute.

**Solution:** Added `initSyncfusionControls(ctx)` hook in `site.js` that:
1. Finds all `<script>` tags in the swapped content
2. Creates new script elements and copies content
3. Replaces old scripts with new ones to trigger execution

**Usage:** Call `initSyncfusionControls({ target: '#targetSelector' })` in `onAfter` hooks:
```javascript
window.showResidentModal = function(ctx) {
    initSyncfusionControls({ target: '#modalBody' });
    // ... show modal
};
```

## Critical Gaps (ALIS-GAP)

### 1. Event Delegation with Syncfusion Controls

**Issue:** Syncfusion controls wrap the actual input elements in container divs. When ALIS attributes like `data-alis-trigger="input"` are placed on the Syncfusion tag helper (e.g., `<ejs-textbox>`), the events fire on the inner input element, not the wrapper where ALIS attributes reside.

**Affected Controls:**
- `<ejs-textbox>` - wraps `<input>` in `<span class="e-input-group">`
- `<ejs-dropdownlist>` - wraps input in complex structure
- `<ejs-numerictextbox>` - wraps input with spin buttons
- `<ejs-datepicker>` - wraps input with calendar button

**Current Workaround:** None - ALIS needs to bubble up to find the element with ALIS attributes.

**Proposed Solution:**
```javascript
// In ALIS event handling, when target doesn't have ALIS attrs, 
// check for Syncfusion wrapper pattern and find closest element with attrs
function findALISElement(target) {
  // Check if target is inside a Syncfusion control
  const sfWrapper = target.closest('[class*="e-control"]');
  if (sfWrapper) {
    // Look for ALIS attributes on the wrapper or its parent
    return sfWrapper.closest('[data-alis-get], [data-alis-post], [data-alis-put], [data-alis-delete]');
  }
  return target;
}
```

### 2. Dynamic Content Re-initialization

**Issue:** When ALIS swaps content that contains Syncfusion controls, the new controls are not initialized. The `<ejs-scripts>` tag helper only runs on initial page load.

**Affected Scenarios:**
- Loading forms via ALIS into modals
- Swapping partial views that contain Syncfusion controls
- Cascading dropdowns where the child dropdown is replaced

**Current Workaround:** Manual re-initialization in `onAfter` hooks.

**Proposed Solution:**
1. ALIS could emit a custom event after swap: `alis:swap:complete`
2. Syncfusion controls could be re-initialized by scanning the swapped content
3. Or use MutationObserver pattern to detect new Syncfusion elements

### 3. Value Collection from Syncfusion Controls

**Issue:** ALIS collector needs to read values from Syncfusion controls via their `ej2_instances` property, not from the DOM input directly.

**Status:** ✅ Already implemented in `src/collector/reader.js`

**Code Reference:**
```javascript
// Check for Syncfusion components
const instances = element['ej2_instances'];
if (Array.isArray(instances) && instances.length > 0) {
  const instance = instances[0];
  if ('checked' in instance) return { name, value: instance.checked };
  if ('value' in instance) return { name, value: instance.value };
}
```

### 4. Validation Error Display with Syncfusion Controls

**Issue:** ALIS validation needs to apply error classes to Syncfusion control wrappers, not just the inner input.

**Current Behavior:** Error classes may be applied to wrong element.

**Proposed Solution:** The `SyncfusionAdapter` in ALIS validation module should handle this, but needs testing with actual controls.

## Review Notes (ALIS-REVIEW)

### Working Well ✅

1. **`<ejs-button>` with ALIS attributes** - Works for click triggers
   ```html
   <ejs-button data-alis-get="/api/data" data-alis-target="#result" content="Load">
   </ejs-button>
   ```

2. **`<ejs-dropdownlist>` with `data-alis-trigger="change"`** - Works because change event bubbles
   ```html
   <ejs-dropdownlist data-alis-get="/api/floors" data-alis-trigger="change">
   </ejs-dropdownlist>
   ```

3. **Bootstrap modals with ALIS** - Works fine for loading content
   ```html
   <button data-alis-get="/form" data-alis-target="#modalBody" data-alis-on-after="showModal">
   ```

### Needs Attention ⚠️

1. **`<ejs-textbox>` with `data-alis-trigger="input"`** - May not work due to event delegation issue

2. **`data-alis-collect="closest .container"`** - Needs to correctly read Syncfusion control values within the container

3. **Partial views with Syncfusion controls** - Need manual re-initialization after ALIS swap

## Recommendations

### Short-term Fixes

1. **Use native inputs for ALIS-triggered fields:**
   ```html
   <!-- Instead of -->
   <ejs-textbox data-alis-get="/search" data-alis-trigger="input">
   
   <!-- Use native input with Syncfusion styling -->
   <input class="e-input" data-alis-get="/search" data-alis-trigger="input" />
   ```

2. **Use `change` event instead of `input` for Syncfusion controls:**
   ```html
   <ejs-textbox data-alis-get="/search" data-alis-trigger="change">
   ```

3. **Add re-initialization in hooks:**
   ```javascript
   window.afterSwap = function(ctx) {
     // Re-init Syncfusion controls in swapped content
     const target = document.querySelector(ctx.target);
     target.querySelectorAll('[data-sf-control]').forEach(initSyncfusion);
   };
   ```

### Long-term ALIS Enhancements

1. **Add Syncfusion-aware event delegation** - Check parent elements for ALIS attributes when event target doesn't have them

2. **Add `alis:swap:complete` event** - Allow external code to hook into swap completion

3. **Add `data-alis-reinit` attribute** - Specify a function to call after swap to reinitialize controls

4. **Enhance SyncfusionAdapter** - Ensure validation error display works with all Syncfusion control types

## Testing Checklist

- [ ] Debounced search with `<ejs-textbox>`
- [ ] Form validation with `<ejs-textbox>`, `<ejs-dropdownlist>`, `<ejs-numerictextbox>`
- [ ] Cascading dropdowns with ALIS
- [ ] Modal forms with Syncfusion controls
- [ ] Delete confirmation with `<ejs-button>`
- [ ] Hyperlink navigation with partial views
- [ ] Value collection from all Syncfusion control types

