<?php
/**
 * Template Name: Store Finder
 *
 * Full-screen store finder with age verification and GTA-style interface
 */

// Check if full-screen mode is enabled
$full_screen = get_post_meta(get_the_ID(), '_charlie_full_screen', true);

if ($full_screen === 'yes') {
    // Full-screen mode - no header/footer
    ?>
    <!DOCTYPE html>
    <html <?php language_attributes(); ?>>
    <head>
        <meta charset="<?php bloginfo('charset'); ?>">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title><?php wp_title('|', true, 'right'); ?></title>
        <?php wp_head(); ?>
    </head>
    <body <?php body_class('charlie-full-screen'); ?>>
    <?php
} else {
    // Standard theme integration
    get_header();
}
?>

<div class="charlie-store-finder">
    <!-- Enhanced Age Verification Modal -->
    <div id="ageModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle"><?php _e('Age Verification Required', 'charlies-stores'); ?></h2>
            </div>
            <div class="modal-body" id="modalBody">
                <!-- Step 1: Age Verification -->
                <div id="ageVerificationStep">
                    <p><?php printf(__('You must be %d years or older to access this site.', 'charlies-stores'), get_option('charlie_minimum_age', 19)); ?></p>
                    <p><?php printf(__('Are you %d years of age or older?', 'charlies-stores'), get_option('charlie_minimum_age', 19)); ?></p>
                    <div class="age-buttons">
                        <button id="ageYes" class="btn btn-primary"><?php printf(__('Yes, I\'m %d+', 'charlies-stores'), get_option('charlie_minimum_age', 19)); ?></button>
                        <button id="ageNo" class="btn btn-secondary"><?php printf(__('No, I\'m under %d', 'charlies-stores'), get_option('charlie_minimum_age', 19)); ?></button>
                    </div>
                </div>

                <!-- Step 2: Postal Code Entry -->
                <div id="postalCodeStep" class="hidden">
                    <p><?php _e('Please enter your postal code to find nearby stores:', 'charlies-stores'); ?></p>
                    <div class="modal-input-group">
                        <input
                            type="text"
                            id="modalPostalCode"
                            placeholder="<?php _e('e.g., M5V 3A8', 'charlies-stores'); ?>"
                            maxlength="7"
                            pattern="[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d"
                            title="<?php _e('Please enter a valid Canadian postal code (e.g., M5V 3A8)', 'charlies-stores'); ?>"
                        >
                        <button id="modalSearchBtn" class="btn btn-primary"><?php _e('Find Stores', 'charlies-stores'); ?></button>
                    </div>
                    <div id="modalError" class="error-message hidden"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Full Screen Map Application -->
    <div id="app" class="hidden">
        <div id="map" class="fullscreen-map">
            <!-- GTA-style Crosshair Overlay -->
            <div id="gtaCrosshair" class="gta-crosshair">
                <div class="center-dot"></div>
            </div>
            <!-- Radius Vignette Overlay -->
            <div id="radiusVignette" class="radius-vignette"></div>
        </div>
        <div id="mapLoading" class="loading-spinner hidden">
            <div class="spinner"></div>
            <p><?php _e('Loading map...', 'charlies-stores'); ?></p>
        </div>
    </div>

    <?php if ($full_screen !== 'yes') : ?>
        <!-- Standard page content for non-full-screen mode -->
        <div class="store-finder-content">
            <div class="page-header">
                <h1><?php the_title(); ?></h1>
                <?php if (get_the_content()) : ?>
                    <div class="page-description">
                        <?php the_content(); ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Store finder will initialize above this content -->
            <div class="store-finder-fallback">
                <p><?php _e('Loading store finder...', 'charlies-stores'); ?></p>
                <noscript>
                    <p><?php _e('This store finder requires JavaScript to function. Please enable JavaScript in your browser.', 'charlies-stores'); ?></p>
                </noscript>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php
if ($full_screen === 'yes') {
    wp_footer();
    ?>
    </body>
    </html>
    <?php
} else {
    get_footer();
}
?>