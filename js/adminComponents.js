/**
 * Admin CMS UI Components Library
 * Professional e-commerce dashboard components
 * Fully backward compatible with existing data structure
 */

// Size Chip Selector - replaces text input with visual chips
export class SizeChipSelector {
  constructor(containerId, selectedSizes = []) {
    this.container = document.getElementById(containerId);
    this.sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    this.selected = new Set(selectedSizes.filter(s => this.sizes.includes(s)));
    this.hiddenInput = this.container?.nextElementSibling;
    this.render();
  }

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = this.sizes.map(size => `
      <button 
        type="button" 
        class="size-chip ${this.selected.has(size) ? 'active' : ''}" 
        data-size="${size}"
        title="Click to toggle size ${size}"
      >
        ${size}
      </button>
    `).join('');

    this.container.querySelectorAll('.size-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const size = chip.dataset.size;
        if (this.selected.has(size)) {
          this.selected.delete(size);
          chip.classList.remove('active');
        } else {
          this.selected.add(size);
          chip.classList.add('active');
        }
        this.updateHiddenInput();
      });
    });
  }

  updateHiddenInput() {
    if (this.hiddenInput) {
      this.hiddenInput.value = Array.from(this.selected).join(', ');
    }
  }

  getValue() {
    return Array.from(this.selected);
  }

  setValue(sizes) {
    this.selected = new Set(sizes.filter(s => this.sizes.includes(s)));
    this.render();
  }
}

// Color Picker with Multi-Select
export class ColorPicker {
  constructor(containerId, selectedColors = []) {
    this.container = document.getElementById(containerId);
    this.colors = [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Red', hex: '#EF4444' },
      { name: 'Blue', hex: '#3B82F6' },
      { name: 'Green', hex: '#10B981' },
      { name: 'Yellow', hex: '#FBBF24' },
      { name: 'Purple', hex: '#8B5CF6' },
      { name: 'Pink', hex: '#EC4899' },
      { name: 'Gray', hex: '#6B7280' },
      { name: 'Brown', hex: '#92400E' },
      { name: 'Navy', hex: '#001F3F' },
      { name: 'Teal', hex: '#14B8A6' },
      { name: 'Gold', hex: '#D97706' },
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Beige', hex: '#F5DEB3' },
      { name: 'Sand', hex: '#C2B280' }
    ];
    this.selected = new Set(selectedColors);
    this.hiddenInput = this.container?.nextElementSibling;
    this.render();
  }

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="color-picker-grid">
        ${this.colors.map(color => `
          <button 
            type="button" 
            class="color-chip ${this.selected.has(color.name) ? 'active' : ''}" 
            data-color="${color.name}"
            title="${color.name}"
            style="--color-hex: ${color.hex}"
          >
            <span class="color-swatch" style="background-color: ${color.hex}"></span>
            <span class="color-label">${color.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    this.container.querySelectorAll('.color-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const color = chip.dataset.color;
        if (this.selected.has(color)) {
          this.selected.delete(color);
          chip.classList.remove('active');
        } else {
          this.selected.add(color);
          chip.classList.add('active');
        }
        this.updateHiddenInput();
      });
    });
  }

  updateHiddenInput() {
    if (this.hiddenInput) {
      this.hiddenInput.value = Array.from(this.selected).join(', ');
    }
  }

  getValue() {
    return Array.from(this.selected);
  }

  setValue(colors) {
    this.selected = new Set(colors);
    this.render();
  }
}

// Searchable Dropdown
export class SearchableDropdown {
  constructor(containerId, options, placeholder = 'Select...', onSelect = null) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.placeholder = placeholder;
    this.onSelect = onSelect;
    this.isOpen = false;
    this.selectedValue = null;
    this.render();
  }

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="dropdown-wrapper">
        <input 
          type="text" 
          class="dropdown-search" 
          placeholder="${this.placeholder}"
          autocomplete="off"
        >
        <div class="dropdown-menu">
          ${this.options.map(opt => `
            <button type="button" class="dropdown-item" data-value="${opt}">
              ${opt}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const search = this.container.querySelector('.dropdown-search');
    const menu = this.container.querySelector('.dropdown-menu');
    const items = this.container.querySelectorAll('.dropdown-item');

    search.addEventListener('focus', () => {
      this.isOpen = true;
      menu.classList.add('open');
    });

    search.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      items.forEach(item => {
        if (item.textContent.toLowerCase().includes(query)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });

    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const value = item.dataset.value;
        this.selectedValue = value;
        search.value = value;
        this.isOpen = false;
        menu.classList.remove('open');
        this.onSelect?.(value);
      });
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.isOpen = false;
        menu.classList.remove('open');
      }
    });
  }

  getValue() {
    return this.selectedValue;
  }

  setValue(value) {
    this.selectedValue = value;
    const search = this.container?.querySelector('.dropdown-search');
    if (search) search.value = value || '';
  }
}

