<?php
/**
 * Loyalty checkout handoff.
 *
 * The headless storefront (charliesclub.com) sets a signed `loyalty-id` cookie
 * on `.charliesclub.com` for authenticated customers. At checkout we verify that
 * token's HMAC here and stamp the customer's loyalty identity onto the order as
 * meta (`_loyalty_uid` / `_loyalty_email`). Those flow through the WooCommerce
 * order webhook into the inventory platform, which attributes loyalty points to
 * the proven account rather than a typed billing email (anti-point-farming).
 *
 * Token format (must match lib/loyalty/handoff.ts on the storefront):
 *   base64url(json) . base64url( HMAC_SHA256( base64url(json), SECRET ) )
 *   json = { "sub": <supabase user id>, "email": <verified email>, "exp": <ms> }
 *
 * The shared secret must equal the storefront's LOYALTY_HANDOFF_SECRET. Set it
 * as a PHP constant in wp-config.php (define('LOYALTY_HANDOFF_SECRET', '...'))
 * or as an environment variable of the same name.
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The shared HMAC secret. Prefers a wp-config constant, falls back to env.
 *
 * @return string
 */
function charlies_loyalty_secret() {
	if ( defined( 'LOYALTY_HANDOFF_SECRET' ) && LOYALTY_HANDOFF_SECRET ) {
		return (string) LOYALTY_HANDOFF_SECRET;
	}
	$env = getenv( 'LOYALTY_HANDOFF_SECRET' );
	return $env ? (string) $env : '';
}

/**
 * Decode a base64url string to raw bytes.
 *
 * @param string $data base64url input.
 * @return string|false
 */
function charlies_loyalty_b64url_decode( $data ) {
	return base64_decode( strtr( $data, '-_', '+/' ), true );
}

/**
 * Verify a handoff token and return its claims, or null if invalid/expired.
 *
 * @param string $token The `loyalty-id` cookie value.
 * @return array{sub:string,email:string}|null
 */
function charlies_verify_handoff_token( $token ) {
	$secret = charlies_loyalty_secret();
	if ( empty( $token ) || '' === $secret ) {
		return null;
	}

	$parts = explode( '.', $token );
	if ( 2 !== count( $parts ) ) {
		return null;
	}
	list( $encoded, $sig ) = $parts;

	// Recompute the signature over the encoded payload segment.
	$expected_raw = hash_hmac( 'sha256', $encoded, $secret, true );
	$expected     = rtrim( strtr( base64_encode( $expected_raw ), '+/', '-_' ), '=' );
	if ( ! hash_equals( $expected, $sig ) ) {
		return null;
	}

	$json = charlies_loyalty_b64url_decode( $encoded );
	if ( false === $json ) {
		return null;
	}
	$payload = json_decode( $json, true );
	if ( ! is_array( $payload ) ) {
		return null;
	}

	// exp is epoch milliseconds (JS Date.now()).
	if ( ! isset( $payload['exp'] ) || ! is_numeric( $payload['exp'] ) ) {
		return null;
	}
	if ( (float) $payload['exp'] < ( microtime( true ) * 1000 ) ) {
		return null;
	}
	if ( empty( $payload['sub'] ) || empty( $payload['email'] ) ) {
		return null;
	}

	return array(
		'sub'   => (string) $payload['sub'],
		'email' => (string) $payload['email'],
	);
}

/**
 * Stamp the verified loyalty identity onto the order at checkout.
 *
 * Hooked on classic-checkout order creation. Silently no-ops for guests or an
 * absent/invalid cookie — loyalty must never block or fail a checkout.
 *
 * @param WC_Order $order The order being created.
 * @return void
 */
function charlies_attach_loyalty_identity( $order ) {
	if ( empty( $_COOKIE['loyalty-id'] ) ) {
		return;
	}
	// The token is base64url + '.', so this sanitize preserves it unchanged.
	$token  = sanitize_text_field( wp_unslash( $_COOKIE['loyalty-id'] ) );
	$claims = charlies_verify_handoff_token( $token );
	if ( ! $claims ) {
		return;
	}
	$order->update_meta_data( '_loyalty_uid', $claims['sub'] );
	$order->update_meta_data( '_loyalty_email', $claims['email'] );
}
add_action( 'woocommerce_checkout_create_order', 'charlies_attach_loyalty_identity', 20, 1 );
