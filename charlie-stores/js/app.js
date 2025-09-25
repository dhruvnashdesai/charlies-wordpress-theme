/**
 * Main Application Controller
 * 
 * Orchestrates all modules and handles user interactions
 * WordPress Migration: Entry point for theme integration
 */

class CharlieStoreApp {
    constructor() {
        this.mapManager = null;
        this.storeManager = null;
        this.geocodingService = null;
        this.ageVerification = null;
        
        this.isInitialized = false;
        this.currentLocation = null;
        this.currentStores = [];
        this.warehouseAdded = false;
        
        // DOM elements (minimal for full screen map)
        this.mapContainer = null;
        this.loadingSpinner = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Charlie Store App...');
            
            // Wait for age verification before initializing map
            await this.waitForAgeVerification();
            
            // Initialize services
            this.initServices();
            
            // Initialize DOM elements and events
            this.initDOMElements();
            this.bindEvents();
            
            // Initialize map
            await this.initMap();
            
            // Listen for initial search data from modal
            document.addEventListener('modalSearchComplete', async (e) => {
                await this.handleModalSearchComplete(e.detail);
            });
            
            // Load any saved search (will be overridden by modal if user searches)
            this.loadSavedSearch();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
            
            // Track app initialization
            this.trackEvent('app_initialized');
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showError('Application failed to initialize. Please refresh the page.');
        }
    }

    /**
     * Wait for age verification to complete
     */
    async waitForAgeVerification() {
        return new Promise((resolve) => {
            const checkVerification = () => {
                if (window.ageVerification && window.ageVerification.getVerificationStatus()) {
                    resolve();
                } else {
                    setTimeout(checkVerification, 100);
                }
            };
            checkVerification();
        });
    }

    /**
     * Initialize service instances
     */
    initServices() {
        // Get service instances (created by individual modules)
        this.storeManager = window.storeManager;
        this.geocodingService = window.geocodingService;
        this.ageVerification = window.ageVerification;
        
        if (!this.storeManager || !this.geocodingService) {
            throw new Error('Required services not available');
        }
    }

    /**
     * Initialize DOM elements
     */
    initDOMElements() {
        this.mapContainer = document.getElementById('map');
        this.loadingSpinner = document.getElementById('mapLoading');
        
        if (!this.mapContainer) {
            throw new Error('Map container not found');
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {        
        
        document.addEventListener('map:mapInitialized', (e) => {
            console.log('Map initialized and ready');
        });
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.saveCurrentSearch();
        });
    }

    /**
     * Initialize the map
     */
    async initMap() {
        this.mapManager = new MapManager();
        await this.mapManager.init();

        // Initialize category circles system
        this.categoryCircles = new CategoryCircles(this.mapManager);
    }





    /**
     * Update map with search results
     * @param {object} geocodeResult - Geocoding result
     * @param {Array} stores - Nearby stores
     * @param {boolean} dramatic - Use dramatic globe-to-location animation
     */
    updateMap(geocodeResult, stores, dramatic = false) {
        if (!this.mapManager.isMapInitialized()) {
            console.warn('Map not initialized, skipping update');
            return;
        }
        
        // Clear existing markers
        this.mapManager.clearMarkers();
        
        // Get target zoom from config
        const targetZoom = getConfig('MAPBOX.TARGET_ZOOM', 12);
        
        // Always add user location marker first
        this.mapManager.addUserLocationMarker(geocodeResult.coordinates.lngLat);
        
        if (dramatic) {
            // Dramatic animation to location
            this.mapManager.centerOn(geocodeResult.coordinates.lngLat, targetZoom, true);
            
            // Add fake warehouse marker after animation completes
            setTimeout(() => {
                this.addFakeWarehouseMarker(geocodeResult.coordinates.lngLat);
            }, 3500); // Wait for dramatic animation to complete
        } else {
            // Standard update
            this.mapManager.centerOn(geocodeResult.coordinates.lngLat, targetZoom);
            
            // Add fake warehouse marker immediately
            setTimeout(() => {
                this.addFakeWarehouseMarker(geocodeResult.coordinates.lngLat);
            }, 500);
        }
    }

    /**
     * Add a fake warehouse marker within viewport of the user's location
     * @param {Array} userCoordinates - [longitude, latitude] of user's postal code
     */
    addFakeWarehouseMarker(userCoordinates) {
        if (!this.mapManager.isMapInitialized()) return;
        
        // Prevent multiple warehouse additions for the same location
        if (this.warehouseAdded && this.currentLocation && 
            JSON.stringify(this.currentLocation.coordinates.lngLat) === JSON.stringify(userCoordinates)) {
            return;
        }

        // Clear any existing warehouse markers first
        this.mapManager.clearWarehouseMarkers();

        // Generate random coordinates within viewport bounds
        const [userLng, userLat] = userCoordinates;
        const fakeWarehouse = this.generateFakeWarehouseLocation(userLat, userLng);
        
        // Store the warehouse data to prevent regeneration
        this.currentWarehouse = fakeWarehouse;
        
        // Add the warehouse marker
        this.mapManager.addWarehouseMarker(fakeWarehouse);
        
        // Mark as added
        this.warehouseAdded = true;
        
        console.log(`Added fake warehouse at ${fakeWarehouse.distance.toFixed(1)}km from postal code`);
    }

    /**
     * Generate warehouse location at fixed position on vignette edge
     * Desktop: Right center of vignette | Mobile: Top center of vignette
     * @param {number} centerLat - Center latitude
     * @param {number} centerLng - Center longitude
     * @returns {object} Warehouse data with fixed screen position
     */
    generateFakeWarehouseLocation(centerLat, centerLng) {
        // Position warehouse at fixed location on vignette edge
        // Desktop: right center | Mobile: top center

        // Get screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = screenWidth <= 768;

        // Calculate 10km radius in pixels (similar to vignette calculation)
        const earthCircumference = 40075017;
        const currentZoom = this.mapManager ? this.mapManager.map.getZoom() : 12;
        const metersPerPixel = earthCircumference * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, currentZoom + 8);
        const tenKmInPixels = (10 * 1000) / metersPerPixel;

        // Match the mobile vignette radius logic
        const mobileRadiusMultiplier = isMobile ? 0.25 : 1.0; // Same multiplier as vignette
        const baseOuterRadius = tenKmInPixels * 1.2 * mobileRadiusMultiplier;
        const exclusionRadius = Math.max(baseOuterRadius, isMobile ? 200 : 300);

        // Position warehouse at fixed locations on vignette edge using category circles approach
        // Get vignette information from map manager
        const vignetteInfo = this.mapManager.getCurrentVignetteInfo();
        const { centerX, centerY, innerRadius } = vignetteInfo;

        // Use the same approach as category circles
        const vignetteRadius = innerRadius; // Exactly on the edge, not outside
        const centerPoint = { x: centerX, y: centerY };

        console.log('Warehouse positioning debug:', {
            isMobile,
            vignetteInfo,
            centerPoint,
            vignetteRadius,
            screenWidth,
            screenHeight
        });

        let screenX, screenY;

        // Marker sizes (from mapManager.js)
        const markerSize = isMobile ? 120 : 80;
        const markerRadius = markerSize / 2;

        if (isMobile) {
            // Mobile: Top center ON the vignette edge (angle = -90 degrees)
            // Position marker so its bottom edge touches the vignette edge
            const angle = -90; // Due up
            const radians = (angle * Math.PI) / 180;
            const edgeX = centerPoint.x + (vignetteRadius * Math.cos(radians));
            const edgeY = centerPoint.y + (vignetteRadius * Math.sin(radians));

            // Fine-tuning: mobile is centered, just move up more
            screenX = edgeX - 25; // Keep left position
            screenY = edgeY - markerRadius - 75; // Move up by marker radius + 75px
        } else {
            // Desktop: Right center ON the vignette edge (angle = 0 degrees)
            // Position marker so its left edge touches the vignette edge
            const angle = 0; // Due right
            const radians = (angle * Math.PI) / 180;
            const edgeX = centerPoint.x + (vignetteRadius * Math.cos(radians));
            const edgeY = centerPoint.y + (vignetteRadius * Math.sin(radians));

            // Fine-tuning: move more to the right and slightly more up
            screenX = edgeX + markerRadius + 120; // Move right by marker radius + 120px
            screenY = edgeY - 35; // Move up by 35px
        }

        console.log('Warehouse final position:', { screenX, screenY });
        console.log('Calculation details:', {
            angle: isMobile ? -90 : 0,
            vignetteRadius,
            centerPoint,
            markerSize,
            markerRadius,
            edgePosition: isMobile ?
                { edgeX: centerPoint.x, edgeY: centerPoint.y - vignetteRadius } :
                { edgeX: centerPoint.x + vignetteRadius, edgeY: centerPoint.y }
        });

        // Clamp to screen bounds if necessary
        const clampedX = Math.max(50, Math.min(screenWidth - 50, screenX));
        const clampedY = Math.max(50, Math.min(screenHeight - 50, screenY));
        
        // Create warehouse data with screen position
        // Use a single warehouse store ID (configurable in WordPress admin)
        const warehouseStoreId = getConfig('APP.WAREHOUSE_STORE_ID', 1);

        const fakeWarehouse = {
            id: warehouseStoreId,
            name: "Charlie's Distribution Center",
            type: 'warehouse',
            screenPosition: { x: clampedX, y: clampedY },
            address: this.generateFakeAddress(centerLat, centerLng),
            distance: Math.random() * 30 + 15, // 15-45km away
            distanceText: `${(Math.random() * 30 + 15).toFixed(1)} km away`,
            hours: "24/7 Distribution",
            description: "Main distribution hub serving your area",
            postalCode: this.currentLocation?.postalCode // Pass postal code for regional filtering
        };
        
        return fakeWarehouse;
    }

    /**
     * Calculate new coordinates from center point, distance and bearing
     * @param {number} lat - Center latitude
     * @param {number} lng - Center longitude  
     * @param {number} distanceKm - Distance in kilometers
     * @param {number} bearingDeg - Bearing in degrees
     * @returns {object} New coordinates {lat, lng}
     */
    calculateCoordinatesFromDistance(lat, lng, distanceKm, bearingDeg) {
        const earthRadiusKm = 6371;
        const bearingRad = bearingDeg * (Math.PI / 180);
        const latRad = lat * (Math.PI / 180);
        const lngRad = lng * (Math.PI / 180);
        
        const newLatRad = Math.asin(
            Math.sin(latRad) * Math.cos(distanceKm / earthRadiusKm) +
            Math.cos(latRad) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(bearingRad)
        );
        
        const newLngRad = lngRad + Math.atan2(
            Math.sin(bearingRad) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(latRad),
            Math.cos(distanceKm / earthRadiusKm) - Math.sin(latRad) * Math.sin(newLatRad)
        );
        
        return {
            lat: newLatRad * (180 / Math.PI),
            lng: newLngRad * (180 / Math.PI)
        };
    }

    /**
     * Generate a fake address for the warehouse
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {string} Fake address
     */
    generateFakeAddress(lat, lng) {
        const streetNumbers = [1250, 2890, 3456, 4721, 5432, 6789, 7123, 8456, 9876];
        const streetNames = [
            'Industrial Blvd', 'Warehouse Way', 'Distribution Dr', 'Logistics Lane',
            'Commerce Ct', 'Trade St', 'Business Park Rd', 'Supply Chain Ave'
        ];
        
        const streetNumber = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        
        return `${streetNumber} ${streetName}`;
    }



    /**
     * Save current search to localStorage
     * @param {string} postalCode - Postal code searched
     * @param {object} location - Geocoded location
     * @param {Array} stores - Found stores
     */
    saveSearch(postalCode, location, stores) {
        try {
            const searchData = {
                postalCode,
                location,
                stores: stores.map(store => ({
                    id: store.id,
                    name: store.name,
                    distance: store.distance
                })),
                timestamp: Date.now()
            };
            
            localStorage.setItem(
                getConfig('STORAGE_KEYS.LAST_SEARCH'), 
                JSON.stringify(searchData)
            );
        } catch (error) {
            console.warn('Unable to save search:', error);
        }
    }

    /**
     * Handle search completion from modal
     */
    async handleModalSearchComplete(searchData) {
        try {
            if (!searchData) return;

            console.log('Handling modal search completion:', searchData.postalCode);
            
            // Set current location and reset warehouse flag
            this.currentLocation = searchData.geocodeResult;
            this.warehouseAdded = false;
            
            // Update map with dramatic animation (no stores needed)
            this.updateMap(searchData.geocodeResult, [], true);
            
            // Save for future sessions
            this.saveSearch(searchData.postalCode, searchData.geocodeResult, []);
            
            console.log('Modal search complete - map centered on location');
            
        } catch (error) {
            console.error('Failed to handle modal search completion:', error);
        }
    }

    /**
     * Load saved search from localStorage
     */
    loadSavedSearch() {
        try {
            const saved = localStorage.getItem(getConfig('STORAGE_KEYS.LAST_SEARCH'));
            if (!saved) return;
            
            const searchData = JSON.parse(saved);
            const age = Date.now() - searchData.timestamp;
            
            // Only use saved search if less than 1 hour old
            if (age < 60 * 60 * 1000 && searchData.postalCode) {
                console.log('Found saved search:', searchData.postalCode);
                // The saved search will be used if user doesn't have initial search data
            }
        } catch (error) {
            console.warn('Unable to load saved search:', error);
        }
    }

    /**
     * Save current search state
     */
    saveCurrentSearch() {
        if (this.currentLocation && this.currentStores.length > 0) {
            this.saveSearch(
                this.postalCodeInput.value,
                this.currentLocation,
                this.currentStores
            );
        }
    }


    /**
     * Track analytics events
     * @param {string} eventName - Event name
     * @param {object} eventData - Additional event data
     */
    trackEvent(eventName, eventData = {}) {
        // Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', eventName, {
                event_category: 'store_finder',
                ...eventData
            });
        }
        
        // WordPress hooks
        if (typeof window !== 'undefined' && window.wp && window.wp.hooks) {
            window.wp.hooks.doAction('charlie_analytics', eventName, eventData);
        }
        
        console.log('App Event:', eventName, eventData);
    }

    /**
     * Get app status (useful for debugging)
     * @returns {object} Current app status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasLocation: !!this.currentLocation,
            storeCount: this.currentStores.length,
            mapReady: this.mapManager?.isMapInitialized(),
            ageVerified: this.ageVerification?.getVerificationStatus()
        };
    }
}

// WordPress Integration Class
class WordPressCharlieApp extends CharlieStoreApp {
    constructor() {
        super();
        
        // WordPress-specific initialization
        if (typeof wp !== 'undefined' && wp.hooks) {
            this.initWordPressHooks();
        }
    }

    /**
     * Initialize WordPress hooks and filters
     */
    initWordPressHooks() {
        // Allow theme/plugin customization
        wp.hooks.addAction('charlie_app_init', 'charlie-stores', (app) => {
            console.log('Charlie App initialized in WordPress');
        });

        // Hook for search customization
        wp.hooks.addFilter('charlie_search_params', 'charlie-stores', (params) => {
            return params;
        });
    }

    /**
     * WordPress-specific product page navigation
     * @param {object} store - Store data
     */
    handleBrowseProducts(store) {
        if (typeof wp !== 'undefined' && store.products_url) {
            // Use WordPress navigation
            window.location.href = store.products_url;
            return;
        }
        
        // Fall back to parent implementation
        super.handleBrowseProducts(store);
    }
}

// Initialize the application
let charlieApp;

// Wait for DOM and all dependencies
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all modules are loaded
    setTimeout(() => {
        if (isWordPressEnvironment()) {
            charlieApp = new WordPressCharlieApp();
        } else {
            charlieApp = new CharlieStoreApp();
        }
        
        // Make available globally for debugging
        window.charlieApp = charlieApp;
        
        // Also make map manager available for manual styling
        window.forceThickStreets = () => {
            if (charlieApp && charlieApp.mapManager) {
                console.log('Forcing thick street styling...');
                charlieApp.mapManager.applyGTAStyleEnhancements();
            }
        };
    }, 100);
});

// Export for WordPress/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharlieStoreApp, WordPressCharlieApp };
}