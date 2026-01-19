<?php
/**
 * 404 Page Template
 *
 * @package CharliesTheme
 */

get_header();
?>

<div class="error-404">
	<div class="container">
		<div class="error-404__content">
			<h1 class="error-404__title">404</h1>
			<h2 class="error-404__subtitle"><?php esc_html_e( 'Page Not Found', 'charlies-theme' ); ?></h2>
			<p class="error-404__text"><?php esc_html_e( "Sorry, we couldn't find the page you're looking for.", 'charlies-theme' ); ?></p>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn btn-primary">
				<?php esc_html_e( 'Back to Home', 'charlies-theme' ); ?>
			</a>
		</div>

		<?php if ( class_exists( 'WooCommerce' ) ) : ?>
			<div class="error-404__products">
				<h3><?php esc_html_e( 'You might like these', 'charlies-theme' ); ?></h3>
				<?php
				$args = array(
					'post_type'      => 'product',
					'posts_per_page' => 4,
					'orderby'        => 'rand',
				);
				$products = new WP_Query( $args );

				if ( $products->have_posts() ) :
				?>
					<div class="product-grid">
						<?php
						while ( $products->have_posts() ) :
							$products->the_post();
							wc_get_template_part( 'content', 'product' );
						endwhile;
						wp_reset_postdata();
						?>
					</div>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
</div>

<?php
get_footer();
