<?php
/**
 * Header Template
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="site-wrapper">
	<!-- Promo Bar -->
	<div class="promo-bar">
		<div class="container">
			<p class="promo-bar__text"><?php echo charlies_get_promo_text(); ?></p>
		</div>
	</div>

	<!-- Site Header -->
	<header class="site-header">
		<div class="container">
			<div class="site-header__inner">
				<!-- Logo -->
				<div class="site-header__logo">
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-logo">
						<img src="<?php echo esc_url( CHARLIES_THEME_URI . '/assets/images/charlies_logo.png' ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" class="site-logo__image">
					</a>
				</div>

				<!-- Primary Navigation -->
				<nav class="site-header__nav hide-mobile" aria-label="<?php esc_attr_e( 'Primary Navigation', 'charlies-theme' ); ?>">
					<?php
					wp_nav_menu( array(
						'theme_location' => 'primary',
						'container'      => false,
						'menu_class'     => 'primary-menu',
						'fallback_cb'    => 'charlies_fallback_menu',
						'depth'          => 1,
					) );
					?>
				</nav>

				<!-- Header Actions -->
				<div class="site-header__actions">
					<!-- Search Toggle -->
					<button class="header-icon search-toggle" aria-label="<?php esc_attr_e( 'Search', 'charlies-theme' ); ?>">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"/>
							<path d="M21 21l-4.35-4.35"/>
						</svg>
					</button>

					<!-- Account Link -->
					<a href="<?php echo esc_url( get_permalink( get_option( 'woocommerce_myaccount_page_id' ) ) ); ?>" class="header-icon account-link hide-mobile" aria-label="<?php esc_attr_e( 'My Account', 'charlies-theme' ); ?>">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
							<circle cx="12" cy="7" r="4"/>
						</svg>
					</a>

					<!-- Cart -->
					<?php if ( class_exists( 'WooCommerce' ) ) : ?>
						<a href="<?php echo esc_url( wc_get_cart_url() ); ?>" class="header-cart" aria-label="<?php esc_attr_e( 'Shopping Cart', 'charlies-theme' ); ?>">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
								<line x1="3" y1="6" x2="21" y2="6"/>
								<path d="M16 10a4 4 0 0 1-8 0"/>
							</svg>
							<span class="charlies-cart-count"><?php echo WC()->cart->get_cart_contents_count(); ?></span>
						</a>
					<?php endif; ?>

					<!-- Mobile Menu Toggle -->
					<button class="mobile-menu-toggle hide-desktop" aria-label="<?php esc_attr_e( 'Menu', 'charlies-theme' ); ?>" aria-expanded="false">
						<span class="hamburger">
							<span></span>
							<span></span>
							<span></span>
						</span>
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Mobile Menu -->
	<nav class="mobile-menu" aria-label="<?php esc_attr_e( 'Mobile Navigation', 'charlies-theme' ); ?>">
		<div class="mobile-menu__inner">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'mobile-menu__list',
				'fallback_cb'    => 'charlies_fallback_menu',
				'depth'          => 1,
			) );
			?>
			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<a href="<?php echo esc_url( get_permalink( get_option( 'woocommerce_myaccount_page_id' ) ) ); ?>" class="mobile-menu__link">
					<?php esc_html_e( 'My Account', 'charlies-theme' ); ?>
				</a>
			<?php endif; ?>
		</div>
	</nav>

	<main id="main" class="site-main">
