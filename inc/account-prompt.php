<?php
/**
 * Post-purchase account prompt (the loyalty carrot).
 *
 * On the order-received ("thank you") page we invite the customer to create a
 * storefront account on charliesclub.com — at peak intent, with their email
 * already known — to claim the loyalty points this order earned and track it.
 * Signing up with the same email claims the shadow loyalty account the order
 * created (the storefront's account-link trigger flips shadow -> active on email
 * confirmation), so the points carry over.
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The storefront (headless apex) base URL. Overridable via a constant/env; the
 * checkout runs on the checkout.* subdomain, the account lives on the apex.
 *
 * @return string
 */
function charlies_storefront_url() {
	if ( defined( 'CHARLIES_STOREFRONT_URL' ) && CHARLIES_STOREFRONT_URL ) {
		return rtrim( (string) CHARLIES_STOREFRONT_URL, '/' );
	}
	$env = getenv( 'CHARLIES_STOREFRONT_URL' );
	return $env ? rtrim( (string) $env, '/' ) : 'https://charliesclub.com';
}

/**
 * Render the create-account CTA on the thank-you page.
 *
 * @param int $order_id The received order id.
 * @return void
 */
function charlies_account_prompt( $order_id ) {
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return;
	}

	$email = $order->get_billing_email();
	if ( empty( $email ) ) {
		return;
	}

	// Estimate points (storefront awards ~1 point per dollar of item subtotal).
	$points = (int) floor( (float) $order->get_subtotal() );

	$headline = $points > 0
		? sprintf(
			/* translators: %s: estimated loyalty points */
			esc_html__( 'You just earned about %s points on this order.', 'charlies-theme' ),
			'<strong>' . esc_html( number_format_i18n( $points ) ) . '</strong>'
		)
		: esc_html__( 'Start earning points on your orders.', 'charlies-theme' );

	// If this order created (or belongs to) an account, invite them to log in
	// rather than create one. Otherwise offer account creation.
	$has_account = $order->get_user_id() > 0;
	if ( $has_account ) {
		$cta_url  = charlies_storefront_url() . '/en/login?' . http_build_query(
			array(
				'email' => $email,
				'next'  => '/en/rewards',
			)
		);
		$cta_body  = esc_html__( 'Your account is ready. Log in to see your points, track this order, and check out faster next time.', 'charlies-theme' );
		$cta_label = esc_html__( 'Go to my account', 'charlies-theme' );
	} else {
		$cta_url  = charlies_storefront_url() . '/en/signup?' . http_build_query(
			array(
				'email' => $email,
				'next'  => '/en/rewards',
			)
		);
		$cta_body  = esc_html__( 'Create your Charlie\'s account to claim your points, track this order, and check out faster next time.', 'charlies-theme' );
		$cta_label = esc_html__( 'Create my account', 'charlies-theme' );
	}

	?>
	<div class="charlies-account-prompt" style="margin:2em 0;padding:1.25em 1.5em;border:1px solid #ED207B;border-radius:12px;background:#fff0f7;">
		<p style="margin:0 0 .35em;font-size:1.1em;font-weight:600;color:#111;"><?php echo wp_kses_post( $headline ); ?></p>
		<p style="margin:0 0 1em;color:#444;"><?php echo esc_html( $cta_body ); ?></p>
		<a href="<?php echo esc_url( $cta_url ); ?>"
			style="display:inline-block;padding:.7em 1.4em;background:#ED207B;color:#fff;font-weight:600;border-radius:8px;text-decoration:none;">
			<?php echo esc_html( $cta_label ); ?>
		</a>
	</div>
	<?php
}
add_action( 'woocommerce_thankyou', 'charlies_account_prompt', 5 );
