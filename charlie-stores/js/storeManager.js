/**
 * Store Manager Module
 * 
 * Handles store data, mock warehouse locations, and store-related functionality
 * WordPress Migration: Ready for WordPress REST API integration
 */

class StoreManager {
    constructor() {
        this.stores = [];
        this.searchRadius = getConfig('APP.SEARCH_RADIUS_KM');
        this.maxResults = getConfig('APP.MAX_STORE_RESULTS');
        
        // Initialize with mock data (replace with API calls in production)
        this.initializeMockStores();
    }

    /**
     * Initialize with mock store data
     * In WordPress: This would load from database via REST API
     */
    initializeMockStores() {
        this.stores = [
            {
                id: 'store_001',
                name: "Charlie's Downtown Toronto",
                address: "123 Queen Street W, Toronto, ON M5H 2M9",
                coordinates: [-79.3849, 43.6488], // [lng, lat]
                phone: "(416) 555-0123",
                hours: "Mon-Sat 9AM-10PM, Sun 11AM-8PM",
                email: "downtown@charliesstore.ca",
                manager: "Sarah Johnson",
                features: ["drive-thru", "express-pickup", "rewards-program"],
                products: {
                    categories: ["nicotine-pouches", "vaping", "traditional"],
                    featured: ["zyn-pouches", "vuse-pods", "premium-cigars"]
                },
                rating: 4.8,
                reviews: 234,
                established: "2019"
            },
            {
                id: 'store_002',
                name: "Charlie's Mississauga West",
                address: "456 Dundas Street W, Mississauga, ON L5B 1H8",
                coordinates: [-79.6441, 43.5890],
                phone: "(905) 555-0456",
                hours: "Daily 8AM-11PM",
                email: "mississauga@charliesstore.ca",
                manager: "Mike Chen",
                features: ["24-hour-access", "bulk-orders", "delivery"],
                products: {
                    categories: ["nicotine-pouches", "vaping", "accessories"],
                    featured: ["on-pouches", "juul-alternative", "mod-kits"]
                },
                rating: 4.6,
                reviews: 189,
                established: "2020"
            },
            {
                id: 'store_003',
                name: "Charlie's North York Hub",
                address: "789 Yonge Street, North York, ON M2N 5X3",
                coordinates: [-79.4103, 43.7615],
                phone: "(416) 555-0789",
                hours: "Mon-Fri 7AM-10PM, Weekends 9AM-9PM",
                email: "northyork@charliesstore.ca",
                manager: "Amanda Rodriguez",
                features: ["expert-consultation", "custom-orders", "loyalty-points"],
                products: {
                    categories: ["premium-cigars", "nicotine-pouches", "vaping"],
                    featured: ["cuban-cigars", "swedish-snus", "premium-mods"]
                },
                rating: 4.9,
                reviews: 312,
                established: "2018"
            },
            {
                id: 'store_004',
                name: "Charlie's Scarborough East",
                address: "321 Kingston Road, Scarborough, ON M1M 1P1",
                coordinates: [-79.2300, 43.6921],
                phone: "(416) 555-0321",
                hours: "Daily 9AM-10PM",
                email: "scarborough@charliesstore.ca",
                manager: "David Kim",
                features: ["student-discounts", "group-deals", "online-ordering"],
                products: {
                    categories: ["budget-friendly", "nicotine-pouches", "vaping"],
                    featured: ["value-packs", "starter-kits", "bulk-pouches"]
                },
                rating: 4.5,
                reviews: 156,
                established: "2021"
            },
            {
                id: 'store_005',
                name: "Charlie's Etobicoke West",
                address: "654 The Queensway, Etobicoke, ON M8Y 1K8",
                coordinates: [-79.5200, 43.6100],
                phone: "(416) 555-0654",
                hours: "Mon-Thu 8AM-9PM, Fri-Sun 8AM-11PM",
                email: "etobicoke@charliesstore.ca",
                manager: "Jennifer Walsh",
                features: ["weekend-specials", "family-owned", "local-products"],
                products: {
                    categories: ["artisanal", "nicotine-pouches", "accessories"],
                    featured: ["local-blends", "craft-pouches", "custom-accessories"]
                },
                rating: 4.7,
                reviews: 203,
                established: "2017"
            },
            {
                id: 'store_006',
                name: "Charlie's Markham North",
                address: "987 Highway 7 E, Markham, ON L3R 1A1",
                coordinates: [-79.3370, 43.8561],
                phone: "(905) 555-0987",
                hours: "Daily 9AM-10PM",
                email: "markham@charliesstore.ca",
                manager: "Lisa Thompson",
                features: ["tech-forward", "app-ordering", "smart-pickup"],
                products: {
                    categories: ["tech-vaping", "nicotine-pouches", "innovation"],
                    featured: ["smart-pods", "app-controlled", "next-gen-pouches"]
                },
                rating: 4.8,
                reviews: 278,
                established: "2022"
            }
        ];

        console.log(`Initialized ${this.stores.length} mock stores`);
    }

