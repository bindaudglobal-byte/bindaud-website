import { PRODUCT_CATALOG, resolveSitePath, buildProductLink } from './helpers.js';
import { getProducts, normalizeProduct } from './api.js';
import { debounce, requestFrame } from './performance.js';

let searchableCatalog = [...PRODUCT_CATALOG];

const loadSearchCatalog = async () => {
    if (searchableCatalog.length && searchableCatalog[0]?.id) {
        return searchableCatalog;
    }

    try {
        const products = await getProducts({ limit: 50 });
        searchableCatalog = (products || []).map(normalizeProduct);
        return searchableCatalog;
    } catch (error) {
        searchableCatalog = [...PRODUCT_CATALOG];
        return searchableCatalog;
    }
};

export function filterProductsBySearch(query) {
    const normalizedQuery = (query || '').toLowerCase().trim();
    const productCards = document.querySelectorAll('[data-product-id], .product-card, .product-item');
    let visibleCount = 0;
    let hiddenCount = 0;

    requestFrame(() => {
        productCards.forEach((card) => {
            const productName = card.querySelector('.product-name, h3, [class*="title"]')?.textContent.toLowerCase() || '';
            const productDesc = card.querySelector('.product-desc, p, [class*="description"]')?.textContent.toLowerCase() || '';
            const productKeywords = (card.getAttribute('data-keywords') || '').toLowerCase();
            const searchText = `${productName} ${productDesc} ${productKeywords}`;

            if (!normalizedQuery || searchText.includes(normalizedQuery)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
                hiddenCount++;
            }
        });
    });

    if (normalizedQuery && hiddenCount > 0 && visibleCount === 0) {
        showNoResults(normalizedQuery);
    } else if (visibleCount > 0 || !normalizedQuery) {
        hideNoResults();
    }
}

function showNoResults(query) {
    let noResultsDiv = document.getElementById('search-no-results');
    
    if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'search-no-results';
        noResultsDiv.style.cssText = `
            grid-column: 1 / -1;
            padding: 2rem;
            text-align: center;
            background: rgba(33, 72, 107, 0.04);
            border-radius: 1rem;
            border: 1px dashed var(--color-border);
        `;
        
        const productGrid = document.querySelector('.product-grid, .shop-grid, [class*="grid"]');
        if (productGrid) {
            productGrid.appendChild(noResultsDiv);
        }
    }
    
    noResultsDiv.innerHTML = `
        <p style="font-size: 1.1rem; color: var(--color-text-light); margin: 0;">
            No products found for "<strong>${query}</strong>"
        </p>
        <p style="font-size: 0.9rem; color: var(--color-muted); margin: 0.5rem 0 0 0;">
            Try different keywords or browse our collections.
        </p>
    `;
    noResultsDiv.style.display = 'block';
}

function hideNoResults() {
    const noResultsDiv = document.getElementById('search-no-results');
    if (noResultsDiv) {
        noResultsDiv.style.display = 'none';
    }
}

// Search helper for collections
export async function getProductsByKeyword(keyword) {
    if (!keyword) return [];

    const catalog = await loadSearchCatalog();
    const searchTerms = keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return catalog.filter((product) => {
        const text = `${product.name} ${product.description} ${product.code} ${product.collection} ${product.badge}`.toLowerCase();
        return searchTerms.some((term) => text.includes(term));
    });
}

// Live suggestion UI for global search inputs
function createSuggestionItem(product) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'search-suggestion-item';
    item.innerHTML = `
        <img src="${resolveSitePath(product.image)}" alt="${product.name}" loading="lazy" />
        <div class="suggestion-content">
            <strong class="suggestion-title">${product.name}</strong>
            <small class="suggestion-price">PKR ${Number(product.price).toLocaleString('en-PK')}</small>
        </div>
    `;
    item.dataset.productId = product.id;
    return item;
}

function initLiveSearch() {
    const inputs = document.querySelectorAll('input[type="search"], input[placeholder*="Search"], .site-search');

    inputs.forEach((input) => {
        if (input.dataset.searchEnhanced === 'true') return;
        input.dataset.searchEnhanced = 'true';

        const suggestionsRoot = document.createElement('div');
        suggestionsRoot.className = 'search-suggestions';
        suggestionsRoot.setAttribute('aria-hidden', 'true');
        input.insertAdjacentElement('afterend', suggestionsRoot);

        let activeIndex = -1;
        let requestId = 0;

        const renderSuggestions = async (query) => {
            const currentRequestId = ++requestId;
            suggestionsRoot.innerHTML = '';
            suggestionsRoot.style.display = 'none';
            suggestionsRoot.setAttribute('aria-hidden', 'true');
            activeIndex = -1;

            if (!query) return;

            const results = (await getProductsByKeyword(query)).slice(0, 6);
            if (currentRequestId !== requestId) return;
            if (results.length === 0) return;

            results.forEach((product) => {
                const node = createSuggestionItem(product);
                node.addEventListener('click', () => {
                    window.location.href = buildProductLink(product.id);
                });
                suggestionsRoot.appendChild(node);
            });

            suggestionsRoot.style.display = 'block';
            suggestionsRoot.setAttribute('aria-hidden', 'false');
        };

        const debouncedRender = debounce((value) => {
            void renderSuggestions(value);
        }, 90);

        input.addEventListener('input', (e) => {
            const q = e.target.value.trim().toLowerCase();
            debouncedRender(q);
        });

        input.addEventListener('keydown', (e) => {
            const items = suggestionsRoot.querySelectorAll('.search-suggestion-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                items.forEach((it, i) => it.classList.toggle('active', i === activeIndex));
                items[activeIndex]?.focus();
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                items.forEach((it, i) => it.classList.toggle('active', i === activeIndex));
                items[activeIndex]?.focus();
            }

            if (e.key === 'Enter') {
                const active = suggestionsRoot.querySelector('.search-suggestion-item.active');
                if (active) active.click();
            }
        });
    });
}

// Enhance existing initSearch to also enable live suggestions
export function initSearch() {
    if (window.__BINDAUD_SEARCH_INITIALIZED) return;
    window.__BINDAUD_SEARCH_INITIALIZED = true;

    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], .search-input, .site-search');

    searchInputs.forEach((input) => {
        input.addEventListener('input', debounce((event) => {
            const query = event.target.value.toLowerCase().trim();
            filterProductsBySearch(query);
        }, 80));
    });

    void loadSearchCatalog();
    initLiveSearch();
}
