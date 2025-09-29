/**
 * Age Verification Module
 * 
 * Handles age gate functionality for nicotine products
 * WordPress Migration: This module is fully compatible with WordPress
 */

class AgeVerification {
    constructor() {
        this.modalElement = null;
        this.appElement = null;
        this.isVerified = false;
        this.storageKey = getConfig('STORAGE_KEYS.AGE_VERIFIED');
        this.minimumAge = getConfig('APP.MINIMUM_AGE');
        this.sessionDuration = getConfig('APP.SESSION_DURATION');
        
        this.init();
    }

    /**
     * Initialize age verification system
     */
    init() {
        this.modalElement = document.getElementById('ageModal');
        this.appElement = document.getElementById('app');
        this.ageStep = document.getElementById('ageVerificationStep');
        this.postalStep = document.getElementById('postalCodeStep');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalPostalCode = document.getElementById('modalPostalCode');
        this.modalSearchBtn = document.getElementById('modalSearchBtn');
        this.modalError = document.getElementById('modalError');
        
        if (!this.modalElement || !this.appElement) {
            console.error('Age verification: Required DOM elements not found');
            return;
        }

        // Check if user is already verified
        if (this.checkStoredVerification()) {
            this.showApp();
        } else {
            this.showModal();
        }

        this.bindEvents();
    }

    /**
     * Check if user has valid age verification in storage
     * @returns {boolean} True if verified and not expired
     */
    checkStoredVerification() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return false;

            const verification = JSON.parse(stored);
            const now = Date.now();
            
            // Check if verification is valid and not expired
            if (verification.verified && 
                verification.timestamp && 
                (now - verification.timestamp) < this.sessionDuration) {
                
                this.isVerified = true;
                return true;
            }
            
