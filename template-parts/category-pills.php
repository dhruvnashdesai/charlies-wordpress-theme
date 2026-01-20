<?php
/**
 * Category Pills - Two-level AJAX filter for shop page
 *
 * Level 1: Product Types (parent categories)
 * Level 2: Brands (child categories or pa_brand attribute)
 *
 * @package CharliesTheme
 */

defined( 'ABSPATH' ) || exit;

// Get parent product categories (product types)
$product_types = get_terms( array(
	'taxonomy'   => 'product_cat',
	'hide_empty' => true,
	'parent'     => 0,
	'orderby'    => 'menu_order',
	'order'      => 'ASC',
) );

// Get brands - check for pa_brand attribute first, fallback to child categories
$brands = array();
$brand_taxonomy = 'pa_brand';

if ( taxonomy_exists( $brand_taxonomy ) ) {
	$brands = get_terms( array(
		'taxonomy'   => $brand_taxonomy,
		'hide_empty' => true,
		'orderby'    => 'name',
		'order'      => 'ASC',
	) );
}

// If no brand attribute, get all child categories as brands
if ( empty( $brands ) || is_wp_error( $brands ) ) {
	$brand_taxonomy = 'product_cat';
	$brands = get_terms( array(
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'parent'     => 0,
		'exclude'    => array_map( function( $t ) { return $t->term_id; }, $product_types ),
		'orderby'    => 'name',
		'order'      => 'ASC',
	) );

	// Actually get child categories
	$child_brands = array();
	foreach ( $product_types as $type ) {
		$children = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'parent'     => $type->term_id,
			'orderby'    => 'name',
			'order'      => 'ASC',
		) );
		if ( ! empty( $children ) && ! is_wp_error( $children ) ) {
			$child_brands = array_merge( $child_brands, $children );
		}
	}

	if ( ! empty( $child_brands ) ) {
		// Remove duplicates by slug
		$unique_brands = array();
		foreach ( $child_brands as $brand ) {
			$unique_brands[ $brand->slug ] = $brand;
		}
		$brands = array_values( $unique_brands );
	}
}

// Get current filters from URL
$current_type = isset( $_GET['product_type'] ) ? sanitize_text_field( $_GET['product_type'] ) : '';
$current_brand = isset( $_GET['brand'] ) ? sanitize_text_field( $_GET['brand'] ) : '';
?>

<div class="shop-filters" data-brand-taxonomy="<?php echo esc_attr( $brand_taxonomy ); ?>">
	<?php if ( ! empty( $product_types ) && ! is_wp_error( $product_types ) ) : ?>
	<!-- Product Type Pills -->
	<div class="filter-pills filter-pills--types">
		<button type="button"
				class="filter-pills__item <?php echo empty( $current_type ) ? 'filter-pills__item--active' : ''; ?>"
				data-filter="type"
				data-value="">
			<?php esc_html_e( 'All', 'charlies-theme' ); ?>
		</button>
		<?php foreach ( $product_types as $type ) : ?>
			<button type="button"
					class="filter-pills__item <?php echo $current_type === $type->slug ? 'filter-pills__item--active' : ''; ?>"
					data-filter="type"
					data-value="<?php echo esc_attr( $type->slug ); ?>">
				<?php echo esc_html( $type->name ); ?>
			</button>
		<?php endforeach; ?>
	</div>
	<?php endif; ?>

	<?php if ( ! empty( $brands ) && ! is_wp_error( $brands ) ) : ?>
	<!-- Brand Pills -->
	<div class="filter-pills filter-pills--brands">
		<button type="button"
				class="filter-pills__item <?php echo empty( $current_brand ) ? 'filter-pills__item--active' : ''; ?>"
				data-filter="brand"
				data-value="">
			<?php esc_html_e( 'All Brands', 'charlies-theme' ); ?>
		</button>
		<?php foreach ( $brands as $brand ) : ?>
			<button type="button"
					class="filter-pills__item <?php echo $current_brand === $brand->slug ? 'filter-pills__item--active' : ''; ?>"
					data-filter="brand"
					data-value="<?php echo esc_attr( $brand->slug ); ?>">
				<?php echo esc_html( $brand->name ); ?>
			</button>
		<?php endforeach; ?>
	</div>
	<?php endif; ?>
</div>
