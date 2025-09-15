<?php
/**
 * Store Manager Class
 * Handles store custom post type and related functionality
 */
class Charlie_Store_Manager {

    public function __construct() {
        add_action('init', array($this, 'register_post_type'));
        add_action('init', array($this, 'register_taxonomies'));
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post', array($this, 'save_store_meta'));
    }

    /**
     * Register the store custom post type
     */
    public function register_post_type() {
        // Debug logging
        error_log('Charlie Stores: Registering charlie_store post type');

        $result = register_post_type('charlie_store', array(
            'labels' => array(
                'name' => __('Stores', 'charlies-stores'),
                'singular_name' => __('Store', 'charlies-stores'),
                'add_new' => __('Add New Store', 'charlies-stores'),
                'add_new_item' => __('Add New Store', 'charlies-stores'),
                'edit_item' => __('Edit Store', 'charlies-stores'),
                'new_item' => __('New Store', 'charlies-stores'),
                'view_item' => __('View Store', 'charlies-stores'),
                'search_items' => __('Search Stores', 'charlies-stores'),
                'not_found' => __('No stores found', 'charlies-stores'),
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
            'show_in_rest' => true,
            'rest_base' => 'stores',
            'menu_icon' => 'dashicons-store',
            'rewrite' => array('slug' => 'stores'),
        ));

        // Debug logging
        if (is_wp_error($result)) {
            error_log('Charlie Stores: Post type registration failed: ' . $result->get_error_message());
        } else {
            error_log('Charlie Stores: Post type registered successfully');
        }
    }

    /**
     * Register store taxonomies
     */
    public function register_taxonomies() {
        // Store features taxonomy
        register_taxonomy('store_feature', 'charlie_store', array(
            'labels' => array(
                'name' => __('Store Features', 'charlies-stores'),
                'singular_name' => __('Store Feature', 'charlies-stores'),
            ),
            'hierarchical' => false,
            'show_in_rest' => true,
            'rewrite' => array('slug' => 'store-features'),
        ));

        // Product categories taxonomy
        register_taxonomy('product_category', 'charlie_store', array(
            'labels' => array(
                'name' => __('Product Categories', 'charlies-stores'),
                'singular_name' => __('Product Category', 'charlies-stores'),
            ),
            'hierarchical' => true,
            'show_in_rest' => true,
            'rewrite' => array('slug' => 'product-categories'),
        ));
    }

    /**
     * Add meta boxes for store information
     */
    public function add_meta_boxes() {
        add_meta_box(
            'store_location',
            __('Store Location', 'charlies-stores'),
            array($this, 'location_meta_box'),
            'charlie_store',
            'normal',
            'high'
        );

        add_meta_box(
            'store_contact',
            __('Store Contact Information', 'charlies-stores'),
            array($this, 'contact_meta_box'),
            'charlie_store',
            'normal',
            'high'
        );

        add_meta_box(
            'store_details',
            __('Store Details', 'charlies-stores'),
            array($this, 'details_meta_box'),
            'charlie_store',
            'normal',
            'high'
        );
    }

    /**
     * Location meta box content
     */
    public function location_meta_box($post) {
        wp_nonce_field('charlie_store_meta', 'charlie_store_nonce');

        $address = get_post_meta($post->ID, '_store_address', true);
        $latitude = get_post_meta($post->ID, '_store_latitude', true);
        $longitude = get_post_meta($post->ID, '_store_longitude', true);
        ?>
        <table class="form-table">
            <tr>
                <th><label for="store_address"><?php _e('Address', 'charlies-stores'); ?></label></th>
                <td>
                    <textarea id="store_address" name="store_address" rows="3" cols="50"><?php echo esc_textarea($address); ?></textarea>
                </td>
            </tr>
            <tr>
                <th><label for="store_latitude"><?php _e('Latitude', 'charlies-stores'); ?></label></th>
                <td>
                    <input type="number" step="any" id="store_latitude" name="store_latitude" value="<?php echo esc_attr($latitude); ?>" />
                </td>
            </tr>
            <tr>
                <th><label for="store_longitude"><?php _e('Longitude', 'charlies-stores'); ?></label></th>
                <td>
                    <input type="number" step="any" id="store_longitude" name="store_longitude" value="<?php echo esc_attr($longitude); ?>" />
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Contact meta box content
     */
    public function contact_meta_box($post) {
        $phone = get_post_meta($post->ID, '_store_phone', true);
        $email = get_post_meta($post->ID, '_store_email', true);
        $hours = get_post_meta($post->ID, '_store_hours', true);
        $manager = get_post_meta($post->ID, '_store_manager', true);
        ?>
        <table class="form-table">
            <tr>
                <th><label for="store_phone"><?php _e('Phone', 'charlies-stores'); ?></label></th>
                <td><input type="tel" id="store_phone" name="store_phone" value="<?php echo esc_attr($phone); ?>" /></td>
            </tr>
            <tr>
                <th><label for="store_email"><?php _e('Email', 'charlies-stores'); ?></label></th>
                <td><input type="email" id="store_email" name="store_email" value="<?php echo esc_attr($email); ?>" /></td>
            </tr>
            <tr>
                <th><label for="store_hours"><?php _e('Hours', 'charlies-stores'); ?></label></th>
                <td><input type="text" id="store_hours" name="store_hours" value="<?php echo esc_attr($hours); ?>" /></td>
            </tr>
            <tr>
                <th><label for="store_manager"><?php _e('Manager', 'charlies-stores'); ?></label></th>
                <td><input type="text" id="store_manager" name="store_manager" value="<?php echo esc_attr($manager); ?>" /></td>
            </tr>
        </table>
        <?php
    }

    /**
     * Details meta box content
     */
    public function details_meta_box($post) {
        $rating = get_post_meta($post->ID, '_store_rating', true);
        $reviews = get_post_meta($post->ID, '_store_reviews', true);
        $established = get_post_meta($post->ID, '_store_established', true);
        ?>
        <table class="form-table">
            <tr>
                <th><label for="store_rating"><?php _e('Rating (1-5)', 'charlies-stores'); ?></label></th>
                <td>
                    <input type="number" step="0.1" min="1" max="5" id="store_rating" name="store_rating" value="<?php echo esc_attr($rating); ?>" />
                </td>
            </tr>
            <tr>
                <th><label for="store_reviews"><?php _e('Number of Reviews', 'charlies-stores'); ?></label></th>
                <td>
                    <input type="number" id="store_reviews" name="store_reviews" value="<?php echo esc_attr($reviews); ?>" />
                </td>
            </tr>
            <tr>
                <th><label for="store_established"><?php _e('Year Established', 'charlies-stores'); ?></label></th>
                <td>
                    <input type="number" min="1900" max="<?php echo date('Y'); ?>" id="store_established" name="store_established" value="<?php echo esc_attr($established); ?>" />
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Save store meta data
     */
    public function save_store_meta($post_id) {
        // Verify nonce
        if (!isset($_POST['charlie_store_nonce']) || !wp_verify_nonce($_POST['charlie_store_nonce'], 'charlie_store_meta')) {
            return;
        }

        // Check if user has permission to edit
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        // Save meta fields
        $meta_fields = array(
            'store_address' => '_store_address',
            'store_latitude' => '_store_latitude',
            'store_longitude' => '_store_longitude',
            'store_phone' => '_store_phone',
            'store_email' => '_store_email',
            'store_hours' => '_store_hours',
            'store_manager' => '_store_manager',
            'store_rating' => '_store_rating',
            'store_reviews' => '_store_reviews',
            'store_established' => '_store_established',
        );

        foreach ($meta_fields as $form_field => $meta_key) {
            if (isset($_POST[$form_field])) {
                update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$form_field]));
            }
        }
    }
}