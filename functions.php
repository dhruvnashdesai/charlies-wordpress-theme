<?php
/**
 * Charlie's Store Finder Theme Functions
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Include Charlie's Store functionality
require_once get_template_directory() . '/charlie-stores/includes/class-store-manager.php';
require_once get_template_directory() . '/charlie-stores/includes/class-rest-api.php';
require_once get_template_directory() . '/charlie-stores/includes/class-admin.php';
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
 * Initialize Charlie's Store functionality
 */
function charlie_stores_init() {
    error_log('Charlie Stores: Initializing store functionality');

    try {
        new Charlie_Store_Manager();
        error_log('Charlie Stores: Store Manager initialized');

        new Charlie_REST_API();
        error_log('Charlie Stores: REST API initialized');

        new Charlie_Admin();
        error_log('Charlie Stores: Admin initialized');

        new Charlie_WooCommerce_Integration();
        error_log('Charlie Stores: WooCommerce integration initialized');

    } catch (Exception $e) {
        error_log('Charlie Stores: Initialization error: ' . $e->getMessage());
    }
}
add_action('init', 'charlie_stores_init');

/**
 * Flush rewrite rules on theme activation
 */
function charlie_stores_activation() {
    // Register post types first
    charlie_stores_init();

    // Flush rewrite rules
    flush_rewrite_rules();

    error_log('Charlie Stores: Rewrite rules flushed');
}
add_action('after_switch_theme', 'charlie_stores_activation');

/**
 * Enqueue theme styles and scripts
 */
