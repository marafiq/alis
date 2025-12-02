/**
 * ALIS Demo Application
 * Showcases all ALIS features with a real server
 */

// ========================================
// Toast System
// ========================================

const Toast = {
  container: document.getElementById('toast-container'),
  
  show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    
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
  overlay: document.getElementById('modal-overlay'),
  body: document.getElementById('modal-body'),
  
  show(content = '') {
    if (content) {
      this.body.innerHTML = content;
    }
    this.overlay.classList.add('show');
  },
  
  hide() {
    this.overlay.classList.remove('show');
  }
};

window.Modal = Modal;

function closeModal() {
  Modal.hide();
}

function showAddUserModal() {
  Modal.body.innerHTML = `
    <h3>👤 Add New User</h3>
    <form id="add-user-form" 
          data-alis 
          data-alis-target="#add-user-result" 
          data-alis-swap="innerHTML" 
          data-alis-on-after="handleAddUserResult"
          action="/api/users" 
          method="post">
      <div class="form-group">
        <label for="new-name">Full Name</label>
        <input type="text" id="new-name" name="name" class="input" placeholder="John Doe" 
               data-val="true" data-val-required="Name is required">
        <span data-valmsg-for="name" class="field-validation-valid"></span>
      </div>
      <div class="form-group">
        <label for="new-email">Email Address</label>
        <input type="email" id="new-email" name="email" class="input" placeholder="john@example.com"
               data-val="true" data-val-required="Email is required" data-val-email="Invalid email format">
        <span data-valmsg-for="email" class="field-validation-valid"></span>
      </div>
      <div class="form-group">
        <label for="new-role">Role</label>
        <select id="new-role" name="role" class="select"
                data-val="true" data-val-required="Role is required">
          <option value="">Choose a role...</option>
          <option value="Admin">👑 Admin</option>
          <option value="Editor">✏️ Editor</option>
          <option value="Viewer">👁️ Viewer</option>
        </select>
        <span data-valmsg-for="role" class="field-validation-valid"></span>
      </div>
      <div id="add-user-result"></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          Create User
        </button>
      </div>
    </form>
  `;
  Modal.show();
  // Focus the first input after modal opens
  setTimeout(() => document.getElementById('new-name')?.focus(), 100);
}

// Hook handler for add user result - auto close modal and refresh on success
window.handleAddUserResult = function(ctx) {
  if (ctx.success && ctx.body?.success) {
    // Success - close modal, show toast, refresh table
    closeModal();
    Toast.success(ctx.body.message || 'User created successfully!');
    // Refresh users table
    setTimeout(() => {
      document.getElementById('refresh-users')?.click();
    }, 100);
  }
  // On validation error, modal stays open and errors are shown via data-valmsg-for
};

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ========================================
// Theme Toggle
// ========================================

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  
  // Update icon
  const icon = document.querySelector('.theme-icon');
  icon.textContent = newTheme === 'light' ? '☀️' : '🌙';
  
  // Save preference
  localStorage.setItem('theme', newTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = savedTheme === 'light' ? '☀️' : '🌙';
}

// ========================================
// Confirm Handlers
// ========================================

// Register delete user confirmation
ALIS.confirm.register('deleteUser', async (ctx) => {
  return new Promise((resolve) => {
    Modal.body.innerHTML = `
      <h3>⚠️ Confirm Delete</h3>
      <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
        Are you sure you want to delete this user? This action cannot be undone.
      </p>
      <div class="form-actions">
        <button class="btn btn-secondary" id="cancel-delete">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete">Delete User</button>
      </div>
    `;
    Modal.show();
    
    document.getElementById('cancel-delete').onclick = () => {
      closeModal();
      resolve(false);
    };
    
    document.getElementById('confirm-delete').onclick = () => {
      closeModal();
      resolve(true);
    };
  });
});

// ========================================
// ALIS Configuration
// ========================================

ALIS.init({
  // Global hooks
  onBefore: [
    (ctx) => {
      console.log('[ALIS] Starting request:', ctx.config.method, ctx.config.url);
      return true;
    }
  ],
  
  onAfter: [
    (ctx) => {
      console.log('[ALIS] Request complete:', ctx.config.url, ctx.success ? '✓' : '✗');
      
      // Handle network/fetch errors
      if (ctx.error && !ctx.body?.errors) {
        Toast.error(ctx.error.message || 'An error occurred');
      }
    }
  ]
});

// ========================================
// Initial Data Load
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Load users on page load
  setTimeout(() => {
    document.getElementById('refresh-users')?.click();
  }, 500);
});

// ========================================
// Filter Change Handlers
// ========================================

// Auto-refresh when filters change
document.getElementById('filter-role')?.addEventListener('change', () => {
  document.getElementById('refresh-users')?.click();
});

document.getElementById('filter-status')?.addEventListener('change', () => {
  document.getElementById('refresh-users')?.click();
});

// ========================================
// Smooth Scroll for Nav Links
// ========================================

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href?.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ ALIS Demo Application Loaded                         ║
║                                                           ║
║   Open DevTools to see ALIS activity in the console.      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

