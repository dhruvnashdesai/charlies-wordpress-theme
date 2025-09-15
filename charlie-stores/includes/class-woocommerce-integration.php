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
        echo '<option value="">' . __('Select a store', 'charlies-stores') . '</option>';
        foreach ($stores as $store) {
            echo '<option value="' . esc_attr($store->ID) . '"' . selected($current_store, $store->ID, false) . '>' . esc_html($store->post_title) . '</option>';
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
     * Get categories for a specific store via AJAX
     */
    public function get_store_categories() {
        check_ajax_referer('charlie_nonce', 'nonce');

        $store_id = absint($_POST['store_id']);
        if (!$store_id) {
            wp_send_json_error('Invalid store ID');
        }

        // Get all categories that have products at this store
        $categories = $this->get_categories_by_store($store_id);

        wp_send_json_success(array(
            'categories' => $categories,
            'store_id' => $store_id
        ));
    }

    /**
     * Get product categories available at a specific store
     */
    public function get_categories_by_store($store_id) {
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

        if (empty($products)) {
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
}