            // Remove expired verification
            this.clearStoredVerification();
            return false;
            
        } catch (error) {
            console.warn('Age verification: Error reading stored verification:', error);
            this.clearStoredVerification();
            return false;
        }
    }

    /**
     * Store age verification with timestamp
     */
    storeVerification() {
        try {
            const verification = {
                verified: true,
                timestamp: Date.now(),
                age: this.minimumAge
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(verification));
        } catch (error) {
            console.warn('Age verification: Unable to store verification:', error);
        }
    }

    /**
     * Clear stored age verification
     */
    clearStoredVerification() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Age verification: Unable to clear storage:', error);
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const yesButton = document.getElementById('ageYes');
        const noButton = document.getElementById('ageNo');

        if (yesButton) {
            yesButton.addEventListener('click', () => this.handleAgeConfirmed());
        }

        if (noButton) {
            noButton.addEventListener('click', () => this.handleAgeDenied());
        }

        // Postal code step events
        if (this.modalSearchBtn) {
            this.modalSearchBtn.addEventListener('click', () => this.handlePostalCodeSearch());
        }

        if (this.modalPostalCode) {
            this.modalPostalCode.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handlePostalCodeSearch();
                }
            });

            this.modalPostalCode.addEventListener('input', (e) => {
                this.handlePostalCodeInput(e);
            });

            this.modalPostalCode.addEventListener('focus', () => {
                this.hideModalError();
            });
        }

        // Prevent modal close on background click for age verification
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                e.stopPropagation();
                e.preventDefault();
            }
        });

        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (this.modalElement && !this.modalElement.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    // Only allow escape on postal code step
                    if (!this.postalStep.classList.contains('hidden')) {
                        this.handleAgeDenied();
                    }
                }
            }
        });
    }

    /**
     * Handle when user confirms they are of age
     */
    handleAgeConfirmed() {
        this.isVerified = true;
        this.storeVerification();
        
        // Track verification event for analytics (WordPress compatible)
        this.trackEvent('age_verified', {
            minimum_age: this.minimumAge,
            timestamp: new Date().toISOString()
        });

        // Show postal code step instead of closing modal
        this.showPostalCodeStep();
    }

    /**
     * Handle when user denies being of age
     */
    handleAgeDenied() {
        this.isVerified = false;
        this.clearStoredVerification();
        
        // Track denial event for analytics
        this.trackEvent('age_denied', {
            minimum_age: this.minimumAge,
            timestamp: new Date().toISOString()
        });

        this.showAgeDenialMessage();
    }

    /**
     * Show age denial message and redirect/close
     */
    showAgeDenialMessage() {
        const modalBody = this.modalElement.querySelector('.modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="age-denial">
                <h3>Access Restricted</h3>
                <p>You must be ${this.minimumAge} years or older to access this website.</p>
                <p>You will now be redirected away from this site.</p>
            </div>
        `;

        // Redirect after 3 seconds
        setTimeout(() => {
            // Try to go back in history, or redirect to a safe page
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'about:blank';
            }
        }, 3000);
    }

    /**
     * Show postal code step after age verification
     */
    showPostalCodeStep() {
        if (this.ageStep) {
            this.ageStep.classList.add('hidden');
        }
        
        if (this.postalStep) {
            this.postalStep.classList.remove('hidden');
        }
        
        if (this.modalTitle) {
            this.modalTitle.textContent = 'Enter Your Location';
        }

        // Focus on postal code input
        if (this.modalPostalCode) {
            setTimeout(() => {
                this.modalPostalCode.focus();
            }, 100);
        }
    }

    /**
     * Handle postal code input formatting
     * @param {Event} e - Input event
     */
    handlePostalCodeInput(e) {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Format as A1A 1A1
        if (value.length > 3) {
            value = value.slice(0, 3) + ' ' + value.slice(3, 6);
        }
        
        e.target.value = value;
        
        // Visual validation feedback
        if (value.length >= 6) {
            const isValid = window.geocodingService?.validatePostalCode(value);
            e.target.classList.toggle('error', !isValid);
        } else {
            e.target.classList.remove('error');
        }
    }

    /**
     * Handle postal code search
     */
    async handlePostalCodeSearch() {
        const postalCode = this.modalPostalCode?.value?.trim();
        
        if (!postalCode) {
            this.showModalError('Please enter a postal code');
            this.modalPostalCode?.focus();
            return;
        }
        
        if (!this.validatePostalCode(postalCode)) {
            this.showModalError('Please enter a valid Canadian postal code (e.g., M5V 3A8)');
            this.modalPostalCode?.focus();
            return;
        }

        try {
            this.setModalLoadingState(true);
            this.hideModalError();

            // Direct Mapbox API call to bypass broken geocoding service
            const geocodeResult = await this.directMapboxGeocode(postalCode);

            // Track successful search
            this.trackEvent('postal_code_search_success', {
                postal_code: postalCode,
                location: geocodeResult.location
            });

            // Dispatch event with search results
            const searchData = {
                postalCode,
                geocodeResult,
                nearbyStores: [] // No stores needed
            };

            console.log('Age verification dispatching modalSearchComplete event:', searchData);
            document.dispatchEvent(new CustomEvent('modalSearchComplete', {
                detail: searchData
            }));

            // Hide modal and show app
            this.hideModal(() => {
                this.showApp();
            });
            
        } catch (error) {
            console.error('Modal search failed:', error);
            this.showModalError(error.message || 'Unable to find location. Please try again.');
            
            this.trackEvent('postal_code_search_error', {
                postal_code: postalCode,
                error: error.message
            });
            
        } finally {
            this.setModalLoadingState(false);
        }
    }

    /**
     * Validate Canadian postal code format
     * @param {string} postalCode - The postal code to validate
     * @returns {boolean} True if valid
     */
    validatePostalCode(postalCode) {
        if (!postalCode || typeof postalCode !== 'string') {
            return false;
        }
        const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
        return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned);
    }

    /**
     * Direct Mapbox geocoding to bypass broken service
     * @param {string} postalCode - The postal code to geocode
     * @returns {Promise<object>} Geocoding result
     */
    async directMapboxGeocode(postalCode) {
        const accessToken = getConfig('MAPBOX.ACCESS_TOKEN');
        if (!accessToken) {
            throw new Error('Mapbox access token not configured');
        }

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postalCode + ', Canada')}.json?access_token=${accessToken}&country=ca&types=postcode&limit=1`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
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
                city: this.extractCity(feature),
                province: this.extractProvince(feature),
                country: 'Canada'
            },
            formattedAddress: feature.place_name
        };
    }

    /**
     * Extract city from Mapbox feature
     */
    extractCity(feature) {
        if (feature.context) {
            for (const context of feature.context) {
                if (context.id.startsWith('place.')) {
                    return context.text;
                }
            }
        }
        return null;
    }

    /**
     * Extract province from Mapbox feature
     */
    extractProvince(feature) {
        if (feature.context) {
            for (const context of feature.context) {
                if (context.id.startsWith('region.')) {
                    return context.text;
                }
            }
        }
        return null;
    }

    /**
     * Show error message in modal
     * @param {string} message - Error message to display
     */
    showModalError(message) {
        if (this.modalError) {
            this.modalError.textContent = message;
            this.modalError.classList.remove('hidden');
        }
    }

    /**
     * Hide modal error message
     */
    hideModalError() {
        if (this.modalError) {
            this.modalError.classList.add('hidden');
        }
    }

    /**
     * Set loading state for modal search
     * @param {boolean} loading - Whether modal is in loading state
     */
    setModalLoadingState(loading) {
        if (this.modalSearchBtn) {
            this.modalSearchBtn.disabled = loading;
            this.modalSearchBtn.textContent = loading ? 'Searching...' : 'Getting Access';
        }
        
        if (this.modalPostalCode) {
            this.modalPostalCode.disabled = loading;
        }
    }

    /**
     * Show the age verification modal
     */
    showModal() {
        if (this.modalElement) {
            this.modalElement.classList.remove('hidden');
            this.modalElement.setAttribute('aria-hidden', 'false');
            
            // Focus management for accessibility
            const firstButton = this.modalElement.querySelector('button');
            if (firstButton) {
                firstButton.focus();
            }
        }
        
        if (this.appElement) {
            this.appElement.classList.add('hidden');
            this.appElement.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Hide the age verification modal with animation
     * @param {Function} callback - Function to call after modal is hidden
     */
    hideModal(callback) {
        if (!this.modalElement) return;

        this.modalElement.classList.add('closing');
        
        setTimeout(() => {
            this.modalElement.classList.add('hidden');
            this.modalElement.classList.remove('closing');
            this.modalElement.setAttribute('aria-hidden', 'true');
            
            if (callback) callback();
        }, 300); // Match CSS animation duration
    }

    /**
     * Show the main application
     */
    showApp() {
        if (this.appElement) {
            this.appElement.classList.remove('hidden');
            this.appElement.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * Track events for analytics (WordPress compatible)
     * @param {string} eventName - Name of the event
     * @param {object} eventData - Additional event data
     */
    trackEvent(eventName, eventData = {}) {
        // Google Analytics 4 (gtag)
        if (typeof gtag === 'function') {
            gtag('event', eventName, eventData);
        }
        
        // WordPress analytics hook
        if (typeof window !== 'undefined' && window.wp && window.wp.hooks) {
            window.wp.hooks.doAction('charlie_analytics', eventName, eventData);
        }
        
        // Console logging for development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Analytics Event:', eventName, eventData);
        }
    }

    /**
     * Get verification status
     * @returns {boolean} Current verification status
     */
    getVerificationStatus() {
        return this.isVerified;
    }

    /**
     * Force re-verification (useful for testing)
     */
    forceReverification() {
        this.isVerified = false;
        this.clearStoredVerification();
        this.showModal();
    }
}

// WordPress Integration Helper
class WordPressAgeVerification extends AgeVerification {
    constructor() {
        super();
        
        // Hook into WordPress events if available
        if (typeof window !== 'undefined' && window.wp && window.wp.hooks) {
            // Allow other plugins to modify age verification behavior
            window.wp.hooks.doAction('charlie_age_verification_init', this);
        }
    }

    /**
     * WordPress-specific storage using user meta (if user is logged in)
     */
    async storeVerificationWP() {
        if (typeof wp === 'undefined' || !wp.apiFetch) {
            return this.storeVerification();
        }

        try {
            // If user is logged in, store verification in user meta
            await wp.apiFetch({
                path: '/charlie-stores/v1/user/age-verified',
                method: 'POST',
                data: {
                    verified: true,
                    timestamp: Date.now()
                }
            });
            
            // Also store locally as backup
            this.storeVerification();
        } catch (error) {
            console.warn('WordPress age verification storage failed:', error);
            // Fall back to local storage
            this.storeVerification();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in WordPress environment
    if (isWordPressEnvironment()) {
        window.ageVerification = new WordPressAgeVerification();
    } else {
        window.ageVerification = new AgeVerification();
    }
});

// Export for WordPress/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AgeVerification, WordPressAgeVerification };
}