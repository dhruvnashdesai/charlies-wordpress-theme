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
        this.selectedProduct = null; // Currently selected product for details
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
                console.log('ProductMenu: Clicked outside menu, closing...');
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
            right: -1000px;
            width: 950px;
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

        // Add three-panel container
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

        // Middle panel - Products
        const productsPanel = document.createElement('div');
        productsPanel.className = 'products-panel';
        productsPanel.style.cssText = `
            width: 400px;
            border-right: 1px solid #444;
            overflow-y: auto;
            padding: 0;
        `;

        // Right panel - Product Details
        const detailsPanel = document.createElement('div');
        detailsPanel.className = 'details-panel';
        detailsPanel.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0;
        `;

        // Custom scrollbar styling for all panels
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.innerHTML = `
            .brands-panel::-webkit-scrollbar,
            .products-panel::-webkit-scrollbar,
            .details-panel::-webkit-scrollbar {
                width: 8px;
            }
            .brands-panel::-webkit-scrollbar-track,
            .products-panel::-webkit-scrollbar-track,
            .details-panel::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.5);
            }
            .brands-panel::-webkit-scrollbar-thumb,
            .products-panel::-webkit-scrollbar-thumb,
            .details-panel::-webkit-scrollbar-thumb {
                background: #00ff00;
                border-radius: 4px;
            }
            .brands-panel::-webkit-scrollbar-thumb:hover,
            .products-panel::-webkit-scrollbar-thumb:hover,
            .details-panel::-webkit-scrollbar-thumb:hover {
                background: #00cc00;
            }
        `;

        // Assemble the menu
        panelContainer.appendChild(brandsPanel);
        panelContainer.appendChild(productsPanel);
        panelContainer.appendChild(detailsPanel);
        this.menuElement.appendChild(header);
        this.menuElement.appendChild(panelContainer);
        this.menuElement.appendChild(scrollbarStyle);

        // Handle clicks inside the menu with event delegation
        this.menuElement.addEventListener('click', (e) => {
            console.log('ProductMenu: Click inside menu');

            // Handle brand clicks
            const brandItem = e.target.closest('[data-action]');
            if (brandItem) {
                const action = brandItem.getAttribute('data-action');

                if (action === 'clear-filter') {
                    console.log('ProductMenu: Clear brand filter clicked');
                    this.clearBrandFilter();
                } else if (action === 'select-brand') {
                    const brandData = {
                        id: parseInt(brandItem.getAttribute('data-brand-id')),
                        name: brandItem.getAttribute('data-brand-name'),
                        slug: brandItem.getAttribute('data-brand-slug')
                    };
                    console.log('ProductMenu: Brand selected via delegation:', brandData);
                    this.handleBrandSelected(brandData);
                } else if (action === 'select-product') {
                    const productId = brandItem.getAttribute('data-product-id');
                    console.log('ProductMenu: Product selected via delegation:', productId);
                    this.handleProductSelected(productId);
                }

                // Stop propagation for brand clicks
                e.stopPropagation();
                return;
            }

            // For all other clicks inside menu, prevent closing but don't stop propagation
            // (this allows product links to work normally)
            if (!e.target.closest('.close-btn')) {
                console.log('ProductMenu: General click inside menu, preventing close');
                e.stopPropagation();
            }
        });

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
     * Handle product selection for details panel
     */
    handleProductSelected(productId) {
        console.log('ProductMenu: Product selected for details:', productId);

        // Find the product in our filtered products
        const product = this.filteredProducts.find(p => p.id === productId);
        if (product) {
            this.selectedProduct = product;
            console.log('ProductMenu: Selected product:', product);
            this.updateMenuLayout();
        } else {
            console.error('ProductMenu: Product not found:', productId);
        }
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
        console.log('ProductMenu: showMenu() called, already visible:', this.isVisible);

        if (!this.menuElement) {
            console.error('ProductMenu: menuElement is null, cannot show menu');
            return;
        }

        // Only position menu if it's not already visible
        if (!this.isVisible) {
            this.positionMenu();
            this.playMenuSound();
        }

        // Always update layout with new category data
        this.updateMenuLayout();

        this.isVisible = true;
    }

    /**
     * Position the menu on screen
     */
    positionMenu() {
        const menuWidth = 950; // Fixed width for three-panel layout

        this.menuElement.style.width = menuWidth + 'px';
        this.menuElement.style.right = '20px';
        this.menuElement.style.left = 'auto';
        this.menuElement.style.display = 'block';
        this.menuElement.style.visibility = 'visible';

        // Ensure menu content is visible
        const panelContainer = this.menuElement.querySelector('.panel-container');
        if (panelContainer) {
            panelContainer.style.display = 'flex';
            panelContainer.style.height = 'calc(100% - 60px)';
        }

        console.log('ProductMenu: Menu positioned with right: 20px');
        console.log('ProductMenu: Brands loaded:', this.brands.length);
        console.log('ProductMenu: Products loaded:', this.allProducts.length);
    }

    /**
     * Update menu layout (three-panel)
     */
    updateMenuLayout() {
        if (!this.menuElement) return;

        const header = this.menuElement.querySelector('.menu-header');
        const brandsPanel = this.menuElement.querySelector('.brands-panel');
        const productsPanel = this.menuElement.querySelector('.products-panel');
        const detailsPanel = this.menuElement.querySelector('.details-panel');

        if (!header || !brandsPanel || !productsPanel || !detailsPanel) return;

        // Update header
        this.updateThreePanelHeader(header);

        // Update brands panel
        this.updateBrandsPanel(brandsPanel);

        // Update products panel
        this.updateProductsPanel(productsPanel);

        // Update details panel
        this.updateDetailsPanel(detailsPanel);
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

        // Ensure we're using right property consistently
        this.menuElement.style.left = 'auto';
        this.menuElement.style.right = '-1000px';
        this.isVisible = false;

        console.log('ProductMenu: Position set to -800px for hiding animation');

        // Check if transition is working
        setTimeout(() => {
            console.log('ProductMenu: Computed position after 200ms:', window.getComputedStyle(this.menuElement).right);
        }, 200);

        // Wait for animation to complete, then dispatch close event
        setTimeout(() => {
            // Exit product view when menu closes
            document.body.classList.remove('product-view-mode');
            document.dispatchEvent(new CustomEvent('menuClosed'));
            console.log('ProductMenu: Menu hidden and menuClosed event dispatched');
        }, 400);
    }

    /**
     * Update three-panel header
     */
    updateThreePanelHeader(header) {
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
            console.log('ProductMenu: Close button found, adding event listeners...');

            // Remove any existing event listeners
            closeBtn.onclick = null;

            // Add multiple event types to test
            closeBtn.addEventListener('click', (e) => {
                console.log('ProductMenu: CLICK EVENT FIRED!');
                e.preventDefault();
                e.stopPropagation();
                this.hideMenu();
            });

            closeBtn.addEventListener('mousedown', (e) => {
                console.log('ProductMenu: MOUSEDOWN EVENT FIRED!');
            });

            closeBtn.addEventListener('mouseup', (e) => {
                console.log('ProductMenu: MOUSEUP EVENT FIRED!');
            });

            // Add hover effects
            closeBtn.addEventListener('mouseenter', () => {
                console.log('ProductMenu: Mouse entered close button');
                closeBtn.style.background = 'rgba(0,255,0,0.2)';
            });

            closeBtn.addEventListener('mouseleave', () => {
                console.log('ProductMenu: Mouse left close button');
                closeBtn.style.background = 'none';
            });

            // Test if button is actually clickable
            closeBtn.style.pointerEvents = 'all';
            closeBtn.style.position = 'relative';
            closeBtn.style.zIndex = '10000';

            console.log('ProductMenu: Close button setup complete');
        } else {
            console.error('ProductMenu: Close button not found in header!');
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
            " onmouseover="if(!${allSelected}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="if(!${allSelected}) this.style.background='transparent'" data-action="clear-filter">
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
                " onmouseover="if(!${isSelected}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="if(!${isSelected}) this.style.background='transparent'" data-action="select-brand" data-brand-id="${brand.id}" data-brand-name="${brand.name}" data-brand-slug="${brand.slug}">
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
                    " onmouseover="if(${isInStock}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="this.style.background='transparent'" data-action="select-product" data-product-id="${product.id}">
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
     * Update details panel (right side)
     */
    updateDetailsPanel(panel) {
        if (!this.selectedProduct) {
            // No product selected, show placeholder
            panel.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #888;">
                    <div style="font-size: 16px; margin-bottom: 10px;">Select a product</div>
                    <div style="font-size: 12px;">Click on a product from the list to view details</div>
                </div>
            `;
            return;
        }

        const product = this.selectedProduct;
        const isInStock = product.stock > 0;

        panel.innerHTML = `
            <div style="padding: 20px;">
                <!-- Product Image -->
                <div style="text-align: center; margin-bottom: 20px;">
                    ${product.image ?
                        `<img src="${product.image}" alt="${product.name}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid #444;">` :
                        `<div style="width: 200px; height: 200px; background: #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #666; font-size: 14px;">No Image</div>`
                    }
                </div>

                <!-- Product Name -->
                <div style="font-size: 18px; font-weight: bold; color: #00ff00; margin-bottom: 10px; text-align: center;">
                    ${product.name}
                </div>

                <!-- Price -->
                <div style="font-size: 16px; color: #00ff00; text-align: center; margin-bottom: 15px;">
                    ${product.raw_price_html || '$' + product.price.toFixed(2)}
                </div>

                <!-- Stock Status -->
                <div style="text-align: center; margin-bottom: 15px;">
                    <span style="padding: 4px 12px; border-radius: 4px; font-size: 12px; ${isInStock ? 'background: rgba(0,255,0,0.2); color: #00ff00;' : 'background: rgba(255,0,0,0.2); color: #ff4444;'}">
                        ${isInStock ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </span>
                </div>

                <!-- Brand -->
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #888; margin-bottom: 4px;">BRAND</div>
                    <div style="font-size: 14px;">${product.brand || 'Unknown'}</div>
                </div>

                <!-- Category -->
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #888; margin-bottom: 4px;">CATEGORY</div>
                    <div style="font-size: 14px;">${product.category}</div>
                </div>

                <!-- Description -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #888; margin-bottom: 4px;">DESCRIPTION</div>
                    <div style="font-size: 14px; line-height: 1.4;">${product.description}</div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 10px;">
                    ${isInStock ?
                        `<button onclick="window.open('${product.url}', '_blank')" style="
                            flex: 1; padding: 10px; background: rgba(0,255,0,0.2); border: 1px solid #00ff00;
                            color: #00ff00; border-radius: 4px; cursor: pointer; font-family: 'Courier New', monospace;
                            transition: background 0.2s ease;
                        " onmouseover="this.style.background='rgba(0,255,0,0.3)'" onmouseout="this.style.background='rgba(0,255,0,0.2)'">
                            VIEW PRODUCT
                        </button>` :
                        `<button style="
                            flex: 1; padding: 10px; background: rgba(255,0,0,0.2); border: 1px solid #ff4444;
                            color: #ff4444; border-radius: 4px; cursor: not-allowed; font-family: 'Courier New', monospace;
                        ">
                            OUT OF STOCK
                        </button>`
                    }
                </div>
            </div>
        `;
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