// Drag & Drop Image Uploader
export class ImageUploader {
  constructor(containerId, onImageSelect = null) {
    this.container = document.getElementById(containerId);
    this.onImageSelect = onImageSelect;
    this.selectedFile = null;
    this.render();
  }

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="image-uploader">
        <input 
          type="file" 
          class="uploader-input" 
          accept="image/*"
          hidden
        >
        <div class="uploader-zone">
          <svg class="uploader-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p class="uploader-title">Drag and drop image or click to browse</p>
          <p class="uploader-hint">Max 5MB • JPG, PNG, GIF, WebP</p>
        </div>
        <div class="preview-container"></div>
      </div>
    `;

    const input = this.container.querySelector('.uploader-input');
    const zone = this.container.querySelector('.uploader-zone');
    const preview = this.container.querySelector('.preview-container');

    // Click to upload
    zone.addEventListener('click', () => input.click());

    // Drag and drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-active');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-active');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-active');
      const files = e.dataTransfer.files;
      if (files.length) this.handleFile(files[0]);
    });

    // File input change
    input.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleFile(e.target.files[0]);
    });
  }

  handleFile(file) {
    // Validate
    if (!file.type.startsWith('image/')) {
      this.showError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showError('Image must be smaller than 5MB');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.showPreview(e.target.result, file);
      this.onImageSelect?.(file, e.target.result);
    };
    reader.readAsDataURL(file);
  }

  showPreview(dataUrl, file) {
    const preview = this.container.querySelector('.preview-container');
    const zone = this.container.querySelector('.uploader-zone');
    
    zone.style.display = 'none';
    preview.innerHTML = `
      <div class="preview-item">
        <img src="${dataUrl}" alt="Preview">
        <div class="preview-info">
          <p class="preview-name">${file.name}</p>
          <p class="preview-size">${(file.size / 1024).toFixed(2)} KB</p>
        </div>
        <button type="button" class="preview-remove" title="Remove image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    preview.querySelector('.preview-remove').addEventListener('click', (e) => {
      e.preventDefault();
      this.selectedFile = null;
      preview.innerHTML = '';
      zone.style.display = '';
      this.onImageSelect?.(null, null);
    });
  }

  showError(message) {
    const preview = this.container.querySelector('.preview-container');
    preview.innerHTML = `<p class="preview-error">${message}</p>`;
  }

  getFile() {
    return this.selectedFile;
  }

  clear() {
    this.selectedFile = null;
    const zone = this.container.querySelector('.uploader-zone');
    const preview = this.container.querySelector('.preview-container');
    preview.innerHTML = '';
    zone.style.display = '';
  }
}

