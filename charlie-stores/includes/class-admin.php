<?php
/**
 * Admin Settings Class
 * Handles WordPress admin interface for store settings
 */
class Charlie_Admin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
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