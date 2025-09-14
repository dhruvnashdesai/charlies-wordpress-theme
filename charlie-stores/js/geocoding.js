/**
 * Geocoding Module
 * 
 * Handles postal code to coordinates conversion using Mapbox Geocoding API
 * WordPress Migration: Fully compatible with WordPress environment
 */

class GeocodingService {
    constructor() {
        this.accessToken = getConfig('MAPBOX.ACCESS_TOKEN');
        this.baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
        this.bounds = getConfig('MAPBOX.MAX_BOUNDS');
        this.cache = new Map();
        this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    }

    /**
     * Validate Canadian postal code format
     * @param {string} postalCode - The postal code to validate
     * @returns {boolean} True if valid Canadian postal code format
     */
    validatePostalCode(postalCode) {
        if (!postalCode || typeof postalCode !== 'string') {
            return false;
        }

        // Remove spaces and convert to uppercase
        const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
        
        // Canadian postal code pattern: A1A 1A1 or A1A1A1
        const canadianPattern = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;
        
        return canadianPattern.test(cleaned);
    }

    /**
     * Format postal code to standard Canadian format (A1A 1A1)
     * @param {string} postalCode - The postal code to format
     * @returns {string} Formatted postal code
     */
    formatPostalCode(postalCode) {
        if (!postalCode) return '';
        
        const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
        
        if (cleaned.length === 6 && this.validatePostalCode(cleaned)) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        }
        
