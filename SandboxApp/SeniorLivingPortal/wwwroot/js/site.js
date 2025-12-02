/**
 * Senior Living Portal - Site JavaScript
 * Integrates ALIS framework with Syncfusion controls
 * 
 * ALIS Hooks: Functions called by name from window object via data-alis-on-after="functionName"
 * ALIS Confirm: Register named handlers via ALIS.confirm.register('name', handler)
 */

// Initialize ALIS when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize ALIS
    if (typeof ALIS !== 'undefined') {
        ALIS.init({
            telemetry: { level: 'info' }
        });

        // Register a custom confirm handler for delete operations
        // Usage: data-alis-confirm="deleteConfirm"
        ALIS.confirm.register('deleteConfirm', function(ctx) {
            return new Promise((resolve) => {
                // Get the confirm message from element or use default
                const message = ctx.element?.getAttribute('data-alis-confirm-message') 
                    || 'Are you sure you want to delete this item?';
                
                // Create confirmation modal
                const modalHtml = `
                    <div class="modal fade" id="confirmModal" tabindex="-1">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header bg-danger text-white">
                                    <h5 class="modal-title">Confirm Action</h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <p class="mb-0">${message}</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-danger" id="confirmBtn">Confirm</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remove existing modal if any
                const existing = document.getElementById('confirmModal');
                if (existing) existing.remove();

                // Add modal to DOM
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                const modal = document.getElementById('confirmModal');
                const bsModal = new bootstrap.Modal(modal);
                let resolved = false;

                // Handle confirm
                document.getElementById('confirmBtn').addEventListener('click', function() {
                    resolved = true;
                    bsModal.hide();
                    resolve(true);
                });

                // Handle cancel/close
                modal.addEventListener('hidden.bs.modal', function() {
                    modal.remove();
                    if (!resolved) {
                        resolve(false);
                    }
                });

                bsModal.show();
            });
        });

        console.log('ALIS initialized for Senior Living Portal');
    } else {
        console.error('ALIS not found! Make sure alis.js is loaded.');
    }

    // Update clock
    updateClock();
    setInterval(updateClock, 1000);
});

/**
 * Syncfusion Control Re-initialization
 * When ALIS swaps content containing <ejs-scripts>, the inline scripts don't auto-execute.
 * This function finds and executes those scripts to initialize Syncfusion controls.
 */
window.initSyncfusionControls = function(ctx) {
    // Get the target element where content was swapped
    const targetSelector = ctx?.target || ctx?.element?.getAttribute('data-alis-target');
    if (!targetSelector) return;
    
    const target = document.querySelector(targetSelector);
    if (!target) return;
    
    // Find all script tags in the swapped content and execute them
    const scripts = target.querySelectorAll('script');
    scripts.forEach(function(oldScript) {
        // Create a new script element to force execution
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(oldScript.attributes).forEach(function(attr) {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy content
        newScript.textContent = oldScript.textContent;
        
        // Replace old script with new one to trigger execution
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
};

/**
 * ALIS Hooks - Window functions called by name from data-alis-on-after attributes
 * Format: data-alis-on-after="handleSuccess, closeModal"
 */

// Success handler - show toast with success message
window.handleSuccess = function(ctx) {
    // Check if there was a client-side validation error
    if (ctx.error) {
        return; // Don't show success if there was an error
    }
    // Check if response is JSON with success flag
    if (ctx.body && ctx.body.success) {
        showToast(ctx.body.message || 'Operation completed successfully', 'success');
    } else if (ctx.response && ctx.response.ok) {
        showToast('Operation completed successfully', 'success');
    }
};

// Combined handler for resident form - only close modal and refresh on success
// ALIS sets ctx.error for ALL failure scenarios:
// - Client-side validation (VALIDATION_ERROR)
// - Server-side 400 validation (SERVER_VALIDATION_ERROR)  
// - HTTP errors (HTTP_ERROR)
window.handleResidentFormResult = function(ctx) {
    // ctx.error is set by ALIS for any failure - no need to check response.ok
    if (ctx.error) {
        return; // Don't close modal or refresh on error
    }
    
    // Success - close modal and refresh
    showToast(ctx.body?.message || 'Resident saved successfully', 'success');
    
    // Close modal
    const modal = document.querySelector('.modal.show');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
    
    // Refresh residents list
    refreshResidentsList();
};

// Combined handler for vitals form - only close modal and refresh on success
window.handleVitalsFormResult = function(ctx) {
    // ctx.error is set by ALIS for any failure
    if (ctx.error) {
        return; // Don't close modal or refresh on error
    }
    
    // Success - close modal and refresh
    showToast(ctx.body?.message || 'Vitals recorded successfully', 'success');
    
    // Close modal
    const modal = document.querySelector('.modal.show');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
    
    // Refresh vitals dashboard
    refreshVitalsDashboard();
};

// Error handler
window.handleError = function(ctx) {
    if (ctx.error) {
        showToast(ctx.error.message || 'An error occurred', 'error');
    }
};

// Refresh residents list
window.refreshResidents = function() {
    refreshResidentsList();
};

// Refresh vitals dashboard
window.refreshVitals = function() {
    refreshVitalsDashboard();
};

// Close modal
window.closeModal = function() {
    const modal = document.querySelector('.modal.show');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
};

// Clear form
window.clearForm = function(ctx) {
    const form = ctx.element?.closest('form');
    if (form) {
        form.reset();
    }
};

// Show resident modal (for create/edit/details)
// Also initializes Syncfusion controls in the loaded content
window.showResidentModal = function(ctx) {
    // Initialize Syncfusion controls in the modal body
    initSyncfusionControls({ target: '#modalBody' });
    
    const modalEl = document.getElementById('residentModal');
    if (modalEl) {
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) {
            modal = new bootstrap.Modal(modalEl);
        }
        modal.show();
    }
};

// Show vitals modal
// Also initializes Syncfusion controls in the loaded content
window.showVitalsModal = function(ctx) {
    // Initialize Syncfusion controls in the modal body
    initSyncfusionControls({ target: '#vitalsModalBody' });
    
    const modalEl = document.getElementById('vitalsModal');
    if (modalEl) {
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) {
            modal = new bootstrap.Modal(modalEl);
        }
        modal.show();
    }
};

// Clear wings dropdown when building changes (for cascading) - supports both native and Syncfusion
window.clearWings = function() {
    // Handle native select
    const wingSelect = document.getElementById('wingSelect');
    if (wingSelect && !wingSelect.ej2_instances) {
        wingSelect.innerHTML = '<option value="">-- Select Wing --</option>';
        wingSelect.disabled = true;
    }
    
    // Handle Syncfusion DropDownList
    const wingDropdown = document.getElementById('wingDropdown');
    if (wingDropdown && wingDropdown.ej2_instances && wingDropdown.ej2_instances[0]) {
        const ddl = wingDropdown.ej2_instances[0];
        ddl.dataSource = [{ text: '-- Select Wing --', value: '' }];
        ddl.value = '';
        ddl.enabled = false;
    }
};

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Ensure toast container exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toastHtml = `
        <div id="${toastId}" class="toast toast-${type}" role="alert">
            <div class="toast-header">
                <strong class="me-auto">${iconMap[type] || ''} ${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);

    const toastEl = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 5000 });
    
    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });

    bsToast.show();
}

