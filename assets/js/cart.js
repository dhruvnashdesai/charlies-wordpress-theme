/**
 * Simple WooCommerce Cart Integration
 * Clean and minimal functionality
 */

(function($) {
    'use strict';

    // Update cart count on page load
    updateCartCount();

    // Handle add to cart buttons
    $(document).on('click', '.charlies-add-to-cart', function(e) {
        e.preventDefault();

        const $button = $(this);
        const productId = $button.data('product-id');
        const quantity = $button.data('quantity') || 1;

        // Show loading state
        $button.addClass('loading').text('Adding...');

        // Add to cart via AJAX
        $.ajax({
            url: charlies_config.ajax_url,
            type: 'POST',
            data: {
                action: 'charlie_add_to_cart',
                product_id: productId,
                quantity: quantity,
                nonce: charlies_config.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Update cart count
                    updateCartCount();

                    // Show success message
                    showNotification('Product added to cart', 'success');

                    // Reset button
                    $button.removeClass('loading').text('Add to Cart');
                } else {
                    showNotification('Failed to add product to cart', 'error');
                    $button.removeClass('loading').text('Add to Cart');
                }
            },
            error: function() {
                showNotification('An error occurred', 'error');
                $button.removeClass('loading').text('Add to Cart');
            }
        });
    });

    // Update cart count
    function updateCartCount() {
        if (!charlies_config.woocommerce.is_active) return;

        $.ajax({
            url: charlies_config.ajax_url,
            type: 'POST',
            data: {
                action: 'charlie_get_cart',
                nonce: charlies_config.nonce
            },
            success: function(response) {
                if (response.success) {
                    $('.charlies-cart-count').text(response.data.count);
                    $('.charlies-cart-total').text(response.data.total);
                }
            }
        });
    }

    // Simple notification system
    function showNotification(message, type) {
        const notification = $(`
            <div class="charlies-notification charlies-notification-${type}">
                ${message}
            </div>
        `);

        $('body').append(notification);

        setTimeout(() => {
            notification.addClass('show');
        }, 100);

        setTimeout(() => {
            notification.removeClass('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

})(jQuery);