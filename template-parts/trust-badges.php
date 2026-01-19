<?php
/**
 * Trust Badges Template Part
 * Glassmorphic badges below the header
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$badges = array(
	array(
		'text' => __( 'Premium Quality', 'charlies-theme' ),
	),
	array(
		'text' => __( 'Secure Payment', 'charlies-theme' ),
	),
	array(
		'text' => __( 'Fast Shipping', 'charlies-theme' ),
	),
);

$badges = apply_filters( 'charlies_trust_badges', $badges );
?>

<section class="trust-badges">
	<div class="container">
		<div class="trust-badges__list">
			<?php foreach ( $badges as $badge ) : ?>
				<div class="trust-badge">
					<svg class="trust-badge__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
					</svg>
					<span class="trust-badge__text"><?php echo esc_html( $badge['text'] ); ?></span>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
