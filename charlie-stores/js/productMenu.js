/**
 * GTA-Style Product Menu
 * Handles product display when category circles are clicked
 */

class ProductMenu {
    constructor() {
        this.isVisible = false;
        this.currentCategory = null;
        this.selectedBrand = null; // Currently selected brand filter
        this.currentProduct = null;
        this.currentStoreId = null;
        this.brands = [];
        this.allProducts = []; // All products in category
        this.filteredProducts = []; // Filtered by selected brand
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
            right: -800px;
            width: 750px;
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

        // Add dual-panel container
        const panelContainer = document.createElement('div');
        panelContainer.className = 'panel-container';
        panelContainer.style.cssText = `
            display: flex;
            height: calc(100% - 60px);
        `;

        // Left panel - Brands
        const brandsPanel = document.createElement('div');
        brandsPanel.className = 'brands-panel';
        brandsPanel.style.cssText = `
            width: 250px;
            border-right: 1px solid #444;
            overflow-y: auto;
            padding: 0;
        `;

        // Right panel - Products
        const productsPanel = document.createElement('div');
        productsPanel.className = 'products-panel';
        productsPanel.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0;
        `;

        // Custom scrollbar styling for both panels
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.innerHTML = `
            .brands-panel::-webkit-scrollbar,
            .products-panel::-webkit-scrollbar {
                width: 8px;
            }
            .brands-panel::-webkit-scrollbar-track,
            .products-panel::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.5);
            }
            .brands-panel::-webkit-scrollbar-thumb,
            .products-panel::-webkit-scrollbar-thumb {
                background: #00ff00;
                border-radius: 4px;
            }
            .brands-panel::-webkit-scrollbar-thumb:hover,
            .products-panel::-webkit-scrollbar-thumb:hover {
                background: #00cc00;
            }
        `;

        // Assemble the menu
        panelContainer.appendChild(brandsPanel);
        panelContainer.appendChild(productsPanel);
        this.menuElement.appendChild(header);
        this.menuElement.appendChild(panelContainer);
        this.menuElement.appendChild(scrollbarStyle);
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
            console.log('ProductMenu: Loading brands and products for category:', detail.category.id);

            // Load both brands and all products for this category
            await Promise.all([
                this.loadBrands(detail.category.id, detail.storeId),
                this.loadAllProductsForCategory(detail.category.id, detail.storeId)
            ]);

            console.log('ProductMenu: Data loaded, showing dual-panel menu');
            this.selectedBrand = null; // No brand filter initially
            this.showMenu();

        } catch (error) {
            console.error('ProductMenu: Failed to load menu data:', error);
            this.showErrorMenu();
        }
    }

    /**
     * Load brands from API (Level 1)
     */
    async loadBrands(categoryId, storeId) {
        try {
            console.log('ProductMenu: Loading brands for category:', categoryId, 'store:', storeId);

            const formData = new FormData();
            formData.append('action', 'get_store_brands_by_category');
            formData.append('store_id', storeId);
            formData.append('category_id', categoryId);
            formData.append('nonce', getConfig('nonce'));

            const response = await fetch(getConfig('ajax_url'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.brands = data.data.brands;
                console.log('ProductMenu: Loaded brands:', this.brands);
            } else {
                console.warn('ProductMenu: API returned error for brands:', data.data);
                this.brands = [];
            }
        } catch (error) {
            console.error('ProductMenu: Error loading brands:', error);
            this.brands = [];
        }
    }

    /**
     * Load all products for category (for dual-panel view)
     */
    async loadAllProductsForCategory(categoryId, storeId) {
        try {
            console.log('ProductMenu: Loading all products for category:', categoryId, 'store:', storeId);

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
                this.allProducts = this.formatWooCommerceProducts(data.data.products);
                this.filteredProducts = [...this.allProducts]; // Start with all products
                console.log('ProductMenu: Loaded all products:', this.allProducts);
            } else {
                console.warn('ProductMenu: API returned error for all products:', data.data);
                this.allProducts = [];
                this.filteredProducts = [];
            }
        } catch (error) {
            console.error('ProductMenu: Error loading all products:', error);
            this.allProducts = [];
            this.filteredProducts = [];
        }
    }

    /**
     * Load products from API (for specific brand)
     */
    async loadProducts(categoryId, storeId, brandId) {
        try {
            console.log('ProductMenu: Loading products for category:', categoryId, 'store:', storeId, 'brand:', brandId);

            const formData = new FormData();
            formData.append('action', 'get_store_products_by_brand');
            formData.append('store_id', storeId);
            formData.append('category_id', categoryId);
            formData.append('brand_id', brandId);
            formData.append('nonce', getConfig('nonce'));

            const response = await fetch(getConfig('ajax_url'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.products = this.formatWooCommerceProducts(data.data.products);
                console.log('ProductMenu: Loaded products:', this.products);
            } else {
                console.warn('ProductMenu: API returned error for products:', data.data);
                this.products = [];
            }
        } catch (error) {
            console.error('ProductMenu: Error loading products:', error);
            this.products = [];
        }
    }

    /**
     * Handle brand selection (filter products)
     */
    handleBrandSelected(brand) {
        console.log('ProductMenu: Brand selected for filtering:', brand);

        if (this.selectedBrand && this.selectedBrand.id === brand.id) {
            // Clicking same brand deselects it
            this.selectedBrand = null;
            this.filteredProducts = [...this.allProducts];
        } else {
            // Select new brand and filter products
            this.selectedBrand = brand;
            this.filteredProducts = this.allProducts.filter(product => {
                console.log('ProductMenu: Comparing product brand:', product.brand, 'with selected brand:', brand.name);
                return product.brand === brand.name;
            });
        }

        console.log('ProductMenu: Brand filter debug:');
        console.log('Selected brand:', brand.name);
        console.log('All products:', this.allProducts.length);
        console.log('All product brands:', this.allProducts.map(p => p.brand));
        console.log('Filtered to', this.filteredProducts.length, 'products');
        this.updateMenuLayout();
    }

    /**
     * Handle product selection (Level 2 → Level 3)
     */
    handleProductSelected(product) {
        console.log('ProductMenu: Product selected:', product);
        this.currentProduct = product;
        this.menuLevel = 3;
        this.updateMenuLayout();
    }

    /**
     * Navigate back in menu levels
     */
    navigateBack() {
        if (this.menuLevel === 3) {
            // Product detail → Product list
            this.menuLevel = 2;
            this.currentProduct = null;
        } else if (this.menuLevel === 2) {
            // Product list → Brand list
            this.menuLevel = 1;
            this.currentBrand = null;
            this.products = [];
        } else {
            // Brand list → Close menu
            this.hideMenu();
            return;
        }
        this.updateMenuLayout();
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
                raw_price_html: product.price, // Keep original price HTML
                brand: product.brand || 'No Brand' // Add brand information
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
        console.log('ProductMenu: showMenu() called at level:', this.menuLevel);

        if (!this.menuElement) {
            console.error('ProductMenu: menuElement is null, cannot show menu');
            return;
        }

        // Position menu
        this.positionMenu();

        // Update layout based on current level
        this.updateMenuLayout();

        this.isVisible = true;
        this.playMenuSound();
    }

    /**
     * Position the menu on screen
     */
    positionMenu() {
        const menuWidth = 750; // Fixed width for dual-panel layout

        this.menuElement.style.width = menuWidth + 'px';
        this.menuElement.style.right = '20px';
        this.menuElement.style.left = 'auto';
        this.menuElement.style.display = 'block';
        this.menuElement.style.visibility = 'visible';

        // Check if menu fits on screen
        setTimeout(() => {
            const bounds = this.menuElement.getBoundingClientRect();
            if (bounds.right > window.innerWidth) {
                console.log('ProductMenu: Menu off-screen, adjusting position');
                this.menuElement.style.right = 'auto';
                this.menuElement.style.left = (window.innerWidth - menuWidth - 20) + 'px';
            }
        }, 50);
    }

    /**
     * Update menu layout (dual-panel)
     */
    updateMenuLayout() {
        if (!this.menuElement) return;

        const header = this.menuElement.querySelector('.menu-header');
        const brandsPanel = this.menuElement.querySelector('.brands-panel');
        const productsPanel = this.menuElement.querySelector('.products-panel');

        if (!header || !brandsPanel || !productsPanel) return;

        // Update header
        this.updateDualPanelHeader(header);

        // Update brands panel
        this.updateBrandsPanel(brandsPanel);

        // Update products panel
        this.updateProductsPanel(productsPanel);
    }

    /**
     * Hide the product menu
     */
    hideMenu() {
        console.log('ProductMenu: hideMenu() called');
        console.log('ProductMenu: menuElement exists:', !!this.menuElement);

        if (!this.menuElement) {
            console.error('ProductMenu: Cannot hide menu - menuElement is null');
            return;
        }

        console.log('ProductMenu: Current position before hide:', this.menuElement.style.right);
        console.log('ProductMenu: Current computed position before hide:', window.getComputedStyle(this.menuElement).right);

        // Reset to hidden position with animation
        this.menuElement.style.right = '-800px';
        this.isVisible = false;

        console.log('ProductMenu: Position set to -800px for hiding animation');

        // Wait for animation to complete, then dispatch close event
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('menuClosed'));
            console.log('ProductMenu: Menu hidden and menuClosed event dispatched');
        }, 400);
    }

    /**
     * Update dual-panel header
     */
    updateDualPanelHeader(header) {
        const selectedBrandText = this.selectedBrand ?
            ` - ${this.selectedBrand.name}` : '';

        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 18px; font-weight: bold; text-transform: uppercase;">
                        ${this.currentCategory.name}${selectedBrandText}
                    </div>
                    <div style="font-size: 12px; opacity: 0.7; margin-top: 2px;">
                        Showing ${this.filteredProducts.length} of ${this.allProducts.length} products
                    </div>
                </div>
                <button class="close-btn" style="
                    background: none; border: 1px solid #00ff00; color: #00ff00;
                    width: 30px; height: 30px; border-radius: 4px; cursor: pointer;
                    font-family: 'Courier New', monospace; font-size: 18px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s ease;
                ">×</button>
            </div>
        `;

        // Add event listener to close button
        const closeBtn = header.querySelector('.close-btn');
        if (closeBtn) {
            // Remove any existing event listeners
            closeBtn.onclick = null;

            // Add proper event listener
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('ProductMenu: Close button clicked');
                this.hideMenu();
            });

            // Add hover effects
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = 'rgba(0,255,0,0.2)';
            });

            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = 'none';
            });
        }
    }

    /**
     * Update brands panel (left side)
     */
    updateBrandsPanel(panel) {
        let html = `
            <div style="padding: 15px 15px 10px 15px; border-bottom: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #00ff00;">
                    BRANDS
                </div>
            </div>
        `;

        // Add "All Brands" option
        const allSelected = !this.selectedBrand;
        html += `
            <div class="brand-item" style="
                padding: 12px 15px;
                border-bottom: 1px solid #333;
                cursor: pointer;
                transition: background 0.2s ease;
                background: ${allSelected ? 'rgba(0,255,0,0.2)' : 'transparent'};
                border-left: ${allSelected ? '3px solid #00ff00' : '3px solid transparent'};
            " onmouseover="if(!${allSelected}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="if(!${allSelected}) this.style.background='transparent'" onclick="window.productMenu.clearBrandFilter()">
                <div style="font-size: 14px; font-weight: bold;">
                    All Brands
                </div>
                <div style="font-size: 11px; opacity: 0.7;">
                    ${this.allProducts.length} products
                </div>
            </div>
        `;

        // Add individual brands
        this.brands.forEach(brand => {
            const isSelected = this.selectedBrand && this.selectedBrand.id === brand.id;
            html += `
                <div class="brand-item" style="
                    padding: 12px 15px;
                    border-bottom: 1px solid #333;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    background: ${isSelected ? 'rgba(0,255,0,0.2)' : 'transparent'};
                    border-left: ${isSelected ? '3px solid #00ff00' : '3px solid transparent'};
                " onmouseover="if(!${isSelected}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="if(!${isSelected}) this.style.background='transparent'" onclick="window.productMenu.handleBrandSelected({id: ${brand.id}, name: '${brand.name}', slug: '${brand.slug}'})">
                    <div style="font-size: 14px; font-weight: bold;">
                        ${brand.name}
                    </div>
                    <div style="font-size: 11px; opacity: 0.7;">
                        ${brand.product_count} products
                    </div>
                </div>
            `;
        });

        if (this.brands.length === 0) {
            html += `
                <div style="padding: 30px 15px; text-align: center; opacity: 0.5;">
                    <div style="font-size: 12px;">No brands available</div>
                </div>
            `;
        }

        panel.innerHTML = html;
    }

    /**
     * Update products panel (right side)
     */
    updateProductsPanel(panel) {
        let html = `
            <div style="padding: 15px 15px 10px 15px; border-bottom: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; color: #00ff00;">
                    PRODUCTS
                    ${this.selectedBrand ? `(${this.selectedBrand.name})` : '(All Brands)'}
                </div>
            </div>
        `;

        if (this.filteredProducts.length === 0) {
            html += `
                <div style="padding: 40px 20px; text-align: center; opacity: 0.7;">
                    <div style="font-size: 16px; margin-bottom: 8px;">No Products Available</div>
                    <div style="font-size: 12px;">
                        ${this.selectedBrand ?
                            `No products found for ${this.selectedBrand.name}` :
                            'This category has no products'
                        }
                    </div>
                </div>
            `;
        } else {
            this.filteredProducts.forEach(product => {
                const isInStock = product.stock > 0;
                html += `
                    <div class="product-item" style="
                        padding: 15px 20px;
                        border-bottom: 1px solid #333;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        transition: background 0.2s ease;
                        cursor: ${isInStock ? 'pointer' : 'not-allowed'};
                        opacity: ${isInStock ? '1' : '0.5'};
                    " onmouseover="if(${isInStock}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="this.style.background='transparent'" onclick="window.open('${product.url}', '_blank')">
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">
                                ${product.name}
                            </div>
                            <div style="font-size: 11px; opacity: 0.7; margin-bottom: 2px;">
                                ${product.description}
                            </div>
                            <div style="font-size: 10px; opacity: 0.6;">
                                Brand: ${product.brand || 'Unknown'} • ${isInStock ? `Stock: ${product.stock}` : 'Out of Stock'}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 14px; font-weight: bold; color: #00ff00;">
                                ${product.raw_price_html || '$' + product.price.toFixed(2)}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        panel.innerHTML = html;
    }

    /**
     * Clear brand filter (show all products)
     */
    clearBrandFilter() {
        this.selectedBrand = null;
        this.filteredProducts = [...this.allProducts];
        console.log('ProductMenu: Cleared brand filter, showing all products');
        this.updateMenuLayout();
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