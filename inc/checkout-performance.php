<?php
/**
 * Checkout performance.
 *
 * Defer WooCommerce transactional emails (order confirmation, new-account,
 * admin new-order) to background processing (Action Scheduler) instead of
 * sending them synchronously during the "Place order" request. A slow SMTP send
 * was the main cause of the multi-minute wait after placing an order — the order
 * itself saves + pays in a few seconds; the rest was WooCommerce blocking the
 * response while it sent 2–3 emails one after another. Deferring moves those
 * sends off the checkout critical path; the emails still go out moments later.
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'woocommerce_defer_transactional_emails', '__return_true' );
