<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<nav class="charlies-nav">
    <div class="charlies-nav-container">
        <!-- Logo -->
        <a href="<?php echo esc_url(home_url('/')); ?>" class="charlies-logo">
            <?php if (has_custom_logo()) : ?>
                <?php the_custom_logo(); ?>
            <?php else : ?>
                <?php bloginfo('name'); ?>
            <?php endif; ?>
        </a>

        <!-- Main Navigation -->
        <ul class="charlies-nav-menu">
            <li><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></li>
            <?php if (class_exists('WooCommerce')) : ?>
                <li><a href="<?php echo wc_get_page_permalink('shop'); ?>">Products</a></li>
            <?php endif; ?>

            <?php
            // Display product categories in navigation
            if (class_exists('WooCommerce')) :
                $categories = get_terms(array(
                    'taxonomy' => 'product_cat',
                    'hide_empty' => true,
                    'parent' => 0,
                    'number' => 3
                ));

                if ($categories) :
                    foreach ($categories as $category) : ?>
                        <li><a href="<?php echo get_term_link($category); ?>"><?php echo esc_html($category->name); ?></a></li>
                    <?php endforeach;
                endif;
            endif; ?>

            <li><a href="<?php echo esc_url(home_url('/about')); ?>">About</a></li>
            <li><a href="<?php echo esc_url(home_url('/contact')); ?>">Contact</a></li>
        </ul>

        <!-- Cart & Account -->
        <div class="charlies-nav-actions">
            <?php if (class_exists('WooCommerce')) : ?>
                <a href="<?php echo wc_get_account_endpoint_url('dashboard'); ?>" class="charlies-account-link">
                    Account
                </a>
                <a href="<?php echo wc_get_cart_url(); ?>" class="charlies-cart-icon">
                    🛒 <span class="charlies-cart-count"><?php echo WC()->cart->get_cart_contents_count(); ?></span>
                </a>
            <?php endif; ?>
        </div>
    </div>
</nav>

<script>
// Simple age verification check - will be enhanced by the main script
document.addEventListener('DOMContentLoaded', function() {
    const isVerified = localStorage.getItem('charlies_age_verified');
    const expirationTime = localStorage.getItem('charlies_age_verified_expires');
    const now = new Date().getTime();

    // If not verified or expired, show modal
    if (!isVerified || !expirationTime || now > parseInt(expirationTime)) {
        showSimpleAgeModal();
    }

    function showSimpleAgeModal() {
        const modalHTML = `
            <div id="charlies-age-modal" class="charlies-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div class="charlies-modal" style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);">
                    <div class="charlies-modal-content">
                        <h2 style="margin-bottom: 1rem; color: #333; font-weight: 600;">Age Verification</h2>
                        <p style="margin-bottom: 1rem; color: #666; line-height: 1.5;">You must be 19 years or older to access this site.</p>
                        <p style="margin-bottom: 1rem; color: #666; line-height: 1.5;">Are you 19 years of age or older?</p>
                        <div class="charlies-age-buttons" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                            <button id="charlies-age-yes" style="padding: 12px 24px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; background: #000; color: white; min-width: 120px;">Yes, I'm 19+</button>
                            <button id="charlies-age-no" style="padding: 12px 24px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; background: #f5f5f5; color: #333; min-width: 120px;">No, I'm under 19</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';

        // Handle button clicks
        document.getElementById('charlies-age-yes').addEventListener('click', function() {
            // Set verification for 24 hours
            const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('charlies_age_verified', 'true');
            localStorage.setItem('charlies_age_verified_expires', expirationTime.toString());

            // Remove modal
            const modal = document.getElementById('charlies-age-modal');
            modal.style.display = 'none';
            document.body.style.overflow = '';
            modal.remove();
        });

        document.getElementById('charlies-age-no').addEventListener('click', function() {
            alert('You must be 19 or older to access this site.');
            window.location.href = 'https://www.google.com';
        });
    }
});
</script>