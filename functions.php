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
		CHARLIES_THEME_VERSION
	);

	// Main JavaScript
	wp_enqueue_script(
		'charlies-main',
		CHARLIES_THEME_URI . '/assets/js/main.js',
		array(),
		CHARLIES_THEME_VERSION,
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
			CHARLIES_THEME_VERSION,
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