// Rich Text Editor (simplified)
export class RichTextEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.textarea = this.container?.querySelector('textarea');
    this.render();
  }

  render() {
    if (!this.container || !this.textarea) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';
    toolbar.innerHTML = `
      <div class="rte-button-group">
        <button type="button" class="rte-button" data-cmd="bold" title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" class="rte-button" data-cmd="italic" title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" class="rte-button" data-cmd="underline" title="Underline (Ctrl+U)">
          <u>U</u>
        </button>
      </div>
      <div class="rte-button-group">
        <button type="button" class="rte-button" data-cmd="insertUnorderedList" title="Bullet list">
          <span>• List</span>
        </button>
        <button type="button" class="rte-button" data-cmd="createLink" title="Insert link">
          <span>🔗 Link</span>
        </button>
      </div>
    `;

    this.container.insertBefore(toolbar, this.textarea);

    toolbar.querySelectorAll('.rte-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        
        if (cmd === 'createLink') {
          const url = prompt('Enter URL:');
          if (url) document.execCommand(cmd, false, url);
        } else {
          document.execCommand(cmd, false, null);
        }
        this.textarea.focus();
      });
    });
  }

  getValue() {
    return this.textarea?.value || '';
  }

  setValue(value) {
    if (this.textarea) this.textarea.value = value;
  }
}

// Auto SKU Generator
export class SKUGenerator {
  static generate(productName, category = '') {
    const namePart = productName
      .toUpperCase()
      .split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 3);
    
    const categoryPart = category
      .toUpperCase()
      .split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 3);
    
    const timestamp = Date.now().toString().slice(-4);
    
    return `BD-${categoryPart || namePart}-${timestamp}`;
  }
}

// Notification System
export class Notifier {
  static show(message, type = 'success', duration = 3000) {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button type="button" class="notification-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    const container = document.getElementById('notifications') || document.body;
    container.appendChild(notif);

    const close = () => {
      notif.classList.add('hide');
      setTimeout(() => notif.remove(), 300);
    };

    notif.querySelector('.notification-close').addEventListener('click', close);
    setTimeout(close, duration);
  }

  static success(message) {
    this.show(message, 'success', 3000);
  }

  static error(message) {
    this.show(message, 'error', 4000);
  }

  static info(message) {
    this.show(message, 'info', 3000);
  }
}

// Keyboard Shortcuts Manager
export class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.setupDefaults();
  }

  setupDefaults() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S: Save (prevent default browser save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.querySelector('#product-form-submit')?.click();
      }

      // Escape: Cancel edit
      if (e.key === 'Escape') {
        document.querySelector('#cancel-product-edit')?.click();
      }

      // Ctrl/Cmd + K: Search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('#orders-search')?.focus();
      }
    });
  }

  register(combo, callback) {
    this.shortcuts.set(combo, callback);
  }
}

// Confirmation Dialog
export class ConfirmDialog {
  static async show(title, message, okText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog-overlay';
      dialog.innerHTML = `
        <div class="confirm-dialog">
          <div class="confirm-dialog-header">
            <h3>${title}</h3>
            <button type="button" class="confirm-dialog-close" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="confirm-dialog-body">
            <p>${message}</p>
          </div>
          <div class="confirm-dialog-footer">
            <button type="button" class="btn btn-ghost confirm-cancel">${cancelText}</button>
            <button type="button" class="btn btn-primary confirm-ok">${okText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const handleClose = (result) => {
        dialog.classList.add('hide');
        setTimeout(() => dialog.remove(), 300);
        resolve(result);
      };

      dialog.querySelector('.confirm-close').addEventListener('click', () => handleClose(false));
      dialog.querySelector('.confirm-cancel').addEventListener('click', () => handleClose(false));
      dialog.querySelector('.confirm-ok').addEventListener('click', () => handleClose(true));

      // Keyboard navigation
      dialog.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') handleClose(false);
        if (e.key === 'Enter') handleClose(true);
      });

      dialog.querySelector('.confirm-ok').focus();
    });
  }
}

// Loading Indicator
export class LoadingIndicator {
  static show(message = 'Loading...') {
    let indicator = document.getElementById('loading-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'loading-indicator';
      indicator.className = 'loading-indicator';
      indicator.innerHTML = `
        <div class="spinner"></div>
        <p>${message}</p>
      `;
      document.body.appendChild(indicator);
    }
    indicator.style.display = 'flex';
  }

  static hide() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.style.display = 'none';
  }
}

// Product Duplicate Helper
export class ProductDuplicator {
  static duplicate(product, newName = `${product.name} (Copy)`) {
    return {
      ...product,
      id: '',
      name: newName,
      code: '',
      createdAt: new Date().toISOString()
    };
  }
}
