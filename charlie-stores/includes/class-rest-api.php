<?php
/**
 * REST API Class
 * Handles API endpoints for store data
 */
class Charlie_REST_API {

    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Get nearby stores
        register_rest_route('charlie-stores/v1', '/stores/nearby', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_nearby_stores'),
            'permission_callback' => '__return_true',
            'args' => array(
                'latitude' => array(
                    'required' => true,
                    'type' => 'number',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param >= -90 && $param <= 90;
                    }
                ),
                'longitude' => array(
                    'required' => true,
                    'type' => 'number',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param >= -180 && $param <= 180;
                    }
                ),
                'radius' => array(
                    'default' => 50,
                    'type' => 'number',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0 && $param <= 1000;
                    }
                ),
                'limit' => array(
                    'default' => 10,
                    'type' => 'integer',
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0 && $param <= 50;
                    }
                ),
            ),
        ));

        // Geocode postal code
        register_rest_route('charlie-stores/v1', '/geocode/(?P<postal_code>[A-Za-z0-9\s]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'geocode_postal_code'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * Get stores near coordinates
     */
    public function get_nearby_stores($request) {
        $latitude = $request['latitude'];
        $longitude = $request['longitude'];
        $radius = $request['radius'];
        $limit = $request['limit'];

        // Query stores
        $stores = get_posts(array(
            'post_type' => 'charlie_store',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => array(
                array(
                    'key' => '_store_latitude',
                    'compare' => 'EXISTS'
                ),
                array(
                    'key' => '_store_longitude',
                    'compare' => 'EXISTS'
                ),
            ),
        ));

        $nearby_stores = array();

        foreach ($stores as $store) {
            $store_lat = get_post_meta($store->ID, '_store_latitude', true);
            $store_lng = get_post_meta($store->ID, '_store_longitude', true);

            if (!$store_lat || !$store_lng) continue;

            // Calculate distance
            $distance = $this->calculate_distance($latitude, $longitude, $store_lat, $store_lng);

            if ($distance <= $radius) {
                $nearby_stores[] = array(
                    'id' => $store->ID,
                    'name' => $store->post_title,
                    'address' => get_post_meta($store->ID, '_store_address', true),
                    'latitude' => floatval($store_lat),
                    'longitude' => floatval($store_lng),
                    'coordinates' => array(floatval($store_lng), floatval($store_lat)),
                    'phone' => get_post_meta($store->ID, '_store_phone', true),
                    'email' => get_post_meta($store->ID, '_store_email', true),
                    'hours' => get_post_meta($store->ID, '_store_hours', true),
                    'manager' => get_post_meta($store->ID, '_store_manager', true),
                    'rating' => floatval(get_post_meta($store->ID, '_store_rating', true)),
                    'reviews' => intval(get_post_meta($store->ID, '_store_reviews', true)),
                    'established' => get_post_meta($store->ID, '_store_established', true),
                    'distance' => $distance,
                    'features' => wp_get_post_terms($store->ID, 'store_feature', array('fields' => 'slugs')),
                    'products' => array(
                        'categories' => wp_get_post_terms($store->ID, 'product_category', array('fields' => 'slugs')),
                        'featured' => array()
                    ),
                    'products_url' => get_permalink($store->ID),
                    'type' => 'store',
                );
            }
        }

        // Sort by distance and limit results
        usort($nearby_stores, function($a, $b) {
            return $a['distance'] <=> $b['distance'];
        });

        return array_slice($nearby_stores, 0, $limit);
    }

    /**
     * Geocode postal code (server-side caching)
     */
    public function geocode_postal_code($request) {
        $postal_code = $request['postal_code'];

        // Check cache first
        $cache_key = 'charlie_geocode_' . md5($postal_code);
        $cached_result = get_transient($cache_key);

        if ($cached_result !== false) {
            return $cached_result;
        }

        // Use Mapbox Geocoding API
        $mapbox_token = get_option('charlie_mapbox_token');
        if (!$mapbox_token) {
            return new WP_Error('no_token', 'Mapbox token not configured', array('status' => 500));
        }

        $url = sprintf(
            'https://api.mapbox.com/geocoding/v5/mapbox.places/%s.json?access_token=%s&country=ca&types=postcode&limit=1',
            urlencode($postal_code . ', Canada'),
            $mapbox_token
        );

        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            return new WP_Error('geocoding_failed', 'Geocoding request failed', array('status' => 500));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['features']) || empty($data['features'])) {
            return new WP_Error('no_results', 'No results found for postal code', array('status' => 404));
        }

        $feature = $data['features'][0];
        $result = array(
            'coordinates' => array(
                'latitude' => $feature['center'][1],
                'longitude' => $feature['center'][0],
                'lngLat' => $feature['center']
            ),
            'postalCode' => $postal_code,
            'location' => array(
                'city' => $this->extract_city($feature),
                'province' => $this->extract_province($feature),
                'country' => 'Canada'
            ),
            'formattedAddress' => $feature['place_name'],
            'confidence' => 0.8,
            'bbox' => $feature['bbox'] ?? null
        );

        // Cache for 1 hour
        set_transient($cache_key, $result, HOUR_IN_SECONDS);

        return $result;
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private function calculate_distance($lat1, $lng1, $lat2, $lng2) {
        $earth_radius = 6371; // Earth's radius in kilometers

        $lat1 = deg2rad($lat1);
        $lng1 = deg2rad($lng1);
        $lat2 = deg2rad($lat2);
        $lng2 = deg2rad($lng2);

        $dlat = $lat2 - $lat1;
        $dlng = $lng2 - $lng1;

        $a = sin($dlat/2) * sin($dlat/2) + cos($lat1) * cos($lat2) * sin($dlng/2) * sin($dlng/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earth_radius * $c;
    }

    /**
     * Extract city from Mapbox response
     */
    private function extract_city($feature) {
        if (isset($feature['context'])) {
            foreach ($feature['context'] as $context) {
                if (strpos($context['id'], 'place.') === 0) {
                    return $context['text'];
                }
            }
        }
        return null;
    }

    /**
     * Extract province from Mapbox response
     */
    private function extract_province($feature) {
        if (isset($feature['context'])) {
            foreach ($feature['context'] as $context) {
                if (strpos($context['id'], 'region.') === 0) {
                    return $context['text'];
                }
            }
        }
        return null;
    }
}