    /**
     * Find stores within radius of coordinates (always returns stores for Canadian locations)
     * @param {Array} userCoordinates - [longitude, latitude]
     * @param {number} radiusKm - Search radius in kilometers (not used for Canadian locations)
     * @returns {Promise<Array>} Array of nearby stores with distances
     */
    async findNearbyStores(userCoordinates, radiusKm = this.searchRadius) {
        try {
            // In WordPress: This would make a REST API call
            if (isWordPressEnvironment()) {
                return await this.findNearbyStoresWP(userCoordinates, radiusKm);
            }

            const [userLng, userLat] = userCoordinates;
            
            // Check if coordinates are within Canada bounds (approximate)
            const isInCanada = this.isLocationInCanada(userLat, userLng);
            
            if (!isInCanada) {
                throw new Error("Charlie's only sells in Canada");
            }

            // For Canadian locations, always return stores with calculated distances
            const nearbyStores = this.stores.map(store => {
                const distance = this.calculateDistance(
                    userLat, userLng,
                    store.coordinates[1], store.coordinates[0]
                );

                return {
                    ...store,
                    distance,
                    // Add computed fields
                    distanceText: `${distance.toFixed(1)} km away`,
                    estimatedDriveTime: this.estimateDriveTime(distance)
                };
            });

            // Sort by distance and return all stores (Canada-wide coverage)
            nearbyStores.sort((a, b) => a.distance - b.distance);
            
            return nearbyStores.slice(0, this.maxResults);
            
        } catch (error) {
            console.error('Error finding nearby stores:', error);
            throw error; // Re-throw to preserve the specific error message
        }
    }

    /**
     * Check if coordinates are within Canada's approximate bounds
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if location is in Canada
     */
    isLocationInCanada(lat, lng) {
        // Canada's approximate bounds
        const canadaBounds = {
            north: 83.1,
            south: 41.7,
            west: -141.0,
            east: -52.6
        };
        
        return lat >= canadaBounds.south && 
               lat <= canadaBounds.north && 
               lng >= canadaBounds.west && 
               lng <= canadaBounds.east;
    }

