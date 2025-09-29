/**
 * WooCommerce Cart Manager
 * Integrates Charlie's theme with WooCommerce cart system
 */

class WooCartManager {
    constructor() {
        this.ajaxUrl = window.charlie_config?.ajax_url || '/wp-admin/admin-ajax.php';
        this.nonce = window.charlie_config?.nonce || '';

        console.log('WooCartManager: Initializing with ajaxUrl:', this.ajaxUrl, 'nonce:', this.nonce ? 'present' : 'missing');
        console.log('WooCartManager: charlie_config available:', !!window.charlie_config);

        // Initialize cart
        this.cart = {
            items: [],
            count: 0,
            total: '0.00',
            subtotal: '0.00',
            checkout_url: ''
        };

        this.init();
    }

    init() {
        // Load cart from WooCommerce
        console.log('WooCartManager: Loading initial cart...');
        this.loadCart();
    }

    /**
     * Add product to WooCommerce cart
     */
    async addToCart(productId, quantity = 1) {
        try {
            console.log('WooCartManager: Adding product to cart - ID:', productId, 'quantity:', quantity);
            console.log('WooCartManager: Using AJAX URL:', this.ajaxUrl, 'nonce:', this.nonce ? 'present' : 'missing');

            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'charlie_add_to_cart',
                    product_id: productId,
                    quantity: quantity,
                    nonce: this.nonce
                })
            });

            console.log('WooCartManager: Add to cart response status:', response.status);
            const data = await response.json();
            console.log('WooCartManager: Add to cart response data:', data);

            if (data.success) {
                // Update local cart state
                this.cart.count = data.data.cart_count;
                this.cart.total = data.data.cart_total;
                console.log('WooCartManager: Updated cart count:', this.cart.count, 'total:', this.cart.total);

                // Reload full cart data
                await this.loadCart();

                // Dispatch custom event
                this.dispatchCartEvent('cart_updated', {
                    message: data.data.message,
                    product_id: productId,
                    cart: this.cart
                });

                return data.data;
            } else {
                console.error('WooCartManager: Failed to add to cart:', data.data);
                throw new Error(data.data || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('WooCartManager: Error adding to cart:', error);
            throw error;
        }
    }

    /**
     * Load cart from WooCommerce
     */
    async loadCart() {
        try {
            console.log('WooCartManager: Making AJAX request to:', this.ajaxUrl);
            console.log('WooCartManager: Request params - action: charlie_get_cart, nonce:', this.nonce ? 'present' : 'missing');

            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'charlie_get_cart',
                    nonce: this.nonce
                })
            });

            console.log('WooCartManager: Response status:', response.status);
            const data = await response.json();
            console.log('WooCartManager: Response data:', data);

            if (data.success) {
                this.cart = data.data;
                console.log('WooCartManager: Cart loaded successfully:', this.cart);

                // Dispatch cart loaded event
                this.dispatchCartEvent('cart_loaded', this.cart);

                return this.cart;
            } else {
                console.error('WooCartManager: Cart load failed:', data.data);
                throw new Error(data.data || 'Failed to load cart');
            }
        } catch (error) {
            console.error('WooCartManager: Error loading cart:', error);
            // Return empty cart structure
            this.cart = {
                items: [],
                count: 0,
                total: '0.00',
                subtotal: '0.00',
                checkout_url: ''
            };
            return this.cart;
        }
    }

    /**
     * Update cart item quantity
     */
    async updateCartQuantity(cartItemKey, quantity) {
        try {
            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'charlie_update_cart',
                    cart_item_key: cartItemKey,
                    quantity: quantity,
                    nonce: this.nonce
                })
            });

            const data = await response.json();

            if (data.success) {
                // Reload cart data
                await this.loadCart();

                this.dispatchCartEvent('cart_updated', {
                    message: data.data.message,
                    cart: this.cart
                });

                return data.data;
            } else {
                throw new Error(data.data || 'Failed to update cart');
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            throw error;
        }
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(cartItemKey) {
        try {
            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'charlie_remove_from_cart',
                    cart_item_key: cartItemKey,
                    nonce: this.nonce
                })
            });

            const data = await response.json();

            if (data.success) {
                // Reload cart data
                await this.loadCart();

                this.dispatchCartEvent('cart_updated', {
                    message: data.data.message,
                    cart: this.cart
                });

                return data.data;
            } else {
                throw new Error(data.data || 'Failed to remove from cart');
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    }

    /**
     * Get cart total
     */
    getCartTotal() {
        return parseFloat(this.cart.total.replace(/[^0-9.-]+/g, '')) || 0;
    }

    /**
     * Get cart item count
     */
    getCartItemCount() {
        return this.cart.count || 0;
    }

    /**
     * Get cart items
     */
    getCartItems() {
        return this.cart.items || [];
    }

    /**
     * Redirect to WooCommerce checkout
     */
    goToCheckout() {
        if (this.cart.checkout_url) {
            window.location.href = this.cart.checkout_url;
        } else {
            // Fallback to standard checkout URL
            window.location.href = '/checkout';
        }
    }

    /**
     * Clear cart (for logout/reset)
     */
    async clearCart() {
        // WooCommerce doesn't have a direct clear cart AJAX endpoint
        // We'll remove items one by one
        const items = this.getCartItems();

        for (const item of items) {
            try {
                await this.removeFromCart(item.cart_item_key);
            } catch (error) {
                console.error('Error clearing cart item:', error);
            }
        }

        this.dispatchCartEvent('cart_cleared', this.cart);
    }

    /**
     * Dispatch custom cart events
     */
    dispatchCartEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data,
            bubbles: true
        });

        document.dispatchEvent(event);
    }

    /**
     * Check if cart is empty
     */
    isEmpty() {
        return this.getCartItemCount() === 0;
    }

    /**
     * Get formatted cart total
     */
    getFormattedTotal() {
        return this.cart.total || '$0.00';
    }

    /**
     * Get formatted cart subtotal
     */
    getFormattedSubtotal() {
        return this.cart.subtotal || '$0.00';
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.WooCartManager = WooCartManager;
}

// Auto-initialize if in WordPress environment
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.charlie_config) {
            window.charlieCart = new WooCartManager();
        }
    });
} else if (typeof window !== 'undefined' && window.charlie_config) {
    window.charlieCart = new WooCartManager();
}