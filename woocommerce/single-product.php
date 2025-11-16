<?php
/**
 * Single Product Template
 *
 * This template displays individual product pages with:
 * - Left: Product images (hero + gallery grid)
 * - Right: Grey info box with product details
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' ); ?>

<main class="charlies-main charlies-single-product">
    <div class="charlies-container">

        <?php while ( have_posts() ) : ?>
            <?php the_post(); ?>

            <div id="product-<?php the_ID(); ?>" <?php wc_product_class( 'charlies-product-detail', $product ); ?>>

                <!-- Product Layout Container -->
                <div class="charlies-product-layout">

                    <!-- Left Column - Product Images -->
                    <div class="charlies-product-images">
                        <?php
                        /**
                         * Hook: woocommerce_before_single_product_summary
                         * @hooked woocommerce_show_product_sale_flash - 10
                         * @hooked woocommerce_show_product_images - 20
                         */
                        do_action( 'woocommerce_before_single_product_summary' );
                        ?>
                    </div>

                    <!-- Right Column - Product Info Box -->
                    <div class="charlies-product-info">
                        <div class="charlies-product-info-box">
                            <?php
                            /**
                             * Hook: woocommerce_single_product_summary
                             * @hooked woocommerce_template_single_title - 5
                             * @hooked woocommerce_template_single_rating - 10
                             * @hooked woocommerce_template_single_price - 10
                             * @hooked woocommerce_template_single_excerpt - 20
                             * @hooked woocommerce_template_single_add_to_cart - 30
                             * @hooked woocommerce_template_single_meta - 40
                             * @hooked woocommerce_template_single_sharing - 50
                             */
                            do_action( 'woocommerce_single_product_summary' );
                            ?>
                        </div>
                    </div>

                </div>

                <!-- Product Tabs/Additional Content -->
                <div class="charlies-product-tabs">
                    <?php
                    /**
                     * Hook: woocommerce_after_single_product_summary
                     * @hooked woocommerce_output_product_data_tabs - 10
                     * @hooked woocommerce_upsell_display - 15
                     * @hooked woocommerce_output_related_products - 20
                     */
                    do_action( 'woocommerce_after_single_product_summary' );
                    ?>
                </div>

            </div>

        <?php endwhile; ?>

    </div>
</main>

<?php get_footer( 'shop' ); ?>