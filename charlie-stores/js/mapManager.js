/**
 * Map Manager Module
 * 
 * Handles Mapbox GL JS integration and map functionality
 * WordPress Migration: Fully compatible, uses wp_enqueue_script patterns
 */

class MapManager {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.currentPopup = null;
        this.currentScreenPopup = null;
        this.userLocationMarker = null;
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            accessToken: getConfig('MAPBOX.ACCESS_TOKEN'),
            style: getConfig('MAPBOX.STYLE_URL'),
            center: getConfig('MAPBOX.DEFAULT_CENTER'),
            zoom: getConfig('MAPBOX.DEFAULT_ZOOM'),
            maxBounds: getConfig('MAPBOX.MAX_BOUNDS')
        };

        // DOM elements
        this.mapContainer = null;
        this.loadingSpinner = null;
        this.crosshair = null;
        this.radiusVignette = null;
    }

    /**
     * Initialize the map
     * @returns {Promise<void>}
     */
    async init() {
        try {
            this.mapContainer = document.getElementById('map');
            this.loadingSpinner = document.getElementById('mapLoading');
            this.crosshair = document.getElementById('gtaCrosshair');
            this.radiusVignette = document.getElementById('radiusVignette');
            
            if (!this.mapContainer) {
                throw new Error('Map container not found');
            }

            // Validate Mapbox token
            if (!this.config.accessToken || this.config.accessToken.includes('example')) {
                this.showMapError('Mapbox access token not configured. Please add your token to config.js');
                return;
            }

            this.showLoading(true);
            
            // Set Mapbox access token
            mapboxgl.accessToken = this.config.accessToken;

            // Create map instance with GTA-style top-down view
            this.map = new mapboxgl.Map({
                container: this.mapContainer,
                style: this.config.style,
                center: this.config.center,
                zoom: this.config.zoom,
                maxBounds: this.config.maxBounds,
                // GTA STYLE: Perfect top-down view
                pitch: 0,               // No tilt - pure top-down like GTA
                bearing: 0,             // No rotation - straight north up
                // Performance optimizations
                antialias: true,        
                optimizeForTerrain: false, // Disable terrain for flat 2D look
                // WordPress compatibility
                attributionControl: true,
                logoPosition: 'bottom-left'
            });

            await this.setupMapEvents();
            await this.addMapControls();
            
            this.isInitialized = true;
            this.showLoading(false);
            
            // Dispatch custom event for other modules
            this.dispatchMapEvent('mapInitialized', { map: this.map });
            
        } catch (error) {
            console.error('Map initialization error:', error);
            this.showMapError('Unable to load map. Please refresh the page and try again.');
            this.showLoading(false);
        }
    }

    /**
     * Setup map event handlers
     * @returns {Promise<void>}
     */
    async setupMapEvents() {
        return new Promise((resolve) => {
            // Map load event with GTA-style enhancements
            this.map.on('load', () => {
                console.log('Map loaded successfully');
                this.applyGTAStyleEnhancements();
                resolve();
            });

            // Error handling
            this.map.on('error', (e) => {
                console.error('Map error:', e);
                this.showMapError('Map encountered an error. Please try refreshing the page.');
            });

            // Click event for closing popups
            this.map.on('click', (e) => {
                // Only close popup if not clicking on a marker
                if (!this.isClickOnMarker(e.point)) {
                    this.closeCurrentPopup();
                }
            });

            // Style change events for WordPress theme compatibility
            this.map.on('style.load', () => {
                // Re-add any custom layers after style changes
                this.dispatchMapEvent('styleChanged', { map: this.map });
            });
        });
    }

    /**
     * Add map controls
     */
    addMapControls() {
        // Navigation controls (zoom, rotate)
        const navControl = new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        });
        this.map.addControl(navControl, 'top-right');

        // Scale control
        const scaleControl = new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        });
        this.map.addControl(scaleControl, 'bottom-left');

        // Geolocate control (optional)
        if (navigator.geolocation) {
            const geolocateControl = new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            });
            this.map.addControl(geolocateControl, 'top-right');

            // Handle geolocation events
            geolocateControl.on('geolocate', (e) => {
                this.dispatchMapEvent('userLocationFound', { 
                    coordinates: [e.coords.longitude, e.coords.latitude],
                    accuracy: e.coords.accuracy 
                });
            });
        }
    }

    /**
     * Center map on coordinates with animation
     * @param {Array} coordinates - [longitude, latitude]
     * @param {number} zoom - Zoom level
     * @param {boolean} dramatic - Use dramatic globe-to-location animation
     */
    centerOn(coordinates, zoom = 12, dramatic = false) {
        if (!this.isInitialized || !coordinates) return;

        if (dramatic) {
            this.dramaticFlyTo(coordinates, zoom);
        } else {
            this.map.flyTo({
                center: coordinates,
                zoom: zoom,
                duration: 1000,
                essential: true // Respects prefers-reduced-motion
            });
        }
    }

    /**
     * Dramatic animation from globe view to specific location with GTA-style camera work
     * @param {Array} coordinates - [longitude, latitude]
     * @param {number} zoom - Target zoom level
     */
    dramaticFlyTo(coordinates, zoom) {
        // First ensure we're at globe view with cinematic angle
        this.map.flyTo({
            center: getConfig('MAPBOX.DEFAULT_CENTER'),
            zoom: getConfig('MAPBOX.DEFAULT_ZOOM'),
            pitch: 0, // Start flat
            bearing: 0,
            duration: 500,
            essential: true
        });

        // Then animate to the target location with GTA-style top-down view
        setTimeout(() => {
            this.map.flyTo({
                center: coordinates,
                zoom: zoom,
                pitch: 0,       // Keep top-down view like GTA
                bearing: 0,     // Keep north up like GTA
                duration: 2500, // Longer duration for dramatic effect
                curve: 1.8,     // Higher curve for more dramatic arc
                speed: 0.8,     // Slower speed for cinematic feel
                essential: true,
                // Easing function for smooth animation
                easing: (t) => {
                    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                }
            });
            
            // Apply video game styling after the animation settles
            setTimeout(() => {
                this.applyGTAStyleEnhancements();
            }, 3000);
        }, 600); // Wait for globe view to settle
    }

    /**
     * Add a store marker to the map
     * @param {object} store - Store data
     * @param {Function} clickCallback - Callback for marker click
     */
    addStoreMarker(store, clickCallback) {
        if (!this.isInitialized || !store.coordinates) return;

        const markerId = store.id || store.name;
        
        // Remove existing marker if it exists
        this.removeMarker(markerId);

        // Create custom marker element
        const markerElement = this.createMarkerElement(store);

        // Create marker
        const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'center'
        })
        .setLngLat(store.coordinates)
        .addTo(this.map);

        // Add click event
        markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleMarkerClick(store, marker, clickCallback);
        });

        // Store marker reference
        this.markers.set(markerId, {
            marker,
            element: markerElement,
            store,
            isSelected: false
        });

        return marker;
    }

    /**
     * Create custom marker element
     * @param {object} store - Store data
     * @returns {HTMLElement} Marker element
     */
    createMarkerElement(store) {
        const element = document.createElement('div');
        element.className = 'custom-marker';
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `${store.name} - Click for details`);
        element.setAttribute('tabindex', '0');
        
        // Add keyboard support
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });

        return element;
    }

    /**
     * Handle marker click events
     * @param {object} store - Store data
     * @param {mapboxgl.Marker} marker - Mapbox marker instance
     * @param {Function} clickCallback - Click callback
     */
    handleMarkerClick(store, marker, clickCallback) {
        // Update marker visual state
        this.setSelectedMarker(store.id || store.name);

        // Close any existing popup
        this.closeCurrentPopup();

        // Create and show popup
        this.showStorePopup(store, marker);

        // Execute callback if provided
        if (typeof clickCallback === 'function') {
            clickCallback(store);
        }

        // Track analytics
        this.trackMapEvent('store_marker_clicked', {
            store_id: store.id,
            store_name: store.name
        });
    }

    /**
     * Show store information popup
     * @param {object} store - Store data
     * @param {mapboxgl.Marker} marker - Marker instance
     */
    showStorePopup(store, marker) {
        const popupContent = this.createPopupContent(store);
        
        this.currentPopup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            anchor: 'bottom',
            offset: 40,
            className: 'store-popup'
        })
        .setLngLat(marker.getLngLat())
        .setHTML(popupContent)
        .addTo(this.map);

        // Add event listeners to popup buttons
        this.bindPopupEvents(store);

        // Handle popup close
        this.currentPopup.on('close', () => {
            this.clearSelectedMarker();
            this.currentPopup = null;
        });
    }

    /**
     * Create popup content HTML
     * @param {object} store - Store data
     * @returns {string} HTML content
     */
    createPopupContent(store) {
        const distance = store.distance ? `${store.distance.toFixed(1)} km away` : '';
        
        return `
            <div class="popup-content">
                <h3>${store.name}</h3>
                <p class="address">${store.address}</p>
                <p class="hours">Hours: ${store.hours || 'Call for hours'}</p>
                <p class="distance">${distance}</p>
                <div class="popup-actions">
                    <button class="popup-btn popup-btn-primary" data-action="browse" data-store-id="${store.id}">
                        Browse Products
                    </button>
                    <button class="popup-btn popup-btn-secondary" data-action="directions" data-store-id="${store.id}">
                        Get Directions
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Bind popup button events
     * @param {object} store - Store data
     */
    bindPopupEvents(store) {
        setTimeout(() => {
            const popup = document.querySelector('.store-popup');
            if (!popup) return;

            const browseBtn = popup.querySelector('[data-action="browse"]');
            const directionsBtn = popup.querySelector('[data-action="directions"]');

            if (browseBtn) {
                browseBtn.addEventListener('click', () => {
                    this.handleBrowseProducts(store);
                });
            }

            if (directionsBtn) {
                directionsBtn.addEventListener('click', () => {
                    this.handleGetDirections(store);
                });
            }
        }, 100);
    }

    /**
     * Handle browse products action
     * @param {object} store - Store data
     */
    handleBrowseProducts(store) {
        // Dispatch event for other modules to handle
        this.dispatchMapEvent('browseProducts', { store });

        // For WordPress: trigger navigation
        if (isWordPressEnvironment() && store.products_url) {
            window.location.href = store.products_url;
        } else {
            // Demo navigation
            console.log('Navigate to products for store:', store.name);
            alert(`Browsing products for ${store.name}\n\nIn a real implementation, this would navigate to the store's product page.`);
        }

        this.trackMapEvent('browse_products_clicked', {
            store_id: store.id,
            store_name: store.name
        });
    }

    /**
     * Handle get directions action
     * @param {object} store - Store data
     */
    handleGetDirections(store) {
        if (!store.coordinates) return;

        const [lng, lat] = store.coordinates;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        
        window.open(directionsUrl, '_blank');

        this.trackMapEvent('directions_clicked', {
            store_id: store.id,
            store_name: store.name
        });
    }

    /**
     * Set selected marker visual state
     * @param {string} markerId - Marker ID
     */
    setSelectedMarker(markerId) {
        // Clear all selected states
        this.clearSelectedMarker();

        const markerData = this.markers.get(markerId);
        if (markerData) {
            markerData.element.classList.add('selected');
            markerData.isSelected = true;
        }
    }

    /**
     * Clear all selected marker states
     */
    clearSelectedMarker() {
        this.markers.forEach((markerData) => {
            markerData.element.classList.remove('selected');
            markerData.isSelected = false;
        });
    }

    /**
     * Remove a marker from the map
     * @param {string} markerId - Marker ID
     */
    removeMarker(markerId) {
        const markerData = this.markers.get(markerId);
        if (markerData) {
            if (markerData.isScreenMarker) {
                // Remove screen-positioned marker (DOM element)
                if (markerData.element && markerData.element.parentNode) {
                    markerData.element.parentNode.removeChild(markerData.element);
                }
            } else {
                // Remove regular Mapbox marker
                if (markerData.marker) {
                    markerData.marker.remove();
                }
            }
            this.markers.delete(markerId);
        }
    }

    /**
     * Clear all markers from the map except user location
     */
    clearMarkers() {
        this.markers.forEach((markerData, markerId) => {
            this.removeMarker(markerId);
        });
        // Clear vape stores separately if needed
        this.clearVapeStoreMarkers();
    }

    /**
     * Clear only warehouse markers from the map
     */
    clearWarehouseMarkers() {
        const warehouseMarkers = [];
        this.markers.forEach((markerData, markerId) => {
            if (markerData.warehouse && markerData.warehouse.type === 'warehouse') {
                warehouseMarkers.push(markerId);
            }
        });
        
        warehouseMarkers.forEach(markerId => {
            this.removeMarker(markerId);
        });
    }

    /**
     * Generate and add fake vape store markers within viewport
     * @param {Array} centerCoordinates - [longitude, latitude] center point
     */
    addFakeVapeStores(centerCoordinates) {
        if (!this.isInitialized || !centerCoordinates) return;

        const [centerLng, centerLat] = centerCoordinates;
        const vapeStores = [];
        
        // Generate 10 fake vape stores within viewport (about 3km radius at zoom 12)
        for (let i = 0; i < 10; i++) {
            const store = this.generateFakeVapeStore(centerLat, centerLng, i);
            vapeStores.push(store);
            this.addVapeStoreMarker(store);
        }
        
        console.log(`Added ${vapeStores.length} fake vape stores to map`);
        return vapeStores;
    }

    /**
     * Generate a fake vape store location within viewport
     * @param {number} centerLat - Center latitude
     * @param {number} centerLng - Center longitude
     * @param {number} index - Store index for naming
     * @returns {object} Fake vape store data
     */
    generateFakeVapeStore(centerLat, centerLng, index) {
        // Keep stores within 3km radius to stay in viewport at zoom 12
        const maxDistance = 3; // km
        const minDistance = 0.3; // km - not too close to center
        
        const distance = Math.random() * (maxDistance - minDistance) + minDistance;
        const bearing = Math.random() * 360;
        const coordinates = this.calculateCoordinatesFromDistance(centerLat, centerLng, distance, bearing);
        
        // Vape store names for variety
        const storeNames = [
            "Cloud Nine Vapes",
            "Vapor Haven",
            "Mist & Co.",
            "The Vape Lounge",
            "Smoke & Mirrors",
            "Puff Paradise",
            "Vapor Trail",
            "Cloud Factory",
            "Steam Dreams",
            "Vape Central"
        ];
        
        // Street names for addresses
        const streets = [
            "King Street", "Queen Street", "Main Street", "Bloor Street",
            "Yonge Street", "College Street", "Dundas Street", "Bay Street"
        ];
        
        const storeName = storeNames[index] || `Vape Store ${index + 1}`;
        const streetNumber = Math.floor(Math.random() * 9999) + 1;
        const streetName = streets[Math.floor(Math.random() * streets.length)];
        
        return {
            id: `fake_vape_store_${index}`,
            name: storeName,
            type: 'vape_store',
            coordinates: [coordinates.lng, coordinates.lat],
            address: `${streetNumber} ${streetName}`,
            distance: distance,
            distanceText: `${distance.toFixed(1)} km away`,
            hours: this.generateRandomHours(),
            description: "Premium vaping products and accessories",
            rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0 rating
            products: Math.floor(Math.random() * 150) + 50 // 50-200 products
        };
    }
    
    /**
     * Generate random store hours
     * @returns {string} Store hours string
     */
    generateRandomHours() {
        const hourOptions = [
            "9:00 AM - 9:00 PM",
            "10:00 AM - 10:00 PM", 
            "8:00 AM - 8:00 PM",
            "11:00 AM - 11:00 PM",
            "9:00 AM - 6:00 PM"
        ];
        return hourOptions[Math.floor(Math.random() * hourOptions.length)];
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
     * Add vape store marker to the map
     * @param {object} store - Vape store data
     */
    addVapeStoreMarker(store) {
        if (!this.isInitialized || !store.coordinates) return;

        const markerId = store.id;
        
        // Remove existing marker if it exists
        this.removeMarker(markerId);

        // Create custom vape store marker element
        const markerElement = this.createVapeStoreMarkerElement(store);

        // Create marker
        const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'center'
        })
        .setLngLat(store.coordinates)
        .addTo(this.map);

        // Add click event
        markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showVapeStorePopup(store, marker);
        });

        // Store marker reference
        this.markers.set(markerId, {
            marker,
            element: markerElement,
            store,
            isSelected: false
        });

        return marker;
    }

    /**
     * Create custom vape store marker element with video game styling
     * @param {object} store - Vape store data
     * @returns {HTMLElement} Marker element
     */
    createVapeStoreMarkerElement(store) {
        const element = document.createElement('div');
        element.className = 'vape-store-marker';
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `${store.name} - Click for details`);
        element.setAttribute('tabindex', '0');
        
        // Video game style vape store marker with flat colors and big outlines
        element.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <!-- Black outline circle -->
                <circle cx="16" cy="16" r="15" fill="#000" stroke="#000" stroke-width="2"/>
                <!-- Bright flat fill -->
                <circle cx="16" cy="16" r="12" fill="#FF6B35" stroke="none"/>
                <!-- Simple vape icon (no text, high contrast) -->
                <rect x="10" y="12" width="12" height="3" fill="#000" rx="1"/>
                <rect x="13" y="8" width="6" height="2" fill="#000" rx="1"/>
                <!-- Vapor clouds (simple shapes) -->
                <circle cx="20" cy="8" r="1.5" fill="#FFF" opacity="0.8"/>
                <circle cx="23" cy="6" r="1" fill="#FFF" opacity="0.6"/>
                <circle cx="25" cy="8" r="0.8" fill="#FFF" opacity="0.4"/>
            </svg>
        `;
        
        element.style.cssText = `
            width: 32px;
            height: 32px;
            cursor: pointer;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
            transition: transform 0.1s ease;
            position: relative;
        `;
        
        // Video game hover effects - flat color changes and bigger outlines
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.1)';
            element.querySelector('circle[fill="#FF6B35"]').setAttribute('fill', '#FF7A45');
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)';
            element.querySelector('circle[fill="#FF7A45"]').setAttribute('fill', '#FF6B35');
        });
        
        // Keyboard support
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });

        return element;
    }

    /**
     * Show vape store information popup
     * @param {object} store - Vape store data
     * @param {mapboxgl.Marker} marker - Marker instance
     */
    showVapeStorePopup(store, marker) {
        const popupContent = this.createVapeStorePopupContent(store);
        
        // Close any existing popup
        this.closeCurrentPopup();
        
        this.currentPopup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            anchor: 'bottom',
            offset: 40,
            className: 'vape-store-popup'
        })
        .setLngLat(marker.getLngLat())
        .setHTML(popupContent)
        .addTo(this.map);

        // Handle popup close
        this.currentPopup.on('close', () => {
            this.currentPopup = null;
        });
    }

    /**
     * Create vape store popup content HTML
     * @param {object} store - Vape store data
     * @returns {string} HTML content
     */
    createVapeStorePopupContent(store) {
        return `
            <div class="popup-content vape-store-popup-content">
                <h3>💨 ${store.name}</h3>
                <p class="address">📍 ${store.address}</p>
                <p class="hours">⏰ ${store.hours}</p>
                <p class="distance">📏 ${store.distanceText}</p>
                <p class="rating">⭐ ${store.rating}/5.0</p>
                <p class="products">${store.products} products available</p>
                <p class="description">${store.description}</p>
                <div class="popup-actions">
                    <button class="popup-btn popup-btn-primary">Browse Products</button>
                    <button class="popup-btn popup-btn-secondary">Get Directions</button>
                </div>
            </div>
        `;
    }

    /**
     * Clear all vape store markers from the map
     */
    clearVapeStoreMarkers() {
        const vapeStoreMarkers = [];
        this.markers.forEach((markerData, markerId) => {
            if (markerData.store && markerData.store.type === 'vape_store') {
                vapeStoreMarkers.push(markerId);
            }
        });
        
        vapeStoreMarkers.forEach(markerId => {
            this.removeMarker(markerId);
        });
    }

    /**
     * Add user location marker
     * @param {Array} coordinates - [longitude, latitude]
     */
    addUserLocationMarker(coordinates) {
        if (!this.isInitialized) return;

        // Remove existing user location marker
        if (this.userLocationMarker) {
            this.userLocationMarker.remove();
            this.hideRadiusVignette();
        }

        // Create user location marker element using custom icon
        const element = document.createElement('div');
        element.className = 'user-location-marker';
        
        element.style.cssText = `
            width: 40px;
            height: 40px;
            background-image: url('${getConfig('UI.CUSTOM_LOCATION_ICON', 'assets/images/gtamap_icon.png')}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
            position: relative;
            z-index: 1000;
        `;

        this.userLocationMarker = new mapboxgl.Marker({
            element,
            anchor: 'bottom'
        })
        .setLngLat(coordinates)
        .addTo(this.map);
        
        // Show radius vignette effect
        this.showRadiusVignette();
        
        // Vape stores removed for clean map
    }

    /**
     * Add warehouse marker to the map (positioned in black area outside 10km circle)
     * @param {object} warehouse - Warehouse data with screenPosition
     */
    addWarehouseMarker(warehouse) {
        if (!this.isInitialized) return;

        const markerId = warehouse.id;
        
        // Remove existing marker if it exists
        this.removeMarker(markerId);

        // Create custom warehouse marker element
        const markerElement = this.createWarehouseMarkerElement(warehouse);

        // Position marker at fixed screen coordinates (not geographic)
        if (warehouse.screenPosition) {
            markerElement.style.position = 'fixed';
            markerElement.style.left = `${warehouse.screenPosition.x}px`;
            markerElement.style.top = `${warehouse.screenPosition.y}px`;
            markerElement.style.zIndex = '600'; // Above vignette but below crosshair
            markerElement.style.transform = 'translate(-50%, -50%)';
            
            // Add directly to the map container instead of using Mapbox marker
            this.mapContainer.appendChild(markerElement);
        }

        // Add click event for warehouse interaction
        markerElement.addEventListener('click', (e) => {
            e.stopPropagation();

            // Trigger sliding animation to left side
            this.slideToProductMode();

            // Dispatch event for category circles
            document.dispatchEvent(new CustomEvent('warehouseClicked', {
                detail: warehouse
            }));
        });

        // Store marker reference
        this.markers.set(markerId, {
            marker: null, // No Mapbox marker, just DOM element
            element: markerElement,
            warehouse: warehouse,
            isSelected: false,
            isScreenMarker: true // Flag to indicate this is a screen-positioned marker
        });

        console.log(`Warehouse marker placed at screen position: ${warehouse.screenPosition.x}, ${warehouse.screenPosition.y}`);
        return markerElement;
    }

    /**
     * Create custom warehouse marker element
     * @param {object} warehouse - Warehouse data
     * @returns {HTMLElement} Marker element
     */
    createWarehouseMarkerElement(warehouse) {
        const element = document.createElement('div');
        element.className = 'warehouse-marker';
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `${warehouse.name} - Click for details`);
        element.setAttribute('tabindex', '0');
        
        // Use custom icon with large white circle background and pulsing animation
        element.style.cssText = `
            width: 80px;
            height: 80px;
            background-color: white;
            background-image: url('${getConfig('UI.WAREHOUSE_ICON', 'assets/images/ass_1.png')}');
            background-size: 70%;
            background-repeat: no-repeat;
            background-position: center;
            border: 4px solid #333;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            position: relative;
            transform-origin: center center;
            animation: warehousePulse 2s ease-in-out infinite;
        `;
        
        // Hover effects - enhanced for pulsing marker
        element.addEventListener('mouseenter', () => {
            element.style.animationDuration = '1s'; // Faster pulse on hover
            element.style.borderColor = '#000';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.animationDuration = '2s'; // Back to normal pulse
            element.style.borderColor = '#333';
        });
        
        // Keyboard support
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });

        return element;
    }

    /**
     * Show warehouse information popup
     * @param {object} warehouse - Warehouse data
     * @param {mapboxgl.Marker} marker - Marker instance
     */
    showWarehousePopup(warehouse, marker) {
        const popupContent = this.createWarehousePopupContent(warehouse);
        
        // Close any existing popup
        this.closeCurrentPopup();
        
        this.currentPopup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            anchor: 'bottom',
            offset: 50,
            className: 'warehouse-popup'
        })
        .setLngLat(marker.getLngLat())
        .setHTML(popupContent)
        .addTo(this.map);

        // Handle popup close
        this.currentPopup.on('close', () => {
            this.currentPopup = null;
        });
    }

    /**
     * Show warehouse popup for screen-positioned markers
     * @param {object} warehouse - Warehouse data
     * @param {object} screenPosition - Screen position {x, y}
     */
    showWarehouseScreenPopup(warehouse, screenPosition) {
        const popupContent = this.createWarehousePopupContent(warehouse);
        
        // Close any existing popup
        this.closeCurrentPopup();
        
        // Create a custom popup element positioned at screen coordinates
        const popupElement = document.createElement('div');
        popupElement.className = 'warehouse-screen-popup';
        popupElement.innerHTML = `
            <div class="popup-close" onclick="this.parentElement.remove()">×</div>
            ${popupContent}
        `;
        
        // Position popup near the marker
        popupElement.style.cssText = `
            position: fixed;
            left: ${screenPosition.x + 40}px;
            top: ${screenPosition.y - 20}px;
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 700;
            max-width: 300px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            transform: translateY(-50%);
        `;
        
        // Add close button styling
        const closeBtn = popupElement.querySelector('.popup-close');
        if (closeBtn) {
            closeBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 10px;
                cursor: pointer;
                font-size: 18px;
                color: #666;
                font-weight: bold;
            `;
        }
        
        document.body.appendChild(popupElement);
        
        // Store reference for cleanup
        this.currentScreenPopup = popupElement;
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (this.currentScreenPopup === popupElement) {
                popupElement.remove();
                this.currentScreenPopup = null;
            }
        }, 10000);
    }

    /**
     * Create warehouse popup content HTML
     * @param {object} warehouse - Warehouse data
     * @returns {string} HTML content
     */
    createWarehousePopupContent(warehouse) {
        const wooConfig = getConfig('WOOCOMMERCE', {});
        const isWooActive = wooConfig.IS_ACTIVE;

        let actionButtons = '';
        if (isWooActive) {
            const storeShopUrl = `${wooConfig.SHOP_URL}?store_location=${warehouse.id}`;
            actionButtons = `
                <div class="popup-actions" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <button class="browse-products-btn" onclick="window.open('${storeShopUrl}', '_blank')"
                            style="background: #0073aa; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                        🛒 Browse Products
                    </button>
                    <button class="view-cart-btn" onclick="window.open('${wooConfig.CART_URL}', '_blank')"
                            style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        🛍️ View Cart
                    </button>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="popup-actions" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px; margin: 0;">E-commerce coming soon!</p>
                </div>
            `;
        }

        return `
            <div class="popup-content warehouse-popup-content">
                <h3>🏭 ${warehouse.name}</h3>
                <p class="address">${warehouse.address}</p>
                <p class="hours">⏰ ${warehouse.hours}</p>
                <p class="distance">📍 ${warehouse.distanceText}</p>
                <p class="description">${warehouse.description}</p>
                ${actionButtons}
            </div>
        `;
    }

    /**
     * Close current popup
     */
    closeCurrentPopup() {
        if (this.currentPopup) {
            this.currentPopup.remove();
            this.currentPopup = null;
            this.clearSelectedMarker();
        }
        
        if (this.currentScreenPopup) {
            this.currentScreenPopup.remove();
            this.currentScreenPopup = null;
        }
    }

    /**
     * Check if click is on a marker
     * @param {Array} point - Click point [x, y]
     * @returns {boolean} True if click is on marker
     */
    isClickOnMarker(point) {
        const features = this.map.queryRenderedFeatures(point);
        return features.some(feature => feature.source === 'markers');
    }

    /**
     * Show/hide loading spinner
     * @param {boolean} show - Whether to show spinner
     */
    showLoading(show) {
        if (this.loadingSpinner) {
            if (show) {
                this.loadingSpinner.classList.remove('hidden');
            } else {
                this.loadingSpinner.classList.add('hidden');
            }
        }
    }

    /**
     * Show map error message
     * @param {string} message - Error message
     */
    showMapError(message) {
        if (this.mapContainer) {
            this.mapContainer.innerHTML = `
                <div class="map-error">
                    <h3>Map Unavailable</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Try Again</button>
                </div>
            `;
        }
    }

    /**
     * Dispatch custom map events
     * @param {string} eventName - Event name
     * @param {object} detail - Event detail
     */
    dispatchMapEvent(eventName, detail) {
        const event = new CustomEvent(`map:${eventName}`, { detail });
        document.dispatchEvent(event);

        // WordPress hooks integration
        if (typeof window !== 'undefined' && window.wp && window.wp.hooks) {
            window.wp.hooks.doAction(`charlie_map_${eventName}`, detail);
        }
    }

    /**
     * Track map-related analytics events
     * @param {string} eventName - Event name
     * @param {object} eventData - Event data
     */
    trackMapEvent(eventName, eventData) {
        // Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', eventName, { 
                event_category: 'map_interaction',
                ...eventData 
            });
        }

        // WordPress analytics
        if (typeof window !== 'undefined' && window.wp && window.wp.hooks) {
            window.wp.hooks.doAction('charlie_analytics', eventName, eventData);
        }
    }

    /**
     * Get map instance (for external access)
     * @returns {mapboxgl.Map|null} Map instance
     */
    getMap() {
        return this.map;
    }

    /**
     * Apply GTA-style visual enhancements to the map
     * Following video game aesthetic principles:
     * - Big outlines everywhere
     * - Limited palette & flat fills
     * - Tilt + shadow for cinematic depth
     * - Simple iconography
     * - Reduced clutter
     */
    applyGTAStyleEnhancements() {
        if (!this.map || !this.map.isStyleLoaded()) return;

        try {
            // 1. BIG OUTLINES EVERYWHERE
            this.applyBigOutlines();
            
            // 2. LIMITED PALETTE & FLAT FILLS
            this.applyFlatPalette();
            
            // 3. TILT + SHADOW (cinematic depth)
            this.applyCinematicLighting();
            
            // 4. CLUTTER DISCIPLINE (reduce POIs and labels)
            this.reduceClutter();

            console.log('GTA-style video game enhancements applied successfully');
        } catch (error) {
            console.warn('Some GTA-style enhancements could not be applied:', error.message);
        }
    }

    /**
     * Apply big outlines to roads, buildings, and labels
     */
    applyBigOutlines() {
        // Get ALL layers and find road layers dynamically
        const allLayers = this.map.getStyle().layers;
        console.log('All layer IDs:', allLayers.map(layer => layer.id));
        
        // ROAD STYLING - Target actual dark-v11 layer names with GTA hierarchy
        const palette = {
            water: '#001133',
            park: '#2d5a2d',
            building: '#404040',
            road: '#888888', // Light grey for road fills
            background: '#1a1a1a'
        };

        const roadLayerHierarchy = {
            // Major roads - Thickest (like GTA highways)
            major: {
                patterns: ['road-simple', 'bridge-simple', 'tunnel-simple'],
                casingsWidths: { 6: 3, 10: 5, 14: 7, 18: 10 },
                fillWidths: { 6: 2, 10: 3, 14: 5, 18: 7 }
            },
            // Medium roads - Medium thick  
            medium: {
                patterns: ['road-pedestrian', 'bridge-pedestrian', 'tunnel-pedestrian'],
                casingsWidths: { 6: 2, 10: 3, 14: 5, 18: 7 },
                fillWidths: { 6: 1, 10: 2, 14: 3, 18: 5 }
            },
            // Minor roads - Thin
            minor: {
                patterns: ['road-path', 'bridge-path', 'tunnel-path', 'road-steps', 'bridge-steps', 'tunnel-steps', 'road-path-trail', 'bridge-path-trail', 'tunnel-path-trail', 'road-path-cycleway-piste', 'bridge-path-cycleway-piste', 'tunnel-path-cycleway-piste'],
                casingsWidths: { 6: 1, 10: 2, 14: 3, 18: 4 },
                fillWidths: { 6: 0.5, 10: 1, 14: 2, 18: 2.5 }
            },
            // Rails - Special
            rail: {
                patterns: ['road-rail', 'bridge-rail', 'tunnel-rail'],
                casingsWidths: { 6: 0.5, 10: 1, 14: 1.5, 18: 2 },
                fillWidths: { 6: 0.25, 10: 0.5, 14: 1, 18: 1 }
            }
        };

        // Style ALL road layers (not just casings)
        const roadLayers = allLayers.filter(layer => 
            layer.type === 'line' && 
            (layer.id.startsWith('road-') || layer.id.startsWith('bridge-') || layer.id.startsWith('tunnel-'))
        );
        
        console.log('Found road layers:', roadLayers.map(l => l.id));
        console.log('Applying GTA-style road hierarchy...');
        
        roadLayers.forEach(layer => {
            const layerId = layer.id;
            let roadType = 'minor'; // default
            let isCasing = layerId.includes('case');
            
            // Determine road type from layer ID
            for (const [typeName, config] of Object.entries(roadLayerHierarchy)) {
                if (config.patterns.some(pattern => layerId.includes(pattern))) {
                    roadType = typeName;
                    break;
                }
            }
            
            const config = roadLayerHierarchy[roadType];
            const widths = isCasing ? config.casingsWidths : config.fillWidths;
            const color = isCasing ? '#666666' : palette.road; // Grey casings, lighter fills
            
            try {
                this.map.setPaintProperty(layerId, 'line-width', [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    6, widths[6],
                    10, widths[10],
                    14, widths[14],
                    18, widths[18]
                ]);
                this.map.setPaintProperty(layerId, 'line-color', color);
                this.map.setPaintProperty(layerId, 'line-opacity', 1);
                console.log(`✅ Applied ${roadType} ${isCasing ? 'casing' : 'fill'} to: ${layerId} (${widths[18]}px at zoom 18)`);
            } catch (error) {
                console.warn(`❌ Could not style ${layerId}:`, error.message);
            }
        });

        // BUILDING OUTLINES - Thick black borders
        const buildingLayers = ['building-outline', 'building'];
        buildingLayers.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.setPaintProperty(layerId, 'fill-outline-color', '#000000');
                // Try to add stroke if layer supports it
                try {
                    this.map.setPaintProperty(layerId, 'fill-stroke-width', 2);
                    this.map.setPaintProperty(layerId, 'fill-stroke-color', '#000000');
                } catch (e) {
                    // Layer doesn't support stroke, that's ok
                }
            }
        });

        // LABEL HALOS - Thick white/black outlines around text
        const labelLayers = this.map.getStyle().layers.filter(layer => 
            layer.type === 'symbol' && layer.layout && layer.layout['text-field']
        );
        
        labelLayers.forEach(layer => {
            try {
                this.map.setPaintProperty(layer.id, 'text-halo-width', 3);
                this.map.setPaintProperty(layer.id, 'text-halo-color', '#000000');
                this.map.setPaintProperty(layer.id, 'text-halo-blur', 0); // Sharp, not blurred
            } catch (e) {
                // Some layers might not support halos
            }
        });
    }

    /**
     * Apply limited palette with flat fills (no gradients)
     */
    applyFlatPalette() {
        // Define video game color palette - black land, grey water
        const palette = {
            water: '#666666',        // Grey water
            land: '#000000',         // Black land/background
            park: '#000000',         // Black parks (same as land)
            building: '#333333',     // Dark grey buildings
            road: '#888888',         // Light grey roads
            background: '#000000'    // Black background
        };

        // WATER - Grey
        if (this.map.getLayer('water')) {
            this.map.setPaintProperty('water', 'fill-color', palette.water);
            this.map.setPaintProperty('water', 'fill-opacity', 1);
        }

        // BACKGROUND/LAND - Black
        if (this.map.getLayer('background')) {
            this.map.setPaintProperty('background', 'background-color', palette.background);
        }

        // LANDUSE/PARKS - Black (same as land)
        const landLayers = [
            'landuse-park', 'landuse-recreation-ground', 'park', 'landuse',
            'landcover', 'landuse-residential', 'landuse-commercial',
            'landuse-industrial', 'natural'
        ];
        landLayers.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.setPaintProperty(layerId, 'fill-color', palette.land);
                this.map.setPaintProperty(layerId, 'fill-opacity', 1);
            }
        });

        // BUILDINGS - Dark grey for visibility
        const buildingLayers = ['building', 'building-top'];
        buildingLayers.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.setPaintProperty(layerId, 'fill-color', palette.building);
                this.map.setPaintProperty(layerId, 'fill-opacity', 1);
            }
        });
    }

    /**
     * Apply cinematic lighting for tilt + shadow effect
     */
    applyCinematicLighting() {
        // BUILDING EXTRUSIONS - Lower light for dramatic shadows
        if (this.map.getLayer('building-extrusion')) {
            this.map.setPaintProperty('building-extrusion', 'fill-extrusion-opacity', 0.9);
            this.map.setPaintProperty('building-extrusion', 'fill-extrusion-ambient-occlusion-intensity', 0.8);
            // Lower the light angle for longer shadows
            this.map.setPaintProperty('building-extrusion', 'fill-extrusion-vertical-gradient', true);
        }

        // Set light position for dramatic shadows (lower angle)
        try {
            this.map.setLight({
                'intensity': 0.3,  // Lower intensity for moody lighting
                'color': '#ffffff',
                'position': [1.5, 75, 30] // Lower angle creates longer shadows
            });
        } catch (e) {
            console.warn('Could not set custom lighting:', e.message);
        }
    }

    /**
     * Remove ALL text labels for completely clean map aesthetic
     */
    reduceClutter() {
        // Get all symbol layers (POIs, labels, icons)
        const symbolLayers = this.map.getStyle().layers.filter(layer => layer.type === 'symbol');
        
        console.log('Found symbol layers for cleanup:', symbolLayers.map(l => l.id));
        
        symbolLayers.forEach(layer => {
            const layerId = layer.id;
            
            // HIDE ALL TEXT LABELS - Completely clean map with no names
            if (layer.layout && layer.layout['text-field']) {
                try {
                    this.map.setLayoutProperty(layerId, 'visibility', 'none');
                    console.log(`✅ Hidden text label: ${layerId}`);
                } catch (e) {
                    console.warn(`❌ Could not hide text label ${layerId}:`, e.message);
                }
            }
            
            // HIDE ALL ICONS/SYMBOLS - Keep only our custom markers
            if (layer.layout && layer.layout['icon-image']) {
                try {
                    this.map.setLayoutProperty(layerId, 'visibility', 'none');
                    console.log(`✅ Hidden icon layer: ${layerId}`);
                } catch (e) {
                    console.warn(`❌ Could not hide icon ${layerId}:`, e.message);
                }
            }
        });
    }

    /**
     * Show GTA-style crosshair overlay at circle center
     */
    showCrosshair() {
        if (this.crosshair) {
            this.crosshair.classList.add('visible');
            // Position will be updated by updateRadiusVignette()
        }
    }

    /**
     * Hide GTA-style crosshair overlay
     */
    hideCrosshair() {
        if (this.crosshair) {
            this.crosshair.classList.remove('visible');
        }
    }

    /**
     * Update crosshair position based on circle overlay center coordinates
     */
    updateCrosshairFromCircle(centerX, centerY) {
        if (!this.crosshair) return;

        // Position crosshair at the exact center coordinates used by the circle
        this.crosshair.style.left = `${centerX}px`;
        this.crosshair.style.top = `${centerY}px`;
        this.crosshair.style.transform = 'translate(-50%, -50%)';
    }

    /**
     * Legacy method - now uses circle-based positioning
     */
    updateCrosshairPosition() {
        // This method is now handled by updateRadiusVignette()
        // which calls updateCrosshairFromCircle() with the same center coordinates
        return;
    }

    // Crosshair tracking is now handled by vignette tracking system

    /**
     * Show 10km radius vignette effect
     */
    showRadiusVignette() {
        if (this.radiusVignette && this.userLocationMarker) {
            this.radiusVignette.classList.add('visible');
            this.updateRadiusVignette();
            
            // Show crosshair at the center of the circle
            this.showCrosshair();
            
            // Set up tracking for zoom changes (radius needs to scale)
            this.setupVignetteTracking();
        }
    }

    /**
     * Hide radius vignette effect
     */
    hideRadiusVignette() {
        if (this.radiusVignette) {
            this.radiusVignette.classList.remove('visible');
            this.removeVignetteTracking();
            
            // Hide crosshair when vignette is hidden
            this.hideCrosshair();
        }
    }

    /**
     * Update radius vignette and crosshair to maintain 10km radius at current zoom level
     */
    updateRadiusVignette() {
        if (!this.radiusVignette || !this.userLocationMarker || !this.map) return;

        // Get marker coordinates
        const markerCoords = this.userLocationMarker.getLngLat();
        const screenPoint = this.map.project(markerCoords);
        
        // Calculate 10km in pixels at current zoom level
        const earthCircumference = 40075017; // Earth's circumference in meters
        const currentZoom = this.map.getZoom();
        const metersPerPixel = earthCircumference * Math.cos(markerCoords.lat * Math.PI / 180) / Math.pow(2, currentZoom + 8);
        const tenKmInPixels = (10 * 1000) / metersPerPixel; // 10km in pixels
        
        // Update the vignette gradient to use the calculated radius
        const vignetteElement = this.radiusVignette;
        const centerX = screenPoint.x;
        const centerY = screenPoint.y - 20; // Offset for marker anchor
        
        // Create dynamic gradient based on calculated radius
        const innerRadius = Math.max(tenKmInPixels * 0.7, 150); // Inner clear area
        const outerRadius = Math.max(tenKmInPixels * 1.2, 300);  // Outer fade area
        
        vignetteElement.style.background = `radial-gradient(
            circle at ${centerX}px ${centerY}px,
            transparent 0px,
            transparent ${innerRadius}px,
            rgba(0, 0, 0, 0.1) ${innerRadius + 20}px,
            rgba(0, 0, 0, 0.3) ${innerRadius + 40}px,
            rgba(0, 0, 0, 0.6) ${innerRadius + 60}px,
            rgba(0, 0, 0, 0.8) ${innerRadius + 80}px,
            rgba(0, 0, 0, 0.95) ${outerRadius}px,
            rgba(0, 0, 0, 1) ${outerRadius + 50}px
        )`;
        
        // Update crosshair position to match circle center
        this.updateCrosshairFromCircle(centerX, centerY);
    }

    /**
     * Set up event listeners for vignette tracking
     */
    setupVignetteTracking() {
        if (!this.map) return;

        this.vignetteUpdateHandler = () => this.updateRadiusVignette();
        
        this.map.on('move', this.vignetteUpdateHandler);
        this.map.on('zoom', this.vignetteUpdateHandler);
    }

    /**
     * Remove vignette tracking event listeners
     */
    removeVignetteTracking() {
        if (!this.map || !this.vignetteUpdateHandler) return;

        this.map.off('move', this.vignetteUpdateHandler);
        this.map.off('zoom', this.vignetteUpdateHandler);
    }

    /**
     * Slide map and vignette to left side for product mode
     */
    slideToProductMode() {
        if (!this.isInitialized || !this.map) {
            console.warn('Map not initialized for sliding animation');
            return;
        }

        // Get vignette and overlay elements
        const mapContainer = document.getElementById('map');
        const vignette = document.getElementById('radiusVignette');
        const crosshair = document.getElementById('gtaCrosshair');

        if (!vignette) {
            console.warn('Vignette not found for sliding animation');
            return;
        }

        // Calculate how much to pan the map (200px right to move location marker left)
        const panDistance = 200; // pixels
        const currentCenter = this.map.getCenter();

        // Convert screen pixel offset to geographic coordinates
        // Pan RIGHT so the location marker appears to move LEFT
        const currentCenterPixel = this.map.project(currentCenter);
        const newCenterPixel = {
            x: currentCenterPixel.x + panDistance, // ADD to pan right
            y: currentCenterPixel.y
        };
        const newCenter = this.map.unproject(newCenterPixel);

        // Add CSS classes for smooth animation to overlay elements
        if (mapContainer) mapContainer.classList.add('product-mode'); // For state tracking
        vignette.classList.add('product-mode');
        if (crosshair) crosshair.classList.add('product-mode');

        // Pan the map to new center with smooth animation
        this.map.easeTo({
            center: newCenter,
            duration: 600, // Match CSS animation duration
            essential: true // Ensures animation plays even with reduced motion
        });

        // Update warehouse marker positions (they're screen-positioned, so they need adjustment)
        setTimeout(() => {
            this.updateMarkersForProductMode();
        }, 100); // Small delay to let the pan start

        console.log('Sliding to product mode with map pan');
    }

    /**
     * Update marker positions for product mode
     */
    updateMarkersForProductMode() {
        // Since we're panning the map, screen-positioned markers need minimal adjustment
        // The map pan handles most of the movement, but we may need slight fine-tuning
        this.markers.forEach((markerData, markerId) => {
            if (markerData.isScreenMarker && markerData.element) {
                // The map pan will move geographic content, but screen-positioned markers
                // may need a small adjustment to stay properly positioned relative to the vignette
                markerData.element.style.transition = 'left 0.6s ease-in-out';

                // Optional: small adjustment if needed (can be fine-tuned)
                // For now, let the map pan handle the movement
            }
        });
    }

    /**
     * Check if map is initialized
     * @returns {boolean} Initialization status
     */
    isMapInitialized() {
        return this.isInitialized;
    }
}

// Export for WordPress/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapManager };
}