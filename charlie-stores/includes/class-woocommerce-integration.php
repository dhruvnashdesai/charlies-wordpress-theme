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
        add_action('wp_ajax_get_store_categories', array($this, 'get_store_categories'));
        add_action('wp_ajax_nopriv_get_store_categories', array($this, 'get_store_categories'));
        add_action('wp_ajax_get_store_products_by_category', array($this, 'get_store_products_by_category'));
        add_action('wp_ajax_nopriv_get_store_products_by_category', array($this, 'get_store_products_by_category'));
        add_action('wp_ajax_get_store_brands_by_category', array($this, 'get_store_brands_by_category'));
        add_action('wp_ajax_nopriv_get_store_brands_by_category', array($this, 'get_store_brands_by_category'));
        add_action('wp_ajax_get_store_products_by_brand', array($this, 'get_store_products_by_brand'));
        add_action('wp_ajax_nopriv_get_store_products_by_brand', array($this, 'get_store_products_by_brand'));

        // Add WooCommerce cart integration AJAX handlers
        add_action('wp_ajax_charlie_add_to_cart', array($this, 'ajax_add_to_cart'));
        add_action('wp_ajax_nopriv_charlie_add_to_cart', array($this, 'ajax_add_to_cart'));
        add_action('wp_ajax_charlie_get_cart', array($this, 'ajax_get_cart'));
        add_action('wp_ajax_nopriv_charlie_get_cart', array($this, 'ajax_get_cart'));
        add_action('wp_ajax_charlie_update_cart', array($this, 'ajax_update_cart'));
        add_action('wp_ajax_nopriv_charlie_update_cart', array($this, 'ajax_update_cart'));
        add_action('wp_ajax_charlie_remove_from_cart', array($this, 'ajax_remove_from_cart'));
        add_action('wp_ajax_nopriv_charlie_remove_from_cart', array($this, 'ajax_remove_from_cart'));

        // Add store location field to products (only in admin)
        if (is_admin()) {
            add_action('woocommerce_product_options_general_product_data', array($this, 'add_store_location_field'));
            add_action('woocommerce_process_product_meta', array($this, 'save_store_location_field'));

            // Add category color field
            add_action('product_cat_add_form_fields', array($this, 'add_category_color_field'));
            add_action('product_cat_edit_form_fields', array($this, 'edit_category_color_field'));
            add_action('edited_product_cat', array($this, 'save_category_color_field'));
            add_action('create_product_cat', array($this, 'save_category_color_field'));
        }

        // Filter shop page by store location (frontend only)
        if (!is_admin()) {
            add_action('pre_get_posts', array($this, 'filter_shop_by_store'));
        }
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

        // Ensure WooCommerce admin functions are loaded
        if (!function_exists('woocommerce_wp_select') || !function_exists('woocommerce_wp_text_field')) {
            // Include WooCommerce admin functions if not available
            if (file_exists(WC()->plugin_path() . '/includes/admin/wc-meta-box-functions.php')) {
                include_once WC()->plugin_path() . '/includes/admin/wc-meta-box-functions.php';
            }

            // If still not available, fall back to manual HTML
            if (!function_exists('woocommerce_wp_select')) {
                $this->add_store_location_field_fallback();
                return;
            }
        }

        echo '<div class="options_group">';

        // Get all stores for dropdown
        $stores = get_posts(array(
            'post_type' => 'charlie_store',
            'posts_per_page' => -1,
            'post_status' => 'publish'
        ));

        // Debug: Log store count for troubleshooting
        error_log('Charlie Stores Debug: Found ' . count($stores) . ' stores');
        foreach ($stores as $store) {
            error_log('Store: ID=' . $store->ID . ', Title=' . $store->post_title);
        }

        $store_options = array('' => __('Select a store', 'charlies-stores'));
        foreach ($stores as $store) {
            $store_options[$store->ID] = $store->post_title;
        }

        // If no stores exist, add a helpful message
        if (empty($stores)) {
            $store_options[''] = __('No stores found - Please create a store first', 'charlies-stores');
        }

        // Check if WooCommerce admin functions are available
        if (function_exists('woocommerce_wp_select')) {
            woocommerce_wp_select(array(
                'id' => '_charlie_store_location',
                'label' => __('Available at Store', 'charlies-stores'),
                'description' => __('Select which store this product is available at.', 'charlies-stores'),
                'desc_tip' => true,
                'options' => $store_options
            ));
        } else {
            // Fallback to manual HTML if WooCommerce functions aren't available
            $current_store = get_post_meta(get_the_ID(), '_charlie_store_location', true);
            echo '<p class="form-field _charlie_store_location_field">';
            echo '<label for="_charlie_store_location">' . __('Available at Store', 'charlies-stores') . '</label>';
            echo '<select id="_charlie_store_location" name="_charlie_store_location" class="select short">';
            foreach ($store_options as $value => $label) {
                echo '<option value="' . esc_attr($value) . '"' . selected($current_store, $value, false) . '>' . esc_html($label) . '</option>';
            }
            echo '</select>';
            echo '<span class="description">' . __('Select which store this product is available at.', 'charlies-stores') . '</span>';
            echo '</p>';
        }

        // Check if WooCommerce admin functions are available
        if (function_exists('woocommerce_wp_text_field')) {
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
        } else {
            // Fallback to manual HTML if WooCommerce functions aren't available
            $current_stock = get_post_meta(get_the_ID(), '_charlie_store_stock', true);
            echo '<p class="form-field _charlie_store_stock_field">';
            echo '<label for="_charlie_store_stock">' . __('Store Stock Quantity', 'charlies-stores') . '</label>';
            echo '<input type="number" id="_charlie_store_stock" name="_charlie_store_stock" value="' . esc_attr($current_stock) . '" step="1" min="0" class="short" />';
            echo '<span class="description">' . __('Stock quantity at this specific store.', 'charlies-stores') . '</span>';
            echo '</p>';
        }

        echo '</div>';
    }

    /**
     * Fallback method for when WooCommerce admin functions aren't available
     */
    private function add_store_location_field_fallback() {
        global $post;

        $current_store = get_post_meta($post->ID, '_charlie_store_location', true);
        $current_stock = get_post_meta($post->ID, '_charlie_store_stock', true);

        // Get all stores for dropdown
        $stores = get_posts(array(
            'post_type' => 'charlie_store',
            'posts_per_page' => -1,
            'post_status' => 'publish'
        ));

        echo '<div class="options_group">';

        // Store selection field
        echo '<p class="form-field _charlie_store_location_field">';
        echo '<label for="_charlie_store_location">' . __('Available at Store', 'charlies-stores') . '</label>';
        echo '<select id="_charlie_store_location" name="_charlie_store_location" class="select short">';

        if (empty($stores)) {
            echo '<option value="">' . __('No stores found - Please create a store first', 'charlies-stores') . '</option>';
        } else {
            echo '<option value="">' . __('Select a store', 'charlies-stores') . '</option>';
            foreach ($stores as $store) {
                echo '<option value="' . esc_attr($store->ID) . '"' . selected($current_store, $store->ID, false) . '>' . esc_html($store->post_title) . '</option>';
            }
        }
        echo '</select>';
        echo '<span class="description">' . __('Select which store this product is available at.', 'charlies-stores') . '</span>';
        echo '</p>';

        // Stock quantity field
        echo '<p class="form-field _charlie_store_stock_field">';
        echo '<label for="_charlie_store_stock">' . __('Store Stock Quantity', 'charlies-stores') . '</label>';
        echo '<input type="number" id="_charlie_store_stock" name="_charlie_store_stock" value="' . esc_attr($current_stock) . '" step="1" min="0" class="short" />';
        echo '<span class="description">' . __('Stock quantity at this specific store.', 'charlies-stores') . '</span>';
        echo '</p>';

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
     * Get products for a specific store and category via AJAX
     */
    public function get_store_products_by_category() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $store_id = absint($_POST['store_id']);
        $category_id = absint($_POST['category_id']);

        if (!$store_id) {
            wp_send_json_error('Invalid store ID');
        }

        if (!$category_id) {
            wp_send_json_error('Invalid category ID');
        }

        error_log("Charlie Debug: get_store_products_by_category called with store_id: $store_id, category_id: $category_id");

        // Get products for this store and category
        $products = $this->get_products_by_store_and_category($store_id, $category_id);

        error_log("Charlie Debug: Found " . count($products) . " products for store $store_id in category $category_id");

        wp_send_json_success(array(
            'products' => $products,
            'store_id' => $store_id,
            'category_id' => $category_id,
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

            $store_stock = get_post_meta($product->ID, '_charlie_store_stock', true);
            $wc_stock = $wc_product->get_stock_quantity(); // Get actual WooCommerce stock
            $stock_status = $wc_product->get_stock_status(); // Get stock status
            $manage_stock = $wc_product->get_manage_stock(); // Check if stock management is enabled
            $actual_stock = $wc_stock ?: ($store_stock ?: 0); // Use WC stock first, fallback to custom

            // Debug logging
            error_log("Charlie Debug Stock: Product {$product->post_title} (ID: {$product->ID}) - WC Stock: {$wc_stock}, Manage Stock: " . ($manage_stock ? 'YES' : 'NO') . ", Stock Status: {$stock_status}, Store Stock: {$store_stock}");

            $formatted_products[] = array(
                'id' => $product->ID,
                'name' => $product->post_title,
                'description' => wp_trim_words($product->post_excerpt, 20),
                'price' => $wc_product->get_price_html(),
                'image' => get_the_post_thumbnail_url($product->ID, 'medium'),
                'url' => get_permalink($product->ID),
                'add_to_cart_url' => $wc_product->add_to_cart_url(),
                'in_stock' => $wc_product->is_in_stock(),
                'store_stock' => $store_stock ?: 0,
                'stock' => $actual_stock, // Use actual WooCommerce stock
                'wc_stock' => $wc_stock, // Include for debugging
                'stock_status' => $stock_status, // Include for debugging
                'manage_stock' => $manage_stock, // Include for debugging
                'categories' => wp_get_post_terms($product->ID, 'product_cat', array('fields' => 'names'))
            );
        }

        return $formatted_products;
    }

    /**
     * Get products available at a specific store in a specific category
     */
    public function get_products_by_store_and_category($store_id, $category_id, $limit = 12) {
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
            ),
            'tax_query' => array(
                array(
                    'taxonomy' => 'product_cat',
                    'field' => 'term_id',
                    'terms' => $category_id
                )
            )
        );

        error_log("Charlie Debug: Query args for store $store_id, category $category_id: " . print_r($args, true));

        $products = get_posts($args);
        $formatted_products = array();

        error_log("Charlie Debug: Raw query returned " . count($products) . " products");

        foreach ($products as $product) {
            $wc_product = wc_get_product($product->ID);
            if (!$wc_product) continue;

            $store_stock = get_post_meta($product->ID, '_charlie_store_stock', true);
            $wc_stock = $wc_product->get_stock_quantity(); // Get actual WooCommerce stock
            $stock_status = $wc_product->get_stock_status(); // Get stock status
            $manage_stock = $wc_product->get_manage_stock(); // Check if stock management is enabled
            $actual_stock = $wc_stock ?: ($store_stock ?: 0); // Use WC stock first, fallback to custom

            // Debug logging
            error_log("Charlie Debug Stock: Product {$product->post_title} (ID: {$product->ID}) - WC Stock: {$wc_stock}, Manage Stock: " . ($manage_stock ? 'YES' : 'NO') . ", Stock Status: {$stock_status}, Store Stock: {$store_stock}");

            // Get brand information
            $brands = wp_get_post_terms($product->ID, 'product_brand', array('fields' => 'names'));
            $brand_name = !empty($brands) ? $brands[0] : 'No Brand';

            $formatted_products[] = array(
                'id' => $product->ID,
                'name' => $product->post_title,
                'description' => wp_trim_words($product->post_excerpt ?: $product->post_content, 20),
                'price' => $wc_product->get_price_html(),
                'regular_price' => $wc_product->get_regular_price(),
                'sale_price' => $wc_product->get_sale_price(),
                'image' => get_the_post_thumbnail_url($product->ID, 'medium'),
                'url' => get_permalink($product->ID),
                'add_to_cart_url' => $wc_product->add_to_cart_url(),
                'in_stock' => $wc_product->is_in_stock(),
                'store_stock' => $store_stock ?: 0,
                'stock' => $actual_stock, // Use actual WooCommerce stock
                'wc_stock' => $wc_stock, // Include for debugging
                'stock_status' => $stock_status, // Include for debugging
                'manage_stock' => $manage_stock, // Include for debugging
                'categories' => wp_get_post_terms($product->ID, 'product_cat', array('fields' => 'names')),
                'brand' => $brand_name,
                'sku' => $wc_product->get_sku()
            );

            error_log("Charlie Debug: Formatted product: " . $product->post_title . " (Stock: $store_stock)");
        }

        return $formatted_products;
    }

    /**
     * Get brands for a specific store and category via AJAX
     */
    public function get_store_brands_by_category() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $store_id = absint($_POST['store_id']);
        $category_id = absint($_POST['category_id']);

        if (!$store_id || !$category_id) {
            wp_send_json_error('Invalid store ID or category ID');
        }

        error_log("Charlie Debug: get_store_brands_by_category called with store_id: $store_id, category_id: $category_id");

        // Get brands that have products in this store and category
        $brands = $this->get_brands_by_store_and_category($store_id, $category_id);

        error_log("Charlie Debug: Found " . count($brands) . " brands for store $store_id in category $category_id");

        wp_send_json_success(array(
            'brands' => $brands,
            'store_id' => $store_id,
            'category_id' => $category_id
        ));
    }

    /**
     * Get products for a specific store, category, and brand via AJAX
     */
    public function get_store_products_by_brand() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $store_id = absint($_POST['store_id']);
        $category_id = absint($_POST['category_id']);
        $brand_id = absint($_POST['brand_id']);

        if (!$store_id || !$category_id || !$brand_id) {
            wp_send_json_error('Invalid store ID, category ID, or brand ID');
        }

        error_log("Charlie Debug: get_store_products_by_brand called with store_id: $store_id, category_id: $category_id, brand_id: $brand_id");

        // Get products for this store, category, and brand
        $products = $this->get_products_by_store_category_and_brand($store_id, $category_id, $brand_id);

        error_log("Charlie Debug: Found " . count($products) . " products for store $store_id, category $category_id, brand $brand_id");

        wp_send_json_success(array(
            'products' => $products,
            'store_id' => $store_id,
            'category_id' => $category_id,
            'brand_id' => $brand_id
        ));
    }

    /**
     * Get brands that have products at a specific store in a specific category
     */
    public function get_brands_by_store_and_category($store_id, $category_id) {
        // First get all products at this store in this category
        $products = get_posts(array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => array(
                array(
                    'key' => '_charlie_store_location',
                    'value' => $store_id,
                    'compare' => '='
                )
            ),
            'tax_query' => array(
                array(
                    'taxonomy' => 'product_cat',
                    'field' => 'term_id',
                    'terms' => $category_id
                )
            ),
            'fields' => 'ids'
        ));

        if (empty($products)) {
            return array();
        }

        // Get unique brands from these products
        $brand_ids = array();
        foreach ($products as $product_id) {
            $product_brands = wp_get_post_terms($product_id, 'product_brand', array('fields' => 'ids'));
            $brand_ids = array_merge($brand_ids, $product_brands);
        }

        $brand_ids = array_unique($brand_ids);

        // Get brand details
        $brands = array();
        foreach ($brand_ids as $brand_id) {
            $brand = get_term($brand_id, 'product_brand');
            if (!is_wp_error($brand)) {
                $product_count = $this->count_products_in_brand_at_store($brand_id, $store_id, $category_id);

                $brands[] = array(
                    'id' => $brand->term_id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'description' => $brand->description,
                    'product_count' => $product_count,
                    'image' => $this->get_brand_image($brand_id)
                );
            }
        }

        return $brands;
    }

    /**
     * Get products available at a specific store in a specific category and brand
     */
    public function get_products_by_store_category_and_brand($store_id, $category_id, $brand_id, $limit = 12) {
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
            ),
            'tax_query' => array(
                'relation' => 'AND',
                array(
                    'taxonomy' => 'product_cat',
                    'field' => 'term_id',
                    'terms' => $category_id
                ),
                array(
                    'taxonomy' => 'product_brand',
                    'field' => 'term_id',
                    'terms' => $brand_id
                )
            )
        );

        $products = get_posts($args);
        $formatted_products = array();

        foreach ($products as $product) {
            $wc_product = wc_get_product($product->ID);
            if (!$wc_product) continue;

            $store_stock = get_post_meta($product->ID, '_charlie_store_stock', true);
            $wc_stock = $wc_product->get_stock_quantity(); // Get actual WooCommerce stock
            $stock_status = $wc_product->get_stock_status(); // Get stock status
            $manage_stock = $wc_product->get_manage_stock(); // Check if stock management is enabled
            $actual_stock = $wc_stock ?: ($store_stock ?: 0); // Use WC stock first, fallback to custom

            // Debug logging
            error_log("Charlie Debug Stock: Product {$product->post_title} (ID: {$product->ID}) - WC Stock: {$wc_stock}, Manage Stock: " . ($manage_stock ? 'YES' : 'NO') . ", Stock Status: {$stock_status}, Store Stock: {$store_stock}");

            // Get brand information
            $brands = wp_get_post_terms($product->ID, 'product_brand', array('fields' => 'names'));
            $brand_name = !empty($brands) ? $brands[0] : 'No Brand';

            $formatted_products[] = array(
                'id' => $product->ID,
                'name' => $product->post_title,
                'description' => wp_trim_words($product->post_excerpt ?: $product->post_content, 20),
                'full_description' => $product->post_content,
                'short_description' => $product->post_excerpt,
                'price' => $wc_product->get_price_html(),
                'regular_price' => $wc_product->get_regular_price(),
                'sale_price' => $wc_product->get_sale_price(),
                'image' => get_the_post_thumbnail_url($product->ID, 'medium'),
                'gallery_images' => $this->get_product_gallery_images($product->ID),
                'url' => get_permalink($product->ID),
                'add_to_cart_url' => $wc_product->add_to_cart_url(),
                'in_stock' => $wc_product->is_in_stock(),
                'store_stock' => $store_stock ?: 0,
                'stock' => $actual_stock, // Use actual WooCommerce stock
                'wc_stock' => $wc_stock, // Include for debugging
                'stock_status' => $stock_status, // Include for debugging
                'manage_stock' => $manage_stock, // Include for debugging
                'categories' => wp_get_post_terms($product->ID, 'product_cat', array('fields' => 'names')),
                'brand' => $brand_name,
                'sku' => $wc_product->get_sku(),
                'weight' => $wc_product->get_weight(),
                'dimensions' => array(
                    'length' => $wc_product->get_length(),
                    'width' => $wc_product->get_width(),
                    'height' => $wc_product->get_height()
                )
            );
        }

        return $formatted_products;
    }

    /**
     * Count products in brand at specific store and category
     */
    private function count_products_in_brand_at_store($brand_id, $store_id, $category_id) {
        $products = get_posts(array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => array(
                array(
                    'key' => '_charlie_store_location',
                    'value' => $store_id,
                    'compare' => '='
                )
            ),
            'tax_query' => array(
                'relation' => 'AND',
                array(
                    'taxonomy' => 'product_cat',
                    'field' => 'term_id',
                    'terms' => $category_id
                ),
                array(
                    'taxonomy' => 'product_brand',
                    'field' => 'term_id',
                    'terms' => $brand_id
                )
            ),
            'fields' => 'ids'
        ));

        return count($products);
    }

    /**
     * Get brand image URL
     */
    private function get_brand_image($brand_id) {
        $thumbnail_id = get_term_meta($brand_id, 'thumbnail_id', true);
        if ($thumbnail_id) {
            return wp_get_attachment_image_url($thumbnail_id, 'medium');
        }
        return '';
    }

    /**
     * Get product gallery images
     */
    private function get_product_gallery_images($product_id) {
        $wc_product = wc_get_product($product_id);
        if (!$wc_product) return array();

        $gallery_ids = $wc_product->get_gallery_image_ids();
        $gallery_images = array();

        foreach ($gallery_ids as $image_id) {
            $gallery_images[] = wp_get_attachment_image_url($image_id, 'medium');
        }

        return $gallery_images;
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
     * Get categories for a specific store via AJAX
     */
    public function get_store_categories() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $store_id = absint($_POST['store_id']);
        error_log("Charlie Debug: get_store_categories called with store_id: $store_id");

        if (!$store_id) {
            error_log("Charlie Debug: Invalid store ID provided");
            wp_send_json_error('Invalid store ID');
        }

        // Get all categories that have products at this store
        $categories = $this->get_categories_by_store($store_id);
        error_log("Charlie Debug: Found " . count($categories) . " categories for store $store_id");

        wp_send_json_success(array(
            'categories' => $categories,
            'store_id' => $store_id
        ));
    }

    /**
     * Get product categories available at a specific store
     */
    public function get_categories_by_store($store_id) {
        error_log("Charlie Debug: Getting categories for store ID: $store_id");

        // First get all products at this store
        $products = get_posts(array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => array(
                array(
                    'key' => '_charlie_store_location',
                    'value' => $store_id,
                    'compare' => '='
                )
            ),
            'fields' => 'ids'
        ));

        error_log("Charlie Debug: Found " . count($products) . " products linked to store $store_id");
        error_log("Charlie Debug: Product IDs: " . implode(', ', $products));

        if (empty($products)) {
            error_log("Charlie Debug: No products found for store $store_id, returning empty categories");
            return array();
        }

        // Get unique categories from these products
        $category_ids = array();
        foreach ($products as $product_id) {
            $product_categories = wp_get_post_terms($product_id, 'product_cat', array('fields' => 'ids'));
            $category_ids = array_merge($category_ids, $product_categories);
        }

        $category_ids = array_unique($category_ids);

        // Get category details
        $categories = array();
        foreach ($category_ids as $cat_id) {
            $category = get_term($cat_id, 'product_cat');
            if (!is_wp_error($category)) {
                $product_count = $this->count_products_in_category_at_store($cat_id, $store_id);

                $categories[] = array(
                    'id' => $category->term_id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'product_count' => $product_count,
                    'image' => $this->get_category_image($cat_id),
                    'color' => get_term_meta($cat_id, '_charlie_category_color', true) ?: '#00ff00'
                );
            }
        }

        return $categories;
    }

    /**
     * Count products in category at specific store
     */
    private function count_products_in_category_at_store($category_id, $store_id) {
        $products = get_posts(array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'tax_query' => array(
                array(
                    'taxonomy' => 'product_cat',
                    'field' => 'term_id',
                    'terms' => $category_id
                )
            ),
            'meta_query' => array(
                array(
                    'key' => '_charlie_store_location',
                    'value' => $store_id,
                    'compare' => '='
                )
            ),
            'fields' => 'ids'
        ));

        return count($products);
    }

    /**
     * Get category image URL
     */
    private function get_category_image($category_id) {
        $thumbnail_id = get_term_meta($category_id, 'thumbnail_id', true);
        if ($thumbnail_id) {
            return wp_get_attachment_image_url($thumbnail_id, 'medium');
        }
        return '';
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

    /**
     * Add category color field to category creation form
     */
    public function add_category_color_field() {
        ?>
        <div class="form-field">
            <label for="charlie_category_color"><?php _e('Category Color', 'charlies-stores'); ?></label>
            <input type="color" name="charlie_category_color" id="charlie_category_color" value="#00ff00" />
            <p class="description"><?php _e('Choose a color for this category in the map interface.', 'charlies-stores'); ?></p>
        </div>
        <?php
    }

    /**
     * Add category color field to category edit form
     */
    public function edit_category_color_field($term) {
        $color = get_term_meta($term->term_id, '_charlie_category_color', true);
        if (empty($color)) {
            $color = '#00ff00';
        }
        ?>
        <tr class="form-field">
            <th scope="row" valign="top">
                <label for="charlie_category_color"><?php _e('Category Color', 'charlies-stores'); ?></label>
            </th>
            <td>
                <input type="color" name="charlie_category_color" id="charlie_category_color" value="<?php echo esc_attr($color); ?>" />
                <p class="description"><?php _e('Choose a color for this category in the map interface.', 'charlies-stores'); ?></p>
            </td>
        </tr>
        <?php
    }

    /**
     * Save category color field
     */
    public function save_category_color_field($term_id) {
        if (isset($_POST['charlie_category_color'])) {
            $color = sanitize_hex_color($_POST['charlie_category_color']);
            update_term_meta($term_id, '_charlie_category_color', $color);
        }
    }

    /**
     * AJAX: Add product to WooCommerce cart
     */
    public function ajax_add_to_cart() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $product_id = absint($_POST['product_id']);
        $quantity = absint($_POST['quantity']) ?: 1;

        if (!$product_id) {
            wp_send_json_error('Invalid product ID');
        }

        // Add to WooCommerce cart
        $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity);

        if ($cart_item_key) {
            wp_send_json_success(array(
                'message' => 'Product added to cart',
                'cart_item_key' => $cart_item_key,
                'cart_count' => WC()->cart->get_cart_contents_count(),
                'cart_total' => WC()->cart->get_cart_total()
            ));
        } else {
            wp_send_json_error('Failed to add product to cart');
        }
    }

    /**
     * AJAX: Get WooCommerce cart contents
     */
    public function ajax_get_cart() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $cart_items = array();
        $cart_total = 0;

        foreach (WC()->cart->get_cart() as $cart_item_key => $cart_item) {
            $product = $cart_item['data'];
            $product_id = $cart_item['product_id'];

            $cart_items[] = array(
                'cart_item_key' => $cart_item_key,
                'product_id' => $product_id,
                'name' => $product->get_name(),
                'price' => $product->get_price(),
                'quantity' => $cart_item['quantity'],
                'line_total' => $cart_item['line_total'],
                'image' => get_the_post_thumbnail_url($product_id, 'thumbnail'),
                'url' => get_permalink($product_id)
            );
        }

        wp_send_json_success(array(
            'items' => $cart_items,
            'count' => WC()->cart->get_cart_contents_count(),
            'subtotal' => WC()->cart->get_cart_subtotal(),
            'total' => WC()->cart->get_total(),
            'checkout_url' => wc_get_checkout_url()
        ));
    }

    /**
     * AJAX: Update cart item quantity
     */
    public function ajax_update_cart() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $cart_item_key = sanitize_text_field($_POST['cart_item_key']);
        $quantity = absint($_POST['quantity']);

        if (!$cart_item_key) {
            wp_send_json_error('Invalid cart item key');
        }

        $updated = WC()->cart->set_quantity($cart_item_key, $quantity);

        if ($updated) {
            wp_send_json_success(array(
                'message' => 'Cart updated',
                'cart_count' => WC()->cart->get_cart_contents_count(),
                'cart_total' => WC()->cart->get_cart_total()
            ));
        } else {
            wp_send_json_error('Failed to update cart');
        }
    }

    /**
     * AJAX: Remove item from cart
     */
    public function ajax_remove_from_cart() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $cart_item_key = sanitize_text_field($_POST['cart_item_key']);

        if (!$cart_item_key) {
            wp_send_json_error('Invalid cart item key');
        }

        $removed = WC()->cart->remove_cart_item($cart_item_key);

        if ($removed) {
            wp_send_json_success(array(
                'message' => 'Item removed from cart',
                'cart_count' => WC()->cart->get_cart_contents_count(),
                'cart_total' => WC()->cart->get_cart_total()
            ));
        } else {
            wp_send_json_error('Failed to remove item from cart');
        }
    }
}