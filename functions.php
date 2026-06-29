<?php
/**
 * Charlie's Theme Functions
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CHARLIES_THEME_VERSION', '1.0.0' );
define( 'CHARLIES_THEME_DIR', get_template_directory() );
define( 'CHARLIES_THEME_URI', get_template_directory_uri() );

/**
 * Theme Setup
 */
function charlies_theme_setup() {
	// Add theme support
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array(
		'search-form',
		'comment-form',
		'comment-list',
		'gallery',
		'caption',
		'style',
		'script',
	) );

	// WooCommerce support
	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	// Register navigation menus
	register_nav_menus( array(
		'primary'   => __( 'Primary Menu', 'charlies-theme' ),
		'footer-1'  => __( 'Footer Column 1', 'charlies-theme' ),
		'footer-2'  => __( 'Footer Column 2', 'charlies-theme' ),
		'footer-3'  => __( 'Footer Column 3', 'charlies-theme' ),
	) );

	// Custom logo support
	add_theme_support( 'custom-logo', array(
		'height'      => 100,
		'width'       => 300,
		'flex-height' => true,
		'flex-width'  => true,
	) );
}
add_action( 'after_setup_theme', 'charlies_theme_setup' );

/**
 * Enqueue Styles and Scripts
 */
function charlies_enqueue_assets() {
	// Google Fonts - Inter
	wp_enqueue_style(
		'charlies-google-fonts',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	// Main stylesheet
	wp_enqueue_style(
		'charlies-main',
		CHARLIES_THEME_URI . '/assets/css/main.css',
		array( 'charlies-google-fonts' ),
		filemtime( CHARLIES_THEME_DIR . '/assets/css/main.css' )
	);

	// Main JavaScript
	wp_enqueue_script(
		'charlies-main',
		CHARLIES_THEME_URI . '/assets/js/main.js',
		array(),
		filemtime( CHARLIES_THEME_DIR . '/assets/js/main.js' ),
		true
	);

	// Localize script for AJAX
	wp_localize_script( 'charlies-main', 'charliesAjax', array(
		'url'   => admin_url( 'admin-ajax.php' ),
		'nonce' => wp_create_nonce( 'charlies_nonce' ),
	) );

	// Cart JS (only if WooCommerce is active)
	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_script(
			'charlies-cart',
			CHARLIES_THEME_URI . '/assets/js/cart.js',
			array( 'charlies-main' ),
			filemtime( CHARLIES_THEME_DIR . '/assets/js/cart.js' ),
			true
		);
	}
}
add_action( 'wp_enqueue_scripts', 'charlies_enqueue_assets' );

/**
 * WooCommerce: Remove default styles and add our own
 */
function charlies_woocommerce_setup() {
	// Remove default WooCommerce styles
	add_filter( 'woocommerce_enqueue_styles', '__return_empty_array' );
}
add_action( 'init', 'charlies_woocommerce_setup' );

/**
 * WooCommerce: When an order qualifies for free shipping, hide the paid rates.
 *
 * The Canada zone carries both the eShipper (paid UPS) method and a Free Shipping
 * method (min order $120). Once the cart crosses the threshold WooCommerce would
 * show both — so we strip everything except the free rate(s) and the customer
 * just sees "Free Shipping". The warehouse still buys a real UPS label via
 * eShipper on the inventory side; the customer simply isn't charged.
 */
function charlies_hide_paid_rates_when_free_available( $rates ) {
	$free = array();
	foreach ( $rates as $rate_id => $rate ) {
		if ( 'free_shipping' === $rate->method_id ) {
			$free[ $rate_id ] = $rate;
		}
	}
	return ! empty( $free ) ? $free : $rates;
}
add_filter( 'woocommerce_package_rates', 'charlies_hide_paid_rates_when_free_available', 100 );

/**
 * WooCommerce: Customer-friendly, speed-first shipping labels.
 *
 * The eShipper plugin emits raw carrier strings like "UPS-Standard (1 day)".
 * Customers pick on speed, not carrier — so we relabel to a benefit-first label
 * with a delivery estimate. The warehouse still ships UPS via eShipper; the
 * carrier name just stays out of the customer's way. When the regional courier
 * (Flashbird) starts contributing rates, give it a "Same-Day" style label here
 * (fill in its method_id once its WooCommerce method is on the zone).
 */
function charlies_friendly_shipping_labels( $rates ) {
	foreach ( $rates as $rate ) {
		switch ( $rate->get_method_id() ) {
			case 'free_shipping':
				$rate->set_label( __( 'Free Shipping', 'charlies-theme' ) );
				break;

			case 'woocommerce_eshipper':
				// Stash the transit estimate from e.g. "UPS-Standard (1 day)" as
				// hidden rate meta (underscore key = kept off the order/email),
				// then set the clean name. The ETA is rendered as a small subline
				// by the full-label filter below. Read the label BEFORE relabeling.
				if ( preg_match( '/\((\d+)\s*day/i', $rate->get_label(), $m ) ) {
					$n = (int) $m[1];
					$rate->add_meta_data(
						'_charlies_eta',
						sprintf(
							/* translators: %d: number of business days */
							_n( 'Arrives in ~%d business day', 'Arrives in ~%d business days', $n, 'charlies-theme' ),
							$n
						)
					);
				}
				$rate->set_label( __( 'Standard Shipping', 'charlies-theme' ) );
				break;

			// case 'flashbird':
			//	$rate->set_label( __( 'Same-Day Delivery', 'charlies-theme' ) );
			//	break;
		}
	}
	return $rates;
}
add_filter( 'woocommerce_package_rates', 'charlies_friendly_shipping_labels', 90 );

