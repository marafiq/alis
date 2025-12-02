/**
 * ALIS Demo Application
 * Showcases all ALIS features with a real server
 */

// ========================================
// Request Counter
// ========================================

let requestCount = 0;
let successCount = 0;

function updateStats() {
  document.getElementById('request-count').textContent = requestCount;
  document.getElementById('success-count').textContent = successCount;
}

// ========================================
// Toast System
// ========================================

const Toast = {
  container: document.getElementById('toast-container'),
  
  show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); },
  warning(msg) { this.show(msg, 'warning'); }
};

window.Toast = Toast;

// ========================================
// Modal System
// ========================================

const Modal = {
  get overlay() {
    return document.getElementById('modal-overlay');
  },
  get body() {
    return document.getElementById('modal-body');
  },
  
  show(content = '') {
    if (content) this.body.innerHTML = content;
    this.overlay.classList.add('show');
  },
  
  hide() {
    const overlay = this.overlay;
    if (overlay) {
      overlay.classList.remove('show');
      // Force style recalculation
      overlay.style.display = 'none';
      setTimeout(() => {
        overlay.style.display = '';
      }, 10);
    }
  }
};

window.Modal = Modal;
window.closeModal = () => Modal.hide();

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ========================================
// Add User Modal
// ========================================

window.showAddUserModal = function() {
  Modal.body.innerHTML = `
    <h3>➕ Add New User</h3>
    <form id="add-user-form" 
          data-alis 
          data-alis-swap="none"
          data-alis-on-after="logHook, closeModalOnSuccess, showSuccessToast, refreshUsersGrid, displayValidationErrors"
          action="/api/users" 
          method="post"
          novalidate>
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Full Name</label>
          <input type="text" name="name" class="input" placeholder="John Doe">
          <span data-valmsg-for="name" class="field-error"></span>
        </div>
        <div class="form-group full-width">
          <label>Email Address</label>
          <input type="text" name="email" class="input" placeholder="john@example.com">
          <span data-valmsg-for="email" class="field-error"></span>
        </div>
        <div class="form-group full-width">
          <label>Role</label>
          <select name="role" class="input">
            <option value="">Select role...</option>
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <span data-valmsg-for="role" class="field-error"></span>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create User</button>
      </div>
    </form>
  `;
  Modal.show();
  setTimeout(() => document.querySelector('#add-user-form input[name="name"]')?.focus(), 100);
};

// Hook: Dummy logging hook (demonstrates multiple hooks)
window.logHook = function(ctx) {
  console.log('[logHook] Called with:', {
    success: ctx.success,
    url: ctx.config?.url,
    method: ctx.config?.method,
    hasBody: !!ctx.body
  });
};

// Hook: Close modal on success
window.closeModalOnSuccess = function(ctx) {
  if (ctx.success && ctx.body?.success) {
    Modal.hide();
  }
};

// Hook: Show toast message
window.showSuccessToast = function(ctx) {
  if (ctx.success && ctx.body?.success) {
    Toast.success(ctx.body.message || 'Operation completed!');
  }
};

// Hook: Refresh users grid
window.refreshUsersGrid = function(ctx) {
  if (ctx.success && ctx.body?.success) {
    setTimeout(() => document.getElementById('refresh-users')?.click(), 100);
  }
};

// Hook: Display validation errors
window.displayValidationErrors = function(ctx) {
  const form = ctx.element?.closest('form') || document.querySelector('#add-user-form');
  if (!form) return;
  
  // Clear previous errors
  form.querySelectorAll('[data-valmsg-for]').forEach(el => {
    el.textContent = '';
  });
  
  // Display new errors from ProblemDetails
  if (ctx.body?.errors) {
    Object.entries(ctx.body.errors).forEach(([field, messages]) => {
      const errorSpan = form.querySelector(`[data-valmsg-for="${field}"]`);
      if (errorSpan && Array.isArray(messages)) {
        errorSpan.textContent = messages[0];
      }
    });
  }
};

// ========================================
// Edit User Modal
// ========================================