function charlies_enqueue_assets() {
    // Theme stylesheet
    wp_enqueue_style('charlies-style', get_stylesheet_uri(), array(), '1.0.0');

    // Theme JavaScript (if needed)
    wp_enqueue_script('charlies-theme-js', get_template_directory_uri() . '/js/theme.js', array('jquery'), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'charlies_enqueue_assets');

/**
 * Enqueue Charlie's Store scripts and styles
 */
function charlie_enqueue_store_assets() {
    // Only load on store-related pages or homepage (if it's the store finder)
    if (!is_page_template('page-store-finder.php') && !is_singular('charlie_store') && !is_front_page()) {
        return;
    }

    // Mapbox GL JS
    wp_enqueue_script(
        'mapbox-gl',
        'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js',
        array(),
        '3.0.1',
        true
    );

    wp_enqueue_style(
        'mapbox-gl',
        'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css',
        array(),
        '3.0.1'
    );

    // Charlie's Store styles
    wp_enqueue_style(
        'charlie-styles',
        get_template_directory_uri() . '/charlie-stores/css/styles.css',
        array(),
        '1.0.6'
    );

    wp_enqueue_style(
        'charlie-modal',
        get_template_directory_uri() . '/charlie-stores/css/modal.css',
        array('charlie-styles'),
        '1.0.6'
    );

    wp_enqueue_style(
        'charlie-map',
        get_template_directory_uri() . '/charlie-stores/css/map.css',
        array('mapbox-gl'),
        '1.0.6'
    );

    // WooCommerce integration styles
    if (class_exists('WooCommerce')) {
        wp_enqueue_style(
            'charlie-woocommerce',
            get_template_directory_uri() . '/charlie-stores/css/woocommerce.css',
            array('charlie-styles'),
            '1.0.0'
        );
    }

    // Charlie's Store scripts
    wp_enqueue_script(
        'charlie-config',
        get_template_directory_uri() . '/charlie-stores/js/config.js',
        array(),
        '1.0.0',
        true
    );

    wp_enqueue_script(
        'charlie-age-verification',
        get_template_directory_uri() . '/charlie-stores/js/ageVerification.js',
        array('charlie-config'),
        '1.0.6',
        true
    );

    wp_enqueue_script(
        'charlie-geocoding',
        get_template_directory_uri() . '/charlie-stores/js/geocoding.js',
        array('charlie-config'),
        '1.0.6',
        true
    );

    wp_enqueue_script(
        'charlie-map',
        get_template_directory_uri() . '/charlie-stores/js/mapManager.js',
        array('mapbox-gl', 'charlie-config'),
        '1.0.6',
        true
    );

    wp_enqueue_script(
        'charlie-stores',
        get_template_directory_uri() . '/charlie-stores/js/storeManager.js',
        array('charlie-config'),
        '1.0.0',
        true
    );

    wp_enqueue_script(
        'charlie-category-circles',
        get_template_directory_uri() . '/charlie-stores/js/categoryCircles.js',
        array('charlie-config'),
        '1.0.0',
        true
    );

    wp_enqueue_script(
        'charlie-product-menu',
        get_template_directory_uri() . '/charlie-stores/js/productMenu.js',
        array('charlie-config'),
        '1.0.0',
        true
    );

    wp_enqueue_script(
        'charlie-app',
        get_template_directory_uri() . '/charlie-stores/js/app.js',
        array(
            'charlie-config',
            'charlie-age-verification',
            'charlie-geocoding',
            'charlie-map',
            'charlie-stores',
            'charlie-category-circles',
            'charlie-product-menu'
        ),
        '1.0.0',
        true
    );

    // Localize script with WordPress configuration
    wp_localize_script('charlie-config', 'charlie_config', array(
        'MAPBOX' => array(
            'ACCESS_TOKEN' => get_option('charlie_mapbox_token', ''),
            'STYLE_URL' => 'mapbox://styles/mapbox/dark-v11',
            'MAX_BOUNDS' => array(array(-141.0, 41.7), array(-52.6, 83.1)),
            'DEFAULT_CENTER' => array(0, 20),
            'DEFAULT_ZOOM' => 1.5,
            'TARGET_ZOOM' => 12
        ),
        'APP' => array(
            'MINIMUM_AGE' => get_option('charlie_minimum_age', 19),
            'SESSION_DURATION' => 24 * 60 * 60 * 1000,
            'SEARCH_RADIUS_KM' => get_option('charlie_search_radius', 50),
            'MAX_STORE_RESULTS' => 10,
            'WAREHOUSE_STORE_ID' => get_option('charlie_warehouse_store_id', 1)
        ),
        'UI' => array(
            'ENABLE_CROSSHAIR' => get_option('charlie_enable_crosshair', true),
            'ENABLE_VIGNETTE' => get_option('charlie_enable_vignette', true),
            'VIGNETTE_RADIUS_KM' => get_option('charlie_vignette_radius', 10),
            'CUSTOM_LOCATION_ICON' => get_template_directory_uri() . '/charlie-stores/assets/images/gtamap_icon.png',
            'WAREHOUSE_ICON' => get_template_directory_uri() . '/charlie-stores/assets/images/ass_1.png'
        ),
        'ENDPOINTS' => array(
            'STORES' => rest_url('charlie-stores/v1/stores'),
            'NEARBY' => rest_url('charlie-stores/v1/stores/nearby'),
            'GEOCODE' => rest_url('charlie-stores/v1/geocode'),
            'STORE_PRODUCTS' => admin_url('admin-ajax.php?action=get_store_products'),
            'STORE_CATEGORIES' => admin_url('admin-ajax.php?action=get_store_categories'),
        ),
        'STORAGE_KEYS' => array(
            'AGE_VERIFIED' => 'charlie_age_verified',
            'LAST_SEARCH' => 'charlie_last_search',
            'USER_LOCATION' => 'charlie_user_location'
        ),
        'MESSAGES' => array(
            'AGE_VERIFICATION_FAILED' => __('You must be 19 or older to access this site.', 'charlies-stores'),
            'INVALID_POSTAL_CODE' => __('Please enter a valid Canadian postal code (e.g., M5V 3A8).', 'charlies-stores'),
            'GEOCODING_FAILED' => __('Unable to find that postal code. Please check and try again.', 'charlies-stores'),
            'MAP_LOAD_ERROR' => __('Unable to load map. Please refresh the page and try again.', 'charlies-stores'),
            'NO_STORES_FOUND' => __('No stores found within 50km of your location.', 'charlies-stores'),
        ),
        'WOOCOMMERCE' => array(
            'SHOP_URL' => class_exists('WooCommerce') ? wc_get_page_permalink('shop') : '',
            'CART_URL' => class_exists('WooCommerce') ? wc_get_cart_url() : '',
            'CHECKOUT_URL' => class_exists('WooCommerce') ? wc_get_checkout_url() : '',
            'IS_ACTIVE' => class_exists('WooCommerce')
        ),
        'nonce' => wp_create_nonce('charlie_nonce'),
        'ajax_url' => admin_url('admin-ajax.php'),
    ));
}
add_action('wp_enqueue_scripts', 'charlie_enqueue_store_assets');

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
 * Add page meta box for store finder options
 */
function charlie_add_page_meta_boxes() {
    add_meta_box(
        'charlie-page-options',
        __('Store Finder Options', 'charlies-stores'),
        'charlie_page_options_callback',
        'page',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'charlie_add_page_meta_boxes');

function charlie_page_options_callback($post) {
    wp_nonce_field('charlie_page_meta', 'charlie_page_nonce');
    $full_screen = get_post_meta($post->ID, '_charlie_full_screen', true);
    ?>
    <label>
        <input type="checkbox" name="charlie_full_screen" value="yes" <?php checked($full_screen, 'yes'); ?> />
        <?php _e('Enable full-screen mode (removes header/footer)', 'charlies-stores'); ?>
    </label>
    <?php
}

function charlie_save_page_meta($post_id) {
    if (!isset($_POST['charlie_page_nonce']) || !wp_verify_nonce($_POST['charlie_page_nonce'], 'charlie_page_meta')) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $full_screen = isset($_POST['charlie_full_screen']) ? 'yes' : 'no';
    update_post_meta($post_id, '_charlie_full_screen', $full_screen);
}
add_action('save_post', 'charlie_save_page_meta');