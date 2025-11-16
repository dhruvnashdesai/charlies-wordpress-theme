<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<!-- Warning Section - Above Header -->
<div class="charlies-warning-bar">
    <div class="charlies-container">
        <p>WARNING: This product contains nicotine. Nicotine is an addictive chemical.</p>
    </div>
</div>

<!-- Promotional Running Banner -->
<div class="charlies-promo-banner">
    <div class="charlies-promo-content">
        <span class="charlies-promo-text">SAME DAY DELIVERY IN MONTREAL</span>
        <span class="charlies-promo-text">NO TAX</span>
        <span class="charlies-promo-text">US STRENGTHS</span>
        <span class="charlies-promo-text">SAME DAY DELIVERY IN MONTREAL</span>
        <span class="charlies-promo-text">NO TAX</span>
        <span class="charlies-promo-text">US STRENGTHS</span>
        <span class="charlies-promo-text">SAME DAY DELIVERY IN MONTREAL</span>
        <span class="charlies-promo-text">NO TAX</span>
        <span class="charlies-promo-text">US STRENGTHS</span>
    </div>
</div>

<nav class="charlies-nav">
    <div class="charlies-nav-container">
        <!-- Left Navigation -->
        <div class="charlies-nav-left">
            <ul class="charlies-nav-menu">
                <?php if (class_exists('WooCommerce')) :
                    // Get WooCommerce product categories
                    $devices_term = get_term_by('slug', 'devices', 'product_cat');
                    $pouches_term = get_term_by('slug', 'pouches', 'product_cat');
                    $sticks_term = get_term_by('slug', 'sticks', 'product_cat');
                ?>
                    <?php if ($devices_term) : ?>
                        <li><a href="<?php echo get_term_link($devices_term); ?>">Devices</a></li>
                    <?php endif; ?>
                    <?php if ($pouches_term) : ?>
                        <li><a href="<?php echo get_term_link($pouches_term); ?>">Pouches</a></li>
                    <?php endif; ?>
                    <?php if ($sticks_term) : ?>
                        <li><a href="<?php echo get_term_link($sticks_term); ?>">Sticks</a></li>
                    <?php endif; ?>
                    <li><a href="<?php echo wc_get_page_permalink('shop'); ?>">All Products</a></li>
                <?php endif; ?>
            </ul>
        </div>

        <!-- Center Logo -->
        <div class="charlies-nav-center">
            <a href="<?php echo esc_url(home_url('/')); ?>" class="charlies-logo">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/images/logo2.png" alt="<?php bloginfo('name'); ?>" class="charlies-logo-image">
            </a>
        </div>

        <!-- Right Navigation -->
        <div class="charlies-nav-right">
            <?php if (class_exists('WooCommerce')) : ?>
                <a href="<?php echo wc_get_account_endpoint_url('dashboard'); ?>" class="charlies-account-icon" title="Account">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </a>
                <a href="<?php echo wc_get_cart_url(); ?>" class="charlies-cart-icon" title="Cart">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <span class="charlies-cart-count"><?php echo WC()->cart->get_cart_contents_count(); ?></span>
                </a>
            <?php endif; ?>
        </div>
    </div>
</nav>

<!-- Age Verification Modal -->
<div id="charlies-age-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: none; align-items: center; justify-content: center;">
    <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);">
        <h2 style="margin-bottom: 1rem; color: #333; font-weight: 600;">Age Verification</h2>
        <p style="margin-bottom: 1rem; color: #666; line-height: 1.5;">You must be 19 years or older to access this site.</p>
        <p style="margin-bottom: 1.5rem; color: #666; line-height: 1.5;">Are you 19 years of age or older?</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button onclick="verifyAge(true)" style="padding: 12px 24px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; background: #000; color: white; min-width: 120px;">Yes, I'm 19+</button>
            <button onclick="verifyAge(false)" style="padding: 12px 24px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; background: #f5f5f5; color: #333; min-width: 120px;">No, I'm under 19</button>
        </div>
    </div>
</div>

<script>
// Check if user needs age verification
function checkAgeVerification() {
    const verified = localStorage.getItem('charlies_age_verified');
    const expires = localStorage.getItem('charlies_age_verified_expires');
    const now = new Date().getTime();

    if (!verified || !expires || now > parseInt(expires)) {
        document.getElementById('charlies-age-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Handle age verification
function verifyAge(isOfAge) {
    if (isOfAge) {
        // Store verification for 24 hours
        const expires = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('charlies_age_verified', 'true');
        localStorage.setItem('charlies_age_verified_expires', expires.toString());

        // Hide modal
        document.getElementById('charlies-age-modal').style.display = 'none';
        document.body.style.overflow = '';
    } else {
        alert('You must be 19 or older to access this site.');
        window.location.href = 'https://www.google.com';
    }
}

// Run check when page loads
checkAgeVerification();
</script>