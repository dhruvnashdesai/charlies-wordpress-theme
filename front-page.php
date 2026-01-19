<?php
/**
 * Front Page Template
 *
 * @package CharliesTheme
 */

get_header();
?>

<div class="homepage">

	<!-- Trust Badges Section -->
	<?php get_template_part( 'template-parts/trust-badges' ); ?>

	<!-- Brand Marquee Section -->
	<?php get_template_part( 'template-parts/brand-marquee' ); ?>

	<!-- Newest Drops Section -->
	<section class="section newest-drops">
		<div class="container">
			<h2 class="section-title text-center"><?php esc_html_e( 'Newest Drops', 'charlies-theme' ); ?></h2>

			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<?php
				$args = array(
					'post_type'      => 'product',
					'posts_per_page' => 8,
					'orderby'        => 'date',
					'order'          => 'DESC',
				);
				$products = new WP_Query( $args );
				?>

				<?php if ( $products->have_posts() ) : ?>
					<div class="product-grid">
						<?php while ( $products->have_posts() ) : $products->the_post(); ?>
							<?php global $product; ?>
							<div class="product-card">
								<a href="<?php the_permalink(); ?>" class="product-card__link">
									<div class="product-card__image">
										<?php if ( has_post_thumbnail() ) : ?>
											<?php the_post_thumbnail( 'charlies-product-card' ); ?>
										<?php else : ?>
											<img src="<?php echo esc_url( wc_placeholder_img_src( 'charlies-product-card' ) ); ?>" alt="<?php the_title_attribute(); ?>">
										<?php endif; ?>

										<?php if ( $product->is_on_sale() ) : ?>
											<span class="product-card__badge"><?php esc_html_e( 'Sale', 'charlies-theme' ); ?></span>
										<?php endif; ?>
									</div>

									<div class="product-card__content">
										<h3 class="product-card__title"><?php the_title(); ?></h3>

										<div class="product-card__price">
											<?php echo $product->get_price_html(); ?>
										</div>
									</div>
								</a>

								<?php if ( $product->is_in_stock() && $product->is_type( 'simple' ) ) : ?>
									<button class="product-card__btn ajax-add-to-cart" data-product-id="<?php echo esc_attr( $product->get_id() ); ?>">
										<?php esc_html_e( 'Add to Cart', 'charlies-theme' ); ?>
									</button>
								<?php else : ?>
									<a href="<?php the_permalink(); ?>" class="product-card__btn">
										<?php esc_html_e( 'View Product', 'charlies-theme' ); ?>
									</a>
								<?php endif; ?>
							</div>
						<?php endwhile; ?>
					</div>
					<?php wp_reset_postdata(); ?>
				<?php endif; ?>

				<div class="newest-drops__cta text-center">
					<a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>" class="btn btn-outline">
						<?php esc_html_e( 'View All Products', 'charlies-theme' ); ?>
					</a>
				</div>
			<?php else : ?>
				<p class="text-center text-muted"><?php esc_html_e( 'WooCommerce is required to display products.', 'charlies-theme' ); ?></p>
			<?php endif; ?>
		</div>
	</section>

	<!-- Why Choose Section -->
	<section class="section why-choose">
		<div class="container">
			<h2 class="section-title text-center"><?php esc_html_e( 'Why Choose Us', 'charlies-theme' ); ?></h2>

			<div class="benefits-grid">
				<div class="benefit-card">
					<div class="benefit-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
						</svg>
					</div>
					<h3 class="benefit-card__title"><?php esc_html_e( 'Best Prices', 'charlies-theme' ); ?></h3>
					<p class="benefit-card__text"><?php esc_html_e( 'Competitive pricing on all products', 'charlies-theme' ); ?></p>
				</div>

				<div class="benefit-card">
					<div class="benefit-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="1" y="3" width="15" height="13"/>
							<polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
							<circle cx="5.5" cy="18.5" r="2.5"/>
							<circle cx="18.5" cy="18.5" r="2.5"/>
						</svg>
					</div>
					<h3 class="benefit-card__title"><?php esc_html_e( 'Fast Shipping', 'charlies-theme' ); ?></h3>
					<p class="benefit-card__text"><?php esc_html_e( 'Quick delivery to your door', 'charlies-theme' ); ?></p>
				</div>

				<div class="benefit-card">
					<div class="benefit-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<h3 class="benefit-card__title"><?php esc_html_e( 'Secure Payment', 'charlies-theme' ); ?></h3>
					<p class="benefit-card__text"><?php esc_html_e( 'Multiple secure payment options', 'charlies-theme' ); ?></p>
				</div>

				<div class="benefit-card">
					<div class="benefit-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
							<polyline points="9 22 9 12 15 12 15 22"/>
						</svg>
					</div>
					<h3 class="benefit-card__title"><?php esc_html_e( 'Money Back', 'charlies-theme' ); ?></h3>
					<p class="benefit-card__text"><?php esc_html_e( '30-day money back guarantee', 'charlies-theme' ); ?></p>
				</div>
			</div>
		</div>
	</section>

</div>

<?php
get_footer();