        return postalCode;
    }

    /**
     * Get cached geocoding result
     * @param {string} postalCode - The postal code
     * @returns {object|null} Cached result or null
     */
    getCachedResult(postalCode) {
        const key = this.formatPostalCode(postalCode);
        const cached = this.cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.data;
        }
        
        // Remove expired cache entry
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }

    /**
     * Cache geocoding result
     * @param {string} postalCode - The postal code
     * @param {object} data - The geocoding result
     */
    setCachedResult(postalCode, data) {
        const key = this.formatPostalCode(postalCode);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Geocode a Canadian postal code to coordinates
     * @param {string} postalCode - The postal code to geocode
     * @returns {Promise<object>} Promise resolving to geocoding result
     */
    async geocodePostalCode(postalCode) {
        // Validate input
        if (!this.validatePostalCode(postalCode)) {
            throw new Error(getConfig('MESSAGES.INVALID_POSTAL_CODE'));
        }

        const formattedCode = this.formatPostalCode(postalCode);
        
        // Check cache first
        const cached = this.getCachedResult(formattedCode);
        if (cached) {
            return cached;
        }

        // Check API token
        if (!this.accessToken || this.accessToken.includes('example')) {
            throw new Error('Mapbox access token not configured. Please add your token to config.js');
        }

        try {
            const url = this.buildGeocodingUrl(formattedCode);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Check if we got any results
            if (!data.features || data.features.length === 0) {
                throw new Error("Please enter a valid Canadian postal code");
            }
            
            const result = this.processGeocodingResponse(data, formattedCode);
            
            // Cache successful result
            this.setCachedResult(formattedCode, result);
            
            return result;
            
        } catch (error) {
            console.error('Geocoding error:', error);
            
            // Provide user-friendly error message
            if (error.message.includes('API error')) {
                throw new Error(getConfig('MESSAGES.GEOCODING_FAILED'));
            }
            
            throw error;
        }
    }

    /**
     * Build Mapbox Geocoding API URL
     * @param {string} postalCode - Formatted postal code
     * @returns {string} Complete API URL
     */
    buildGeocodingUrl(postalCode) {
        const params = new URLSearchParams({
            access_token: this.accessToken,
            country: 'ca', // Restrict to Canada
            types: 'postcode',
            limit: 1,
            // Bias results to Canada bounds
            bbox: `${this.bounds[0][0]},${this.bounds[0][1]},${this.bounds[1][0]},${this.bounds[1][1]}`
        });

        return `${this.baseUrl}${encodeURIComponent(postalCode + ', Canada')}.json?${params}`;
    }

    /**
     * Process Mapbox geocoding API response
     * @param {object} data - API response data
     * @param {string} originalCode - Original postal code
     * @returns {object} Processed result
     */
    processGeocodingResponse(data, originalCode) {
        // Features are already validated before this method is called

        const feature = data.features[0];
        const [longitude, latitude] = feature.center;
        
        // Extract location information
        const context = feature.context || [];
        const placeName = feature.place_name || '';
        
        // Parse location components
        const locationInfo = this.parseLocationContext(context, placeName);

        return {
            coordinates: {
                latitude,
                longitude,
                // Convert to array for Mapbox compatibility
                lngLat: [longitude, latitude]
            },
            postalCode: originalCode,
            location: {
                city: locationInfo.city,
                province: locationInfo.province,
                country: 'Canada'
            },
            formattedAddress: placeName,
            confidence: this.calculateConfidence(feature),
            bbox: feature.bbox || null,
            raw: feature // Keep original response for debugging
        };
    }

    /**
     * Parse location context from Mapbox response
     * @param {Array} context - Context array from Mapbox
     * @param {string} placeName - Place name from response
     * @returns {object} Parsed location info
     */
    parseLocationContext(context, placeName) {
        const locationInfo = {
            city: null,
            province: null
        };

        // Parse context for location information
        context.forEach(item => {
            if (item.id && item.text) {
                if (item.id.startsWith('place.')) {
                    locationInfo.city = item.text;
                } else if (item.id.startsWith('region.')) {
                    locationInfo.province = item.text;
                }
            }
        });

        // Fallback: try to extract from place name
        if (!locationInfo.city || !locationInfo.province) {
            const parts = placeName.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                if (!locationInfo.city) locationInfo.city = parts[1];
                if (!locationInfo.province) locationInfo.province = parts[2];
            }
        }

        return locationInfo;
    }

    /**
     * Calculate confidence score for geocoding result
     * @param {object} feature - Mapbox feature object
     * @returns {number} Confidence score (0-1)
     */
    calculateConfidence(feature) {
        let confidence = 0.5; // Base confidence
        
        // Higher confidence for exact postal code matches
        if (feature.properties && feature.properties.accuracy === 'postcode') {
            confidence += 0.3;
        }
        
        // Higher confidence if bbox is small (more precise)
        if (feature.bbox) {
            const bboxSize = (feature.bbox[2] - feature.bbox[0]) * (feature.bbox[3] - feature.bbox[1]);
            if (bboxSize < 0.01) { // Very small bbox
                confidence += 0.2;
            }
        }
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Clear geocoding cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// WordPress Integration
class WordPressGeocodingService extends GeocodingService {
    constructor() {
        super();
        
        // Use WordPress REST API if available for server-side geocoding
        if (typeof wp !== 'undefined' && wp.apiFetch) {
            this.wpApiAvailable = true;
        }
    }

    /**
     * WordPress-specific geocoding with server-side caching
     * @param {string} postalCode - The postal code to geocode
     * @returns {Promise<object>} Geocoding result
     */
    async geocodePostalCodeWP(postalCode) {
        // Try WordPress API first (server-side caching)
        if (this.wpApiAvailable) {
            try {
                const result = await wp.apiFetch({
                    path: `/charlie-stores/v1/geocode/${encodeURIComponent(postalCode)}`
                });
                
                if (result && result.coordinates) {
                    return result;
                }
            } catch (error) {
                console.warn('WordPress geocoding failed, falling back to client-side:', error);
            }
        }

        // Fall back to client-side geocoding
        return this.geocodePostalCode(postalCode);
    }
}

// Initialize service
let geocodingService;
document.addEventListener('DOMContentLoaded', () => {
    if (isWordPressEnvironment()) {
        geocodingService = new WordPressGeocodingService();
    } else {
        geocodingService = new GeocodingService();
    }
    
    // Make available globally
    window.geocodingService = geocodingService;
});

// Export for WordPress/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GeocodingService, WordPressGeocodingService };
}