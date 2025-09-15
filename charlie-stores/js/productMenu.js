/**
 * GTA-Style Product Menu
 * Handles product display when category circles are clicked
 */

class ProductMenu {
    constructor() {
        this.isVisible = false;
        this.currentCategory = null;
        this.currentStoreId = null;
        this.products = [];
        this.menuElement = null;

        this.init();
    }

    /**
     * Initialize the product menu system
     */
    init() {
        console.log('ProductMenu: Initializing...');
        this.createMenuElement();
        console.log('ProductMenu: Menu element created:', !!this.menuElement);
        this.setupEventListeners();
        console.log('ProductMenu: Event listeners setup complete');
        console.log('ProductMenu: Initialization complete');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('ProductMenu: Setting up categorySelected event listener...');
        // Listen for category selection
        document.addEventListener('categorySelected', (e) => {
            console.log('ProductMenu: categorySelected event received!', e.detail);
            this.handleCategorySelected(e.detail);
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && this.menuElement && !this.menuElement.contains(e.target)) {
                this.hideMenu();
            }
        });
    }

    /**
     * Create the menu DOM element
     */
    createMenuElement() {
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'gta-product-menu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 50%;
            right: -400px;
            width: 380px;
            height: 500px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 20, 0.95));
            border: 2px solid #00ff00;
            border-radius: 8px;
            box-shadow:
                0 0 30px rgba(0, 255, 0, 0.5),
                inset 0 0 20px rgba(0, 0, 0, 0.8);
            z-index: 9999;
            transform: translateY(-50%);
            transition: right 0.4s ease-in-out;
            font-family: 'Courier New', monospace;
            color: #00ff00;
            overflow: hidden;
            display: block;
        `;

        // Add menu header
        const header = document.createElement('div');
        header.className = 'menu-header';
        header.style.cssText = `
            padding: 15px 20px;
            border-bottom: 1px solid #444;
            background: linear-gradient(90deg, rgba(0, 255, 0, 0.2), rgba(0, 0, 0, 0.8));
        `;

        // Add menu content area
        const content = document.createElement('div');
        content.className = 'menu-content';
        content.style.cssText = `
            height: calc(100% - 60px);
            overflow-y: auto;
            padding: 0;
        `;

        // Custom scrollbar styling
        content.innerHTML = `
            <style>
            .menu-content::-webkit-scrollbar {
                width: 8px;
            }
            .menu-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.5);
            }
            .menu-content::-webkit-scrollbar-thumb {
                background: #00ff00;
                border-radius: 4px;
            }
            .menu-content::-webkit-scrollbar-thumb:hover {
                background: #00cc00;
            }
            </style>
        `;

        this.menuElement.appendChild(header);
        this.menuElement.appendChild(content);
        document.body.appendChild(this.menuElement);
    }

    /**
     * Handle category selection
     */
    async handleCategorySelected(detail) {
        console.log('ProductMenu: Category selected for product menu:', detail);

        this.currentCategory = detail.category;
        this.currentStoreId = detail.storeId;

        try {
            console.log('ProductMenu: Loading products for category:', detail.category.id);
            // Load products for this category
            await this.loadProducts(detail.category.id, detail.storeId);

            console.log('ProductMenu: Products loaded, calling showMenu()');
            // Show the menu
            this.showMenu();

        } catch (error) {
            console.error('ProductMenu: Failed to load products:', error);
            this.showErrorMenu();
        }
    }

    /**
     * Load products from API
     */
    async loadProducts(categoryId, storeId) {
        try {
            console.log('ProductMenu: Loading real WooCommerce products for category:', categoryId, 'store:', storeId);

            const formData = new FormData();
            formData.append('action', 'get_store_products_by_category');
            formData.append('store_id', storeId);
            formData.append('category_id', categoryId);
            formData.append('nonce', getConfig('nonce'));

            const response = await fetch(getConfig('ajax_url'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.products = this.formatWooCommerceProducts(data.data.products);
                console.log('ProductMenu: Loaded real products:', this.products);
            } else {
                console.warn('ProductMenu: API returned error, falling back to fake products:', data.data);
                // Fallback to fake products for now
                this.products = this.generateFakeProducts(this.currentCategory);
            }
        } catch (error) {
            console.error('ProductMenu: Error loading products, falling back to fake products:', error);
            // Fallback to fake products
            this.products = this.generateFakeProducts(this.currentCategory);
        }
    }

    /**
     * Format WooCommerce products for menu display
     */
    formatWooCommerceProducts(wooProducts) {
        return wooProducts.map(product => {
            return {
                id: product.id,
                name: product.name,
                price: this.extractPriceFromHTML(product.price),
                currency: 'CAD',
                stock: parseInt(product.store_stock) || 0,
                category: this.currentCategory.name,
                description: product.description || 'No description available',
                image: product.image,
                url: product.url,
                add_to_cart_url: product.add_to_cart_url,
                in_stock: product.in_stock && parseInt(product.store_stock) > 0,
                raw_price_html: product.price // Keep original price HTML
            };
        });
    }

    /**
     * Extract numeric price from WooCommerce price HTML
     */
    extractPriceFromHTML(priceHTML) {
        if (!priceHTML) return 0;

        // Extract price from HTML like "<span class="amount">$29.99</span>"
        const matches = priceHTML.match(/[\d,]+\.?\d*/);
        if (matches) {
            return parseFloat(matches[0].replace(',', ''));
        }
        return 0;
    }

    /**
     * Generate fake products for testing
     */
    generateFakeProducts(category) {
        const products = [];
        const productCount = Math.floor(Math.random() * 8) + 4; // 4-12 products

        const productNames = [
            'Premium Blend', 'Classic Mix', 'Special Reserve', 'Daily Choice',
            'Elite Selection', 'Signature Series', 'House Special', 'Deluxe Option',
            'Standard Grade', 'High Quality', 'Top Tier', 'Select Edition'
        ];

        for (let i = 0; i < productCount; i++) {
            const name = productNames[Math.floor(Math.random() * productNames.length)];
            const price = (Math.random() * 50 + 10).toFixed(2);
            const inStock = Math.random() > 0.2; // 80% chance in stock

            products.push({
                id: `product_${category.id}_${i}`,
                name: `${name} ${i + 1}`,
                price: parseFloat(price),
                currency: 'CAD',
                stock: inStock ? Math.floor(Math.random() * 20) + 1 : 0,
                category: category.name,
                description: `Premium ${category.name.toLowerCase()} product with excellent quality.`,
                image: null // We'll add images later
            });
        }

        return products;
    }

    /**
     * Show the product menu
     */
    showMenu() {
        console.log('ProductMenu: showMenu() called');
        console.log('ProductMenu: menuElement exists:', !!this.menuElement);

        if (!this.menuElement) {
            console.error('ProductMenu: menuElement is null, cannot show menu');
            return;
        }

        console.log('ProductMenu: Updating menu content...');
        this.updateMenuContent();

        console.log('ProductMenu: Setting menu position to visible...');

        // Calculate safe position - ensure menu fits on screen
        const screenWidth = window.innerWidth;
        const menuWidth = 380;
        const safeRight = Math.max(20, screenWidth - menuWidth - 50); // At least 50px from edge

        console.log('ProductMenu: Screen width:', screenWidth, 'Safe position:', safeRight);

        this.menuElement.style.right = '20px'; // Start with right positioning
        this.menuElement.style.left = 'auto'; // Clear any left positioning
        this.menuElement.style.display = 'block'; // Ensure it's visible
        this.menuElement.style.visibility = 'visible'; // Double ensure visibility

        // If still off-screen, use left positioning instead
        setTimeout(() => {
            const bounds = this.menuElement.getBoundingClientRect();
            if (bounds.right > window.innerWidth) {
                console.log('ProductMenu: Menu off-screen, switching to left positioning');
                this.menuElement.style.right = 'auto';
                this.menuElement.style.left = (window.innerWidth - menuWidth - 20) + 'px';
            }
        }, 50);

        this.isVisible = true;

        console.log('ProductMenu: Menu should now be visible at right: 20px');
        console.log('ProductMenu: Menu element styles:', {
            right: this.menuElement.style.right,
            zIndex: this.menuElement.style.zIndex,
            display: this.menuElement.style.display,
            position: this.menuElement.style.position
        });

        // Debug: Check if element is in DOM and visible
        console.log('ProductMenu: Element in DOM:', document.body.contains(this.menuElement));
        console.log('ProductMenu: Element bounds:', this.menuElement.getBoundingClientRect());

        // Remove debugging styles
        this.menuElement.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 20, 0.95))';
        this.menuElement.style.border = '2px solid #00ff00';

        // Add GTA-style sound effect (optional)
        this.playMenuSound();
    }

    /**
     * Hide the product menu
     */
    hideMenu() {
        if (!this.menuElement) return;

        this.menuElement.style.right = '-400px'; // Slide out to right
        this.isVisible = false;

        setTimeout(() => {
            // Clear selection highlighting after menu closes
            document.dispatchEvent(new CustomEvent('menuClosed'));
        }, 400);
    }

    /**
     * Update menu content with products
     */
    updateMenuContent() {
        const header = this.menuElement.querySelector('.menu-header');
        const content = this.menuElement.querySelector('.menu-content');

        if (!header || !content) return;

        // Update header
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 18px; font-weight: bold; text-transform: uppercase;">
                        ${this.currentCategory.name}
                    </div>
                    <div style="font-size: 12px; opacity: 0.7; margin-top: 2px;">
                        ${this.products.length} Products Available
                    </div>
                </div>
                <button class="close-btn" onclick="window.productMenu.hideMenu()" style="
                    background: none;
                    border: 1px solid #00ff00;
                    color: #00ff00;
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(0,255,0,0.2)'" onmouseout="this.style.background='none'">×</button>
            </div>
        `;

        // Update content with product list
        let productHTML = '';

        this.products.forEach((product, index) => {
            const isInStock = product.stock > 0;
            productHTML += `
                <div class="product-item" style="
                    padding: 15px 20px;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background 0.2s ease;
                    cursor: ${isInStock ? 'pointer' : 'not-allowed'};
                    opacity: ${isInStock ? '1' : '0.5'};
                " onmouseover="if(${isInStock}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="this.style.background='transparent'" onclick="window.productMenu.handleProductClick('${product.id}')">
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">
                            ${product.name}
                        </div>
                        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 2px;">
                            ${product.description}
                        </div>
                        <div style="font-size: 10px; opacity: 0.6;">
                            ${isInStock ? `Stock: ${product.stock}` : 'Out of Stock'}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: bold; color: #00ff00;">
                            ${product.raw_price_html || '$' + product.price.toFixed(2)}
                        </div>
                        <div style="font-size: 10px; opacity: 0.7; margin-top: 2px;">
                            ${product.currency}
                        </div>
                    </div>
                </div>
            `;
        });

        if (this.products.length === 0) {
            productHTML = `
                <div style="padding: 40px 20px; text-align: center; opacity: 0.7;">
                    <div style="font-size: 16px; margin-bottom: 8px;">No Products Available</div>
                    <div style="font-size: 12px;">This category is currently empty.</div>
                </div>
            `;
        }

        content.innerHTML = productHTML;
    }

    /**
     * Handle product click
     */
    handleProductClick(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock === 0) return;

        console.log('Product clicked:', product);

        // For real WooCommerce products, redirect to product page or add to cart
        if (product.url) {
            // Option 1: Navigate to product page
            window.open(product.url, '_blank');

            // Option 2: Add to cart directly (uncomment if preferred)
            // if (product.add_to_cart_url) {
            //     window.location.href = product.add_to_cart_url;
            // }
        } else {
            // Fallback for fake products
            alert(`Selected: ${product.name}\nPrice: $${product.price}\nStock: ${product.stock}`);
        }
    }

    /**
     * Show error menu
     */
    showErrorMenu() {
        const content = this.menuElement.querySelector('.menu-content');
        const header = this.menuElement.querySelector('.menu-header');

        if (header) {
            header.innerHTML = `
                <div style="color: #ff4444;">
                    <div style="font-size: 18px; font-weight: bold;">ERROR</div>
                    <div style="font-size: 12px; opacity: 0.7;">Failed to load products</div>
                </div>
            `;
        }

        if (content) {
            content.innerHTML = `
                <div style="padding: 40px 20px; text-align: center; color: #ff4444;">
                    <div style="font-size: 16px; margin-bottom: 8px;">Unable to Load Products</div>
                    <div style="font-size: 12px; opacity: 0.7;">Please try again later.</div>
                </div>
            `;
        }

        this.showMenu();
    }

    /**
     * Play GTA-style menu sound (optional)
     */
    playMenuSound() {
        // TODO: Add menu sound effect
        // For now, just log
        console.log('🔊 Menu sound: *beep*');
    }

    /**
     * Check if menu is currently visible
     */
    isMenuVisible() {
        return this.isVisible;
    }
}

// Initialize product menu
let productMenu;

document.addEventListener('DOMContentLoaded', () => {
    console.log('ProductMenu: DOM loaded, initializing in 150ms...');
    setTimeout(() => {
        console.log('ProductMenu: Creating ProductMenu instance...');
        productMenu = new ProductMenu();

        // Make available globally for debugging and button clicks
        window.productMenu = productMenu;
        console.log('ProductMenu: Instance created and available as window.productMenu');

        // Add manual test function
        window.testProductMenu = () => {
            console.log('Testing product menu manually...');
            if (window.productMenu) {
                window.productMenu.currentCategory = { id: 'test', name: 'Test Category' };
                window.productMenu.currentStoreId = 'test';
                window.productMenu.products = [
                    { id: 'test1', name: 'Test Product', price: 29.99, currency: 'CAD', stock: 5, description: 'Test description' }
                ];
                window.productMenu.showMenu();
            }
        };
        console.log('ProductMenu: Use window.testProductMenu() to manually test the menu');
    }, 150);
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ProductMenu = ProductMenu;
}