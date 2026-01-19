<?php
/**
 * Footer Template
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
	</main><!-- #main -->

	<!-- Site Footer -->
	<footer class="site-footer">
		<div class="container">
			<div class="site-footer__grid">
				<!-- Column 1: About / Brand (45%) -->
				<div class="site-footer__col site-footer__col--brand">
					<h4 class="footer-title"><?php bloginfo( 'name' ); ?></h4>
					<p class="footer-tagline"><?php bloginfo( 'description' ); ?></p>
					<?php if ( has_nav_menu( 'footer-1' ) ) : ?>
						<?php
						wp_nav_menu( array(
							'theme_location' => 'footer-1',
							'container'      => false,
							'menu_class'     => 'footer-menu',
							'depth'          => 1,
						) );
						?>
					<?php endif; ?>
				</div>

				<!-- Column 2: Shop Links (20%) -->
				<div class="site-footer__col">
					<h4 class="footer-title"><?php esc_html_e( 'Shop', 'charlies-theme' ); ?></h4>
					<?php if ( has_nav_menu( 'footer-2' ) ) : ?>
						<?php
						wp_nav_menu( array(
							'theme_location' => 'footer-2',
							'container'      => false,
							'menu_class'     => 'footer-menu',
							'depth'          => 1,
						) );
						?>
					<?php else : ?>
						<ul class="footer-menu">
							<?php if ( class_exists( 'WooCommerce' ) ) : ?>
								<li><a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>"><?php esc_html_e( 'All Products', 'charlies-theme' ); ?></a></li>
								<li><a href="<?php echo esc_url( wc_get_cart_url() ); ?>"><?php esc_html_e( 'Cart', 'charlies-theme' ); ?></a></li>
								<li><a href="<?php echo esc_url( wc_get_checkout_url() ); ?>"><?php esc_html_e( 'Checkout', 'charlies-theme' ); ?></a></li>
							<?php endif; ?>
						</ul>
					<?php endif; ?>
				</div>

				<!-- Column 3: Support Links (20%) -->
				<div class="site-footer__col">
					<h4 class="footer-title"><?php esc_html_e( 'Support', 'charlies-theme' ); ?></h4>
					<?php if ( has_nav_menu( 'footer-3' ) ) : ?>
						<?php
						wp_nav_menu( array(
							'theme_location' => 'footer-3',
							'container'      => false,
							'menu_class'     => 'footer-menu',
							'depth'          => 1,
						) );
						?>
					<?php else : ?>
						<ul class="footer-menu">
							<li><a href="<?php echo esc_url( home_url( '/contact' ) ); ?>"><?php esc_html_e( 'Contact Us', 'charlies-theme' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/faq' ) ); ?>"><?php esc_html_e( 'FAQ', 'charlies-theme' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/shipping' ) ); ?>"><?php esc_html_e( 'Shipping', 'charlies-theme' ); ?></a></li>
						</ul>
					<?php endif; ?>
				</div>

				<!-- Column 4: Legal (20%) -->
				<div class="site-footer__col">
					<h4 class="footer-title"><?php esc_html_e( 'Legal', 'charlies-theme' ); ?></h4>
					<ul class="footer-menu">
						<li><a href="<?php echo esc_url( get_privacy_policy_url() ); ?>"><?php esc_html_e( 'Privacy Policy', 'charlies-theme' ); ?></a></li>
						<li><a href="<?php echo esc_url( home_url( '/terms' ) ); ?>"><?php esc_html_e( 'Terms of Service', 'charlies-theme' ); ?></a></li>
						<li><a href="<?php echo esc_url( home_url( '/refund-policy' ) ); ?>"><?php esc_html_e( 'Refund Policy', 'charlies-theme' ); ?></a></li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Copyright Bar -->
		<div class="site-footer__copyright">
			<div class="container">
				<p>&copy; <?php echo esc_html( date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'charlies-theme' ); ?></p>
			</div>
		</div>
	</footer>

</div><!-- .site-wrapper -->

<!-- Back to Top Button -->
<button class="back-to-top" aria-label="<?php esc_attr_e( 'Back to top', 'charlies-theme' ); ?>">
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M18 15l-6-6-6 6"/>
	</svg>
</button>

<?php wp_footer(); ?>
</body>
</html>
