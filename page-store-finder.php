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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    <!-- Emergency geocoding fix for WordPress.com caching -->
    <script>
    // Override immediately, don't wait for DOMContentLoaded
    (function() {
        const accessToken = '<?php echo get_option('charlie_mapbox_token'); ?>';

        // Direct Mapbox geocoding function
        async function directMapboxGeocode(postalCode) {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postalCode + ', Canada')}.json?access_token=${accessToken}&country=ca&types=postcode&limit=1`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Geocoding failed');
            }

            const data = await response.json();
            if (!data.features || data.features.length === 0) {
                throw new Error('Please enter a valid Canadian postal code');
            }

            const feature = data.features[0];
            const [longitude, latitude] = feature.center;

            return {
                coordinates: {
                    latitude,
                    longitude,
                    lngLat: [longitude, latitude]
                },
                postalCode,
                location: {
                    city: null,
                    province: null,
                    country: 'Canada'
                },
                formattedAddress: feature.place_name
            };
        }

        // Override geocoding service as soon as it's available
        function overrideGeocodingService() {
            if (window.geocodingService) {
                console.log('Overriding geocoding service...');
                window.geocodingService.geocodePostalCode = directMapboxGeocode;
                return true;
            }
            return false;
        }

        // Override age verification as soon as it's available
        function overrideAgeVerification() {
            if (window.ageVerification && window.ageVerification.handlePostalCodeSearch) {
                console.log('Overriding age verification...');

                window.ageVerification.handlePostalCodeSearch = async function() {
                    const postalCode = this.modalPostalCode?.value?.trim();

                    if (!postalCode) {
                        this.showModalError('Please enter a postal code');
                        this.modalPostalCode?.focus();
                        return;
                    }

                    // Simple postal code validation
                    const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
                    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
                        this.showModalError('Please enter a valid Canadian postal code (e.g., M5V 3A8)');
                        this.modalPostalCode?.focus();
                        return;
                    }

                    try {
                        this.setModalLoadingState(true);
                        this.hideModalError();

                        const geocodeResult = await directMapboxGeocode(postalCode);

                        // Dispatch event with search results
                        const searchData = {
                            postalCode,
                            geocodeResult,
                            nearbyStores: []
                        };

                        document.dispatchEvent(new CustomEvent('modalSearchComplete', {
                            detail: searchData
                        }));

                        // Hide modal and show app
                        this.hideModal(() => {
                            this.showApp();
                        });

                    } catch (error) {
                        console.error('Geocoding failed:', error);
                        this.showModalError(error.message || 'Unable to find location. Please try again.');
                    } finally {
                        this.setModalLoadingState(false);
                    }
                };
                return true;
            }
            return false;
        }

        // Check immediately and then periodically
        const checkInterval = setInterval(() => {
            const geocodingOverridden = overrideGeocodingService();
            const ageVerificationOverridden = overrideAgeVerification();

            if (geocodingOverridden && ageVerificationOverridden) {
                console.log('All services overridden successfully');
                clearInterval(checkInterval);
            }
        }, 100);

        // Also try on DOMContentLoaded as fallback
        document.addEventListener('DOMContentLoaded', function() {
            overrideGeocodingService();
            overrideAgeVerification();
        });

        // Clear interval after 10 seconds to avoid infinite checking
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    })();
    </script>
    </body>
    </html>
    <?php
} else {
    get_footer();
}
?>