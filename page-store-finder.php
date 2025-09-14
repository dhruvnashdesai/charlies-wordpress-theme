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
    <!-- BYPASS EVERYTHING: Add direct postal code input to page -->
    <div id="directPostalInput" style="position: fixed; top: 20px; right: 20px; z-index: 10000; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Direct Postal Code Entry</h3>
        <input type="text" id="directPostalCode" placeholder="e.g., M5V 3A8" style="padding: 8px; margin-right: 8px; border: 1px solid #ddd; border-radius: 4px; width: 120px;" maxlength="7">
        <button id="directSearchBtn" style="padding: 8px 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">Search</button>
        <div id="directError" style="color: red; font-size: 12px; margin-top: 5px; display: none;"></div>
        <div id="directStatus" style="color: green; font-size: 12px; margin-top: 5px; display: none;"></div>
    </div>

    <script>
    console.log('DIRECT BYPASS: Starting...');

    const MAPBOX_TOKEN = '<?php echo get_option('charlie_mapbox_token'); ?>';

    async function directMapboxCall(postalCode) {
        console.log('DIRECT: Calling Mapbox for:', postalCode);

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postalCode + ', Canada')}.json?access_token=${MAPBOX_TOKEN}&country=ca&types=postcode&limit=1`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Mapbox API error: ${response.status}`);
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

    function setupDirectInput() {
        const directInput = document.getElementById('directPostalCode');
        const directBtn = document.getElementById('directSearchBtn');
        const directError = document.getElementById('directError');
        const directStatus = document.getElementById('directStatus');
        const ageModal = document.getElementById('ageModal');
        const app = document.getElementById('app');

        if (!directInput || !directBtn) {
            console.log('DIRECT: Elements not found, retrying...');
            return false;
        }

        console.log('DIRECT: Setting up handlers...');

        async function handleDirectSearch() {
            const postalCode = directInput.value?.trim();

            directError.style.display = 'none';
            directStatus.style.display = 'none';

            if (!postalCode) {
                directError.textContent = 'Please enter a postal code';
                directError.style.display = 'block';
                directInput.focus();
                return;
            }

            const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
            if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
                directError.textContent = 'Please enter a valid Canadian postal code (e.g., M5V 3A8)';
                directError.style.display = 'block';
                directInput.focus();
                return;
            }

            try {
                directBtn.disabled = true;
                directBtn.textContent = 'Searching...';
                directInput.disabled = true;

                console.log('DIRECT: Calling directMapboxCall...');
                const geocodeResult = await directMapboxCall(postalCode);
                console.log('DIRECT: Success:', geocodeResult);

                directStatus.textContent = `Found: ${geocodeResult.formattedAddress}`;
                directStatus.style.display = 'block';

                // Skip modal completely and go straight to app
                if (ageModal) ageModal.style.display = 'none';
                if (app) app.classList.remove('hidden');

                // Dispatch the event for the map
                const searchData = {
                    postalCode,
                    geocodeResult,
                    nearbyStores: []
                };

                document.dispatchEvent(new CustomEvent('modalSearchComplete', {
                    detail: searchData
                }));

                console.log('DIRECT: Complete!');

            } catch (error) {
                console.error('DIRECT: Error:', error);
                directError.textContent = error.message || 'Geocoding failed';
                directError.style.display = 'block';
            } finally {
                directBtn.disabled = false;
                directBtn.textContent = 'Search';
                directInput.disabled = false;
            }
        }

        directBtn.addEventListener('click', handleDirectSearch);

        directInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleDirectSearch();
            }
        });

        // Format input as user types
        directInput.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (value.length > 3) {
                value = value.slice(0, 3) + ' ' + value.slice(3, 6);
            }
            e.target.value = value;
        });

        console.log('DIRECT: Setup complete!');
        return true;
    }

    // Try immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDirectInput);
    } else {
        setupDirectInput();
    }

    console.log('DIRECT: Script loaded');
    </script>
    </body>
    </html>
    <?php
} else {
    get_footer();
}
?>