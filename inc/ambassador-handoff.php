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
	// Also drop a note so it shows in the order timeline, not just meta.
	$order->add_order_note( sprintf( 'Referred by ambassador: %s', $code ) );
}
add_action( 'woocommerce_checkout_create_order', 'charlies_attach_ambassador_ref', 20, 1 );

/**
 * Show the ambassador referral code on the admin order edit screen.
 *
 * The code is stored as hidden (underscore-prefixed) order meta, so it doesn't
 * display by default. This renders it in the order details panel. The ambassador's
 * name lives in the inventory platform (Supabase), not WordPress — staff look the
 * code up there; the code alone uniquely identifies the ambassador. Works on both
 * the classic and HPOS order edit screens (shared hook).
 *
 * @param WC_Order $order The order being viewed.
 * @return void
 */
function charlies_render_ambassador_ref_admin( $order ) {
	$code = $order->get_meta( '_ambassador_ref' );
	if ( empty( $code ) ) {
		return;
	}
	echo '<p class="form-field form-field-wide"><strong>' .
		esc_html__( 'Ambassador referral', 'charlies-theme' ) . ':</strong> ' .
		'<code>' . esc_html( $code ) . '</code></p>';
}
add_action( 'woocommerce_admin_order_data_after_billing_address', 'charlies_render_ambassador_ref_admin', 10, 1 );
