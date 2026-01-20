<?php
/**
 * Category Pills - Filter pills for shop page
 *
 * Displays WooCommerce product categories as horizontal scrollable pills.
 *
 * @package CharliesTheme
 */

defined( 'ABSPATH' ) || exit;

// Get product categories (only parent categories, hide empty)
$categories = get_terms( array(
	'taxonomy'   => 'product_cat',
	'hide_empty' => true,
	'parent'     => 0,
	'orderby'    => 'menu_order',
	'order'      => 'ASC',
) );

// Exit if no categories
if ( empty( $categories ) || is_wp_error( $categories ) ) {
	return;
}

// Get current category
$current_cat = get_queried_object();
$current_cat_id = ( $current_cat && isset( $current_cat->term_id ) ) ? $current_cat->term_id : 0;
$is_shop = is_shop();
?>

<div class="category-pills">
	<div class="category-pills__list">
		<!-- All Products pill -->
		<a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>"
		   class="category-pills__item <?php echo $is_shop && ! is_product_category() ? 'category-pills__item--active' : ''; ?>">
			<?php esc_html_e( 'All', 'charlies-theme' ); ?>
		</a>

		<?php foreach ( $categories as $category ) : ?>
			<a href="<?php echo esc_url( get_term_link( $category ) ); ?>"
			   class="category-pills__item <?php echo $current_cat_id === $category->term_id ? 'category-pills__item--active' : ''; ?>">
				<?php echo esc_html( $category->name ); ?>
			</a>
		<?php endforeach; ?>
	</div>
</div>