window.showEditUserModal = function(id, name, email, role) {
  Modal.body.innerHTML = `
    <h3>✏️ Edit User</h3>
    <form data-alis 
          data-alis-target="#edit-user-result" 
          data-alis-swap="innerHTML"
          data-alis-on-after="handleEditUserResult"
          action="/api/users/${id}" 
          method="put"
          novalidate>
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Full Name</label>
          <input type="text" name="name" class="input" value="${name}">
          <span data-valmsg-for="name" class="field-error"></span>
        </div>
        <div class="form-group full-width">
          <label>Email Address</label>
          <input type="text" name="email" class="input" value="${email}">
          <span data-valmsg-for="email" class="field-error"></span>
        </div>
        <div class="form-group full-width">
          <label>Role</label>
          <select name="role" class="input">
            <option value="Admin" ${role === 'Admin' ? 'selected' : ''}>Admin</option>
            <option value="Editor" ${role === 'Editor' ? 'selected' : ''}>Editor</option>
            <option value="Viewer" ${role === 'Viewer' ? 'selected' : ''}>Viewer</option>
          </select>
        </div>
      </div>
      <div id="edit-user-result"></div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  Modal.show();
};

window.handleEditUserResult = function(ctx) {
  console.log('[handleEditUserResult]', 'success:', ctx.success, 'body:', ctx.body);
  if (ctx.success && ctx.body && ctx.body.success === true) {
    closeModal();
    Toast.success('User updated successfully!');
    setTimeout(() => document.getElementById('refresh-users')?.click(), 100);
  }
};

// ========================================
// Theme Toggle
// ========================================

window.toggleTheme = function() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  
  const icon = document.querySelector('.theme-icon');
  const text = document.querySelector('.theme-toggle span:last-child');
  if (icon) icon.textContent = next === 'light' ? '☀️' : '🌙';
  if (text) text.textContent = next === 'light' ? 'Light Mode' : 'Dark Mode';
  
  localStorage.setItem('theme', next);
};

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// ========================================
// Confirm Handlers
// ========================================

ALIS.confirm.register('deleteUser', async (ctx) => {
  return new Promise((resolve) => {
    Modal.body.innerHTML = `
      <h3>⚠️ Delete User</h3>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        Are you sure you want to delete this user? This action cannot be undone.
      </p>
      <div class="form-actions">
        <button class="btn btn-ghost" id="cancel-delete">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete">Delete</button>
      </div>
    `;
    Modal.show();
    
    document.getElementById('cancel-delete').onclick = () => { closeModal(); resolve(false); };
    document.getElementById('confirm-delete').onclick = () => { closeModal(); resolve(true); };
  });
});

ALIS.confirm.register('customConfirm', async (ctx) => {
  return new Promise((resolve) => {
    Modal.body.innerHTML = `
      <h3>🔔 Custom Confirmation</h3>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        This is a custom confirmation modal registered with ALIS.confirm.register()
      </p>
      <div class="form-actions">
        <button class="btn btn-ghost" id="cancel-custom">Cancel</button>
        <button class="btn btn-primary" id="confirm-custom">Proceed</button>
      </div>
    `;
    Modal.show();
    
    document.getElementById('cancel-custom').onclick = () => { closeModal(); resolve(false); };
    document.getElementById('confirm-custom').onclick = () => { closeModal(); resolve(true); };
  });
});

// ========================================
// Hook Demos
// ========================================

window.demoBeforeHook = function(ctx) {
  console.log('[onBefore Hook]', 'URL:', ctx.config.url, 'Method:', ctx.config.method);
  Toast.info('onBefore hook executed! Check console.');
  return true; // Return false to cancel request
};

window.demoAfterHook = function(ctx) {
  console.log('[onAfter Hook]', 'Success:', ctx.success, 'Body:', ctx.body);
  if (ctx.success) {
    Toast.success('onAfter hook: Request succeeded!');
  } else {
    Toast.error('onAfter hook: Request failed!');
  }
};

// ========================================
// Custom Component Value Functions
// ========================================

window.getSliderValue = function(element) {
  const input = element.querySelector('input[type="range"]');
  return input ? input.value : '0';
};

// Update slider display
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('slider-input');
  if (slider) {
    slider.addEventListener('input', (e) => {
      const display = e.target.closest('.custom-slider').querySelector('.slider-value');
      if (display) display.textContent = e.target.value;
    });
  }
});

// ========================================
// Navigation Active State
// ========================================

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// ========================================
// ALIS Configuration
// ========================================

ALIS.init({
  onBefore: [
    (ctx) => {
      requestCount++;
      updateStats();
      console.log(`[ALIS] Request #${requestCount}:`, ctx.config.method?.toUpperCase(), ctx.config.url);
      return true;
    }
  ],
  
  onAfter: [
    (ctx) => {
      if (ctx.success) {
        successCount++;
        updateStats();
      }
      console.log(`[ALIS] Complete:`, ctx.config.url, ctx.success ? '✓' : '✗');
      
      // Show error toast for network errors
      if (ctx.error && !ctx.body?.errors) {
        Toast.error(ctx.error.message || 'Request failed');
      }
    }
  ]
});

