<?php
/**
 * Admin Settings Class
 * Handles WordPress admin interface for store settings
 */
class Charlie_Admin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_notices', array($this, 'check_store_setup'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('Charlie\'s Store Settings', 'charlies-stores'),
            __('Store Settings', 'charlies-stores'),
            'manage_options',
            'charlie-store-settings',
            array($this, 'settings_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('charlie_store_settings', 'charlie_mapbox_token');
        register_setting('charlie_store_settings', 'charlie_minimum_age');
        register_setting('charlie_store_settings', 'charlie_search_radius');
        register_setting('charlie_store_settings', 'charlie_enable_crosshair');
        register_setting('charlie_store_settings', 'charlie_enable_vignette');
        register_setting('charlie_store_settings', 'charlie_vignette_radius');
        register_setting('charlie_store_settings', 'charlie_warehouse_store_id');

        add_settings_section(
            'charlie_api_settings',
            __('API Settings', 'charlies-stores'),
            null,
            'charlie-store-settings'
        );

        add_settings_field(
            'mapbox_token',
            __('Mapbox Access Token', 'charlies-stores'),
            array($this, 'mapbox_token_field'),
            'charlie-store-settings',
            'charlie_api_settings'
        );

        add_settings_section(
            'charlie_app_settings',
            __('Application Settings', 'charlies-stores'),
            null,
            'charlie-store-settings'
        );

        add_settings_field(
            'minimum_age',
            __('Minimum Age', 'charlies-stores'),
            array($this, 'minimum_age_field'),
            'charlie-store-settings',
            'charlie_app_settings'
        );

        add_settings_field(
            'search_radius',
            __('Default Search Radius (km)', 'charlies-stores'),
            array($this, 'search_radius_field'),
            'charlie-store-settings',
            'charlie_app_settings'
        );

        add_settings_field(
            'warehouse_store_id',
            __('Warehouse Store ID', 'charlies-stores'),
            array($this, 'warehouse_store_id_field'),
            'charlie-store-settings',
            'charlie_app_settings'
        );

        add_settings_section(
            'charlie_ui_settings',
            __('GTA-Style Interface Settings', 'charlies-stores'),
            null,
            'charlie-store-settings'
        );

        add_settings_field(
            'enable_crosshair',
            __('Enable Crosshair Overlay', 'charlies-stores'),
            array($this, 'enable_crosshair_field'),
            'charlie-store-settings',
            'charlie_ui_settings'
        );

        add_settings_field(
            'enable_vignette',
            __('Enable Radius Vignette', 'charlies-stores'),
            array($this, 'enable_vignette_field'),
            'charlie-store-settings',
            'charlie_ui_settings'
        );

        add_settings_field(
            'vignette_radius',
            __('Vignette Radius (km)', 'charlies-stores'),
            array($this, 'vignette_radius_field'),
            'charlie-store-settings',
            'charlie_ui_settings'
        );
    }

    /**
     * Settings page content
     */
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('charlie_store_settings');
                do_settings_sections('charlie-store-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    /**
     * Mapbox token field
     */
    public function mapbox_token_field() {
        $value = get_option('charlie_mapbox_token', '');
        ?>
        <input type="password" name="charlie_mapbox_token" value="<?php echo esc_attr($value); ?>" size="50" />
        <p class="description">
            <?php _e('Get your Mapbox access token from', 'charlies-stores'); ?>
            <a href="https://account.mapbox.com/access-tokens/" target="_blank">Mapbox Account</a>
        </p>
        <?php
    }

    /**
     * Minimum age field
     */
    public function minimum_age_field() {
        $value = get_option('charlie_minimum_age', 19);
        ?>
        <input type="number" min="18" max="25" name="charlie_minimum_age" value="<?php echo esc_attr($value); ?>" />
        <p class="description"><?php _e('Minimum age required to access the store finder.', 'charlies-stores'); ?></p>
        <?php
    }

    /**
     * Search radius field
     */
    public function search_radius_field() {
        $value = get_option('charlie_search_radius', 50);
        ?>
        <input type="number" min="1" max="500" name="charlie_search_radius" value="<?php echo esc_attr($value); ?>" />
        <p class="description"><?php _e('Default radius in kilometers for store searches.', 'charlies-stores'); ?></p>
        <?php
    }

    /**
     * Warehouse store ID field
     */
    public function warehouse_store_id_field() {
        $value = get_option('charlie_warehouse_store_id', 1);

        // Get all stores for dropdown
        $stores = get_posts(array(
            'post_type' => 'charlie_store',
            'posts_per_page' => -1,
            'post_status' => 'publish'
        ));

        if (empty($stores)) {
            ?>
            <p style="color: #d63638; font-weight: bold;">
                <?php _e('No stores found! Please create a store first.', 'charlies-stores'); ?>
                <a href="<?php echo admin_url('post-new.php?post_type=charlie_store'); ?>">
                    <?php _e('Create Store', 'charlies-stores'); ?>
                </a>
            </p>
            <input type="number" min="1" name="charlie_warehouse_store_id" value="<?php echo esc_attr($value); ?>" />
            <?php
        } else {
            ?>
            <select name="charlie_warehouse_store_id">
                <option value=""><?php _e('Select warehouse store', 'charlies-stores'); ?></option>
                <?php foreach ($stores as $store) : ?>
                    <option value="<?php echo esc_attr($store->ID); ?>" <?php selected($value, $store->ID); ?>>
                        <?php echo esc_html($store->post_title); ?> (ID: <?php echo $store->ID; ?>)
                    </option>
                <?php endforeach; ?>
            </select>
            <?php
        }
        ?>
        <p class="description"><?php _e('Select which store represents your warehouse/distribution center.', 'charlies-stores'); ?></p>
        <?php
    }

    /**
     * Check store setup and show admin notices
     */
    public function check_store_setup() {
        // Only show on relevant admin pages
        $screen = get_current_screen();
        if (!$screen || !in_array($screen->base, ['edit', 'post', 'settings_page_charlie-store-settings'])) {
            return;
        }

        // Check if we have any stores
        $stores = get_posts(array(
            'post_type' => 'charlie_store',
            'posts_per_page' => 1,
            'post_status' => 'publish'
        ));

        if (empty($stores)) {
            ?>
            <div class="notice notice-warning">
                <p>
                    <strong><?php _e('Charlie\'s Store Finder:', 'charlies-stores'); ?></strong>
                    <?php _e('No stores found. Products cannot be linked to stores until you create at least one store.', 'charlies-stores'); ?>
                    <a href="<?php echo admin_url('post-new.php?post_type=charlie_store'); ?>" class="button button-primary">
                        <?php _e('Create Your First Store', 'charlies-stores'); ?>
                    </a>
                </p>
            </div>
            <?php
        }

        // Check warehouse configuration
        $warehouse_id = get_option('charlie_warehouse_store_id');
        if ($warehouse_id && !get_post($warehouse_id)) {
            ?>
            <div class="notice notice-error">
                <p>
                    <strong><?php _e('Charlie\'s Store Finder:', 'charlies-stores'); ?></strong>
                    <?php printf(__('Warehouse store ID %d does not exist.', 'charlies-stores'), $warehouse_id); ?>
                    <a href="<?php echo admin_url('options-general.php?page=charlie-store-settings'); ?>">
                        <?php _e('Update Settings', 'charlies-stores'); ?>
                    </a>
                </p>
            </div>
            <?php
        }
    }

    /**
     * Enable crosshair field
     */
    public function enable_crosshair_field() {
        $value = get_option('charlie_enable_crosshair', true);
        ?>
        <input type="checkbox" name="charlie_enable_crosshair" value="1" <?php checked($value, true); ?> />
        <p class="description"><?php _e('Show GTA-style crosshair targeting overlay on the map.', 'charlies-stores'); ?></p>
        <?php
    }

    /**
     * Enable vignette field
     */
    public function enable_vignette_field() {
        $value = get_option('charlie_enable_vignette', true);
        ?>
        <input type="checkbox" name="charlie_enable_vignette" value="1" <?php checked($value, true); ?> />
        <p class="description"><?php _e('Show radius vignette overlay that fades to black outside the visible area.', 'charlies-stores'); ?></p>
        <?php
    }

    /**
     * Vignette radius field
     */
    public function vignette_radius_field() {
        $value = get_option('charlie_vignette_radius', 10);
        ?>
        <input type="number" min="1" max="50" name="charlie_vignette_radius" value="<?php echo esc_attr($value); ?>" />
        <p class="description"><?php _e('Radius in kilometers for the visible area inside the vignette overlay.', 'charlies-stores'); ?></p>
        <?php
    }
}