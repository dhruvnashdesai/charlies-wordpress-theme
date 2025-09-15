<?php
/**
 * WooCommerce Integration Class
 * Handles linking stores to WooCommerce products
 */
class Charlie_WooCommerce_Integration {

    public function __construct() {
        // Only initialize if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            return;
        }

        add_action('init', array($this, 'init'));
        add_action('wp_ajax_get_store_products', array($this, 'get_store_products'));
        add_action('wp_ajax_nopriv_get_store_products', array($this, 'get_store_products'));

        // Add store location field to products
        add_action('woocommerce_product_options_general_product_data', array($this, 'add_store_location_field'));
        add_action('woocommerce_process_product_meta', array($this, 'save_store_location_field'));

        // Filter shop page by store location
        add_action('pre_get_posts', array($this, 'filter_shop_by_store'));
    }

    /**
     * Initialize WooCommerce integration
     */
    public function init() {
        // Add custom product fields
        $this->add_product_meta_fields();
    }

    /**
     * Add store location field to product admin
     */
    public function add_store_location_field() {
        global $post;

        echo '<div class="options_group">';

        // Get all stores for dropdown
        $stores = get_posts(array(
            'post_type' => 'charlie_store',
            'posts_per_page' => -1,
            'post_status' => 'publish'
        ));

        $store_options = array('' => __('Select a store', 'charlies-stores'));
        foreach ($stores as $store) {
            $store_options[$store->ID] = $store->post_title;
        }

        woocommerce_wp_select(array(
            'id' => '_charlie_store_location',
            'label' => __('Available at Store', 'charlies-stores'),
            'description' => __('Select which store this product is available at.', 'charlies-stores'),
            'desc_tip' => true,
            'options' => $store_options
        ));

        woocommerce_wp_text_field(array(
            'id' => '_charlie_store_stock',
            'label' => __('Store Stock Quantity', 'charlies-stores'),
            'description' => __('Stock quantity at this specific store.', 'charlies-stores'),
            'desc_tip' => true,
            'type' => 'number',
            'custom_attributes' => array(
                'step' => '1',
                'min' => '0'
            )
        ));

        echo '</div>';
    }

    /**
     * Save store location field
     */
    public function save_store_location_field($post_id) {
        $store_location = isset($_POST['_charlie_store_location']) ? sanitize_text_field($_POST['_charlie_store_location']) : '';
        $store_stock = isset($_POST['_charlie_store_stock']) ? absint($_POST['_charlie_store_stock']) : '';

        update_post_meta($post_id, '_charlie_store_location', $store_location);
        update_post_meta($post_id, '_charlie_store_stock', $store_stock);
    }

    /**
     * Filter shop page by store location
     */
    public function filter_shop_by_store($query) {
        if (!is_admin() && $query->is_main_query()) {
            if (is_shop() && isset($_GET['store_location'])) {
                $store_id = absint($_GET['store_location']);
                if ($store_id) {
                    $meta_query = $query->get('meta_query', array());
                    $meta_query[] = array(
                        'key' => '_charlie_store_location',
                        'value' => $store_id,
                        'compare' => '='
                    );
                    $query->set('meta_query', $meta_query);
                }
            }
        }
    }

    /**
     * Get products for a specific store via AJAX
     */
    public function get_store_products() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $store_id = absint($_POST['store_id']);
        if (!$store_id) {
            wp_send_json_error('Invalid store ID');
        }

        // Get products for this store
        $products = $this->get_products_by_store($store_id);

        wp_send_json_success(array(
            'products' => $products,
            'store_id' => $store_id,
            'shop_url' => $this->get_store_shop_url($store_id)
        ));
    }

    /**
     * Get products available at a specific store
     */
    public function get_products_by_store($store_id, $limit = 12) {
        $args = array(
            'post_type' => 'product',
            'posts_per_page' => $limit,
            'post_status' => 'publish',
            'meta_query' => array(
                array(
                    'key' => '_charlie_store_location',
                    'value' => $store_id,
                    'compare' => '='
                )
            )
        );

        $products = get_posts($args);
        $formatted_products = array();

        foreach ($products as $product) {
            $wc_product = wc_get_product($product->ID);
            if (!$wc_product) continue;

            $formatted_products[] = array(
                'id' => $product->ID,
                'name' => $product->post_title,
                'description' => wp_trim_words($product->post_excerpt, 20),
                'price' => $wc_product->get_price_html(),
                'image' => get_the_post_thumbnail_url($product->ID, 'medium'),
                'url' => get_permalink($product->ID),
                'add_to_cart_url' => $wc_product->add_to_cart_url(),
                'in_stock' => $wc_product->is_in_stock(),
                'store_stock' => get_post_meta($product->ID, '_charlie_store_stock', true),
                'categories' => wp_get_post_terms($product->ID, 'product_cat', array('fields' => 'names'))
            );
        }

        return $formatted_products;
    }

    /**
     * Get shop URL filtered by store
     */
    public function get_store_shop_url($store_id) {
        $shop_url = wc_get_page_permalink('shop');
        return add_query_arg('store_location', $store_id, $shop_url);
    }

    /**
     * Get store name by ID
     */
    public function get_store_name($store_id) {
        $store = get_post($store_id);
        return $store ? $store->post_title : '';
    }

    /**
     * Add product meta fields for store-specific data
     */
    private function add_product_meta_fields() {
        // Additional meta fields can be added here
    }

    /**
     * Check if WooCommerce is active
     */
    public static function is_woocommerce_active() {
        return class_exists('WooCommerce');
    }

    /**
     * Get cart URL
     */
    public function get_cart_url() {
        return wc_get_cart_url();
    }

    /**
     * Get checkout URL
     */
    public function get_checkout_url() {
        return wc_get_checkout_url();
    }
}