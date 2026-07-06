<?php
/**
 * Interac e-Transfer payment gateway.
 *
 * Offline gateway: the customer sends an Interac e-Transfer from their own
 * bank (autodeposit is enabled on the receiving address, so no security
 * question). The order waits on-hold until the deposit is confirmed —
 * manually in Woo admin for now; the inventory platform's deposit matcher
 * will automate the on-hold → processing flip later. It matches on the
 * order number the customer puts in the transfer message, which is why the
 * instructions ask for it.
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Charlies_Gateway_ETransfer extends WC_Payment_Gateway {

	/**
	 * E-Transfer recipient address shown in the instructions.
	 *
	 * @var string
	 */
	protected $recipient;

	/**
	 * Instructions template ({order_number}/{order_total}/{recipient}).
	 *
	 * @var string
	 */
	protected $instructions;

	public function __construct() {
		$this->id                 = 'charlies_etransfer';
		$this->has_fields         = false;
		$this->method_title       = __( 'Interac e-Transfer', 'charlies-theme' );
		$this->method_description = __( 'Payment by Interac e-Transfer. Orders stay on-hold until the deposit is confirmed (manually, or by the inventory platform\'s matcher).', 'charlies-theme' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title        = $this->get_option( 'title' );
		$this->description  = $this->get_option( 'description' );
		$this->recipient    = $this->get_option( 'recipient' );
		$this->instructions = $this->get_option( 'instructions' );

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_thankyou_' . $this->id, array( $this, 'thankyou_page' ) );
		add_action( 'woocommerce_email_before_order_table', array( $this, 'email_instructions' ), 10, 3 );
	}

	public function init_form_fields() {
		$this->form_fields = array(
			'enabled'      => array(
				'title'   => __( 'Enable/Disable', 'charlies-theme' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable Interac e-Transfer', 'charlies-theme' ),
				'default' => 'no',
			),
			'title'        => array(
				'title'       => __( 'Title', 'charlies-theme' ),
				'type'        => 'text',
				'description' => __( 'Payment method name the customer sees at checkout.', 'charlies-theme' ),
				'default'     => __( 'Interac e-Transfer', 'charlies-theme' ),
				'desc_tip'    => true,
			),
			'description'  => array(
				'title'       => __( 'Description', 'charlies-theme' ),
				'type'        => 'textarea',
				'description' => __( 'Shown under the method name at checkout, before the order is placed.', 'charlies-theme' ),
				'default'     => __( 'Pay from your Canadian bank account with Interac e-Transfer. We\'ll show you the transfer details after you place your order.', 'charlies-theme' ),
				'desc_tip'    => true,
			),
			'recipient'    => array(
				'title'       => __( 'Recipient email', 'charlies-theme' ),
				'type'        => 'email',
				'description' => __( 'The e-Transfer address customers send payment to ({recipient} in the instructions).', 'charlies-theme' ),
				'default'     => 'etf@charliesclub.com',
			),
			'instructions' => array(
				'title'       => __( 'Instructions', 'charlies-theme' ),
				'type'        => 'textarea',
				'css'         => 'min-height:140px;',
				'description' => __( 'Shown on the order-received page and in the on-hold email. Placeholders: {order_number}, {order_total}, {recipient}.', 'charlies-theme' ),
				'default'     => __(
					"Send an Interac e-Transfer of {order_total} to {recipient} with your order number ({order_number}) in the e-Transfer comments.\n\nAutodeposit is enabled — no security question is needed.\n\nOrders are processed manually during business hours, Monday to Friday, up to 3 business days after payment is received. Weekend payments are processed the following Monday.\n\nIMPORTANT: If your payment isn't received within three (3) business days, your order will be cancelled.\n\nInterac e-Transfer is available with your Canadian online bank account. Details: http://www.interac.ca/en/interac-etransfer/etransfer-faq",
					'charlies-theme'
				),
			),
		);
	}

	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );

		$order->update_status( 'on-hold', __( 'Awaiting Interac e-Transfer deposit.', 'charlies-theme' ) );

		wc_maybe_reduce_stock_levels( $order_id );

		if ( isset( WC()->cart ) ) {
			WC()->cart->empty_cart();
		}

		return array(
			'result'   => 'success',
			'redirect' => $this->get_return_url( $order ),
		);
	}

	/**
	 * Instructions with placeholders resolved for a specific order.
	 */
	protected function get_order_instructions( WC_Order $order ) {
		if ( ! $this->instructions ) {
			return '';
		}
		// Plain-text total (e.g. "$45.00") so the same string works in HTML
		// and plain-text emails alike.
		$total = html_entity_decode(
			wp_strip_all_tags( wc_price( $order->get_total(), array( 'currency' => $order->get_currency() ) ) ),
			ENT_QUOTES,
			'UTF-8'
		);

		return str_replace(
			array( '{order_number}', '{order_total}', '{recipient}' ),
			array( $order->get_order_number(), $total, $this->recipient ),
			$this->instructions
		);
	}

	/**
	 * Order-received (thank-you) page.
	 */
	public function thankyou_page( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order || ! $order->has_status( 'on-hold' ) ) {
			return;
		}
		$text = $this->get_order_instructions( $order );
		if ( ! $text ) {
			return;
		}
		echo '<section class="charlies-etransfer-instructions">';
		echo '<h2>' . esc_html__( 'How to pay', 'charlies-theme' ) . '</h2>';
		echo wp_kses_post( make_clickable( wpautop( wptexturize( $text ) ) ) );
		echo '</section>';
	}

	/**
	 * Payment instructions in the customer's on-hold email.
	 *
	 * @param WC_Order $order         Order object.
	 * @param bool     $sent_to_admin Whether this is the admin copy.
	 * @param bool     $plain_text    Whether the email is plain text.
	 */
	public function email_instructions( $order, $sent_to_admin, $plain_text = false ) {
		if ( $sent_to_admin || $this->id !== $order->get_payment_method() || ! $order->has_status( 'on-hold' ) ) {
			return;
		}
		$text = $this->get_order_instructions( $order );
		if ( ! $text ) {
			return;
		}
		if ( $plain_text ) {
			echo esc_html( wp_strip_all_tags( $text ) ) . "\n\n";
		} else {
			echo '<h2>' . esc_html__( 'How to pay', 'charlies-theme' ) . '</h2>';
			echo wp_kses_post( make_clickable( wpautop( wptexturize( $text ) ) ) );
		}
	}
}
