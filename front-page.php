<?php
/**
 * Front Page Template
 * Structure matches dipski.co landing page
 *
 * @package CharliesTheme
 */

get_header();
?>

<div class="homepage">

	<!-- Section 1: Hero Banner -->
	<section class="hero-banner">
		<div class="container">
			<div class="hero-banner__content">
				<h1 class="hero-banner__title"><?php echo esc_html( get_option( 'charlies_hero_title', '$10 A TIN. LIMITED TIME.' ) ); ?></h1>
				<p class="hero-banner__subtitle"><?php echo esc_html( get_option( 'charlies_hero_subtitle', 'Premium nicotine pouches at unbeatable prices.' ) ); ?></p>

				<?php get_template_part( 'template-parts/trust-badges' ); ?>

				<?php if ( class_exists( 'WooCommerce' ) ) : ?>
					<a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>" class="btn btn-primary btn-lg hero-banner__cta">
						<?php esc_html_e( 'Shop Now', 'charlies-theme' ); ?>
					</a>
				<?php endif; ?>
			</div>
		</div>
	</section>

	<!-- Section 2: Brand Marquee -->
	<?php get_template_part( 'template-parts/brand-marquee' ); ?>

	<!-- Section 3: Newest Drops -->
	<section class="section product-section">
		<div class="container">
			<h2 class="section-title text-center"><?php esc_html_e( 'Newest Drops', 'charlies-theme' ); ?></h2>

			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<?php
				$newest_args = array(
					'post_type'      => 'product',
					'posts_per_page' => 6,
					'orderby'        => 'date',
					'order'          => 'DESC',
				);
				$newest_products = new WP_Query( $newest_args );
				?>

				<?php if ( $newest_products->have_posts() ) : ?>
					<div class="product-grid">
						<?php while ( $newest_products->have_posts() ) : $newest_products->the_post(); ?>
							<?php wc_get_template_part( 'content', 'product' ); ?>
						<?php endwhile; ?>
					</div>
					<?php wp_reset_postdata(); ?>
				<?php endif; ?>
			<?php endif; ?>
		</div>
	</section>

	<!-- Section 4: Why Choose Us -->
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
					<h3 class="benefit-card__title"><?php esc_html_e( 'Power Play Pricing', 'charlies-theme' ); ?></h3>
					<p class="benefit-card__text"><?php esc_html_e( 'Best prices on premium pouches', 'charlies-theme' ); ?></p>
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
							<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
							<line x1="1" y1="10" x2="23" y2="10"/>
						</svg>
					</div>
					<h3 class="benefit-card__title"><?php esc_html_e( 'Convenient Payment', 'charlies-theme' ); ?></h3>
					<p class="benefit-card__text"><?php esc_html_e( 'Credit card & e-transfer accepted', 'charlies-theme' ); ?></p>
				</div>

				<div class="benefit-card">
					<div class="benefit-card__icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
							<polyline points="9 12 11 14 15 10"/>
						</svg>
					</div>
					<h3 class="benefit-card__title"><?php esc_html_e( 'Money Back Guarantee', 'charlies-theme' ); ?></h3>
					<p class="benefit-card__text"><?php esc_html_e( '30-day no questions asked', 'charlies-theme' ); ?></p>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 5: Best Sellers -->
	<section class="section product-section product-section--alt">
		<div class="container">
			<h2 class="section-title text-center"><?php esc_html_e( 'Best Sellers', 'charlies-theme' ); ?></h2>

			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<?php
				$best_args = array(
					'post_type'      => 'product',
					'posts_per_page' => 6,
					'meta_key'       => 'total_sales',
					'orderby'        => 'meta_value_num',
					'order'          => 'DESC',
				);
				$best_products = new WP_Query( $best_args );
				?>

				<?php if ( $best_products->have_posts() ) : ?>
					<div class="product-grid">
						<?php while ( $best_products->have_posts() ) : $best_products->the_post(); ?>
							<?php wc_get_template_part( 'content', 'product' ); ?>
						<?php endwhile; ?>
					</div>
					<?php wp_reset_postdata(); ?>
				<?php endif; ?>
			<?php endif; ?>
		</div>
	</section>

	<!-- Section 6: Educational / 101 Section -->
	<section class="section info-section">
		<div class="container">
			<div class="info-section__content">
				<h2 class="info-section__title"><?php esc_html_e( 'Nicotine Pouch 101', 'charlies-theme' ); ?></h2>

				<div class="info-block">
					<h3><?php esc_html_e( 'How do nicotine pouches work?', 'charlies-theme' ); ?></h3>
					<p><?php esc_html_e( 'Nicotine pouches are small, discreet pouches that you place between your gum and lip. The nicotine is absorbed through your gum tissue, providing a smoke-free, spit-free experience. Each pouch lasts about 30-60 minutes.', 'charlies-theme' ); ?></p>
				</div>

				<div class="info-block">
					<h3><?php esc_html_e( 'Are they safer than traditional tobacco?', 'charlies-theme' ); ?></h3>
					<p><?php esc_html_e( 'Nicotine pouches contain no tobacco leaf, which means no combustion and no smoke. While nicotine itself is addictive, pouches eliminate many of the harmful chemicals found in cigarettes and traditional chewing tobacco.', 'charlies-theme' ); ?></p>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 7: FAQ Accordion -->
	<section class="section faq-section">
		<div class="container">
			<h2 class="section-title text-center"><?php esc_html_e( 'Frequently Asked Questions', 'charlies-theme' ); ?></h2>

			<div class="faq-accordion">
				<div class="faq-item">
					<button class="faq-item__question" aria-expanded="false">
						<span><?php esc_html_e( 'What are nicotine pouches?', 'charlies-theme' ); ?></span>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M6 9l6 6 6-6"/>
						</svg>
					</button>
					<div class="faq-item__answer">
						<p><?php esc_html_e( 'Nicotine pouches are tobacco-free products that deliver nicotine without smoke, vapor, or spit. They come in various flavors and strengths to suit your preferences.', 'charlies-theme' ); ?></p>
					</div>
				</div>

				<div class="faq-item">
					<button class="faq-item__question" aria-expanded="false">
						<span><?php esc_html_e( 'How long does shipping take?', 'charlies-theme' ); ?></span>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M6 9l6 6 6-6"/>
						</svg>
					</button>
					<div class="faq-item__answer">
						<p><?php esc_html_e( 'We ship orders within 1-2 business days. Delivery typically takes 3-5 business days depending on your location. Express shipping options are available at checkout.', 'charlies-theme' ); ?></p>
					</div>
				</div>

				<div class="faq-item">
					<button class="faq-item__question" aria-expanded="false">
						<span><?php esc_html_e( 'What is your return policy?', 'charlies-theme' ); ?></span>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M6 9l6 6 6-6"/>
						</svg>
					</button>
					<div class="faq-item__answer">
						<p><?php esc_html_e( 'We offer a 30-day money-back guarantee. If you are not satisfied with your purchase, contact us for a full refund, no questions asked.', 'charlies-theme' ); ?></p>
					</div>
				</div>

				<div class="faq-item">
					<button class="faq-item__question" aria-expanded="false">
						<span><?php esc_html_e( 'What payment methods do you accept?', 'charlies-theme' ); ?></span>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M6 9l6 6 6-6"/>
						</svg>
					</button>
					<div class="faq-item__answer">
						<p><?php esc_html_e( 'We accept all major credit cards (Visa, Mastercard, American Express) as well as e-transfer for Canadian customers.', 'charlies-theme' ); ?></p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 8: CTA Banner -->
	<section class="cta-banner">
		<div class="container">
			<div class="cta-banner__content">
				<h2 class="cta-banner__title"><?php esc_html_e( 'Ready to try?', 'charlies-theme' ); ?></h2>
				<?php if ( class_exists( 'WooCommerce' ) ) : ?>
					<a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>" class="btn btn-primary btn-lg">
						<?php esc_html_e( 'Shop All Products', 'charlies-theme' ); ?>
					</a>
				<?php endif; ?>
			</div>
		</div>
	</section>

	<!-- Section 9: Newsletter Signup -->
	<section class="section newsletter-section">
		<div class="container">
			<div class="newsletter-section__content">
				<h2 class="newsletter-section__title"><?php esc_html_e( 'Join the Club', 'charlies-theme' ); ?></h2>
				<p class="newsletter-section__text"><?php esc_html_e( 'Subscribe for exclusive deals, new product drops, and more.', 'charlies-theme' ); ?></p>

				<form class="newsletter-form" action="#" method="post">
					<div class="newsletter-form__field">
						<input type="email" name="email" placeholder="<?php esc_attr_e( 'Enter your email', 'charlies-theme' ); ?>" required>
						<button type="submit" class="btn btn-primary"><?php esc_html_e( 'Subscribe', 'charlies-theme' ); ?></button>
					</div>
				</form>
			</div>
		</div>
	</section>

</div>

<?php
get_footer();
