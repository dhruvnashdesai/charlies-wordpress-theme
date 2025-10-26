<?php
/**
 * The Template for displaying product archives, including the main shop page which is a post type archive
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' ); ?>

<main class="charlies-main woocommerce-page">
    <div class="charlies-container">

        <!-- Shop Page Header -->
        <div class="shop-header">
            <h1 class="page-title">
                <?php if ( apply_filters( 'woocommerce_show_page_title', true ) ) : ?>
                    <?php woocommerce_page_title(); ?>
                <?php endif; ?>
            </h1>

            <?php if ( woocommerce_get_page_id( 'shop' ) ) : ?>
                <div class="shop-description">
                    <?php echo wpautop( wp_kses_post( get_post_field( 'post_content', woocommerce_get_page_id( 'shop' ) ) ) ); ?>
                </div>
            <?php else : ?>
                <p class="shop-description">Browse our complete selection of premium nicotine products.</p>
            <?php endif; ?>
        </div>

        <?php
        /**
         * Hook: woocommerce_before_main_content.
         *
         * @hooked woocommerce_output_content_wrapper - 10 (outputs opening divs for the content)
         * @hooked woocommerce_breadcrumb - 20
         * @hooked WC_Structured_Data::generate_website_data() - 30
         */
        do_action( 'woocommerce_before_main_content' );

        /**
         * Hook: woocommerce_archive_description.
         *
         * @hooked woocommerce_taxonomy_archive_description - 10
         * @hooked woocommerce_product_archive_description - 10
         */
        do_action( 'woocommerce_archive_description' );
        ?>

        <?php if ( woocommerce_product_loop() ) : ?>

            <?php
            /**
             * Hook: woocommerce_before_shop_loop.
             *
             * @hooked woocommerce_output_all_notices - 10
             * @hooked woocommerce_result_count - 20
             * @hooked woocommerce_catalog_ordering - 30
             */
            do_action( 'woocommerce_before_shop_loop' );

            woocommerce_product_loop_start();

            if ( wc_get_loop_prop( 'is_paginated' ) ) {
                woocommerce_maybe_show_product_subcategories();
            }

            while ( have_posts() ) {
                the_post();

                /**
                 * Hook: woocommerce_shop_loop.
                 */
                do_action( 'woocommerce_shop_loop' );

                wc_get_template_part( 'content', 'product' );
            }

            woocommerce_product_loop_end();

            /**
             * Hook: woocommerce_after_shop_loop.
             *
             * @hooked woocommerce_pagination - 10
             */
            do_action( 'woocommerce_after_shop_loop' );
            ?>

        <?php else : ?>

            <?php
            /**
             * Hook: woocommerce_no_products_found.
             *
             * @hooked wc_no_products_found - 10
             */
            do_action( 'woocommerce_no_products_found' );
            ?>

        <?php endif; ?>

        <?php
        /**
         * Hook: woocommerce_after_main_content.
         *
         * @hooked woocommerce_output_content_wrapper_end - 10 (outputs closing divs for the content)
         */
        do_action( 'woocommerce_after_main_content' );
        ?>

    </div>
</main>

<?php
get_footer( 'shop' );
?>