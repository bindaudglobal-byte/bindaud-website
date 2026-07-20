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
  constructor(containerId, onImagesChange = null) {
    this.container = document.getElementById(containerId);
    this.onImagesChange = onImagesChange;
    this.images = [];
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="image-uploader">
        <input type="file" class="uploader-input" accept="image/*" multiple hidden>
        <div class="uploader-zone" tabindex="0" role="button" aria-label="Upload product images">
          <svg class="uploader-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p class="uploader-title">Drag and drop images or click to browse</p>
          <p class="uploader-hint">Upload multiple files, paste URLs, reorder covers, and preview thumbnails.</p>
        </div>
        <div class="uploader-controls">
          <div class="uploader-url-field">
            <input type="url" class="uploader-url-input" placeholder="Paste image URL and press Add">
            <button type="button" class="btn btn-ghost btn-sm uploader-add-url">Add</button>
          </div>
          <button type="button" class="btn btn-ghost btn-sm uploader-clear-all">Clear All</button>
        </div>
        <div class="preview-container"></div>
      </div>
    `;

    const input = this.container.querySelector('.uploader-input');
    const zone = this.container.querySelector('.uploader-zone');
    const addUrl = this.container.querySelector('.uploader-add-url');
    const urlInput = this.container.querySelector('.uploader-url-input');
    const clearAll = this.container.querySelector('.uploader-clear-all');

    zone.addEventListener('click', () => input.click());
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
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) this.handleFiles(files);
    });

    input.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleFiles(Array.from(e.target.files));
    });

    addUrl.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) return;
      this.addImageUrl(url);
      urlInput.value = '';
    });

    clearAll.addEventListener('click', () => this.clear());

    this.renderPreview();
  }

  handleFiles(files) {
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        this.showError('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.showError('Image must be smaller than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.addImage({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url: e.target.result,
          name: file.name,
          size: file.size,
          isCover: this.images.length === 0
        });
      };
      reader.readAsDataURL(file);
    });
  }

  addImageUrl(url) {
    const validUrl = /^https?:\/\/.+$/i.test(url);
    if (!validUrl) {
      this.showError('Please enter a valid image URL');
      return;
    }

    this.addImage({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url,
      name: url.split('/').pop() || 'image.jpg',
      size: 0,
      isCover: this.images.length === 0
    });
  }

  addImage(image) {
    this.images.push(image);
    if (!this.images.some((item) => item.isCover)) {
      this.images[0].isCover = true;
    }
    this.renderPreview();
    this.onImagesChange?.(this.getValue());
  }

  renderPreview() {
    const preview = this.container.querySelector('.preview-container');
    const zone = this.container.querySelector('.uploader-zone');
    if (!preview || !zone) return;

    zone.style.display = this.images.length ? 'none' : '';
    preview.innerHTML = this.images.length
      ? this.images.map((image, index) => `
        <div class="preview-item" draggable="true" data-id="${image.id}">
          <div class="preview-thumbnail">
            <img src="${image.url}" alt="Product image ${index + 1}" loading="lazy">
          </div>
          <div class="preview-info">
            <p class="preview-name">${image.name}</p>
            <p class="preview-size">${image.size ? `${(image.size / 1024).toFixed(1)} KB` : 'URL image'}</p>
            <div class="preview-actions">
              <button type="button" class="btn btn-ghost btn-sm preview-cover-btn" data-action="cover" title="Set cover image">${image.isCover ? 'Cover ✓' : 'Set Cover'}</button>
              <button type="button" class="btn btn-ghost btn-sm preview-remove-btn" data-action="remove" title="Remove image">Remove</button>
            </div>
          </div>
        </div>
      `).join('')
      : '';

    preview.querySelectorAll('.preview-remove-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        const item = event.target.closest('.preview-item');
        this.removeImage(item?.dataset.id);
      });
    });

    preview.querySelectorAll('.preview-cover-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        const item = event.target.closest('.preview-item');
        this.selectCover(item?.dataset.id);
      });
    });

    this.setupSorting(preview);
  }

  setupSorting(container) {
    container.querySelectorAll('.preview-item').forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.id);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const sourceId = e.dataTransfer.getData('text/plain');
        const targetId = item.dataset.id;
        this.reorderImages(sourceId, targetId);
      });
    });
  }

  reorderImages(sourceId, targetId) {
    const sourceIndex = this.images.findIndex((image) => image.id === sourceId);
    const targetIndex = this.images.findIndex((image) => image.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    const [moved] = this.images.splice(sourceIndex, 1);
    this.images.splice(targetIndex, 0, moved);
    this.renderPreview();
    this.onImagesChange?.(this.getValue());
  }

  selectCover(id) {
    this.images = this.images.map((image) => ({
      ...image,
      isCover: image.id === id
    }));
    this.renderPreview();
    this.onImagesChange?.(this.getValue());
  }

  removeImage(id) {
    this.images = this.images.filter((image) => image.id !== id);
    if (!this.images.some((image) => image.isCover) && this.images.length) {
      this.images[0].isCover = true;
    }
    this.renderPreview();
    this.onImagesChange?.(this.getValue());
  }

  showError(message) {
    const preview = this.container.querySelector('.preview-container');
    if (preview) preview.innerHTML = `<p class="preview-error">${message}</p>`;
  }

  getValue() {
    return [...this.images];
  }

  getFile() {
    return this.images[0] ?? null;
  }

  loadImages(images = []) {
    if (!Array.isArray(images)) return;
    this.images = images.map((image, index) => ({
      id: image.id || `img-${Date.now()}-${index}`,
      url: String(image.url || image.image || '').trim(),
      name: String(image.name || `Image ${index + 1}`).trim(),
      size: Number(image.size) || 0,
      isCover: Boolean(image.isCover) || index === 0
    })).filter((item) => item.url);
    this.renderPreview();
  }

  clear() {
    this.images = [];
    this.renderPreview();
    this.onImagesChange?.(this.getValue());
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
