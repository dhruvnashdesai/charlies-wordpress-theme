/**
 * Charlie's Theme - Cart JavaScript
 * AJAX cart functionality for WooCommerce
 *
 * @package CharliesTheme
 */

const charliesCart = {
	/**
	 * Initialize cart functionality
	 */
	init() {
		this.bindAddToCart();
		this.bindQuantityButtons();
		this.bindRemoveItem();
	},

	/**
	 * AJAX add to cart
	 */
	bindAddToCart() {
		document.addEventListener('click', async (e) => {
			const btn = e.target.closest('.ajax-add-to-cart');
			if (!btn) return;

			e.preventDefault();

			const productId = btn.dataset.productId;
			const quantity = btn.dataset.quantity || 1;

			btn.classList.add('loading');
			btn.disabled = true;

			try {
				const response = await this.addToCart(productId, quantity);
				if (response.success) {
					this.updateCartCount(response.cart_count);
					btn.classList.add('added');
					setTimeout(() => btn.classList.remove('added'), 2000);
				}
			} catch (error) {
				console.error('Add to cart error:', error);
			} finally {
				btn.classList.remove('loading');
				btn.disabled = false;
			}
		});
	},

	/**
	 * Add product to cart via AJAX
	 */
	async addToCart(productId, quantity = 1) {
		const formData = new FormData();
		formData.append('action', 'woocommerce_ajax_add_to_cart');
		formData.append('product_id', productId);
		formData.append('quantity', quantity);

		const response = await fetch(charliesAjax.url, {
			method: 'POST',
			body: formData,
			credentials: 'same-origin'
		});

		return response.json();
	},

	/**
	 * Quantity increment/decrement buttons
	 */
	bindQuantityButtons() {
		document.addEventListener('click', (e) => {
			const btn = e.target.closest('.qty-btn');
			if (!btn) return;

			const input = btn.parentElement.querySelector('input[type="number"]');
			if (!input) return;

			const min = parseInt(input.min) || 1;
			const max = parseInt(input.max) || 999;
			let value = parseInt(input.value) || 1;

			if (btn.classList.contains('qty-minus')) {
				value = Math.max(min, value - 1);
			} else if (btn.classList.contains('qty-plus')) {
				value = Math.min(max, value + 1);
			}

			input.value = value;
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});
	},

	/**
	 * Remove item from cart
	 */
	bindRemoveItem() {
		document.addEventListener('click', async (e) => {
			const btn = e.target.closest('.remove-cart-item');
			if (!btn) return;

			e.preventDefault();

			const cartKey = btn.dataset.cartKey;
			if (!cartKey) return;

			btn.closest('.cart-item')?.classList.add('removing');

			try {
				const formData = new FormData();
				formData.append('action', 'charlies_remove_cart_item');
				formData.append('cart_key', cartKey);
				formData.append('nonce', charliesAjax.nonce);

				const response = await fetch(charliesAjax.url, {
					method: 'POST',
					body: formData,
					credentials: 'same-origin'
				});

				const data = await response.json();
				if (data.success) {
					location.reload();
				}
			} catch (error) {
				console.error('Remove from cart error:', error);
			}
		});
	},

	/**
	 * Update cart count in header
	 */
	updateCartCount(count) {
		const counters = document.querySelectorAll('.charlies-cart-count');
		counters.forEach(counter => {
			counter.textContent = count;
			counter.classList.toggle('has-items', count > 0);
		});

		// Trigger bump animation
		if (window.charliesCartAnimation) {
			window.charliesCartAnimation.bump();
		}
	}
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
	charliesCart.init();
});
