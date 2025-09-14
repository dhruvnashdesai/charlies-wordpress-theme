/**
 * Configuration file for Charlie's Nicotine Store application
 * 
 * This file contains all configuration constants and settings.
 * WordPress Migration: Move these to wp_localize_script() for security
 */

// Application Configuration
const APP_CONFIG = {
    // Mapbox Configuration
    MAPBOX: {
        // IMPORTANT: Replace with your actual Mapbox access token
        // For WordPress: Use wp_localize_script to pass this securely
        ACCESS_TOKEN: 'pk.eyJ1IjoiZGhydXZuYXNoZGVzYWkiLCJhIjoiY21mOGh1MTR0MG9sMzJtcHZpd2c4bG1odSJ9.b3fp-bzvNNzpa2zqh-4nzA',
        
        // Map Style URL - Dark v11 style
        STYLE_URL: 'mapbox://styles/mapbox/dark-v11',
        
        // Default map center (Global view)
        DEFAULT_CENTER: [0, 20],
        DEFAULT_ZOOM: 1.5,
        
        // Target zoom level for postal code locations
        TARGET_ZOOM: 12,
        
        // Map bounds for Canada (approximate)
        MAX_BOUNDS: [
            [-141.0, 41.7],  // Southwest coordinates
            [-52.6, 83.1]    // Northeast coordinates
        ]
    },
    
    // Application Settings
    APP: {
        MINIMUM_AGE: 19,
        SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        SEARCH_RADIUS_KM: 50,
        MAX_STORE_RESULTS: 10
    },
    
    // API Endpoints
    // WordPress Migration: These would typically be REST API endpoints
    ENDPOINTS: {
        GEOCODING: 'https://api.mapbox.com/geocoding/v5/mapbox.places/',
        // For WordPress: Use admin-ajax.php or REST API
        STORES: '/wp-json/charlie-stores/v1/stores',
        PRODUCTS: '/wp-json/charlie-stores/v1/products'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        AGE_VERIFIED: 'charlie_age_verified',
        LAST_SEARCH: 'charlie_last_search',
        USER_LOCATION: 'charlie_user_location'
    },
    
    // Error Messages
    MESSAGES: {
        AGE_VERIFICATION_FAILED: 'You must be 19 or older to access this site.',
        INVALID_POSTAL_CODE: 'Please enter a valid Canadian postal code (e.g., M5V 3A8).',
        GEOCODING_FAILED: 'Unable to find that postal code. Please check and try again.',
        MAP_LOAD_ERROR: 'Unable to load map. Please refresh the page and try again.',
        NO_STORES_FOUND: 'No stores found within 50km of your location.',
        GENERIC_ERROR: 'An error occurred. Please try again.'
    }
};

// WordPress Compatibility
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
}

/**
 * Utility function to check if running in WordPress environment
 * @returns {boolean} True if WordPress detected
 */
function isWordPressEnvironment() {
    return typeof window !== 'undefined' && 
           (window.wp !== undefined || 
            document.querySelector('meta[name="generator"][content*="WordPress"]') !== null);
}

/**
 * Get configuration value with WordPress override support
 * @param {string} path - Dot notation path to config value (e.g., 'MAPBOX.ACCESS_TOKEN')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value
 */
function getConfig(path, defaultValue = null) {
    // Check for WordPress localized data first
    if (typeof window !== 'undefined' && window.charlie_config) {
        const wpValue = getNestedValue(window.charlie_config, path);
        if (wpValue !== undefined) {
            return wpValue;
        }
    }
    
    // Fall back to APP_CONFIG
    return getNestedValue(APP_CONFIG, path, defaultValue);
}

/**
 * Helper function to get nested object values using dot notation
 * @param {object} obj - Object to search
 * @param {string} path - Dot notation path
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Found value or default
 */
function getNestedValue(obj, path, defaultValue = null) {
    return path.split('.').reduce((current, key) => {
        return (current && current[key] !== undefined) ? current[key] : defaultValue;
    }, obj);
}

// Export for WordPress/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG, getConfig, isWordPressEnvironment };
}