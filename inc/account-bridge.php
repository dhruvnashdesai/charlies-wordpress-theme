<?php
/**
 * Checkout account bridge.
 *
 * Makes the WooCommerce "create an account" checkbox at checkout also provision
 * a matching storefront (Supabase) account on charliesclub.com with the SAME
 * email + password — so one set of credentials works on both the checkout and
 * the storefront (loyalty, rewards, order history).
 *
 * - Offers the create-account option + a password field at checkout.
 * - Hides it (and pre-fills the email) for visitors already signed into the
 *   storefront (a valid `loyalty-id` handoff cookie).
 * - On account creation, mirrors the credentials to the storefront via a signed
 *   server-to-server call (HMAC over the shared LOYALTY_HANDOFF_SECRET).
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether the current visitor already has a storefront account (valid handoff
 * cookie). Reuses the loyalty-handoff verifier.
 *
 * @return array{sub:string,email:string}|null
 */
function charlies_storefront_identity() {
	if ( empty( $_COOKIE['loyalty-id'] ) || ! function_exists( 'charlies_verify_handoff_token' ) ) {
		return null;
	}
	return charlies_verify_handoff_token( sanitize_text_field( wp_unslash( $_COOKIE['loyalty-id'] ) ) );
}

// Offer account creation at checkout — unless they already have a storefront
// account, in which case there's nothing to create.
add_filter(
	'woocommerce_checkout_registration_enabled',
	function ( $enabled ) {
		return charlies_storefront_identity() ? false : true;
	}
);
// Keep it optional (guest checkout still allowed).
add_filter( 'woocommerce_checkout_registration_required', '__return_false' );
// Show a password field so the customer sets a password we can mirror.
add_filter( 'pre_option_woocommerce_registration_generate_password', fn() => 'no' );

// Pre-fill the billing email for signed-in storefront customers.
add_filter(
	'woocommerce_checkout_get_value',
	function ( $value, $input ) {
		if ( 'billing_email' === $input && empty( $value ) ) {
			$id = charlies_storefront_identity();
			if ( $id && ! empty( $id['email'] ) ) {
				return $id['email'];
			}
		}
		return $value;
	},
	10,
	2
);

/**
 * Mirror a just-created Woo account to the storefront (same email + password).
 *
 * @param string $email    The customer email.
 * @param string $password The plaintext password they chose.
 * @param string $name     Their full name (optional).
 * @return void
 */
function charlies_provision_storefront_account( $email, $password, $name ) {
	if ( empty( $email ) || empty( $password ) || ! function_exists( 'charlies_loyalty_secret' ) ) {
		return;
	}
	$secret = charlies_loyalty_secret();
	if ( '' === $secret ) {
		return;
	}
	$ts  = (string) time();
	$sig = hash_hmac( 'sha256', strtolower( $email ) . ':' . $ts, $secret );

	$url = ( function_exists( 'charlies_storefront_url' ) ? charlies_storefront_url() : 'https://charliesclub.com' )
		. '/api/account/provision';

	$res = wp_remote_post(
		$url,
		array(
			'timeout' => 8,
			'headers' => array( 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode(
				array(
					'email'    => strtolower( $email ),
					'password' => $password,
					'name'     => $name,
					'ts'       => $ts,
					'sig'      => $sig,
				)
			),
		)
	);
	if ( is_wp_error( $res ) ) {
		// Best-effort — the post-purchase prompt is the fallback. Log for triage.
		error_log( 'charlies account provision failed: ' . $res->get_error_message() );
	}
}

// Make the "Create an account?" block stand out on the checkout — a pink card,
// separated from the marketing opt-in above it.
add_action(
	'wp_head',
	function () {
		if ( ! function_exists( 'is_checkout' ) || ! is_checkout() ) {
			return;
		}
		?>
<style id="charlies-account-fields-style">
	/* Mirror the sibling "Ship to a different address?" box (#ship-to-different-address)
	   exactly — same padding, border width and radius — so the two checkboxes line
	   up horizontally. Only the colour differs (pink to make it pop). A flex column
	   spaces the checkbox row from the password field (shown when ticked). */
	.woocommerce-account-fields {
		margin-top: 1.75em;
		padding: 1rem;
		background: rgba(237, 32, 123, 0.14);
		border: 2px solid rgba(237, 32, 123, 0.65);
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.woocommerce-account-fields > p,
	.woocommerce-account-fields > .create-account,
	.woocommerce-account-fields .form-row {
		margin: 0;
	}
	/* Scope to the checkbox label only (has this class) — not the password label. */
	.woocommerce-account-fields .woocommerce-form__label-for-checkbox {
		align-items: center;
		gap: 0.75rem;
		font-weight: 600;
		margin: 0;
	}
</style>
		<?php
	}
);

// When Woo creates the account at checkout, mirror it to the storefront.
add_action(
	'woocommerce_created_customer',
	function ( $customer_id, $new_customer_data, $password_generated ) {
		if ( $password_generated ) {
			return; // no user-chosen password to mirror
		}
		$email    = isset( $new_customer_data['user_email'] ) ? $new_customer_data['user_email'] : '';
		$password = isset( $new_customer_data['user_pass'] ) ? $new_customer_data['user_pass'] : '';

		$first = isset( $_POST['billing_first_name'] ) ? sanitize_text_field( wp_unslash( $_POST['billing_first_name'] ) ) : '';
		$last  = isset( $_POST['billing_last_name'] ) ? sanitize_text_field( wp_unslash( $_POST['billing_last_name'] ) ) : '';
		$name  = trim( $first . ' ' . $last );

		charlies_provision_storefront_account( $email, $password, $name );
	},
	20,
	3
);
