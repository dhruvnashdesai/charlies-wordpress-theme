<?php
/**
 * WooCommerce Template
 * This template is used for all WooCommerce pages (shop, product archives, etc.)
 */

get_header(); ?>

<main class="charlies-main woocommerce-page">
    <div class="charlies-container">


        <?php
        // WooCommerce content
        woocommerce_content();
        ?>

    </div>
</main>

<?php get_footer(); ?>