/**
 * Refresh residents list via ALIS
 */
function refreshResidentsList() {
    const container = document.getElementById('residents-list');
    if (container && typeof ALIS !== 'undefined') {
        ALIS.request({
            url: '/Residents/Search',
            method: 'GET',
            target: '#residents-list',
            swap: 'innerHTML',
            onAfter: function() {
                // Initialize Syncfusion controls after swap
                initSyncfusionControls({ target: '#residents-list' });
            }
        });
    }
}

/**
 * Refresh vitals dashboard
 */
function refreshVitalsDashboard() {
    const container = document.getElementById('vitals-dashboard');
    if (container && typeof ALIS !== 'undefined') {
        ALIS.request({
            url: '/Vitals/Dashboard',
            method: 'GET',
            target: '#vitals-dashboard',
            swap: 'innerHTML',
            onAfter: function() {
                // Initialize Syncfusion controls after swap
                initSyncfusionControls({ target: '#vitals-dashboard' });
            }
        });
    }
}

/**
 * Update clock display
 */
function updateClock() {
    const clockEl = document.getElementById('current-time');
    if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString();
    }
}

// Expose utility functions globally
window.showToast = showToast;
window.refreshResidentsList = refreshResidentsList;
window.refreshVitalsDashboard = refreshVitalsDashboard;
