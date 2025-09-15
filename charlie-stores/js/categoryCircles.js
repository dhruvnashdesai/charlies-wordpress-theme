/**
 * Category Circles Manager
 * Handles the radial category circles that appear around the vignette when warehouse is clicked
 */

class CategoryCircles {
    constructor() {
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
        const vignette = document.getElementById('radiusVignette');
        if (!vignette) {
            // Fallback calculations
            this.centerPoint = {
                x: window.innerWidth * 0.4,
                y: window.innerHeight * 0.5
            };
            this.vignetteRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
            return;
        }

        // Get actual vignette dimensions
        const rect = vignette.getBoundingClientRect();
        this.centerPoint = {
            x: rect.left + (rect.width / 2),
            y: rect.top + (rect.height / 2)
        };
        this.vignetteRadius = Math.min(rect.width, rect.height) / 2;
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
            this.calculateVignetteGeometry();
            if (this.isVisible) {
                this.repositionCategories();
            }
        });
    }

    /**
     * Handle warehouse marker click
     */
    async handleWarehouseClick(warehouse) {
        console.log('Warehouse clicked, loading categories...', warehouse);

        this.currentStoreId = warehouse.id;

        try {
            // Hide existing categories first
            this.hideCategories();

            // Load categories for this warehouse/store
            await this.loadCategories(warehouse.id);

            // Show category circles
            this.showCategories();

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

        this.calculateVignetteGeometry(); // Recalculate in case of changes

        // Calculate positions for categories
        const positions = this.calculateCategoryPositions();

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
    }

    /**
     * Calculate positions for category circles around vignette
     */
    calculateCategoryPositions() {
        const numCategories = Math.min(this.categories.length, 6); // Max 6 categories
        const positions = [];

        // Distance from vignette edge
        const distance = this.vignetteRadius + 80;

        // Calculate angles - distribute around right side of circle
        const startAngle = -60; // Start at upper-right
        const endAngle = 60;    // End at lower-right
        const angleStep = numCategories > 1 ? (endAngle - startAngle) / (numCategories - 1) : 0;

        for (let i = 0; i < numCategories; i++) {
            const angle = startAngle + (angleStep * i);
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

        // Style the category circle
        element.style.cssText = `
            position: fixed;
            left: ${position.x - 40}px;
            top: ${position.y - 40}px;
            width: 80px;
            height: 80px;
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
            font-size: 10px;
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
            <div style="font-size: 12px; margin-bottom: 2px;">${category.name}</div>
            <div style="font-size: 8px; opacity: 0.8;">${category.product_count} items</div>
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

        // Dispatch event for product menu to handle
        document.dispatchEvent(new CustomEvent('categorySelected', {
            detail: {
                category: category,
                storeId: this.currentStoreId
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
        }, 300);
    }

    /**
     * Reposition categories (for resize events)
     */
    repositionCategories() {
        if (!this.isVisible) return;

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
}

// Add CSS for category circles
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
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = categoryCircleCSS;
document.head.appendChild(style);

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CategoryCircles = CategoryCircles;
}