<?php
/**
 * Ambassador referral checkout handoff.
 *
 * The headless storefront (charliesclub.com) sets an unsigned `charlies_ref`
 * cookie on `.charliesclub.com` when a visitor arrives via an /r/<code> referral
 * link. At checkout we copy that referral code onto the order as `_ambassador_ref`
 * meta. It flows through the WooCommerce order webhook into the inventory
 * platform, which resolves it to an active ambassador (by referral code) and
 * credits commission.
 *
 * Unlike the loyalty handoff, the ref is not signed — the code only selects which
 * ambassador a later purchase is attributed to (same trust level as a coupon), so
 * there is no HMAC to verify here. Attribution can also arrive via a Woo coupon on
 * the order; the inventory side prefers the coupon and falls back to this meta.
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Stamp the ambassador referral code onto the order at checkout.
 *
 * Hooked on classic-checkout order creation. No-ops when the cookie is absent so
 * it can never block or fail a checkout.
 *
 * @param WC_Order $order The order being created.
 * @return void
 */
function charlies_attach_ambassador_ref( $order ) {
	if ( empty( $_COOKIE['charlies_ref'] ) ) {
		return;
	}
	$raw = sanitize_text_field( wp_unslash( $_COOKIE['charlies_ref'] ) );
	// Mirror the charset/length the storefront /r/<code> route allows.
	$code = substr( preg_replace( '/[^A-Za-z0-9_-]/', '', $raw ), 0, 32 );
	if ( '' === $code ) {
		return;
	}
	$order->update_meta_data( '_ambassador_ref', $code );
}
add_action( 'woocommerce_checkout_create_order', 'charlies_attach_ambassador_ref', 20, 1 );
