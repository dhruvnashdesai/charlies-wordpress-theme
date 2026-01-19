<?php
/**
 * Brand Marquee Template Part
 * Infinite scrolling brand logos
 *
 * @package CharliesTheme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Brand logos - can be filtered or replaced with ACF/custom fields
$brands = array(
	array(
		'name' => 'Brand 1',
		'logo' => CHARLIES_THEME_URI . '/assets/images/brands/brand-1.png',
	),
	array(
		'name' => 'Brand 2',
		'logo' => CHARLIES_THEME_URI . '/assets/images/brands/brand-2.png',
	),
	array(
		'name' => 'Brand 3',
		'logo' => CHARLIES_THEME_URI . '/assets/images/brands/brand-3.png',
	),
	array(
		'name' => 'Brand 4',
		'logo' => CHARLIES_THEME_URI . '/assets/images/brands/brand-4.png',
	),
	array(
		'name' => 'Brand 5',
		'logo' => CHARLIES_THEME_URI . '/assets/images/brands/brand-5.png',
	),
	array(
		'name' => 'Brand 6',
		'logo' => CHARLIES_THEME_URI . '/assets/images/brands/brand-6.png',
	),
);

$brands = apply_filters( 'charlies_brand_logos', $brands );

// Don't render if no brands
if ( empty( $brands ) ) {
	return;
}
?>

<section class="brand-marquee">
	<div class="brand-marquee__track">
		<div class="brand-marquee__inner">
			<?php
			// Output brands twice for seamless loop
			for ( $i = 0; $i < 2; $i++ ) :
				foreach ( $brands as $brand ) :
			?>
				<div class="brand-marquee__item">
					<?php if ( file_exists( str_replace( CHARLIES_THEME_URI, CHARLIES_THEME_DIR, $brand['logo'] ) ) ) : ?>
						<img src="<?php echo esc_url( $brand['logo'] ); ?>" alt="<?php echo esc_attr( $brand['name'] ); ?>" loading="lazy">
					<?php else : ?>
						<span class="brand-marquee__placeholder"><?php echo esc_html( $brand['name'] ); ?></span>
					<?php endif; ?>
				</div>
			<?php
				endforeach;
			endfor;
			?>
		</div>
	</div>
</section>
