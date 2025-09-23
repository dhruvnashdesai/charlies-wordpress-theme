/**
 * Category Circles Manager
 * Handles the radial category circles that appear around the vignette when warehouse is clicked
 */

class CategoryCircles {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.isInitialized = false;
        this.categories = [];
        this.categoryElements = new Map();
        this.isVisible = false;
        this.currentStoreId = null;
        this.vignetteRadius = 0;
        this.centerPoint = { x: 0, y: 0 };

        this.init();
    }

    /**
     * Initialize the category circles system
     */
    init() {
        this.calculateVignetteGeometry();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('CategoryCircles initialized');
    }

    /**
     * Calculate vignette center and radius for positioning
     */
    calculateVignetteGeometry() {
        // Get the actual vignette center from MapManager
        if (this.mapManager) {
            const vignetteInfo = this.mapManager.getCurrentVignetteInfo();
            this.centerPoint = {
                x: vignetteInfo.centerX,
                y: vignetteInfo.centerY
            };
            this.vignetteRadius = vignetteInfo.innerRadius; // Use innerRadius for positioning right at the edge
            // Vignette center debug removed
            return;
        }

        // Fallback calculations if MapManager not available
        const mapContainer = document.getElementById('map');
        const isProductMode = mapContainer && mapContainer.classList.contains('product-mode');

        let baseX = window.innerWidth * 0.4;
        if (isProductMode) {
            baseX = window.innerWidth * 0.25; // Shifted left position
        }
        this.centerPoint = {
            x: baseX,
            y: window.innerHeight * 0.5
        };
        this.vignetteRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25;

        // Fallback center debug removed
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for warehouse clicks
        document.addEventListener('warehouseClicked', (e) => {
            this.handleWarehouseClick(e.detail);
        });

        // Listen for map interactions that should hide categories
        document.addEventListener('mapClicked', () => {
            this.hideCategories();
        });

        // Window resize
        window.addEventListener('resize', () => {
            // Don't recalculate geometry in product view
            const isProductView = document.body.classList.contains('product-view-mode');
            if (!isProductView) {
                this.calculateVignetteGeometry();
                if (this.isVisible) {
                    this.repositionCategories();
                }
            }
        });

        // Listen for menu close to exit product view
        document.addEventListener('menuClosed', () => {
            this.exitProductView();
        });
    }

    /**
     * Handle warehouse marker click
     */
    async handleWarehouseClick(warehouse) {
        console.log('Warehouse clicked - opening product menu:', warehouse.name);

        // Add warehouse mode class for safe area background handling
        document.body.classList.add('warehouse-mode');

        this.currentStoreId = warehouse.id;
        const isMobile = window.innerWidth <= 768;

        try {
            // Hide any existing categories
            this.hideCategories();

            // Load categories for this warehouse/store
            await this.loadCategories(warehouse.id);

            // Skip category circles entirely - just set up for product menu
            // this.enterProductView(); // DISABLED - we don't want category circles

            // Just add the product view class without the category positioning
            document.body.classList.add('product-view-mode');

            // Hide vignette only on desktop, keep it visible on mobile
            if (!isMobile) {
                this.hideVignette();
                console.log('Desktop: Hiding vignette overlay');
            } else {
                console.log('Mobile: Keeping vignette overlay visible');
            }

            // Dispatch event to open product menu with all categories
            document.dispatchEvent(new CustomEvent('warehouseSelectedForMenu', {
                detail: {
                    warehouse: warehouse,
                    storeId: warehouse.id,
                    categories: this.categories
                }
            }));

        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    /**
     * Load categories from WooCommerce for specific store
     */
    async loadCategories(storeId) {
        const formData = new FormData();
        formData.append('action', 'get_store_categories');
        formData.append('store_id', storeId);
        formData.append('nonce', getConfig('nonce'));

        const response = await fetch(getConfig('ajax_url'), {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            this.categories = data.data.categories;
            console.log('Loaded categories:', this.categories);
        } else {
            throw new Error(data.data || 'Failed to load categories');
        }
    }

    /**
     * Show category circles around vignette
     */
    showCategories() {
        if (this.categories.length === 0) {
            console.log('No categories to display');
            return;
        }

        // Wait for sliding animation to complete before positioning categories
        setTimeout(() => {
            // Check if we're in product view mode - if so, use product view positions
            const isProductView = document.body.classList.contains('product-view-mode');
            let positions;

            if (isProductView) {
                console.log('CategoryCircles: showCategories in product view mode, using top-right positions');
                positions = this.calculateProductViewPositions();
            } else {
                console.log('CategoryCircles: showCategories in normal mode, using vignette positions');
                this.calculateVignetteGeometry(); // Recalculate in case of changes
                positions = this.calculateCategoryPositions();
            }

            // Create and position category elements
            this.categories.forEach((category, index) => {
                if (index < positions.length) {
                    const element = this.createCategoryElement(category, positions[index]);
                    this.categoryElements.set(category.id, element);
                    document.body.appendChild(element);
                }
            });

            this.isVisible = true;

            // Animate in
            setTimeout(() => {
                this.categoryElements.forEach(element => {
                    element.classList.add('visible');
                });
            }, 50);
        }, 650); // Wait for slide animation (600ms) + small buffer
    }

    /**
     * Calculate positions for category circles around vignette
     */
    calculateCategoryPositions() {
        const numCategories = Math.min(this.categories.length, 6); // Max 6 categories
        const positions = [];

        // Position circles outside the vignette in the dark area
        const distance = this.vignetteRadius * 2; // Double the distance to push into dark area

        console.log('Category positioning debug:', {
            vignetteCenter: this.centerPoint,
            vignetteRadius: this.vignetteRadius,
            distance: distance,
            numCategories: numCategories
        });

        // Mobile vs Desktop positioning
        const isMobile = window.innerWidth <= 768;
        let angles = [];

        if (isMobile) {
            // Mobile: Position circles along the top edge of the vignette
            // Angles from -135° (top-left) to -45° (top-right), with -90° being due up
            if (numCategories === 1) {
                angles = [-90]; // Due up
            } else if (numCategories === 2) {
                angles = [-110, -70]; // Closer to middle
            } else if (numCategories === 3) {
                angles = [-120, -90, -60]; // Tighter cluster around top
            } else if (numCategories === 4) {
                angles = [-130, -105, -75, -50]; // Closer to center
            } else if (numCategories === 5) {
                angles = [-135, -115, -90, -65, -45]; // Tighter spread
            } else {
                angles = [-140, -120, -100, -80, -60, -40]; // Six positions along top
            }
        } else {
            // Desktop: Position circles along the right edge of the vignette
            // Angles from -90° (top-right) to +90° (bottom-right), with 0° being due right
            if (numCategories === 1) {
                angles = [0]; // Due right
            } else if (numCategories === 2) {
                angles = [-20, 20]; // Closer to middle
            } else if (numCategories === 3) {
                angles = [-30, 0, 30]; // Tighter cluster around middle
            } else if (numCategories === 4) {
                angles = [-40, -15, 15, 40]; // Closer to center
            } else if (numCategories === 5) {
                angles = [-45, -25, 0, 25, 45]; // Tighter spread
            } else {
                angles = [-50, -30, -10, 10, 30, 50]; // Six positions closer to middle
            }
        }

        for (let i = 0; i < numCategories; i++) {
            const angle = angles[i];
            const radians = (angle * Math.PI) / 180;

            const x = this.centerPoint.x + (distance * Math.cos(radians));
            const y = this.centerPoint.y + (distance * Math.sin(radians));

            positions.push({ x, y, angle });
        }

        return positions;
    }

    /**
     * Create category circle element
     */
    createCategoryElement(category, position) {
        const element = document.createElement('div');
        element.className = 'category-circle';
        element.setAttribute('data-category-id', category.id);

        // Mobile-responsive sizing
        const isMobile = window.innerWidth <= 768;
        const circleSize = isMobile ? 100 : 120; // Smaller on mobile
        const offset = circleSize / 2;

        // Style the category circle
        element.style.cssText = `
            position: fixed;
            left: ${position.x - offset}px;
            top: ${position.y - offset}px;
            width: ${circleSize}px;
            height: ${circleSize}px;
            background: radial-gradient(circle, ${category.color}22, ${category.color}44);
            border: 3px solid ${category.color};
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 800;
            font-family: 'Courier New', monospace;
            color: ${category.color};
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.3s ease;
            box-shadow: 0 0 20px ${category.color}33;
        `;

        // Add content
        element.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 4px;">${category.name}</div>
            <div style="font-size: 12px; opacity: 0.8;">${category.product_count} items</div>
        `;

        // Add hover effects
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.1)';
            element.style.boxShadow = `0 0 30px ${category.color}66`;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)';
            element.style.boxShadow = `0 0 20px ${category.color}33`;
        });

        // Add click handler
        element.addEventListener('click', () => {
            this.handleCategoryClick(category);
        });

        return element;
    }

    /**
     * Handle category circle click
     */
    handleCategoryClick(category) {
        console.log('Category clicked:', category);

        // Check if we're already in product view mode
        const isAlreadyInProductView = document.body.classList.contains('product-view-mode');

        if (!isAlreadyInProductView) {
            // First time entering product view
            console.log('CategoryCircles: Entering product view for first time');
            this.enterProductView();
        } else {
            // Already in product view, just update the menu content
            console.log('CategoryCircles: Already in product view, just updating menu');
        }

        // Always dispatch event for product menu to handle (menu will update content)
        document.dispatchEvent(new CustomEvent('categorySelected', {
            detail: {
                category: category,
                storeId: this.currentStoreId,
                isProductViewUpdate: isAlreadyInProductView
            }
        }));

        // Highlight selected category
        this.highlightCategory(category.id);
    }

    /**
     * Highlight selected category
     */
    highlightCategory(categoryId) {
        this.categoryElements.forEach((element, id) => {
            if (id === categoryId) {
                element.style.borderWidth = '4px';
                element.style.transform = 'scale(1.2)';
            } else {
                element.style.borderWidth = '3px';
                element.style.transform = 'scale(0.8)';
                element.style.opacity = '0.6';
            }
        });
    }

    /**
     * Hide all category circles
     */
    hideCategories() {
        if (!this.isVisible) return;

        // Animate out
        this.categoryElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'scale(0.5)';
        });

        // Remove elements after animation
        setTimeout(() => {
            this.categoryElements.forEach(element => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
            this.categoryElements.clear();
            this.isVisible = false;

            // Remove warehouse mode class when exiting warehouse view
            document.body.classList.remove('warehouse-mode');
        }, 300);
    }

    /**
     * Reposition categories (for resize events)
     */
    repositionCategories() {
        if (!this.isVisible) return;

        // Don't reposition if we're in product view - categories should stay in place
        const isProductView = document.body.classList.contains('product-view-mode');
        if (isProductView) {
            console.log('CategoryCircles: Skipping repositioning - in product view mode');
            return;
        }

        console.log('CategoryCircles: Repositioning to vignette positions');
        const positions = this.calculateCategoryPositions();
        let index = 0;

        this.categoryElements.forEach(element => {
            if (index < positions.length) {
                const pos = positions[index];
                element.style.left = `${pos.x - 40}px`;
                element.style.top = `${pos.y - 40}px`;
                index++;
            }
        });
    }

    /**
     * Check if categories are currently visible
     */
    isDisplayed() {
        return this.isVisible;
    }

    /**
     * Enter product view - hide vignette and move categories to top right
     */
    enterProductView() {
        // Check if already in product view mode
        if (document.body.classList.contains('product-view-mode')) {
            console.log('CategoryCircles: Already in product view, skipping enter');
            return;
        }

        console.log('CategoryCircles: Entering product view');

        // Add product view class to body for global styling
        document.body.classList.add('product-view-mode');

        // Hide the vignette overlay
        this.hideVignette();

        // Reposition category circles to top right horizontally
        this.repositionForProductView();
    }

    /**
     * Exit product view - restore original layout
     */
    exitProductView() {
        // Check if we're actually in product view mode
        if (!document.body.classList.contains('product-view-mode')) {
            console.log('CategoryCircles: Not in product view, skipping exit');
            return;
        }

        console.log('CategoryCircles: Exiting product view');
        const isMobile = window.innerWidth <= 768;

        // Remove product view class
        document.body.classList.remove('product-view-mode');

        // Show the vignette overlay - it should already be visible on mobile
        if (!isMobile) {
            this.showVignette();
            console.log('Desktop: Restoring vignette overlay');
        } else {
            console.log('Mobile: Vignette overlay was never hidden');
        }

        // Restore category circles to their original positions around the vignette
        this.restoreOriginalPositions();
    }

    /**
     * Hide the vignette overlay
     */
    hideVignette() {
        const vignette = document.getElementById('radiusVignette');
        if (vignette) {
            vignette.style.display = 'none';
        }
    }

    /**
     * Show the vignette overlay
     */
    showVignette() {
        const vignette = document.getElementById('radiusVignette');
        if (vignette) {
            vignette.style.display = '';
        }
    }

    /**
     * Restore category circles to their original positions around the vignette
     */
    restoreOriginalPositions() {
        if (!this.isVisible) return;

        console.log('CategoryCircles: Restoring original positions around vignette');

        // Recalculate original positions around the vignette
        this.calculateVignetteGeometry();
        const positions = this.calculateCategoryPositions();
        let index = 0;

        this.categoryElements.forEach(element => {
            if (index < positions.length) {
                const pos = positions[index];
                element.style.transition = 'all 0.6s ease-in-out';
                element.style.left = `${pos.x - 60}px`;
                element.style.top = `${pos.y - 60}px`;
                index++;
            }
        });
    }

    /**
     * Reposition category circles for product view (top right horizontally)
     */
    repositionForProductView() {
        if (!this.isVisible) return;

        console.log('CategoryCircles: Repositioning for product view - top right horizontal');

        const positions = this.calculateProductViewPositions();
        let index = 0;

        this.categoryElements.forEach(element => {
            if (index < positions.length) {
                const pos = positions[index];
                element.style.transition = 'all 0.6s ease-in-out';
                element.style.left = `${pos.x - 60}px`;
                element.style.top = `${pos.y - 60}px`;
                index++;
            }
        });
    }

    /**
     * Calculate positions for category circles in product view (top right horizontal)
     */
    calculateProductViewPositions() {
        const numCategories = Math.min(this.categories.length, 6);
        const positions = [];

        // Position circles horizontally across the top right
        const topY = 80; // Close to top edge
        const startX = window.innerWidth - 120; // Start from right edge minus circle width
        const spacing = 140; // Horizontal spacing between circles

        for (let i = 0; i < numCategories; i++) {
            positions.push({
                x: startX - (i * spacing), // Move left for each subsequent circle
                y: topY,
                angle: 0
            });
        }

        return positions;
    }
}

// Add CSS for category circles and product view mode
const categoryCircleCSS = `
.category-circle.visible {
    opacity: 1 !important;
    transform: scale(1) !important;
}

.category-circle:hover {
    animation: categoryPulse 2s ease-in-out infinite;
}

@keyframes categoryPulse {
    0%, 100% {
        box-shadow: 0 0 20px var(--category-color, #00ff00)33;
    }
    50% {
        box-shadow: 0 0 40px var(--category-color, #00ff00)66;
    }
}

/* Ensure category circles stay visible in product view mode */
.product-view-mode .category-circle {
    z-index: 1000 !important;
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = categoryCircleCSS;
document.head.appendChild(style);

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CategoryCircles = CategoryCircles;
}