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

<?php
// Show simple age verification on first visit
if (!isset($_COOKIE['charlies_age_verified'])) : ?>
    <div id="charlies-age-overlay" class="charlies-modal-overlay">
        <div class="charlies-modal">
            <div class="charlies-modal-content">
                <h2>Age Verification</h2>
                <p>You must be 19 years or older to access this site.</p>
                <p>Are you 19 years of age or older?</p>
                <div class="charlies-age-buttons">
                    <button id="charlies-age-yes" class="btn btn-primary">Yes, I'm 19+</button>
                    <button id="charlies-age-no" class="btn btn-secondary">No, I'm under 19</button>
                </div>
            </div>
        </div>
    </div>

    <script>
    document.getElementById('charlies-age-yes').addEventListener('click', function() {
        document.cookie = 'charlies_age_verified=true; path=/; max-age=' + (24 * 60 * 60); // 24 hours
        document.getElementById('charlies-age-overlay').style.display = 'none';
    });

    document.getElementById('charlies-age-no').addEventListener('click', function() {
        alert('You must be 19 or older to access this site.');
        window.location.href = 'https://www.google.com';
    });
    </script>
<?php endif; ?>