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
        this.currentView = 'products'; // 'products', 'cart', or 'checkout'
        this.cart = []; // Local cart storage for backward compatibility
        this.wooCart = null; // WooCommerce cart manager

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
        this.initWooCart();
        console.log('ProductMenu: Event listeners setup complete');
        console.log('ProductMenu: Initialization complete');
    }

    /**
     * Initialize WooCommerce cart manager
     */
    initWooCart() {
        // Try to use existing global instance first
        if (typeof window !== 'undefined' && window.charlieCart) {
            this.wooCart = window.charlieCart;
            console.log('ProductMenu: Using existing WooCommerce cart manager');
        } else if (typeof WooCartManager !== 'undefined') {
            this.wooCart = new WooCartManager();
            console.log('ProductMenu: Created new WooCommerce cart manager');
        } else {
            console.warn('ProductMenu: WooCartManager not available, falling back to localStorage');
            this.cart = this.loadCartFromStorage();
            return;
        }

        // Listen for cart events
        document.addEventListener('cart_updated', (e) => {
            this.handleCartUpdated(e.detail);
        });

        document.addEventListener('cart_loaded', (e) => {
            this.handleCartLoaded(e.detail);
        });

        // Load initial cart data
        if (this.wooCart) {
            this.loadInitialCartData();
        }
    }

    /**
     * Load initial cart data from WooCommerce
     */
    async loadInitialCartData() {
        try {
            console.log('ProductMenu: Loading initial cart data...');
            const cartData = await this.wooCart.loadCart();
            console.log('ProductMenu: Initial cart data loaded:', cartData);

            if (cartData) {
                this.cart = cartData.items || [];
                this.cartTotal = cartData.total || '0.00';
                this.cartCount = cartData.count || 0;
                console.log('ProductMenu: Cart initialized with', this.cartCount, 'items, total:', this.cartTotal);

                // If menu is visible, update the display
                if (this.isVisible) {
                    this.updateMenuLayout();
                }
            }
        } catch (error) {
            console.error('ProductMenu: Failed to load initial cart data:', error);
            this.cart = this.loadCartFromStorage();
        }
    }

    /**
     * Handle cart updated event from WooCommerce
     */
    handleCartUpdated(cartData) {
        console.log('ProductMenu: Cart updated:', cartData);
        if (cartData.cart) {
            this.cart = cartData.cart.items || [];
            this.cartTotal = cartData.cart.total || '0.00';
            this.cartCount = cartData.cart.count || 0;
        }
        this.updateHeaderCartCount();
    }

    /**
     * Handle cart loaded event from WooCommerce
     */
    handleCartLoaded(cartData) {
        console.log('ProductMenu: Cart loaded:', cartData);
        this.cart = cartData.items || [];
        this.cartTotal = cartData.total || '0.00';
        this.cartCount = cartData.count || 0;
        this.updateHeaderCartCount();
    }

    /**
     * Update header cart count display
     */
    updateHeaderCartCount() {
        // This will be called when cart is updated to refresh the display
        if (this.currentView === 'cart') {
            // If we're on the cart page, refresh it
            this.renderCartPage();
        }
        // The header update happens automatically in updateMenuHeader when menu is visible
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('ProductMenu: Setting up event listeners...');
        // Listen for category selection (legacy)
        document.addEventListener('categorySelected', (e) => {
            console.log('ProductMenu: categorySelected event received!', e.detail);
            this.handleCategorySelected(e.detail);
        });

        // Listen for warehouse selection (new simplified flow)
        document.addEventListener('warehouseSelectedForMenu', (e) => {
            console.log('ProductMenu: warehouseSelectedForMenu event received!', e.detail);
            this.handleWarehouseSelectedForMenu(e.detail);
        });

        // Listen for cart marker clicks
        document.addEventListener('cartClicked', (e) => {
            console.log('ProductMenu: cartClicked event received!', e.detail);
            this.handleCartClicked(e.detail);
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
            right: -1050px;
            width: 1000px;
            height: 80vh;
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

        // Add filter controls container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.style.cssText = `
            padding: 15px 20px;
            border-bottom: 1px solid #444;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        `;

        // Category filter custom dropdown
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'custom-dropdown-wrapper';
        categoryWrapper.style.cssText = `
            position: relative !important;
            display: inline-block !important;
            min-width: 150px !important;
        `;

        const categoryDisplay = document.createElement('div');
        categoryDisplay.className = 'dropdown-display';
        categoryDisplay.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 200, 0, 0.2)) !important;
            border: 1px solid #00ff00 !important;
            color: #00ff00 !important;
            padding: 8px 30px 8px 12px !important;
            border-radius: 6px !important;
            font-family: 'Courier New', monospace !important;
            font-size: 14px !important;
            cursor: pointer !important;
            box-shadow: 0 2px 8px rgba(0, 255, 0, 0.2) !important;
            user-select: none !important;
            transition: all 0.2s ease !important;
        `;
        categoryDisplay.textContent = 'Categories';

        const categoryArrow = document.createElement('div');
        categoryArrow.className = 'dropdown-arrow';
        categoryArrow.innerHTML = '▼';
        categoryArrow.style.cssText = `
            position: absolute !important;
            right: 8px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            color: #00ff00 !important;
            pointer-events: none !important;
            font-size: 10px !important;
            transition: transform 0.2s ease !important;
        `;

        const categoryDropdown = document.createElement('div');
        categoryDropdown.className = 'dropdown-options';
        categoryDropdown.style.cssText = `
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            right: 0 !important;
            background: rgba(0, 0, 0, 0.9) !important;
            border: 1px solid #00ff00 !important;
            border-radius: 6px !important;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3) !important;
            z-index: 1000 !important;
            max-height: 200px !important;
            overflow-y: auto !important;
            display: none !important;
            backdrop-filter: blur(5px) !important;
            scrollbar-width: thin !important;
            scrollbar-color: #00ff00 rgba(0, 255, 0, 0.1) !important;
        `;

        // Add scrollbar styling for webkit browsers
        const categoryScrollbarStyle = document.createElement('style');
        categoryScrollbarStyle.innerHTML = `
            .dropdown-options::-webkit-scrollbar {
                width: 6px;
            }
            .dropdown-options::-webkit-scrollbar-track {
                background: rgba(0, 255, 0, 0.1);
                border-radius: 3px;
            }
            .dropdown-options::-webkit-scrollbar-thumb {
                background: #00ff00;
                border-radius: 3px;
            }
            .dropdown-options::-webkit-scrollbar-thumb:hover {
                background: #00cc00;
            }
        `;
        document.head.appendChild(categoryScrollbarStyle);

        categoryWrapper.appendChild(categoryDisplay);
        categoryWrapper.appendChild(categoryArrow);
        categoryWrapper.appendChild(categoryDropdown);

        // Brand filter custom dropdown
        const brandWrapper = document.createElement('div');
        brandWrapper.className = 'custom-dropdown-wrapper';
        brandWrapper.style.cssText = `
            position: relative !important;
            display: inline-block !important;
            min-width: 150px !important;
        `;

        const brandDisplay = document.createElement('div');
        brandDisplay.className = 'dropdown-display';
        brandDisplay.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 200, 0, 0.2)) !important;
            border: 1px solid #00ff00 !important;
            color: #00ff00 !important;
            padding: 8px 30px 8px 12px !important;
            border-radius: 6px !important;
            font-family: 'Courier New', monospace !important;
            font-size: 14px !important;
            cursor: pointer !important;
            box-shadow: 0 2px 8px rgba(0, 255, 0, 0.2) !important;
            user-select: none !important;
            transition: all 0.2s ease !important;
        `;
        brandDisplay.textContent = 'Brands';

        const brandArrow = document.createElement('div');
        brandArrow.className = 'dropdown-arrow';
        brandArrow.innerHTML = '▼';
        brandArrow.style.cssText = `
            position: absolute !important;
            right: 8px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            color: #00ff00 !important;
            pointer-events: none !important;
            font-size: 10px !important;
            transition: transform 0.2s ease !important;
        `;

        const brandDropdown = document.createElement('div');
        brandDropdown.className = 'dropdown-options';
        brandDropdown.style.cssText = `
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            right: 0 !important;
            background: rgba(0, 0, 0, 0.9) !important;
            border: 1px solid #00ff00 !important;
            border-radius: 6px !important;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3) !important;
            z-index: 1000 !important;
            max-height: 200px !important;
            overflow-y: auto !important;
            display: none !important;
            backdrop-filter: blur(5px) !important;
        `;

        brandWrapper.appendChild(brandDisplay);
        brandWrapper.appendChild(brandArrow);
        brandWrapper.appendChild(brandDropdown);

        // Clear filters button
        const clearFilters = document.createElement('button');
        clearFilters.className = 'clear-filters-btn';
        clearFilters.textContent = 'Clear';
        clearFilters.style.cssText = `
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid #ff4444;
            color: #ff4444;
            padding: 8px 16px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            cursor: pointer;
        `;

        // Single main panel - Product Grid
        const productGridContainer = document.createElement('div');
        productGridContainer.className = 'product-grid-container';
        productGridContainer.style.cssText = `
            height: calc(100% - 120px);
            overflow-y: auto;
            padding: 20px;
            background: rgba(0, 0, 0, 0.9);
        `;

        // Product grid
        const productGrid = document.createElement('div');
        productGrid.className = 'product-grid';
        productGrid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 20px;
            max-width: 100%;
        `;

        // Add mobile responsive CSS for the grid
        const mobileGridStyle = document.createElement('style');
        mobileGridStyle.innerHTML = `
            /* Force dropdown styling across all browsers */
            .category-filter,
            .brand-filter {
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                appearance: none !important;
                background: linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 200, 0, 0.2)) !important;
                border: 1px solid #00ff00 !important;
                color: #00ff00 !important;
                padding: 8px 24px 8px 12px !important;
                border-radius: 6px !important;
                font-family: 'Courier New', monospace !important;
                font-size: 14px !important;
                cursor: pointer !important;
                background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%2300ff00" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>') !important;
                background-position: right 8px center !important;
                background-size: 12px !important;
                background-repeat: no-repeat !important;
                box-shadow: 0 2px 8px rgba(0, 255, 0, 0.2) !important;
            }

            .category-filter:hover,
            .brand-filter:hover {
                border-color: #00ff00 !important;
                box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3) !important;
                background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 200, 0, 0.3)) !important;
                background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%2300ff00" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>') !important;
                background-position: right 8px center !important;
                background-size: 12px !important;
                background-repeat: no-repeat !important;
            }

            .category-filter:focus,
            .brand-filter:focus {
                outline: none !important;
                border-color: #00ff00 !important;
                box-shadow: 0 0 0 3px rgba(0, 255, 0, 0.3) !important;
                background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 200, 0, 0.3)) !important;
                background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%2300ff00" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>') !important;
                background-position: right 8px center !important;
                background-size: 12px !important;
                background-repeat: no-repeat !important;
            }

            /* Style dropdown options */
            .category-filter option,
            .brand-filter option {
                background-color: #1a1a1a !important;
                color: #00ff00 !important;
                padding: 8px 12px !important;
                border: none !important;
                font-family: 'Courier New', monospace !important;
            }

            .category-filter option:checked,
            .brand-filter option:checked {
                background-color: rgba(0, 255, 0, 0.2) !important;
                color: #ffffff !important;
            }

            @media (max-width: 768px) {
                .product-grid {
                    grid-template-columns: 1fr 1fr !important;
                    gap: 10px !important;
                }

                .product-card {
                    font-size: 12px !important;
                }

                .filter-container {
                    flex-direction: row !important;
                    gap: 8px !important;
                    align-items: center !important;
                    flex-wrap: nowrap !important;
                }

                .category-filter,
                .brand-filter {
                    flex: 1 !important;
                    max-width: 100px !important;
                    min-width: 70px !important;
                    width: auto !important;
                    font-size: 12px !important;
                }

                .category-filter .filter-display,
                .brand-filter .filter-display {
                    padding: 6px 4px !important;
                    font-size: 11px !important;
                }

                .clear-filters-btn {
                    flex-shrink: 0 !important;
                    width: 50px !important;
                    padding: 6px 4px !important;
                    font-size: 11px !important;
                }

                .gta-product-menu {
                    border-radius: 20px 20px 0 0 !important;
                    border: none !important;
                    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5) !important;
                }

                .product-grid-container {
                    padding: 15px !important;
                }
            }

            @media (max-width: 480px) {
                .product-grid {
                    gap: 10px !important;
                }

                .product-card {
                    padding: 10px !important;
                    font-size: 13px !important;
                }

                .filter-container {
                    padding: 10px 15px !important;
                }

                .menu-header {
                    padding: 10px 15px !important;
                }

                .category-filter,
                .brand-filter {
                    font-size: 16px !important;
                    padding: 12px 30px 12px 16px !important;
                }
            }
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

        // Assemble filter elements
        filterContainer.appendChild(categoryWrapper);
        filterContainer.appendChild(brandWrapper);
        filterContainer.appendChild(clearFilters);

        // Assemble product grid
        productGridContainer.appendChild(productGrid);

        // Assemble the menu with new structure
        this.menuElement.appendChild(header);
        this.menuElement.appendChild(filterContainer);
        this.menuElement.appendChild(productGridContainer);
        this.menuElement.appendChild(scrollbarStyle);
        this.menuElement.appendChild(mobileGridStyle);

        // Custom dropdown functionality
        let categoryOpen = false;
        let brandOpen = false;

        // Helper functions to properly close dropdowns
        const closeCategoryDropdown = () => {
            categoryDropdown.style.display = 'none';
            categoryArrow.style.transform = 'translateY(-50%) rotate(0deg)';
            categoryOpen = false;
        };

        const closeBrandDropdown = () => {
            brandDropdown.style.display = 'none';
            brandArrow.style.transform = 'translateY(-50%) rotate(0deg)';
            brandOpen = false;
        };

        // Category dropdown click handler
        categoryDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            if (brandOpen) {
                closeBrandDropdown();
            }

            categoryOpen = !categoryOpen;
            categoryDropdown.style.display = categoryOpen ? 'block' : 'none';
            categoryArrow.style.transform = categoryOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)';
        });

        // Brand dropdown click handler
        brandDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            if (categoryOpen) {
                closeCategoryDropdown();
            }

            brandOpen = !brandOpen;
            brandDropdown.style.display = brandOpen ? 'block' : 'none';
            brandArrow.style.transform = brandOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)';
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            if (categoryOpen) {
                closeCategoryDropdown();
            }
            if (brandOpen) {
                closeBrandDropdown();
            }
        });

        clearFilters.addEventListener('click', () => {
            console.log('Clear filters button clicked!');
            this.clearAllFilters();
            categoryDisplay.textContent = 'Categories';
            brandDisplay.textContent = 'Brands';
        });

        // Store references for easy access
        this.filterContainer = filterContainer;
        this.categoryDisplay = categoryDisplay;
        this.categoryDropdown = categoryDropdown;
        this.brandDisplay = brandDisplay;
        this.brandDropdown = brandDropdown;
        this.productGrid = productGrid;
        this.productGridContainer = productGridContainer;

        // Store dropdown state and arrows for class-level access
        this.categoryOpen = categoryOpen;
        this.brandOpen = brandOpen;
        this.categoryArrow = categoryArrow;
        this.brandArrow = brandArrow;

        // Bind the close functions to this context
        this.closeCategoryDropdown = () => {
            this.categoryDropdown.style.display = 'none';
            this.categoryArrow.style.transform = 'translateY(-50%) rotate(0deg)';
            categoryOpen = false;
        };

        this.closeBrandDropdown = () => {
            this.brandDropdown.style.display = 'none';
            this.brandArrow.style.transform = 'translateY(-50%) rotate(0deg)';
            brandOpen = false;
        };

        // Set up infinite scroll
        this.setupInfiniteScroll();

        // Handle clicks inside the menu with event delegation
        this.menuElement.addEventListener('click', (e) => {
            console.log('ProductMenu: *** CLICK DETECTED ***');
            console.log('ProductMenu: Clicked element:', e.target);
            console.log('ProductMenu: Element class:', e.target.className);
            console.log('ProductMenu: Element tag:', e.target.tagName);

            // Look for data-action element
            const actionElement = e.target.closest('[data-action]');
            console.log('ProductMenu: Found action element:', actionElement);

            if (actionElement) {
                const action = actionElement.getAttribute('data-action');
                console.log('ProductMenu: Action type:', action);

                if (action === 'clear-filter' || action === 'clear-brand-filter') {
                    console.log('ProductMenu: Executing clear brand filter');
                    this.clearBrandFilter();
                } else if (action === 'select-brand') {
                    console.log('ProductMenu: Executing brand selection');
                    const brandData = {
                        id: parseInt(actionElement.getAttribute('data-brand-id')),
                        name: actionElement.getAttribute('data-brand-name'),
                        slug: actionElement.getAttribute('data-brand-slug')
                    };
                    this.handleBrandSelected(brandData);
                } else if (action === 'select-product') {
                    const productId = actionElement.getAttribute('data-product-id');
                    console.log('ProductMenu: *** PRODUCT CLICKED! ID:', productId, '***');
                    this.handleProductSelected(productId);
                } else if (action === 'clear-category-filter') {
                    console.log('ProductMenu: Executing clear category filter');
                    this.clearCategoryFilter();
                } else if (action === 'select-category-filter') {
                    console.log('ProductMenu: Executing category filter selection');
                    const categoryData = {
                        id: parseInt(actionElement.getAttribute('data-category-id')),
                        name: actionElement.getAttribute('data-category-name')
                    };
                    this.handleCategoryFilterSelected(categoryData);
                } else {
                    console.log('ProductMenu: Unknown action:', action);
                }

                e.stopPropagation();
                return;
            } else {
                console.log('ProductMenu: No action element found');
            }

            // Check for close button or cart button
            if (e.target.closest('.close-btn') || e.target.closest('.cart-btn')) {
                console.log('ProductMenu: Close or cart button detected, allowing event');
                return;
            }

            console.log('ProductMenu: Preventing menu close on general click');
            e.stopPropagation();
        });

        document.body.appendChild(this.menuElement);
    }

    /**
     * Handle warehouse selection (new simplified flow)
     */
    async handleWarehouseSelectedForMenu(detail) {
        console.log('ProductMenu: Warehouse selected for menu:', detail);

        this.currentWarehouse = detail.warehouse;
        this.currentStoreId = detail.storeId;
        this.availableCategories = detail.categories;
        this.selectedCategory = null; // No category filter initially
        this.selectedBrand = null; // No brand filter initially

        // Show menu immediately with loading state
        console.log('ProductMenu: Showing menu with loading state');
        this.showMenu();
        this.setLoadingState(true);

        try {
            console.log('ProductMenu: Loading all brands and products for store:', detail.storeId);

            // Load all brands and products for this store (no category filter initially)
            await Promise.all([
                this.loadAllBrandsForStore(detail.storeId),
                this.loadAllProductsForStore(detail.storeId)
            ]);

            console.log('ProductMenu: Data loaded, updating menu content');
            this.setLoadingState(false);
            this.updateMenuLayout(); // Refresh the menu with loaded data

        } catch (error) {
            console.error('ProductMenu: Failed to load menu data:', error);
            this.setLoadingState(false);
            this.showErrorMessage();
        }
    }

    /**
     * Handle cart marker click - open the cart view in the product menu
     * @param {object} detail - Cart click event detail
     */
    async handleCartClicked(detail) {
        console.log('ProductMenu: Cart clicked, opening cart view:', detail);

        // Set up basic state for cart view
        this.currentView = 'cart';
        this.currentStoreId = 1; // Use default store ID for cart functionality

        // Show menu immediately
        console.log('ProductMenu: Showing menu with cart view');
        this.showMenu();

        // Update menu to show cart content
        this.updateMenuLayout();

        // Track cart access
        this.trackEvent('cart_opened', {
            source: 'map_marker',
            items_count: this.cart.length
        });
    }

    /**
     * Set loading state for the entire menu
     * @param {boolean} loading - Whether to show loading state
     */
    setLoadingState(loading) {
        if (!this.menuElement) return;

        if (loading) {
            // Create and show loading overlay
            if (!this.menuLoadingOverlay) {
                this.menuLoadingOverlay = document.createElement('div');
                this.menuLoadingOverlay.className = 'menu-loading-overlay';
                this.menuLoadingOverlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                `;
                this.menuLoadingOverlay.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 10px;">⟳</div>
                        <div>Loading products...</div>
                    </div>
                `;
            }
            this.menuElement.appendChild(this.menuLoadingOverlay);
        } else {
            // Hide and remove loading overlay
            if (this.menuLoadingOverlay) {
                this.menuLoadingOverlay.remove();
                this.menuLoadingOverlay = null;
            }
        }
    }

    /**
     * Show error message in menu
     */
    showErrorMessage() {
        if (!this.menuElement) return;

        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff4444;
            font-family: 'Courier New', monospace;
            text-align: center;
            z-index: 1000;
        `;
        errorElement.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">⚠</div>
            <div>Failed to load products</div>
            <div style="font-size: 12px; margin-top: 10px; color: #888;">Please try again</div>
        `;

        this.menuElement.appendChild(errorElement);
    }

    /**
     * Handle category selection (legacy)
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
     * Load all brands for a store (by getting brands from all categories)
     */
    async loadAllBrandsForStore(storeId) {
        // Get brands from all categories for this store
        const allBrands = new Set();

        // Iterate through available categories and collect all brands
        for (const category of this.availableCategories) {
            try {
                const formData = new FormData();
                formData.append('action', 'get_store_brands_by_category');
                formData.append('category_id', category.id);
                formData.append('store_id', storeId);
                formData.append('nonce', getConfig('nonce'));

                const response = await fetch(getConfig('ajax_url'), {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success && data.data.brands) {
                    data.data.brands.forEach(brand => {
                        allBrands.add(JSON.stringify(brand)); // Use JSON to dedupe objects
                    });
                }
            } catch (error) {
                console.warn('Failed to load brands for category:', category.name, error);
            }
        }

        // Convert back to objects and remove duplicates
        this.brands = Array.from(allBrands).map(brandStr => JSON.parse(brandStr));
        console.log('ProductMenu: Loaded all brands for store:', this.brands);
    }

    /**
     * Load all products for a store (from all categories)
     */
    async loadAllProductsForStore(storeId) {
        // Get products from all categories for this store
        const allProducts = new Map(); // Use Map to dedupe by product ID

        // Iterate through available categories and collect all products
        for (const category of this.availableCategories) {
            try {
                const formData = new FormData();
                formData.append('action', 'get_store_products_by_category');
                formData.append('category_id', category.id);
                formData.append('store_id', storeId);
                formData.append('nonce', getConfig('nonce'));

                const response = await fetch(getConfig('ajax_url'), {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success && data.data.products) {
                    data.data.products.forEach(product => {
                        allProducts.set(product.id, product); // Dedupe by ID
                    });
                }
            } catch (error) {
                console.warn('Failed to load products for category:', category.name, error);
            }
        }

        // Convert to array
        this.allProducts = Array.from(allProducts.values());
        this.filteredProducts = [...this.allProducts]; // Show all initially
        console.log('ProductMenu: Loaded all products for store:', this.allProducts);
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
        console.log('ProductMenu: Available filtered products:', this.filteredProducts.map(p => ({ id: p.id, name: p.name })));
        console.log('ProductMenu: Available all products:', this.allProducts.map(p => ({ id: p.id, name: p.name })));

        // Find the product in our filtered products first
        let product = this.filteredProducts.find(p => p.id == productId); // Use == for loose comparison

        // If not found in filtered, check all products
        if (!product) {
            product = this.allProducts.find(p => p.id == productId);
            console.log('ProductMenu: Product found in allProducts:', product ? product.name : 'NOT FOUND');
        }

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
                stock: parseInt(product.stock) || parseInt(product.store_stock) || 0, // Use the fixed stock field
                wc_stock: product.wc_stock, // Include debug info
                stock_status: product.stock_status, // Include debug info
                manage_stock: product.manage_stock, // Include debug info
                store_stock: product.store_stock, // Include debug info
                categories: product.categories || [], // Keep as array for filtering
                category: product.categories && product.categories.length > 0 ? product.categories[0] : (this.currentCategory ? this.currentCategory.name : 'Uncategorized'), // Use actual product category
                description: product.description || 'No description available',
                image: product.image,
                url: product.url,
                add_to_cart_url: product.add_to_cart_url,
                in_stock: product.in_stock && parseInt(product.stock || product.store_stock) > 0,
                raw_price_html: product.price, // Keep original price HTML
                brand: product.brand || 'No Brand', // Add brand information
                brands: product.brands || [] // Support for multiple brands
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
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile: Full screen coverage with safe area support
            this.menuElement.style.width = '100vw';
            this.menuElement.style.height = '100vh';
            this.menuElement.style.right = '0';
            this.menuElement.style.top = '100vh'; // Start below screen
            this.menuElement.style.left = '0';
            this.menuElement.style.transform = 'none';
            this.menuElement.style.borderRadius = '0'; // No border radius for full screen
            // Add safe area padding for mobile devices
            this.menuElement.style.paddingTop = 'max(env(safe-area-inset-top), 47px)';
            this.menuElement.style.paddingBottom = 'env(safe-area-inset-bottom, 34px)';
            this.menuElement.style.boxSizing = 'border-box';

            // Animate slide up to full screen
            setTimeout(() => {
                this.menuElement.style.top = '0'; // Full screen positioning
                this.menuElement.style.transition = 'top 0.4s ease-out';
            }, 10);
        } else {
            // Desktop: Fixed width on right side
            const menuWidth = 1000; // Compact width for 4-column grid with good marker visibility
            this.menuElement.style.width = menuWidth + 'px';
            this.menuElement.style.height = '80vh';
            this.menuElement.style.right = '20px';
            this.menuElement.style.top = '50%';
            this.menuElement.style.left = 'auto';
            this.menuElement.style.transform = 'translateY(-50%)';
            this.menuElement.style.borderRadius = '8px';
        }

        this.menuElement.style.display = 'block';
        this.menuElement.style.visibility = 'visible';

        console.log('ProductMenu: Menu positioned for', isMobile ? 'mobile' : 'desktop');
        console.log('ProductMenu: Categories available:', this.availableCategories?.length || 0);
        console.log('ProductMenu: Products loaded:', this.allProducts?.length || 0);
    }

    /**
     * Update menu layout (new grid system)
     */
    updateMenuLayout() {
        if (!this.menuElement) return;

        const header = this.menuElement.querySelector('.menu-header');
        if (header) {
            this.updateHeader(header);
        }

        // Show/hide filter container based on current view
        const filterContainer = this.menuElement.querySelector('.filter-container');
        if (filterContainer) {
            filterContainer.style.display = this.currentView === 'products' ? 'flex' : 'none';
        }

        if (this.currentView === 'cart') {
            // Show cart page
            this.renderCartPage();
        } else if (this.currentView === 'checkout') {
            // Show checkout page
            this.renderCheckoutPage();
        } else {
            // Show products page - first clear any cart content
            console.log('updateMenuLayout: Showing products page');
            console.log('updateMenuLayout: filteredProducts length:', this.filteredProducts?.length || 0);
            console.log('updateMenuLayout: allProducts length:', this.allProducts?.length || 0);

            // Clear the product grid container completely to remove any cart content
            if (this.productGridContainer) {
                this.productGridContainer.innerHTML = '';
                console.log('updateMenuLayout: Cleared productGridContainer');

                // Recreate the product grid element
                const productGrid = document.createElement('div');
                productGrid.className = 'product-grid';
                productGrid.style.cssText = `
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 20px;
                    max-width: 100%;
                `;
                this.productGridContainer.appendChild(productGrid);
                this.productGrid = productGrid;
                console.log('updateMenuLayout: Recreated product grid');
            }

            if (this.filteredProducts && this.filteredProducts.length > 0) {
                console.log('updateMenuLayout: Rendering filteredProducts');
                this.renderProductGrid(this.filteredProducts);
            } else if (this.allProducts && this.allProducts.length > 0) {
                console.log('updateMenuLayout: Rendering allProducts');
                this.renderProductGrid(this.allProducts);
            } else {
                console.log('updateMenuLayout: No products to render');
            }

            // Then populate filter dropdowns (this can extract from products if needed)
            this.populateFilters(this.availableCategories, this.brands);
        }
    }

    /**
     * Update header with cart button and close button
     */
    updateHeader(header) {
        const cartItemCount = this.getCartItemCount();

        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <button class="cart-btn" style="
                    background: rgba(0, 255, 0, 0.2);
                    border: 1px solid #00ff00;
                    color: #00ff00;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    🛒 Cart ${cartItemCount > 0 ? `(${cartItemCount})` : ''}
                </button>
                <button class="close-menu-btn" style="
                    background: rgba(255, 0, 0, 0.2);
                    border: 1px solid #ff4444;
                    color: #ff4444;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                ">✕ Close</button>
            </div>
        `;

        // Add cart button handler
        const cartBtn = header.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cart button clicked - showing cart page');
                this.showCartPage();
            });
            cartBtn.addEventListener('mouseenter', () => {
                cartBtn.style.background = 'rgba(0, 255, 0, 0.3)';
            });
            cartBtn.addEventListener('mouseleave', () => {
                cartBtn.style.background = 'rgba(0, 255, 0, 0.2)';
            });
        }

        // Add close button handler
        const closeBtn = header.querySelector('.close-menu-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideMenu();
            });
        }
    }

    /**
     * Hide the product menu
     */
    hideMenu() {
        console.log('ProductMenu: hideMenu() called');

        if (!this.menuElement) {
            console.error('ProductMenu: Cannot hide menu - menuElement is null');
            return;
        }

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile: Slide down
            this.menuElement.style.transition = 'top 0.4s ease-in';
            this.menuElement.style.top = '100vh';
        } else {
            // Desktop: Slide right (fully off-screen)
            this.menuElement.style.transition = 'right 0.4s ease-in';
            this.menuElement.style.right = '-1050px'; // Match initial hidden position
        }

        this.isVisible = false;

        // Wait for animation to complete, then dispatch close event
        setTimeout(() => {
            // Exit product view when menu closes
            document.body.classList.remove('product-view-mode');

            // Restore warehouse and cart markers when menu closes
            this.restoreMapMarkers();

            document.dispatchEvent(new CustomEvent('menuClosed'));
            console.log('ProductMenu: Menu hidden and menuClosed event dispatched');

            // Reset state for next use
            this.selectedCategory = null;
            this.selectedBrand = null;
            this.selectedProduct = null;
            this.availableCategories = null;
            this.currentWarehouse = null;

            // Reset menu position for next show
            this.menuElement.style.transition = '';
        }, 400);
    }

    /**
     * Update three-panel header
     */
    updateThreePanelHeader(header) {
        const selectedBrandText = this.selectedBrand ?
            ` - ${this.selectedBrand.name}` : '';

        // Check if we're in the new simplified flow (warehouse selection)
        const isWarehouseFlow = this.availableCategories && this.currentWarehouse;

        if (isWarehouseFlow) {
            // New flow: Show warehouse name and category filters
            const warehouseName = this.currentWarehouse.name || `Store ${this.currentStoreId}`;
            const selectedCategoryText = this.selectedCategory ? ` - ${this.selectedCategory.name}` : '';

            header.innerHTML = `
                <div style="display: flex; flex-direction: column; flex: 1; margin-right: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <div style="font-size: 18px; font-weight: bold; text-transform: uppercase;">
                                ${warehouseName}${selectedCategoryText}${selectedBrandText}
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
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button data-action="clear-category-filter" style="
                            background: ${!this.selectedCategory ? 'rgba(0,255,0,0.2)' : 'transparent'};
                            border: 1px solid #00ff00; color: #00ff00;
                            padding: 4px 12px; border-radius: 4px; cursor: pointer;
                            font-family: 'Courier New', monospace; font-size: 12px;
                            transition: all 0.2s ease; text-transform: uppercase;
                        ">Categories</button>
                        ${this.availableCategories.map(category => `
                            <button data-action="select-category-filter" data-category-id="${category.id}" data-category-name="${category.name}" style="
                                background: ${this.selectedCategory && this.selectedCategory.id === category.id ? 'rgba(0,255,0,0.2)' : 'transparent'};
                                border: 1px solid ${category.color || '#00ff00'}; color: ${category.color || '#00ff00'};
                                padding: 4px 12px; border-radius: 4px; cursor: pointer;
                                font-family: 'Courier New', monospace; font-size: 12px;
                                transition: all 0.2s ease; text-transform: uppercase;
                            ">${category.name}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            // Legacy flow: Show category name
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
        }

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
                    ${!this.selectedCategory ?
                        '<span style="font-size: 11px; opacity: 0.6; font-weight: normal;">(All categories)</span>' :
                        `<span style="font-size: 11px; opacity: 0.6; font-weight: normal;">(${this.selectedCategory.name})</span>`
                    }
                </div>
            </div>
        `;

        if (this.brands.length === 0) {
            html += `
                <div style="padding: 40px 20px; text-align: center; opacity: 0.5;">
                    <div style="font-size: 14px; margin-bottom: 8px;">No brands available</div>
                    <div style="font-size: 12px;">No products found for this selection</div>
                </div>
            `;
        } else {
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
                " onmouseover="if(!${allSelected}) this.style.background='rgba(0,255,0,0.1)'" onmouseout="if(!${allSelected}) this.style.background='transparent'" data-action="clear-brand-filter">
                    <div style="font-size: 14px; font-weight: bold;">
                        Brands
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
        }

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
        console.log('ProductMenu: updateProductsPanel called');
        console.log('ProductMenu: allProducts.length:', this.allProducts ? this.allProducts.length : 'undefined');
        console.log('ProductMenu: filteredProducts.length:', this.filteredProducts ? this.filteredProducts.length : 'undefined');
        console.log('ProductMenu: selectedBrand:', this.selectedBrand);
        console.log('ProductMenu: selectedCategory:', this.selectedCategory);

        let html = `
            <div style="padding: 15px 15px 10px 15px; border-bottom: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; color: #00ff00;">
                    PRODUCTS
                    ${this.selectedBrand ? `(${this.selectedBrand.name})` : '(Brands)'}
                </div>
            </div>
        `;

        if (!this.filteredProducts || this.filteredProducts.length === 0) {
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
                console.log('ProductMenu: Product stock check:', product.name, 'ID:', product.id, 'ID type:', typeof product.id, 'stock:', product.stock, 'wc_stock:', product.wc_stock, 'stock_status:', product.stock_status, 'manage_stock:', product.manage_stock, 'isInStock:', isInStock);
                html += `
                    <div class="product-item" style="
                        padding: 15px 20px;
                        border-bottom: 1px solid #333;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        transition: background 0.2s ease;
                        cursor: pointer;
                        opacity: ${isInStock ? '1' : '0.5'};
                        pointer-events: auto;
                    " data-action="select-product" data-product-id="${product.id}">
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
                                ${product.raw_price_html || (typeof product.price === 'number' ? '$' + product.price.toFixed(2) : product.price)}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        panel.innerHTML = html;

        // Add hover effects to product items
        const productItems = panel.querySelectorAll('.product-item[data-action="select-product"]');
        productItems.forEach(item => {
            const productId = item.getAttribute('data-product-id');
            const product = this.filteredProducts.find(p => p.id === productId);
            const isInStock = product && product.stock > 0;

            if (isInStock) {
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(0,255,0,0.1)';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                });
            }
        });
    }

    /**
     * Clear category filter (show all products from all categories)
     */
    async clearCategoryFilter() {
        this.selectedCategory = null;
        this.selectedBrand = null;

        try {
            // Reload all brands and products for the store
            await Promise.all([
                this.loadAllBrandsForStore(this.currentStoreId),
                this.loadAllProductsForStore(this.currentStoreId)
            ]);
            this.updateMenuLayout();
            console.log('ProductMenu: Cleared category filter, showing all products');
        } catch (error) {
            console.error('ProductMenu: Failed to reload all data:', error);
        }
    }

    /**
     * Handle category filter selection
     */
    async handleCategoryFilterSelected(categoryData) {
        this.selectedCategory = categoryData;
        this.selectedBrand = null; // Clear brand filter when changing categories

        try {
            console.log('ProductMenu: Loading brands and products for category:', categoryData.name, 'ID:', categoryData.id);

            // Load both brands and products for the selected category
            await Promise.all([
                this.loadBrands(categoryData.id, this.currentStoreId),
                this.loadAllProductsForCategory(categoryData.id, this.currentStoreId)
            ]);

            console.log('ProductMenu: After category selection - brands:', this.brands?.length, 'products:', this.allProducts?.length);
            this.updateMenuLayout();
            console.log('ProductMenu: Category filter applied:', categoryData.name);
        } catch (error) {
            console.error('ProductMenu: Failed to load data for category:', error);
        }
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
                    ${product.raw_price_html || (typeof product.price === 'number' ? '$' + product.price.toFixed(2) : product.price)}
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

    /**
     * Create a product card element
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product.id);

        const isMobile = window.innerWidth <= 768;

        card.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #444;
            border-radius: 8px;
            padding: ${isMobile ? '10px' : '15px'};
            cursor: pointer;
            transition: all 0.3s ease;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: ${isMobile ? '12px' : '14px'};
        `;

        // Product image - 1:1 aspect ratio on mobile
        const imageContainer = document.createElement('div');
        const imageSize = isMobile ? '80px' : '120px';
        imageContainer.style.cssText = `
            width: 100%;
            height: ${imageSize};
            aspect-ratio: 1/1;
            background: #222;
            border-radius: 6px;
            margin-bottom: ${isMobile ? '6px' : '10px'};
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        if (product.image) {
            const image = document.createElement('img');
            image.src = product.image;
            image.alt = product.name;
            image.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
            imageContainer.appendChild(image);
        } else {
            imageContainer.innerHTML = '<div style="color: #666; font-size: 12px;">No Image</div>';
        }

        // Product name
        const name = document.createElement('h4');
        name.textContent = product.name;
        name.style.cssText = `
            margin: 0 0 ${isMobile ? '4px' : '8px'} 0;
            font-size: ${isMobile ? '12px' : '14px'};
            font-weight: bold;
            color: #00ff00;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
        `;

        // Product price
        const price = document.createElement('div');
        price.innerHTML = product.price || 'Price not available';
        price.style.cssText = `
            font-size: ${isMobile ? '11px' : '13px'};
            color: #00cc00;
            margin-bottom: ${isMobile ? '4px' : '8px'};
            font-weight: bold;
        `;

        // Stock indicator
        const stock = document.createElement('div');
        stock.textContent = product.in_stock ? `Stock: ${product.stock || 'Available'}` : 'Out of Stock';
        stock.style.cssText = `
            font-size: ${isMobile ? '9px' : '11px'};
            color: ${product.in_stock ? '#00aa00' : '#aa0000'};
            margin-bottom: ${isMobile ? '6px' : '10px'};
        `;

        // Add to cart button
        const addToCartBtn = document.createElement('button');
        addToCartBtn.textContent = product.in_stock ? 'Add to Cart' : 'Out of Stock';
        addToCartBtn.disabled = !product.in_stock;
        addToCartBtn.style.cssText = `
            width: 100%;
            padding: ${isMobile ? '6px' : '8px'};
            background: ${product.in_stock ? 'rgba(0, 255, 0, 0.2)' : 'rgba(100, 100, 100, 0.2)'};
            border: 1px solid ${product.in_stock ? '#00ff00' : '#666'};
            color: ${product.in_stock ? '#00ff00' : '#666'};
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: ${isMobile ? '10px' : '12px'};
            cursor: ${product.in_stock ? 'pointer' : 'not-allowed'};
            transition: all 0.3s ease;
        `;

        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#00ff00';
            card.style.background = 'rgba(0, 255, 0, 0.05)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.borderColor = '#444';
            card.style.background = 'rgba(0, 0, 0, 0.8)';
        });

        // Add to cart click handler
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (product.in_stock) {
                this.handleAddToCart(product);
            }
        });

        // Assemble card
        card.appendChild(imageContainer);
        card.appendChild(name);
        card.appendChild(price);
        card.appendChild(stock);
        card.appendChild(addToCartBtn);

        return card;
    }

    /**
     * Render products in the grid (with infinite scroll support)
     */
    renderProductGrid(products) {
        console.log('renderProductGrid called with products:', products?.length || 0);
        console.log('renderProductGrid: productGrid element exists:', !!this.productGrid);

        if (!this.productGrid) {
            console.error('renderProductGrid: productGrid element not found');
            return;
        }

        // Store all products for infinite scroll
        this.filteredProducts = products;

        // Reset infinite scroll state
        this.resetInfiniteScroll();

        // Clear existing products
        this.productGrid.innerHTML = '';
        console.log('renderProductGrid: cleared existing products');

        if (!products || products.length === 0) {
            const noProducts = document.createElement('div');
            noProducts.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                color: #666;
                font-family: 'Courier New', monospace;
                padding: 40px;
                font-size: 16px;
            `;
            noProducts.textContent = 'No products found matching your filters.';
            this.productGrid.appendChild(noProducts);
            return;
        }

        // Show initial batch of products (for infinite scroll)
        const itemsPerPage = this.itemsPerPage || 20; // Default fallback
        console.log('renderProductGrid: itemsPerPage:', itemsPerPage);
        const initialBatch = products.slice(0, itemsPerPage);
        console.log('renderProductGrid: initialBatch length:', initialBatch.length);

        initialBatch.forEach((product, index) => {
            console.log(`renderProductGrid: Creating card ${index + 1} for product:`, product.name);
            const card = this.createProductCard(product);
            this.productGrid.appendChild(card);
        });

        console.log('renderProductGrid: Finished appending', initialBatch.length, 'product cards');

        // Check if we have more products to load
        if (products.length <= itemsPerPage) {
            this.hasMoreItems = false;
            if (products.length > 0) {
                this.showEndMessage();
            }
        }
    }

    /**
     * Handle category filter change
     */
    handleCategoryFilter(categoryId) {
        console.log('Category filter changed to:', categoryId);

        this.selectedCategory = categoryId;
        this.selectedBrand = null; // Clear brand when category changes

        // Update brand dropdown to show only brands available in selected category
        this.updateBrandFilterForCategory(categoryId);

        // Update the brand display to show it's been reset
        if (this.brandDisplay) {
            this.brandDisplay.textContent = 'Brands';
        }

        this.filterProducts();
    }

    /**
     * Handle brand filter change
     */
    handleBrandFilter(brandId) {
        console.log('Brand filter changed to:', brandId);

        this.selectedBrand = brandId;

        // Update category dropdown to show only categories available for selected brand
        this.updateCategoryFilterForBrand(brandId);

        this.selectedCategory = null; // Clear category when brand changes

        // Update the category display to show it's been reset
        if (this.categoryDisplay) {
            this.categoryDisplay.textContent = 'Categories';
        }
        this.filterProducts();
    }

    /**
     * Update brand filter dropdown to show only brands available in selected category
     */
    updateBrandFilterForCategory(categoryId) {
        if (!this.brandDropdown || !this.allProducts) return;

        // Get brands available in the selected category
        let availableBrands = [];

        if (!categoryId || categoryId === '') {
            // If no category selected, show all brands
            const brandSet = new Set();
            this.allProducts.forEach(product => {
                if (product.brand && product.brand !== 'No Brand') {
                    brandSet.add(product.brand);
                }
                if (product.brands && Array.isArray(product.brands)) {
                    product.brands.forEach(brand => brandSet.add(brand));
                }
            });
            availableBrands = Array.from(brandSet).map(brand => ({ id: brand, name: brand }));
        } else {
            // Filter products by category first, then extract brands
            const categoryProducts = this.allProducts.filter(product => {
                return (product.categories && product.categories.includes(categoryId)) ||
                       (product.category === categoryId) ||
                       (typeof product.categories === 'string' && product.categories === categoryId);
            });

            const brandSet = new Set();
            categoryProducts.forEach(product => {
                if (product.brand && product.brand !== 'No Brand') {
                    brandSet.add(product.brand);
                }
                if (product.brands && Array.isArray(product.brands)) {
                    product.brands.forEach(brand => brandSet.add(brand));
                }
            });
            availableBrands = Array.from(brandSet).map(brand => ({ id: brand, name: brand }));
        }

        // Repopulate brand dropdown
        this.populateBrandDropdown(availableBrands);
    }

    /**
     * Update category filter dropdown to show only categories available for selected brand
     */
    updateCategoryFilterForBrand(brandId) {
        if (!this.categoryDropdown || !this.allProducts) return;

        // Get categories available for the selected brand
        let availableCategories = [];

        if (!brandId || brandId === '') {
            // If no brand selected, show all categories
            const categorySet = new Set();
            this.allProducts.forEach(product => {
                if (product.categories && Array.isArray(product.categories)) {
                    product.categories.forEach(cat => categorySet.add(cat));
                } else if (product.category) {
                    categorySet.add(product.category);
                } else if (typeof product.categories === 'string') {
                    categorySet.add(product.categories);
                }
            });
            availableCategories = Array.from(categorySet).map(cat => ({ id: cat, name: cat }));
        } else {
            // Filter products by brand first, then extract categories
            const brandProducts = this.allProducts.filter(product => {
                return (product.brand === brandId) ||
                       (product.brands && Array.isArray(product.brands) && product.brands.includes(brandId));
            });

            const categorySet = new Set();
            brandProducts.forEach(product => {
                if (product.categories && Array.isArray(product.categories)) {
                    product.categories.forEach(cat => categorySet.add(cat));
                } else if (product.category) {
                    categorySet.add(product.category);
                } else if (typeof product.categories === 'string') {
                    categorySet.add(product.categories);
                }
            });
            availableCategories = Array.from(categorySet).map(cat => ({ id: cat, name: cat }));
        }

        // Repopulate category dropdown
        this.populateCategoryDropdown(availableCategories);
    }

    /**
     * Populate only the brand dropdown
     */
    populateBrandDropdown(brands) {
        if (!this.brandDropdown) return;

        this.brandDropdown.innerHTML = '';

        // Add "All Brands" option
        const allBrandsOption = document.createElement('div');
        allBrandsOption.className = 'dropdown-option';
        allBrandsOption.style.cssText = `
            padding: 8px 12px !important;
            color: #00ff00 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 14px !important;
            cursor: pointer !important;
            transition: background-color 0.2s ease !important;
            border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
        `;
        allBrandsOption.textContent = 'Brands';
        allBrandsOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.brandDisplay.textContent = 'Brands';
            this.closeBrandDropdown();
            this.handleBrandFilter('');
        });
        allBrandsOption.addEventListener('mouseover', () => {
            allBrandsOption.style.background = 'rgba(0, 255, 0, 0.1)';
        });
        allBrandsOption.addEventListener('mouseout', () => {
            allBrandsOption.style.background = 'transparent';
        });
        this.brandDropdown.appendChild(allBrandsOption);

        if (brands && brands.length > 0) {
            brands.forEach(brand => {
                const option = document.createElement('div');
                option.className = 'dropdown-option';
                option.style.cssText = `
                    padding: 8px 12px !important;
                    color: #00ff00 !important;
                    font-family: 'Courier New', monospace !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    transition: background-color 0.2s ease !important;
                    border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
                `;
                option.textContent = brand.name || brand;
                option.dataset.value = brand.name || brand;

                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.brandDisplay.textContent = brand.name || brand;
                    this.closeBrandDropdown();
                    this.handleBrandFilter(brand.name || brand);
                });
                option.addEventListener('mouseover', () => {
                    option.style.background = 'rgba(0, 255, 0, 0.1)';
                });
                option.addEventListener('mouseout', () => {
                    option.style.background = 'transparent';
                });

                this.brandDropdown.appendChild(option);
            });
        }
    }

    /**
     * Populate only the category dropdown
     */
    populateCategoryDropdown(categories) {
        if (!this.categoryDropdown) return;

        this.categoryDropdown.innerHTML = '';

        // Add "All Categories" option
        const allCategoriesOption = document.createElement('div');
        allCategoriesOption.className = 'dropdown-option';
        allCategoriesOption.style.cssText = `
            padding: 8px 12px !important;
            color: #00ff00 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 14px !important;
            cursor: pointer !important;
            transition: background-color 0.2s ease !important;
            border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
        `;
        allCategoriesOption.textContent = 'Categories';
        allCategoriesOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.categoryDisplay.textContent = 'Categories';
            this.closeCategoryDropdown();
            this.handleCategoryFilter('');
        });
        allCategoriesOption.addEventListener('mouseover', () => {
            allCategoriesOption.style.background = 'rgba(0, 255, 0, 0.1)';
        });
        allCategoriesOption.addEventListener('mouseout', () => {
            allCategoriesOption.style.background = 'transparent';
        });
        this.categoryDropdown.appendChild(allCategoriesOption);

        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'dropdown-option';
                option.style.cssText = `
                    padding: 8px 12px !important;
                    color: #00ff00 !important;
                    font-family: 'Courier New', monospace !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    transition: background-color 0.2s ease !important;
                    border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
                `;
                option.textContent = category.name || category;
                option.dataset.value = category.name || category;

                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.categoryDisplay.textContent = category.name || category;
                    this.closeCategoryDropdown();
                    this.handleCategoryFilter(category.name || category);
                });
                option.addEventListener('mouseover', () => {
                    option.style.background = 'rgba(0, 255, 0, 0.1)';
                });
                option.addEventListener('mouseout', () => {
                    option.style.background = 'transparent';
                });

                this.categoryDropdown.appendChild(option);
            });
        }
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.selectedCategory = null;
        this.selectedBrand = null;

        // Reset dropdown displays
        if (this.categoryDisplay) {
            this.categoryDisplay.textContent = 'Categories';
        }
        if (this.brandDisplay) {
            this.brandDisplay.textContent = 'Brands';
        }

        // Repopulate both dropdowns with all available options
        this.populateFilters(this.availableCategories, this.brands);

        this.filterProducts();
    }

    /**
     * Filter products based on selected filters
     */
    filterProducts() {
        console.log('ProductMenu: Filtering products...');
        console.log('ProductMenu: Selected category:', this.selectedCategory);
        console.log('ProductMenu: Selected brand:', this.selectedBrand);
        console.log('ProductMenu: Total products:', this.allProducts?.length || 0);

        if (!this.allProducts) {
            console.log('ProductMenu: No products to filter');
            return;
        }

        let filtered = [...this.allProducts];

        // Filter by category
        if (this.selectedCategory && this.selectedCategory !== '') {
            console.log('ProductMenu: Filtering by category:', this.selectedCategory);
            filtered = filtered.filter(product => {
                // Check multiple category fields for compatibility
                const categoryMatches =
                    (product.categories && product.categories.includes(this.selectedCategory)) ||
                    (product.category === this.selectedCategory) ||
                    (typeof product.categories === 'string' && product.categories === this.selectedCategory);

                console.log(`Product "${product.name}" categories:`, product.categories, 'category:', product.category, 'matches:', categoryMatches);
                return categoryMatches;
            });
            console.log('ProductMenu: After category filter:', filtered.length, 'products');
        }

        // Filter by brand
        if (this.selectedBrand && this.selectedBrand !== '') {
            console.log('ProductMenu: Filtering by brand:', this.selectedBrand);
            filtered = filtered.filter(product => {
                const brandMatches =
                    product.brand === this.selectedBrand ||
                    (product.brands && product.brands.includes(this.selectedBrand));

                console.log(`Product "${product.name}" brand:`, product.brand, 'brands:', product.brands, 'matches:', brandMatches);
                return brandMatches;
            });
            console.log('ProductMenu: After brand filter:', filtered.length, 'products');
        }

        this.filteredProducts = filtered;
        console.log('ProductMenu: Final filtered products:', filtered.length);
        this.renderProductGrid(filtered);
    }

    /**
     * Handle add to cart action
     */
    handleAddToCart(product) {
        console.log('Add to cart:', product);

        // Add to cart
        this.addToCart(product);

        // Add visual feedback
        const message = document.createElement('div');
        message.textContent = `${product.name} added to cart!`;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 0, 0.9);
            color: #000;
            padding: 10px 20px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(message);

        // Update header to show new cart count
        const header = this.menuElement.querySelector('.menu-header');
        if (header) {
            this.updateHeader(header);
        }

        // Remove message after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    /**
     * Populate filter dropdowns
     */
    populateFilters(categories, brands) {
        // Filter population logs removed for cleaner console

        // Extract categories from actual product data if not provided
        let actualCategories = categories;
        if (!actualCategories && this.allProducts) {
            const categorySet = new Set();
            this.allProducts.forEach(product => {
                // Handle multiple category formats
                if (product.categories && Array.isArray(product.categories)) {
                    product.categories.forEach(cat => categorySet.add(cat));
                } else if (product.category) {
                    categorySet.add(product.category);
                } else if (typeof product.categories === 'string') {
                    categorySet.add(product.categories);
                }
            });
            actualCategories = Array.from(categorySet).map(cat => ({
                id: cat,
                name: cat
            }));
            console.log('ProductMenu: Extracted categories from products:', actualCategories);
        }

        // Extract brands from actual product data if not provided
        let actualBrands = brands;
        if (!actualBrands && this.allProducts) {
            const brandSet = new Set();
            this.allProducts.forEach(product => {
                if (product.brand && product.brand !== 'No Brand') {
                    brandSet.add(product.brand);
                }
                if (product.brands && Array.isArray(product.brands)) {
                    product.brands.forEach(brand => brandSet.add(brand));
                }
            });
            actualBrands = Array.from(brandSet).map(brand => ({
                id: brand,
                name: brand
            }));
            console.log('ProductMenu: Extracted brands from products:', actualBrands);
        }

        // Populate category filter
        if (this.categoryDropdown) {
            this.categoryDropdown.innerHTML = '';

            // Add "All Categories" option
            const allCategoriesOption = document.createElement('div');
            allCategoriesOption.className = 'dropdown-option';
            allCategoriesOption.style.cssText = `
                padding: 8px 12px !important;
                color: #00ff00 !important;
                font-family: 'Courier New', monospace !important;
                font-size: 14px !important;
                cursor: pointer !important;
                transition: background-color 0.2s ease !important;
                border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
            `;
            allCategoriesOption.textContent = 'Categories';
            allCategoriesOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.categoryDisplay.textContent = 'Categories';
                this.closeCategoryDropdown();
                this.handleCategoryFilter('');
            });
            allCategoriesOption.addEventListener('mouseover', () => {
                allCategoriesOption.style.background = 'rgba(0, 255, 0, 0.1)';
            });
            allCategoriesOption.addEventListener('mouseout', () => {
                allCategoriesOption.style.background = 'transparent';
            });
            this.categoryDropdown.appendChild(allCategoriesOption);

            if (actualCategories && actualCategories.length > 0) {
                actualCategories.forEach(category => {
                    const option = document.createElement('div');
                    option.className = 'dropdown-option';
                    option.style.cssText = `
                        padding: 8px 12px !important;
                        color: #00ff00 !important;
                        font-family: 'Courier New', monospace !important;
                        font-size: 14px !important;
                        cursor: pointer !important;
                        transition: background-color 0.2s ease !important;
                        border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
                    `;
                    option.textContent = category.name || category;
                    option.dataset.value = category.name || category;

                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.categoryDisplay.textContent = category.name || category;
                        this.closeCategoryDropdown();
                        this.handleCategoryFilter(category.name || category);
                    });
                    option.addEventListener('mouseover', () => {
                        option.style.background = 'rgba(0, 255, 0, 0.1)';
                    });
                    option.addEventListener('mouseout', () => {
                        option.style.background = 'transparent';
                    });

                    this.categoryDropdown.appendChild(option);
                });
                console.log('ProductMenu: Category filter populated with', actualCategories.length, 'options');
            } else {
                console.log('ProductMenu: No categories available for filter');
            }
        }

        // Populate brand filter
        if (this.brandDropdown) {
            this.brandDropdown.innerHTML = '';

            // Add "All Brands" option
            const allBrandsOption = document.createElement('div');
            allBrandsOption.className = 'dropdown-option';
            allBrandsOption.style.cssText = `
                padding: 8px 12px !important;
                color: #00ff00 !important;
                font-family: 'Courier New', monospace !important;
                font-size: 14px !important;
                cursor: pointer !important;
                transition: background-color 0.2s ease !important;
                border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
            `;
            allBrandsOption.textContent = 'Brands';
            allBrandsOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.brandDisplay.textContent = 'Brands';
                this.closeBrandDropdown();
                this.handleBrandFilter('');
            });
            allBrandsOption.addEventListener('mouseover', () => {
                allBrandsOption.style.background = 'rgba(0, 255, 0, 0.1)';
            });
            allBrandsOption.addEventListener('mouseout', () => {
                allBrandsOption.style.background = 'transparent';
            });
            this.brandDropdown.appendChild(allBrandsOption);

            if (actualBrands && actualBrands.length > 0) {
                actualBrands.forEach(brand => {
                    const option = document.createElement('div');
                    option.className = 'dropdown-option';
                    option.style.cssText = `
                        padding: 8px 12px !important;
                        color: #00ff00 !important;
                        font-family: 'Courier New', monospace !important;
                        font-size: 14px !important;
                        cursor: pointer !important;
                        transition: background-color 0.2s ease !important;
                        border-bottom: 1px solid rgba(0, 255, 0, 0.2) !important;
                    `;
                    option.textContent = brand.name || brand;
                    option.dataset.value = brand.name || brand;

                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.brandDisplay.textContent = brand.name || brand;
                        this.closeBrandDropdown();
                        this.handleBrandFilter(brand.name || brand);
                    });
                    option.addEventListener('mouseover', () => {
                        option.style.background = 'rgba(0, 255, 0, 0.1)';
                    });
                    option.addEventListener('mouseout', () => {
                        option.style.background = 'transparent';
                    });

                    this.brandDropdown.appendChild(option);
                });
                console.log('ProductMenu: Brand filter populated with', actualBrands.length, 'options');
            } else {
                console.log('ProductMenu: No brands available for filter');
            }
        }
    }

    /**
     * Set up infinite scroll functionality
     */
    setupInfiniteScroll() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
        this.hasMoreItems = true;

        // Add scroll listener to the product grid container
        if (this.productGridContainer) {
            this.productGridContainer.addEventListener('scroll', () => {
                this.handleScroll();
            });
        }
    }

    /**
     * Handle scroll event for infinite loading
     */
    handleScroll() {
        if (!this.productGridContainer || this.isLoading || !this.hasMoreItems) return;

        const container = this.productGridContainer;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Load more when user scrolls to within 100px of bottom
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            this.loadMoreProducts();
        }
    }

    /**
     * Load more products (infinite scroll)
     */
    loadMoreProducts() {
        if (this.isLoading || !this.hasMoreItems) return;

        this.isLoading = true;
        this.currentPage++;

        // Show loading indicator
        this.showLoadingIndicator();

        // Simulate loading delay (replace with actual API call)
        setTimeout(() => {
            this.appendMoreProducts();
            this.hideLoadingIndicator();
            this.isLoading = false;
        }, 1000);
    }

    /**
     * Show loading indicator at bottom of product grid
     */
    showLoadingIndicator() {
        if (this.loadingIndicator) return;

        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'loading-indicator';
        this.loadingIndicator.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 20px;
            color: #00aa00;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        `;
        this.loadingIndicator.innerHTML = '⟳ Loading more products...';

        if (this.productGrid) {
            this.productGrid.appendChild(this.loadingIndicator);
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        if (this.loadingIndicator) {
            this.loadingIndicator.remove();
            this.loadingIndicator = null;
        }
    }

    /**
     * Append more products to existing grid (for infinite scroll)
     */
    appendMoreProducts() {
        // In a real implementation, this would load more products from the API
        // For now, we'll just check if we have more filtered products to show

        if (!this.filteredProducts) return;

        const currentDisplayCount = this.productGrid.children.length;
        const totalProducts = this.filteredProducts.length;

        if (currentDisplayCount >= totalProducts) {
            this.hasMoreItems = false;
            this.showEndMessage();
            return;
        }

        // Get next batch of products
        const nextBatch = this.filteredProducts.slice(
            currentDisplayCount,
            currentDisplayCount + this.itemsPerPage
        );

        // Append new product cards
        nextBatch.forEach(product => {
            const card = this.createProductCard(product);
            this.productGrid.appendChild(card);
        });

        // Check if we've shown all products
        if (this.productGrid.children.length >= totalProducts) {
            this.hasMoreItems = false;
            this.showEndMessage();
        }
    }

    /**
     * Show end of products message
     */
    showEndMessage() {
        if (this.endMessage) return;

        this.endMessage = document.createElement('div');
        this.endMessage.className = 'end-message';
        this.endMessage.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 20px;
            color: #666;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            border-top: 1px solid #444;
            margin-top: 20px;
        `;
        this.endMessage.textContent = '── End of products ──';

        if (this.productGrid) {
            this.productGrid.appendChild(this.endMessage);
        }
    }

    /**
     * Reset infinite scroll state
     */
    resetInfiniteScroll() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreItems = true;
        this.hideLoadingIndicator();

        if (this.endMessage) {
            this.endMessage.remove();
            this.endMessage = null;
        }
    }

    /**
     * Cart Management Methods
     */

    /**
     * Load cart from localStorage (fallback only)
     */
    loadCartFromStorage() {
        try {
            const cartData = localStorage.getItem('charlie_cart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Failed to load cart from storage:', error);
            return [];
        }
    }

    /**
     * Save cart to localStorage (fallback only)
     */
    saveCartToStorage() {
        try {
            localStorage.setItem('charlie_cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Failed to save cart to storage:', error);
        }
    }

    /**
     * Add product to cart
     */
    async addToCart(product, quantity = 1) {
        if (this.wooCart) {
            try {
                await this.wooCart.addToCart(product.id, quantity);
                console.log('Product added to WooCommerce cart:', product.name);
            } catch (error) {
                console.error('Failed to add to WooCommerce cart:', error);
                // Fallback to localStorage
                this.addToLocalCart(product, quantity);
            }
        } else {
            this.addToLocalCart(product, quantity);
        }
    }

    /**
     * Add product to local cart (fallback)
     */
    addToLocalCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                raw_price_html: product.raw_price_html
            });
        }

        this.saveCartToStorage();
        console.log('Cart updated:', this.cart);
    }

    /**
     * Remove product from cart
     */
    async removeFromCart(productId) {
        if (this.wooCart) {
            try {
                // Find the cart item key for this product
                const cartItem = this.cart.find(item => item.product_id == productId || item.id == productId);
                if (cartItem && cartItem.cart_item_key) {
                    await this.wooCart.removeFromCart(cartItem.cart_item_key);
                    console.log('Product removed from WooCommerce cart:', productId);
                } else {
                    console.warn('Cart item key not found for product:', productId);
                }
            } catch (error) {
                console.error('Failed to remove from WooCommerce cart:', error);
                // Fallback to localStorage
                this.removeFromLocalCart(productId);
            }
        } else {
            this.removeFromLocalCart(productId);
        }
    }

    /**
     * Remove product from local cart (fallback)
     */
    removeFromLocalCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCartToStorage();
    }

    /**
     * Update cart item quantity
     */
    async updateCartQuantity(productId, quantity) {
        if (this.wooCart) {
            try {
                if (quantity <= 0) {
                    await this.removeFromCart(productId);
                } else {
                    // Find the cart item key for this product
                    const cartItem = this.cart.find(item => item.product_id == productId || item.id == productId);
                    if (cartItem && cartItem.cart_item_key) {
                        await this.wooCart.updateCartQuantity(cartItem.cart_item_key, quantity);
                        console.log('Cart quantity updated for product:', productId, 'to', quantity);
                    } else {
                        console.warn('Cart item key not found for product:', productId);
                    }
                }
            } catch (error) {
                console.error('Failed to update cart quantity:', error);
                // Fallback to localStorage
                this.updateLocalCartQuantity(productId, quantity);
            }
        } else {
            this.updateLocalCartQuantity(productId, quantity);
        }
    }

    /**
     * Update local cart item quantity (fallback)
     */
    updateLocalCartQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromLocalCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCartToStorage();
            }
        }
    }

    /**
     * Get total cart item count
     */
    getCartItemCount() {
        if (this.wooCart && this.cartCount !== undefined) {
            return this.cartCount;
        } else if (this.wooCart) {
            return this.wooCart.getCartItemCount();
        }
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Get total cart value
     */
    getCartTotal() {
        console.log('ProductMenu: getCartTotal() called');
        console.log('ProductMenu: wooCart available:', !!this.wooCart);
        console.log('ProductMenu: cartTotal cached:', this.cartTotal);
        console.log('ProductMenu: local cart items:', this.cart.length);

        if (this.wooCart && this.cartTotal !== undefined) {
            // Use cached total from WooCommerce - extract number from HTML
            let total = 0;
            const totalStr = this.cartTotal.toString();
            console.log('ProductMenu: Raw cartTotal string:', totalStr);

            // Extract number from HTML string like "<span...>$29.99</span>"
            const matches = totalStr.match(/[\d,]+\.\d{2}/);
            if (matches) {
                total = parseFloat(matches[0].replace(/,/g, ''));
            } else {
                // Fallback: try to extract any decimal number
                const fallbackMatches = totalStr.match(/\d+\.\d+/);
                if (fallbackMatches) {
                    total = parseFloat(fallbackMatches[0]);
                }
            }

            console.log('ProductMenu: Extracted WooCommerce total:', total);
            return total;
        } else if (this.wooCart) {
            const wooTotal = this.wooCart.getCartTotal();
            console.log('ProductMenu: Using WooCommerce total:', wooTotal);
            return wooTotal;
        }

        // Fallback to local cart calculation
        const localTotal = this.cart.reduce((total, item) => {
            const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
            return total + (price * item.quantity);
        }, 0);
        console.log('ProductMenu: Using local cart total:', localTotal);
        return localTotal;
    }

    /**
     * Clear entire cart
     */
    async clearCart() {
        if (this.wooCart) {
            try {
                await this.wooCart.clearCart();
                console.log('WooCommerce cart cleared');
            } catch (error) {
                console.error('Failed to clear WooCommerce cart:', error);
                // Fallback to localStorage
                this.clearLocalCart();
            }
        } else {
            this.clearLocalCart();
        }
    }

    /**
     * Clear local cart (fallback)
     */
    clearLocalCart() {
        this.cart = [];
        this.saveCartToStorage();
    }

    /**
     * Show cart page
     */
    showCartPage() {
        this.currentView = 'cart';
        this.updateMenuLayout();
    }

    /**
     * Show products page
     */
    showProductsPage() {
        this.currentView = 'products';

        // Ensure we have products to display
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            this.filteredProducts = [...this.allProducts] || [];
        }

        console.log('showProductsPage: filteredProducts length:', this.filteredProducts.length);
        console.log('showProductsPage: allProducts length:', this.allProducts?.length || 0);

        this.updateMenuLayout();
    }

    /**
     * Show checkout page
     */
    showCheckoutPage() {
        if (this.wooCart && !this.wooCart.isEmpty()) {
            // Redirect to WooCommerce checkout page
            console.log('ProductMenu: Redirecting to WooCommerce checkout');
            this.wooCart.goToCheckout();
        } else {
            // Fallback: show custom checkout within the menu
            console.log('ProductMenu: Showing custom checkout (fallback)');
            this.currentView = 'checkout';
            this.updateMenuLayout();
        }
    }

    /**
     * Render cart page
     */
    renderCartPage() {
        if (!this.productGridContainer) return;

        this.productGridContainer.innerHTML = '';

        const cartContainer = document.createElement('div');
        cartContainer.className = 'cart-container';
        cartContainer.style.cssText = `
            padding: 20px;
            height: 100%;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.9);
        `;

        // Cart header with back button
        const cartHeader = document.createElement('div');
        cartHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #444;
        `;

        cartHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="back-to-products-btn" style="
                    background: rgba(0, 255, 0, 0.2);
                    border: 1px solid #00ff00;
                    color: #00ff00;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                ">← Back</button>
                <h3 style="margin: 0; color: #00ff00; font-size: 18px;">Shopping Cart</h3>
            </div>
        `;

        // Cart items
        const cartItems = document.createElement('div');
        cartItems.className = 'cart-items';

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px; font-family: 'Courier New', monospace;">
                    <div style="font-size: 16px; margin-bottom: 10px;">Your cart is empty</div>
                    <div style="font-size: 14px;">Add some products to get started!</div>
                </div>
            `;
        } else {
            this.cart.forEach(item => {
                const cartItem = this.createCartItem(item);
                cartItems.appendChild(cartItem);
            });

            // Cart total
            const cartTotal = document.createElement('div');
            cartTotal.style.cssText = `
                margin-top: 20px;
                padding: 15px;
                border: 1px solid #00ff00;
                border-radius: 6px;
                background: rgba(0, 255, 0, 0.1);
            `;

            cartTotal.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="color: #00ff00; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold;">
                        Total: $${this.getCartTotal().toFixed(2)}
                    </span>
                    <span style="color: #00aa00; font-family: 'Courier New', monospace; font-size: 12px;">
                        ${this.getCartItemCount()} items
                    </span>
                </div>
                <button class="checkout-btn" style="
                    width: 100%;
                    background: rgba(0, 255, 0, 0.2);
                    border: 1px solid #00ff00;
                    color: #00ff00;
                    padding: 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                ">🛒 CHECKOUT</button>
            `;

            cartItems.appendChild(cartTotal);
        }

        // Event listeners
        const backBtn = cartHeader.querySelector('.back-to-products-btn');
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button clicked, switching to products view');
            this.showProductsPage();
        });

        // Add checkout button event handler
        const checkoutBtn = cartItems.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                console.log('Checkout button clicked');
                if (this.wooCart && !this.wooCart.isEmpty()) {
                    this.showCheckoutPage();
                } else if (this.cart.length === 0) {
                    alert('Your cart is empty');
                } else {
                    this.showCheckoutPage();
                }
            });
            checkoutBtn.addEventListener('mouseenter', () => {
                checkoutBtn.style.background = 'rgba(0, 255, 0, 0.3)';
            });
            checkoutBtn.addEventListener('mouseleave', () => {
                checkoutBtn.style.background = 'rgba(0, 255, 0, 0.2)';
            });
        }

        cartContainer.appendChild(cartHeader);
        cartContainer.appendChild(cartItems);
        this.productGridContainer.appendChild(cartContainer);
    }

    /**
     * Create cart item element
     */
    createCartItem(item) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.style.cssText = `
            display: flex;
            gap: 15px;
            padding: 15px;
            border: 1px solid #444;
            border-radius: 6px;
            margin-bottom: 10px;
            background: rgba(0, 0, 0, 0.8);
            font-family: 'Courier New', monospace;
        `;

        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;

        cartItem.innerHTML = `
            <div style="width: 60px; height: 60px; background: #222; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${item.image ?
                    `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` :
                    `<div style="color: #666; font-size: 10px;">No Image</div>`
                }
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="color: #00ff00; font-size: 14px; font-weight: bold; margin-bottom: 4px;">
                        ${item.name}
                    </div>
                    <div style="color: #00cc00; font-size: 12px;">
                        ${item.raw_price_html || `$${price.toFixed(2)}`} each
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                    <button class="qty-decrease" data-product-id="${item.id}" style="
                        background: rgba(255, 0, 0, 0.2);
                        border: 1px solid #ff4444;
                        color: #ff4444;
                        width: 24px;
                        height: 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">-</button>
                    <span style="color: #00ff00; font-size: 14px; min-width: 20px; text-align: center;">
                        ${item.quantity}
                    </span>
                    <button class="qty-increase" data-product-id="${item.id}" style="
                        background: rgba(0, 255, 0, 0.2);
                        border: 1px solid #00ff00;
                        color: #00ff00;
                        width: 24px;
                        height: 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">+</button>
                    <button class="remove-item" data-product-id="${item.id}" style="
                        background: rgba(255, 0, 0, 0.2);
                        border: 1px solid #ff4444;
                        color: #ff4444;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 10px;
                        margin-left: auto;
                    ">Remove</button>
                </div>
            </div>
        `;

        // Add event listeners
        const decreaseBtn = cartItem.querySelector('.qty-decrease');
        const increaseBtn = cartItem.querySelector('.qty-increase');
        const removeBtn = cartItem.querySelector('.remove-item');

        decreaseBtn.addEventListener('click', () => {
            this.updateCartQuantity(item.id, item.quantity - 1);
            this.renderCartPage();
            // Update header to show new cart count
            const header = this.menuElement.querySelector('.menu-header');
            if (header) {
                this.updateHeader(header);
            }
        });

        increaseBtn.addEventListener('click', () => {
            this.updateCartQuantity(item.id, item.quantity + 1);
            this.renderCartPage();
            // Update header to show new cart count
            const header = this.menuElement.querySelector('.menu-header');
            if (header) {
                this.updateHeader(header);
            }
        });

        removeBtn.addEventListener('click', () => {
            this.removeFromCart(item.id);
            this.renderCartPage();
            // Update header to show new cart count
            const header = this.menuElement.querySelector('.menu-header');
            if (header) {
                this.updateHeader(header);
            }
        });

        return cartItem;
    }

    /**
     * Render checkout page
     */
    renderCheckoutPage() {
        if (!this.productGridContainer) return;

        this.productGridContainer.innerHTML = '';

        const checkoutContainer = document.createElement('div');
        checkoutContainer.className = 'checkout-container';
        checkoutContainer.style.cssText = `
            padding: 20px;
            height: 100%;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.9);
        `;

        // Checkout header with back button
        const checkoutHeader = document.createElement('div');
        checkoutHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #444;
        `;

        checkoutHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="back-to-cart-btn" style="
                    background: rgba(0, 255, 0, 0.2);
                    border: 1px solid #00ff00;
                    color: #00ff00;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                ">← Back to Cart</button>
                <h3 style="margin: 0; color: #00ff00; font-size: 18px;">Checkout</h3>
            </div>
        `;

        // Order summary
        const orderSummary = document.createElement('div');
        orderSummary.style.cssText = `
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
        `;

        const cartTotal = this.getCartTotal();
        const cartItemCount = this.getCartItemCount();

        orderSummary.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #00ff00; font-family: 'Courier New', monospace;">Order Summary</h4>
            <div style="font-family: 'Courier New', monospace; color: #00ff00;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Items (${cartItemCount}):</span>
                    <span>$${cartTotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Shipping:</span>
                    <span>FREE</span>
                </div>
                <hr style="border: 1px solid #444; margin: 10px 0;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                    <span>Total:</span>
                    <span>$${cartTotal.toFixed(2)}</span>
                </div>
            </div>
        `;

        // Payment information
        const paymentInfo = document.createElement('div');
        paymentInfo.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #444;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            font-family: 'Courier New', monospace;
        `;

        paymentInfo.innerHTML = `
            <h4 style="margin: 0 0 15px 0; color: #00ff00;">Payment Method: Direct Bank Transfer</h4>
            <div style="color: #00aa00; font-size: 14px; line-height: 1.6;">
                <p style="margin-bottom: 10px;">Please use the following bank details to make your payment:</p>
                <div id="bank-details" style="background: rgba(0, 255, 0, 0.05); padding: 15px; border-radius: 4px; margin: 10px 0;">
                    <div style="color: #666; font-size: 12px;">Loading payment instructions...</div>
                </div>
                <p style="margin-top: 15px; font-size: 12px; color: #888;">
                    Your order will be processed once payment is received. Please include your order number in the payment reference.
                </p>
            </div>
        `;

        // Customer information form
        const customerForm = document.createElement('div');
        customerForm.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #444;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            font-family: 'Courier New', monospace;
        `;

        customerForm.innerHTML = `
            <h4 style="margin: 0 0 15px 0; color: #00ff00;">Customer Information</h4>
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="display: block; color: #00aa00; margin-bottom: 5px; font-size: 12px;">Full Name *</label>
                    <input type="text" id="customer-name" required style="
                        width: 100%;
                        padding: 8px;
                        background: rgba(0, 0, 0, 0.8);
                        border: 1px solid #444;
                        color: #00ff00;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        box-sizing: border-box;
                    ">
                </div>
                <div>
                    <label style="display: block; color: #00aa00; margin-bottom: 5px; font-size: 12px;">Email Address *</label>
                    <input type="email" id="customer-email" required style="
                        width: 100%;
                        padding: 8px;
                        background: rgba(0, 0, 0, 0.8);
                        border: 1px solid #444;
                        color: #00ff00;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        box-sizing: border-box;
                    ">
                </div>
                <div>
                    <label style="display: block; color: #00aa00; margin-bottom: 5px; font-size: 12px;">Phone Number</label>
                    <input type="tel" id="customer-phone" style="
                        width: 100%;
                        padding: 8px;
                        background: rgba(0, 0, 0, 0.8);
                        border: 1px solid #444;
                        color: #00ff00;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        box-sizing: border-box;
                    ">
                </div>
                <div>
                    <label style="display: block; color: #00aa00; margin-bottom: 5px; font-size: 12px;">Delivery Address *</label>
                    <textarea id="customer-address" required rows="3" style="
                        width: 100%;
                        padding: 8px;
                        background: rgba(0, 0, 0, 0.8);
                        border: 1px solid #444;
                        color: #00ff00;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        resize: vertical;
                        box-sizing: border-box;
                    "></textarea>
                </div>
            </div>
        `;

        // Place order button
        const placeOrderBtn = document.createElement('button');
        placeOrderBtn.className = 'place-order-btn';
        placeOrderBtn.textContent = 'PLACE ORDER';
        placeOrderBtn.style.cssText = `
            width: 100%;
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 15px;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.2s ease;
        `;

        // Event listeners
        const backBtn = checkoutHeader.querySelector('.back-to-cart-btn');
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back to cart button clicked');
            this.showCartPage();
        });

        placeOrderBtn.addEventListener('click', () => {
            this.handlePlaceOrder();
        });

        placeOrderBtn.addEventListener('mouseenter', () => {
            placeOrderBtn.style.background = 'rgba(0, 255, 0, 0.3)';
        });

        placeOrderBtn.addEventListener('mouseleave', () => {
            placeOrderBtn.style.background = 'rgba(0, 255, 0, 0.2)';
        });

        checkoutContainer.appendChild(checkoutHeader);
        checkoutContainer.appendChild(orderSummary);
        checkoutContainer.appendChild(paymentInfo);
        checkoutContainer.appendChild(customerForm);
        checkoutContainer.appendChild(placeOrderBtn);
        this.productGridContainer.appendChild(checkoutContainer);

        // Load WooCommerce payment instructions
        this.loadPaymentInstructions();
    }

    /**
     * Load WooCommerce payment instructions
     */
    async loadPaymentInstructions() {
        try {
            const formData = new FormData();
            formData.append('action', 'get_payment_instructions');
            formData.append('nonce', getConfig('nonce'));

            const response = await fetch(getConfig('ajax_url'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            const bankDetailsElement = document.getElementById('bank-details');
            if (bankDetailsElement) {
                if (data.success && data.data.instructions) {
                    bankDetailsElement.innerHTML = `
                        <div style="color: #00ff00; font-size: 13px; line-height: 1.6;">
                            ${data.data.instructions}
                        </div>
                    `;
                } else {
                    bankDetailsElement.innerHTML = `
                        <div style="color: #00ff00; font-size: 13px;">
                            <strong>Bank Details:</strong><br>
                            Account Name: Charlie's Store<br>
                            Account Number: 123-456-789<br>
                            Sort Code: 12-34-56<br>
                            Reference: Your Order Number
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Failed to load payment instructions:', error);
            const bankDetailsElement = document.getElementById('bank-details');
            if (bankDetailsElement) {
                bankDetailsElement.innerHTML = `
                    <div style="color: #00ff00; font-size: 13px;">
                        <strong>Bank Details:</strong><br>
                        Account Name: Charlie's Store<br>
                        Account Number: 123-456-789<br>
                        Sort Code: 12-34-56<br>
                        Reference: Your Order Number
                    </div>
                `;
            }
        }
    }

    /**
     * Handle place order
     */
    async handlePlaceOrder() {
        // Validate required fields
        const name = document.getElementById('customer-name').value.trim();
        const email = document.getElementById('customer-email').value.trim();
        const address = document.getElementById('customer-address').value.trim();

        if (!name || !email || !address) {
            alert('Please fill in all required fields (Name, Email, Address)');
            return;
        }

        if (!this.validateEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        if (this.wooCart && this.wooCart.isEmpty()) {
            alert('Your cart is empty');
            return;
        } else if (!this.wooCart && this.cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        try {
            if (this.wooCart) {
                // Use WooCommerce checkout
                const orderData = {
                    billing: {
                        first_name: name.split(' ')[0] || '',
                        last_name: name.split(' ').slice(1).join(' ') || '',
                        email: email,
                        phone: document.getElementById('customer-phone').value.trim(),
                        address_1: address,
                        city: '',
                        state: '',
                        postcode: '',
                        country: 'CA'
                    },
                    payment_method: 'bacs' // Direct bank transfer
                };

                const response = await fetch(window.charlie_config.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'charlie_woo_checkout',
                        customer_data: JSON.stringify(orderData),
                        nonce: window.charlie_config.nonce
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Clear cart and show success
                    await this.wooCart.clearCart();
                    this.showOrderSuccess(data.data.order_id, data.data.order_number);
                } else {
                    alert('Failed to place order: ' + (data.data || 'Unknown error'));
                }
            } else {
                // Fallback to custom order system
                const orderData = {
                    customer: {
                        name: name,
                        email: email,
                        phone: document.getElementById('customer-phone').value.trim(),
                        address: address
                    },
                    items: this.cart,
                    total: this.getCartTotal(),
                    payment_method: 'bacs'
                };

                const formData = new FormData();
                formData.append('action', 'create_order');
                formData.append('order_data', JSON.stringify(orderData));
                formData.append('nonce', window.charlie_config.nonce);

                const response = await fetch(window.charlie_config.ajax_url, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.clearCart();
                    this.showOrderSuccess(data.data.order_id);
                } else {
                    alert('Failed to place order: ' + (data.data.message || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Order placement failed:', error);
            alert('Failed to place order. Please try again.');
        }
    }

    /**
     * Show order success page
     */
    showOrderSuccess(orderId, orderNumber = null) {
        if (!this.productGridContainer) return;

        this.productGridContainer.innerHTML = '';

        const successContainer = document.createElement('div');
        successContainer.style.cssText = `
            padding: 40px 20px;
            text-align: center;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
        `;

        successContainer.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">✓</div>
            <h2 style="color: #00ff00; margin-bottom: 15px;">Order Placed Successfully!</h2>
            <p style="font-size: 16px; margin-bottom: 10px;">Order Number: <strong>#${orderNumber || orderId}</strong></p>
            <p style="font-size: 14px; margin-bottom: 20px; color: #00aa00;">
                Thank you for your order! You will receive an email confirmation shortly.
            </p>
            <p style="font-size: 12px; margin-bottom: 30px; color: #888;">
                Please transfer the payment using the bank details provided and include your order number as reference.
            </p>
            <button class="back-to-products-btn" style="
                background: rgba(0, 255, 0, 0.2);
                border: 1px solid #00ff00;
                color: #00ff00;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 14px;
            ">Continue Shopping</button>
        `;

        const backBtn = successContainer.querySelector('.back-to-products-btn');
        backBtn.addEventListener('click', () => {
            this.showProductsPage();
        });

        this.productGridContainer.appendChild(successContainer);
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Restore warehouse and cart markers when menu closes
     */
    restoreMapMarkers() {
        console.log('ProductMenu: Restoring map markers after menu close');

        // Slide map back to centered position on desktop
        const isMobile = window.innerWidth <= 768;
        if (!isMobile && window.charlieApp?.mapManager) {
            window.charlieApp.mapManager.slideBackFromProductMode();
            console.log('ProductMenu: Initiated map slide back to center');
        }

        // Show warehouse marker if it exists
        if (window.charlieApp?.mapManager?.markers) {
            window.charlieApp.mapManager.markers.forEach((markerData, markerId) => {
                if (markerData.warehouse && markerData.warehouse.type === 'warehouse' && markerData.element) {
                    markerData.element.style.display = 'block';
                    console.log('ProductMenu: Restored warehouse marker with ID:', markerId);
                }
            });
        }

        // Show cart marker if it exists
        const cartMarker = window.charlieApp?.mapManager?.markers?.get('cart_marker')?.element;
        if (cartMarker) {
            cartMarker.style.display = 'block';
            console.log('ProductMenu: Restored cart marker');
        }

        // Also ensure vignette is visible on desktop (restore from category circles behavior)
        if (!isMobile) {
            const vignette = document.getElementById('radiusVignette');
            if (vignette) {
                vignette.style.display = '';
                console.log('ProductMenu: Restored vignette overlay on desktop');
            }
        }

        // Restore warehouse mode class if needed (for safe area background)
        document.body.classList.remove('warehouse-mode');
        console.log('ProductMenu: Cleaned up warehouse-mode class');
    }

    /**
     * Track analytics events
     * @param {string} eventName - Event name
     * @param {object} eventData - Additional event data
     */
    trackEvent(eventName, eventData = {}) {
        // Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', eventName, {
                event_category: 'product_menu',
                ...eventData
            });
        }

        // WordPress hooks
        if (typeof window !== 'undefined' && window.wp && window.wp.hooks) {
            window.wp.hooks.doAction('charlie_analytics', eventName, eventData);
        }

        console.log('ProductMenu Event:', eventName, eventData);
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