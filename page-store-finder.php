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
    <!-- NUCLEAR OPTION: Complete bypass of all cached JS -->
    <script>
    console.log('NUCLEAR BYPASS: Starting complete override...');

    // Direct Mapbox function
    const MAPBOX_TOKEN = '<?php echo get_option('charlie_mapbox_token'); ?>';

    async function nuclearGeocode(postalCode) {
        console.log('NUCLEAR: Direct Mapbox call for:', postalCode);

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postalCode + ', Canada')}.json?access_token=${MAPBOX_TOKEN}&country=ca&types=postcode&limit=1`;

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

    // Complete replacement of modal search functionality
    function nuclearModalSearch() {
        console.log('NUCLEAR: Setting up modal search override...');

        const modalSearchBtn = document.getElementById('modalSearchBtn');
        const modalPostalCode = document.getElementById('modalPostalCode');
        const modalError = document.getElementById('modalError');
        const ageModal = document.getElementById('ageModal');
        const app = document.getElementById('app');

        if (!modalSearchBtn || !modalPostalCode) {
            console.log('NUCLEAR: Modal elements not found yet, retrying...');
            return false;
        }

        // Remove all existing event listeners by cloning the button
        const newBtn = modalSearchBtn.cloneNode(true);
        modalSearchBtn.parentNode.replaceChild(newBtn, modalSearchBtn);

        console.log('NUCLEAR: Modal button replaced, adding new handler...');

        // Add our custom handler
        newBtn.addEventListener('click', async () => {
            console.log('NUCLEAR: Custom button clicked!');

            const postalCode = modalPostalCode.value?.trim();

            if (!postalCode) {
                modalError.textContent = 'Please enter a postal code';
                modalError.classList.remove('hidden');
                modalPostalCode.focus();
                return;
            }

            const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
            if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
                modalError.textContent = 'Please enter a valid Canadian postal code (e.g., M5V 3A8)';
                modalError.classList.remove('hidden');
                modalPostalCode.focus();
                return;
            }

            try {
                newBtn.disabled = true;
                newBtn.textContent = 'Searching...';
                modalPostalCode.disabled = true;
                modalError.classList.add('hidden');

                console.log('NUCLEAR: Calling nuclearGeocode...');
                const geocodeResult = await nuclearGeocode(postalCode);
                console.log('NUCLEAR: Geocode success:', geocodeResult);

                // Dispatch the event
                const searchData = {
                    postalCode,
                    geocodeResult,
                    nearbyStores: []
                };

                document.dispatchEvent(new CustomEvent('modalSearchComplete', {
                    detail: searchData
                }));

                // Hide modal and show app
                ageModal.classList.add('hidden');
                app.classList.remove('hidden');

                console.log('NUCLEAR: Search complete!');

            } catch (error) {
                console.error('NUCLEAR: Geocoding failed:', error);
                modalError.textContent = error.message || 'Unable to find location. Please try again.';
                modalError.classList.remove('hidden');
            } finally {
                newBtn.disabled = false;
                newBtn.textContent = 'Find Stores';
                modalPostalCode.disabled = false;
            }
        });

        // Also handle Enter key
        modalPostalCode.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                newBtn.click();
            }
        });

        console.log('NUCLEAR: Modal override complete!');
        return true;
    }

    // Try immediately and keep trying
    let attempts = 0;
    const nuclearInterval = setInterval(() => {
        attempts++;
        console.log(`NUCLEAR: Attempt ${attempts} to override modal...`);

        if (nuclearModalSearch()) {
            console.log('NUCLEAR: Override successful!');
            clearInterval(nuclearInterval);
        } else if (attempts > 100) {
            console.log('NUCLEAR: Giving up after 100 attempts');
            clearInterval(nuclearInterval);
        }
    }, 100);

    // Also try on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log('NUCLEAR: DOMContentLoaded - trying modal override...');
        nuclearModalSearch();
    });
    </script>
    </body>
    </html>
    <?php
} else {
    get_footer();
}
?>