<?php
/**
 * WooCommerce Template
 * This template is used for all WooCommerce pages (shop, product archives, etc.)
 */

get_header();

// DEBUG: Show which template is loading
echo '<!-- DEBUG: woocommerce.php template is loading -->';
?>

<main class="charlies-main woocommerce-page">
    <div class="charlies-container">


        <?php
        // WooCommerce content
        woocommerce_content();
        ?>

    </div>
</main>

<?php get_footer(); ?>