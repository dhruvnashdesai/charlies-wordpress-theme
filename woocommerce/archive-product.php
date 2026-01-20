<?php
/**
 * Shop Archive Page
 *
 * @package CharliesTheme
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<div class="shop-page">
	<div class="container">

		<?php if ( apply_filters( 'woocommerce_show_page_title', true ) ) : ?>
			<header class="shop-header">
				<h1 class="shop-title"><?php woocommerce_page_title(); ?></h1>
				<?php if ( is_shop() && get_the_post_thumbnail_url() ) : ?>
					<div class="shop-description">
						<?php the_archive_description(); ?>
					</div>
				<?php endif; ?>
			</header>
		<?php endif; ?>

		<?php get_template_part( 'template-parts/category-pills' ); ?>

		<!-- Products Container (updated via AJAX) -->
		<div id="shop-products" class="shop-products">
			<?php
			/**
			 * Hook: woocommerce_before_shop_loop.
			 */
			?>
			<div class="shop-toolbar">
				<?php
				woocommerce_result_count();
				woocommerce_catalog_ordering();
				?>
			</div>

			<?php
			if ( woocommerce_product_loop() ) :

				woocommerce_product_loop_start();

				if ( wc_get_loop_prop( 'total' ) ) :
					while ( have_posts() ) :
						the_post();

						do_action( 'woocommerce_shop_loop' );

						wc_get_template_part( 'content', 'product' );
					endwhile;
				endif;

				woocommerce_product_loop_end();
				?>
				<div class="shop-pagination">
					<?php woocommerce_pagination(); ?>
				</div>
				<?php

			else :
				do_action( 'woocommerce_no_products_found' );
			endif;
			?>
		</div>

	</div>
</div>

<?php
get_footer();
