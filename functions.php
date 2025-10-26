<?php
/**
 * Charlie's Store Finder Theme Functions
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Include WooCommerce integration only
require_once get_template_directory() . '/charlie-stores/includes/class-woocommerce-integration.php';

/**
 * Theme setup
 */
function charlies_theme_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption'));
    add_theme_support('custom-logo');

    // Add support for store posts
    add_theme_support('post-thumbnails', array('charlie_store'));

    // Register nav menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'charlies-stores'),
        'footer' => __('Footer Menu', 'charlies-stores'),
    ));
}
add_action('after_setup_theme', 'charlies_theme_setup');

/**
 * Initialize WooCommerce integration
 */
function charlie_woocommerce_init() {
    if (class_exists('WooCommerce')) {
        new Charlie_WooCommerce_Integration();
    }
}
add_action('init', 'charlie_woocommerce_init');

/**
 * Theme activation
 */
function charlies_theme_activation() {
    // Flush rewrite rules
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'charlies_theme_activation');

/**
 * Enqueue theme styles and scripts
 */
function charlies_enqueue_assets() {
    // Theme stylesheet
    wp_enqueue_style('charlies-style', get_stylesheet_uri(), array(), '1.0.0');

    // Theme JavaScript (if needed) - commented out since file doesn't exist
    // wp_enqueue_script('charlies-theme-js', get_template_directory_uri() . '/js/theme.js', array('jquery'), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'charlies_enqueue_assets');

/**
 * Enqueue simple ecommerce assets
 */
function charlies_enqueue_ecommerce_assets() {
    // Simple age verification for nicotine products
    wp_enqueue_script(
        'charlies-age-verification',
        get_template_directory_uri() . '/assets/js/age-verification.js',
        array('jquery'),
        '1.0.0',
        true
    );

    // WooCommerce integration (cart functionality)
    if (class_exists('WooCommerce')) {
        wp_enqueue_script(
            'charlies-cart',
            get_template_directory_uri() . '/assets/js/cart.js',
            array('jquery'),
            '1.0.0',
            true
        );

        wp_enqueue_style(
            'charlies-woocommerce',
            get_template_directory_uri() . '/assets/css/woocommerce.css',
            array('charlies-style'),
            '1.0.0'
        );
    }

    // Ecommerce styles
    wp_enqueue_style(
        'charlies-ecommerce',
        get_template_directory_uri() . '/assets/css/ecommerce.css',
        array('charlies-style'),
        '1.0.0'
    );

    // Landing page styles
    wp_enqueue_style(
        'charlies-landing',
        get_template_directory_uri() . '/assets/css/landing.css',
        array('charlies-style'),
        '1.0.0'
    );

    // Pass configuration to JavaScript
    wp_localize_script('charlies-age-verification', 'charlies_config', array(
        'minimum_age' => get_option('charlies_minimum_age', 19),
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('charlies_nonce'),
        'woocommerce' => array(
            'shop_url' => class_exists('WooCommerce') ? wc_get_page_permalink('shop') : '',
            'cart_url' => class_exists('WooCommerce') ? wc_get_cart_url() : '',
            'checkout_url' => class_exists('WooCommerce') ? wc_get_checkout_url() : '',
            'is_active' => class_exists('WooCommerce')
        )
    ));
}
add_action('wp_enqueue_scripts', 'charlies_enqueue_ecommerce_assets');

/**
 * Register widget areas
 */
function charlies_widgets_init() {
    register_sidebar(array(
        'name' => __('Sidebar', 'charlies-stores'),
        'id' => 'sidebar-1',
        'description' => __('Add widgets here to appear in your sidebar.', 'charlies-stores'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget' => '</section>',
        'before_title' => '<h2 class="widget-title">',
        'after_title' => '</h2>',
    ));
}
add_action('widgets_init', 'charlies_widgets_init');

/**
 * Custom excerpt length
 */
function charlies_excerpt_length($length) {
    return 20;
}
add_filter('excerpt_length', 'charlies_excerpt_length');

/**
 * Custom excerpt more
 */
function charlies_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'charlies_excerpt_more');

/**
 * Add WooCommerce support
 */
function charlies_add_woocommerce_support() {
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}
add_action('after_setup_theme', 'charlies_add_woocommerce_support');