// ========================================
// Initial Data Load
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Load users table
  setTimeout(() => {
    document.getElementById('refresh-users')?.click();
  }, 300);
});

// Auto-refresh on filter change
document.getElementById('filter-role')?.addEventListener('change', () => {
  document.getElementById('refresh-users')?.click();
});

document.getElementById('filter-status')?.addEventListener('change', () => {
  document.getElementById('refresh-users')?.click();
});

// ========================================
// Parallel Requests Demo
// ========================================

window.fireAllParallel = function() {
  // Get all parallel demo buttons
  const buttons = document.querySelectorAll('#parallel .parallel-item .btn');
  
  // Fire all clicks simultaneously
  console.log('[Parallel Demo] Firing', buttons.length, 'requests simultaneously...');
  buttons.forEach(btn => btn.click());
};

// ========================================
// Cascading Selects Demo
// ========================================

// Called after country selection loads states
window.onCountryChanged = function(ctx) {
  const stateSelect = document.getElementById('state-select');
  const citySelect = document.getElementById('city-select');
  // ctx.element is the country select that triggered the request
  const countrySelect = ctx.element || document.getElementById('country-select');
  
  console.log('[Cascading] Country changed, ctx.success:', ctx.success, 'country value:', countrySelect?.value, 'element:', ctx.element);
  
  // Enable state select if country has value
  if (stateSelect) {
    stateSelect.disabled = !countrySelect?.value;
  }
  
  // Reset city select
  if (citySelect) {
    citySelect.innerHTML = '<option value="">Select state first...</option>';
    citySelect.disabled = true;
  }
  
  updateSelectedLocation();
};

// Called after state selection loads cities
window.onStateChanged = function(ctx) {
  const citySelect = document.getElementById('city-select');
  const stateSelect = document.getElementById('state-select');
  
  console.log('[Cascading] State changed, ctx.success:', ctx.success, 'state value:', stateSelect?.value);
  
  // Enable city select if state has value
  if (citySelect) {
    citySelect.disabled = !stateSelect?.value;
  }
  
  updateSelectedLocation();
};

// Update selected location display
window.updateSelectedLocation = function() {
  const country = document.getElementById('country-select');
  const state = document.getElementById('state-select');
  const city = document.getElementById('city-select');
  const display = document.getElementById('selected-location');
  
  if (!display) return;
  
  const parts = [];
  if (city?.value) {
    const cityText = city.options[city.selectedIndex]?.text || '';
    parts.push(cityText);
  }
  if (state?.value) {
    const stateText = state.options[state.selectedIndex]?.text || '';
    parts.push(stateText);
  }
  if (country?.value) {
    const countryText = country.options[country.selectedIndex]?.text || '';
    parts.push(countryText);
  }
  
  display.textContent = parts.length > 0 ? parts.join(' → ') : 'None selected';
};

// ========================================
// Console Banner
// ========================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ ALIS Demo Application                                ║
║                                                           ║
║   Watch the console for request/response activity.        ║
║   All requests are handled by ALIS declaratively!         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
