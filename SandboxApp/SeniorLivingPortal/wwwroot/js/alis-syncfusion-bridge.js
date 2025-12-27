/**
 * ALIS-Syncfusion Bridge
 * 
 * This module bridges Syncfusion EJ2 components with the ALIS framework.
 * 
 * Problem: Syncfusion transforms DOM elements and uses its own event system.
 * Solution: Hook into Syncfusion's events and dispatch ALIS-compatible events.
 * 
 * Usage:
 * 1. Include this script after ALIS and Syncfusion are loaded
 * 2. Call ALIS_SF.init() after DOMContentLoaded
 * 3. Call ALIS_SF.reinit(containerEl) after dynamically loading content
 */
(function(global) {
    'use strict';

    const ALIS_SF = {
        debug: false,
        initialized: false,

        /**
         * Log debug messages when debug mode is enabled
         */
        log: function(...args) {
            if (this.debug) {
                console.log('[ALIS-SF]', ...args);
            }
        },

        /**
         * Initialize the bridge for all Syncfusion controls on the page
         */
        init: function(options = {}) {
            if (this.initialized) {
                this.log('Already initialized, skipping');
                return;
            }

            this.debug = options.debug || false;
            this.log('Initializing ALIS-Syncfusion Bridge');

            // Wait a tick for Syncfusion to finish rendering
            setTimeout(() => {
                this.bindAllControls(document.body);
                this.initialized = true;
                this.log('Initialization complete');
            }, 100);
        },

        /**
         * Reinitialize controls in a specific container (after ALIS swap)
         */
        reinit: function(container) {
            this.log('Reinitializing controls in container');
            this.bindAllControls(container || document.body);
        },

        /**
         * Bind all Syncfusion controls in a container
         */
        bindAllControls: function(container) {
            // Find all elements with ej2_instances (Syncfusion components)
            const elements = container.querySelectorAll('[id]');
            
            elements.forEach(el => {
                if (el.ej2_instances && el.ej2_instances.length > 0) {
                    this.bindControl(el);
                }
            });
        },

        /**
         * Bind a single Syncfusion control to ALIS
         */
        bindControl: function(element) {
            const instance = element.ej2_instances[0];
            if (!instance) return;

            // Check if this element (or its related elements) have ALIS attributes
            const alisElement = this.findAlisElement(element);
            if (!alisElement) {
                this.log('No ALIS attributes found for', element.id);
                return;
            }

            // Skip if already bound
            if (element._alissBound) {
                this.log('Already bound:', element.id);
                return;
            }

            const controlType = this.getControlType(instance);
            this.log('Binding control:', element.id, 'Type:', controlType);

            switch (controlType) {
                case 'dropdownlist':
                case 'combobox':
                case 'autocomplete':
                case 'multiselect':
                    this.bindDropdownLike(element, instance, alisElement);
                    break;
                case 'datepicker':
                case 'datetimepicker':
                case 'timepicker':
                    this.bindDatePicker(element, instance, alisElement);
                    break;
                case 'numerictextbox':
                    this.bindNumericTextBox(element, instance, alisElement);
                    break;
                case 'textbox':
                    this.bindTextBox(element, instance, alisElement);
                    break;
                case 'checkbox':
                case 'radiobutton':
                    this.bindCheckboxLike(element, instance, alisElement);
                    break;
                default:
                    this.log('Unknown control type:', controlType);
            }

            element._alissBound = true;
        },

        /**
         * Determine the Syncfusion control type
         */
        getControlType: function(instance) {
            const constructor = instance.constructor.name;
            
            // Map constructor names to control types
            const typeMap = {
                'DropDownList': 'dropdownlist',
                'ComboBox': 'combobox',
                'AutoComplete': 'autocomplete',
                'MultiSelect': 'multiselect',
                'DatePicker': 'datepicker',
                'DateTimePicker': 'datetimepicker',
                'TimePicker': 'timepicker',
                'NumericTextBox': 'numerictextbox',
                'TextBox': 'textbox',
                'CheckBox': 'checkbox',
                'RadioButton': 'radiobutton'
            };

            // Try to match by constructor name
            for (const [key, value] of Object.entries(typeMap)) {
                if (constructor.includes(key) || constructor === key) {
                    return value;
                }
            }

            // Fallback: check for known classes
            if (instance.element) {
                const el = instance.element;
                if (el.classList.contains('e-dropdownlist')) return 'dropdownlist';
                if (el.classList.contains('e-numerictextbox')) return 'numerictextbox';
                if (el.classList.contains('e-datepicker')) return 'datepicker';
                if (el.classList.contains('e-textbox')) return 'textbox';
                if (el.classList.contains('e-checkbox')) return 'checkbox';
            }

            return 'unknown';
        },

        /**
         * Find the element with ALIS attributes (might be the element itself or related)
         */
        findAlisElement: function(element) {
            // Check the element itself
            if (this.hasAlisAttributes(element)) {
                return element;
            }

            // Check for hidden select (dropdownlist creates _hidden suffix)
            const hiddenSelect = document.getElementById(element.id + '_hidden');
            if (hiddenSelect && this.hasAlisAttributes(hiddenSelect)) {
                return hiddenSelect;
            }

            // Check the wrapper
            const wrapper = element.closest('.e-input-group, .e-control-wrapper');
            if (wrapper && this.hasAlisAttributes(wrapper)) {
                return wrapper;
            }

            return null;
        },

        /**
         * Check if element has any ALIS attributes
         */
        hasAlisAttributes: function(element) {
            return element.hasAttribute('data-alis-get') ||
                   element.hasAttribute('data-alis-post') ||
                   element.hasAttribute('data-alis-put') ||
                   element.hasAttribute('data-alis-patch') ||
                   element.hasAttribute('data-alis-delete') ||
                   element.hasAttribute('data-alis');
        },

        /**
         * Dispatch ALIS trigger event
         */
        dispatchAlisTrigger: function(element, detail = {}) {
            this.log('Dispatching alis:trigger on', element.id || element.tagName, detail);
            
            const event = new CustomEvent('alis:trigger', {
                bubbles: true,
                cancelable: true,
                detail: detail
            });
            
            element.dispatchEvent(event);
        },

        /**
         * Bind dropdown-like controls (DropDownList, ComboBox, etc.)
         */
        bindDropdownLike: function(element, instance, alisElement) {
            this.log('Binding dropdown:', element.id);
            
            // Hook into Syncfusion's change event
            const originalChange = instance.change;
            const self = this;
            
            instance.change = function(args) {
                // Call original handler if exists
                if (originalChange) {
                    originalChange.call(this, args);
                }
                
                self.log('Dropdown changed:', element.id, 'Value:', args.value);
                
                // Dispatch ALIS trigger
                self.dispatchAlisTrigger(alisElement, {
                    type: 'change',
                    value: args.value,
                    text: args.itemData?.text || ''
                });
            };
        },

        /**
         * Bind date picker controls
         */
        bindDatePicker: function(element, instance, alisElement) {
            this.log('Binding datepicker:', element.id);
            
            const originalChange = instance.change;
            const self = this;
            
            instance.change = function(args) {
                if (originalChange) {
                    originalChange.call(this, args);
                }
                
                self.log('DatePicker changed:', element.id, 'Value:', args.value);
                
                self.dispatchAlisTrigger(alisElement, {
                    type: 'change',
                    value: args.value
                });
            };
        },

        /**
         * Bind numeric textbox
         */
        bindNumericTextBox: function(element, instance, alisElement) {
            this.log('Binding numerictextbox:', element.id);
            
            const originalChange = instance.change;
            const self = this;
            
            instance.change = function(args) {
                if (originalChange) {
                    originalChange.call(this, args);
                }
                
                self.log('NumericTextBox changed:', element.id, 'Value:', args.value);
                
                self.dispatchAlisTrigger(alisElement, {
                    type: 'change',
                    value: args.value
                });
            };
        },

        /**
         * Bind textbox - for textbox, native input events should work,
         * but we can also hook into Syncfusion's input event for consistency
         */
        bindTextBox: function(element, instance, alisElement) {
            this.log('Binding textbox:', element.id);
            
            // For textbox, the native input event should already work
            // because the visible input element has the ALIS attributes.
            // But we can add Syncfusion event binding as a fallback.
            
            const originalInput = instance.input;
            const self = this;
            
            instance.input = function(args) {
                if (originalInput) {
                    originalInput.call(this, args);
                }
                
                self.log('TextBox input:', element.id, 'Value:', args.value);
                
                // Only dispatch if native events aren't working
                // Check if ALIS trigger attribute specifies 'alis:trigger'
                const trigger = alisElement.getAttribute('data-alis-trigger');
                if (trigger && trigger.includes('alis:trigger')) {
                    self.dispatchAlisTrigger(alisElement, {
                        type: 'input',
                        value: args.value
                    });
                }
            };
        },

        /**
         * Bind checkbox/radio controls
         */
        bindCheckboxLike: function(element, instance, alisElement) {
            this.log('Binding checkbox:', element.id);
            
            const originalChange = instance.change;
            const self = this;
            
            instance.change = function(args) {
                if (originalChange) {
                    originalChange.call(this, args);
                }
                
                self.log('Checkbox changed:', element.id, 'Checked:', args.checked);
                
                self.dispatchAlisTrigger(alisElement, {
                    type: 'change',
                    checked: args.checked
                });
            };
        }
    };

    // Expose globally
    global.ALIS_SF = ALIS_SF;

})(typeof window !== 'undefined' ? window : this);

