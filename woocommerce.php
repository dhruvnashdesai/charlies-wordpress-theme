<?php
/**
 * WooCommerce Template
 * This template is used for all WooCommerce pages (shop, product archives, etc.)
 */

get_header(); ?>

<main class="charlies-main woocommerce-page">
    <div class="charlies-container">

        <?php if (is_shop()) : ?>
            <!-- Shop Page Header -->
            <div class="shop-header">
                <h1 class="page-title">Our Products</h1>
                <p class="shop-description">Browse our complete selection of premium nicotine products.</p>
            </div>
        <?php endif; ?>

        <?php
        // WooCommerce content
        woocommerce_content();
        ?>

    </div>
</main>

<?php get_footer(); ?>