/**
 * WooCommerce: render the delivery ETA as a small subline under the rate name.
 *
 * Pairs with the relabeling above — the ETA is stashed in hidden `_charlies_eta`
 * meta (so it never leaks onto the order or confirmation email) and surfaced here
 * as a styled `.ship-rate__eta` element, giving a clean two-line method:
 *   Standard Shipping: $16.28
 *   Arrives in ~1 business day
 */
function charlies_shipping_eta_subline( $label, $method ) {
	$meta = $method->get_meta_data();
	if ( ! empty( $meta['_charlies_eta'] ) ) {
		$label .= '<small class="ship-rate__eta">' . esc_html( $meta['_charlies_eta'] ) . '</small>';
	}
	return $label;
}
add_filter( 'woocommerce_cart_shipping_method_full_label', 'charlies_shipping_eta_subline', 10, 2 );

/**
 * WooCommerce: Label the shipping row "Shipping" (not the plugin's "Shipment").
 * Single-package store, so a plain constant name is fine.
 */
function charlies_shipping_package_name() {
	return __( 'Shipping', 'charlies-theme' );
}
add_filter( 'woocommerce_shipping_package_name', 'charlies_shipping_package_name' );

/**
 * WooCommerce: Customize add to cart fragments for AJAX
 */
function charlies_cart_count_fragment( $fragments ) {
	$fragments['span.charlies-cart-count'] = '<span class="charlies-cart-count">' . WC()->cart->get_cart_contents_count() . '</span>';
	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'charlies_cart_count_fragment' );

/**
 * Helper: Get promo bar text
 */
function charlies_get_promo_text() {
	$default = 'FREE SHIPPING ON ORDERS $50+';
	return esc_html( get_option( 'charlies_promo_text', $default ) );
}

/**
 * Custom image sizes
 */
function charlies_add_image_sizes() {
	add_image_size( 'charlies-product-card', 400, 400, true );
	add_image_size( 'charlies-product-large', 800, 800, true );
}
add_action( 'after_setup_theme', 'charlies_add_image_sizes' );

/**
 * Fallback menu for when no menu is set
 */
function charlies_fallback_menu() {
	if ( class_exists( 'WooCommerce' ) ) {
		echo '<ul class="primary-menu">';
		echo '<li><a href="' . esc_url( wc_get_page_permalink( 'shop' ) ) . '">' . esc_html__( 'Shop', 'charlies-theme' ) . '</a></li>';
		echo '</ul>';
	}
}

/**
 * AJAX Handler: Filter Products
 */
function charlies_filter_products() {
	check_ajax_referer( 'charlies_nonce', 'nonce' );

	$product_type    = isset( $_POST['product_type'] ) ? sanitize_text_field( $_POST['product_type'] ) : '';
	$brand           = isset( $_POST['brand'] ) ? sanitize_text_field( $_POST['brand'] ) : '';
	$brand_taxonomy  = isset( $_POST['brand_taxonomy'] ) ? sanitize_text_field( $_POST['brand_taxonomy'] ) : 'product_cat';

	// Build query args
	$args = array(
		'post_type'      => 'product',
		'post_status'    => 'publish',
		'posts_per_page' => 12,
		'tax_query'      => array(
			'relation' => 'AND',
		),
	);

	// Add product type filter (parent category)
	if ( ! empty( $product_type ) ) {
		$args['tax_query'][] = array(
			'taxonomy' => 'product_cat',
			'field'    => 'slug',
			'terms'    => $product_type,
		);
	}

	// Add brand filter
	if ( ! empty( $brand ) ) {
		$args['tax_query'][] = array(
			'taxonomy' => $brand_taxonomy,
			'field'    => 'slug',
			'terms'    => $brand,
		);
	}

	$products = new WP_Query( $args );

	ob_start();
	?>
	<div class="shop-toolbar">
		<p class="woocommerce-result-count">
			<?php
			printf(
				/* translators: %d: product count */
				_n( 'Showing %d result', 'Showing all %d results', $products->found_posts, 'charlies-theme' ),
				$products->found_posts
			);
			?>
		</p>
	</div>

	<?php if ( $products->have_posts() ) : ?>
		<ul class="products columns-4">
			<?php
			while ( $products->have_posts() ) :
				$products->the_post();
				global $product;
				wc_get_template_part( 'content', 'product' );
			endwhile;
			?>
		</ul>
	<?php else : ?>
		<p class="woocommerce-info"><?php esc_html_e( 'No products found matching your selection.', 'charlies-theme' ); ?></p>
	<?php endif; ?>

	<?php
	wp_reset_postdata();

	$html = ob_get_clean();

	wp_send_json_success( array( 'html' => $html ) );
}
add_action( 'wp_ajax_charlies_filter_products', 'charlies_filter_products' );
add_action( 'wp_ajax_nopriv_charlies_filter_products', 'charlies_filter_products' );