    /**
     * WordPress-specific store search using REST API
     * @param {Array} userCoordinates - [longitude, latitude]
     * @param {number} radiusKm - Search radius in kilometers
     * @returns {Promise<Array>} Array of nearby stores
     */
    async findNearbyStoresWP(userCoordinates, radiusKm) {
        if (typeof wp === 'undefined' || !wp.apiFetch) {
            throw new Error('WordPress API not available');
        }

        try {
            const [lng, lat] = userCoordinates;
            
            const stores = await wp.apiFetch({
                path: '/charlie-stores/v1/stores/nearby',
                method: 'GET',
                data: {
                    latitude: lat,
                    longitude: lng,
                    radius: radiusKm,
                    limit: this.maxResults
                }
            });

            return stores.map(store => ({
                ...store,
                // Ensure coordinates are in correct format
                coordinates: [parseFloat(store.longitude), parseFloat(store.latitude)],
                distanceText: `${store.distance.toFixed(1)} km away`,
                estimatedDriveTime: this.estimateDriveTime(store.distance)
            }));
            
        } catch (error) {
            console.warn('WordPress store search failed, using fallback:', error);
            // Fallback to mock data
            return this.findNearbyStores(userCoordinates, radiusKm);
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - Latitude 1
     * @param {number} lng1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lng2 - Longitude 2
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c; // Distance in km
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees to convert
     * @returns {number} Radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Estimate drive time based on distance
     * @param {number} distanceKm - Distance in kilometers
     * @returns {string} Estimated drive time
     */
    estimateDriveTime(distanceKm) {
        // Rough estimation: average city driving speed ~25 km/h including stops
        const avgSpeed = 25;
        const timeHours = distanceKm / avgSpeed;
        const timeMinutes = Math.round(timeHours * 60);
        
        if (timeMinutes < 60) {
            return `~${timeMinutes} min drive`;
        } else {
            const hours = Math.floor(timeMinutes / 60);
            const minutes = timeMinutes % 60;
            return minutes > 0 ? `~${hours}h ${minutes}m drive` : `~${hours}h drive`;
        }
    }

    /**
     * Get store by ID
     * @param {string} storeId - Store ID
     * @returns {object|null} Store data or null if not found
     */
    getStore(storeId) {
        return this.stores.find(store => store.id === storeId) || null;
    }

    /**
     * Get all stores
     * @returns {Array} All stores
     */
    getAllStores() {
        return [...this.stores]; // Return copy to prevent mutations
    }

    /**
     * Get store features/amenities
     * @param {string} storeId - Store ID
     * @returns {Array} Array of features
     */
    getStoreFeatures(storeId) {
        const store = this.getStore(storeId);
        return store ? store.features : [];
    }

    /**
     * Get store products information
     * @param {string} storeId - Store ID
     * @returns {object|null} Products information
     */
    getStoreProducts(storeId) {
        const store = this.getStore(storeId);
        return store ? store.products : null;
    }

    /**
     * Format store information for display
     * @param {object} store - Store object
     * @returns {object} Formatted store information
     */
    formatStoreInfo(store) {
        return {
            id: store.id,
            name: store.name,
            address: store.address,
            phone: store.phone,
            hours: store.hours,
            distance: store.distance,
            distanceText: store.distanceText,
            driveTime: store.estimatedDriveTime,
            rating: store.rating,
            reviews: store.reviews,
            features: store.features,
            manager: store.manager,
            coordinates: store.coordinates
        };
    }

    /**
     * Search stores by text query
     * @param {string} query - Search query
     * @returns {Array} Matching stores
     */
    searchStores(query) {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        
        return this.stores.filter(store => {
            return (
                store.name.toLowerCase().includes(searchTerm) ||
                store.address.toLowerCase().includes(searchTerm) ||
                store.manager.toLowerCase().includes(searchTerm) ||
                store.features.some(feature => feature.toLowerCase().includes(searchTerm))
            );
        });
    }

    /**
     * Get store analytics data
     * @param {string} storeId - Store ID
     * @returns {object} Analytics data
     */
    getStoreAnalytics(storeId) {
        const store = this.getStore(storeId);
        if (!store) return null;

        return {
            storeId: store.id,
            name: store.name,
            rating: store.rating,
            totalReviews: store.reviews,
            established: store.established,
            features: store.features.length,
            productCategories: store.products.categories.length
        };
    }

    /**
     * Track store interaction events
     * @param {string} eventName - Event name
     * @param {object} storeData - Store data
     * @param {object} additionalData - Additional event data
     */
    trackStoreEvent(eventName, storeData, additionalData = {}) {
        const eventData = {
            store_id: storeData.id,
            store_name: storeData.name,
            ...additionalData
        };

        // Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', eventName, {
                event_category: 'store_interaction',
                ...eventData
            });
        }

        // WordPress analytics
        if (typeof window !== 'undefined' && window.wp && window.wp.hooks) {
            window.wp.hooks.doAction('charlie_store_analytics', eventName, eventData);
        }

        console.log('Store Event:', eventName, eventData);
    }

    /**
     * Get configuration for WordPress integration
     * @returns {object} WordPress integration configuration
     */
    getWordPressConfig() {
        return {
            restNamespace: 'charlie-stores/v1',
            endpoints: {
                stores: '/stores',
                nearby: '/stores/nearby',
                products: '/products',
                reviews: '/reviews'
            },
            capabilities: [
                'read_stores',
                'edit_stores',
                'manage_store_products'
            ]
        };
    }
}

// WordPress Integration Extension
class WordPressStoreManager extends StoreManager {
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
        // Allow other plugins to modify store data
        wp.hooks.addFilter('charlie_store_data', 'charlie-stores', (stores) => {
            return stores;
        });

        // Hook for store search customization
        wp.hooks.addAction('charlie_store_search', 'charlie-stores', (query, results) => {
            console.log('Store search performed:', query, results.length, 'results');
        });
    }

    /**
     * WordPress REST API integration for store management
     * @returns {Promise<void>}
     */
    async loadStoresFromWordPress() {
        if (typeof wp === 'undefined' || !wp.apiFetch) {
            console.warn('WordPress API not available, using mock data');
            return;
        }

        try {
            const wpStores = await wp.apiFetch({
                path: '/charlie-stores/v1/stores'
            });

            if (wpStores && wpStores.length > 0) {
                this.stores = wpStores.map(store => ({
                    ...store,
                    coordinates: [parseFloat(store.longitude), parseFloat(store.latitude)]
                }));
                
                console.log(`Loaded ${this.stores.length} stores from WordPress`);
            }
            
        } catch (error) {
            console.error('Failed to load stores from WordPress:', error);
        }
    }
}

// Initialize store manager
let storeManager;
document.addEventListener('DOMContentLoaded', () => {
    if (isWordPressEnvironment()) {
        storeManager = new WordPressStoreManager();
    } else {
        storeManager = new StoreManager();
    }
    
    // Make available globally
    window.storeManager = storeManager;
});

// Export for WordPress/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoreManager, WordPressStoreManager };
}