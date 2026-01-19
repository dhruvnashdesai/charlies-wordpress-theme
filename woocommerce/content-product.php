<?php
/**
 * Product Card in Loop
 *
 * @package CharliesTheme
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}

$classes = array( 'product-card' );
if ( ! $product->is_in_stock() ) {
	$classes[] = 'product-card--out-of-stock';
}
?>

<div <?php wc_product_class( $classes, $product ); ?>>
	<a href="<?php the_permalink(); ?>" class="product-card__link">
		<div class="product-card__image">
			<?php
			if ( has_post_thumbnail() ) {
				the_post_thumbnail( 'charlies-product-card' );
			} else {
				echo '<img src="' . esc_url( wc_placeholder_img_src( 'charlies-product-card' ) ) . '" alt="' . esc_attr( get_the_title() ) . '">';
			}

			if ( $product->is_on_sale() ) {
				echo '<span class="product-card__badge">' . esc_html__( 'Sale', 'charlies-theme' ) . '</span>';
			}
			?>
		</div>

		<div class="product-card__content">
			<h3 class="product-card__title"><?php the_title(); ?></h3>

			<div class="product-card__price">
				<?php echo $product->get_price_html(); ?>
			</div>
		</div>
	</a>

	<?php if ( $product->is_in_stock() ) : ?>
		<?php if ( $product->is_type( 'simple' ) ) : ?>
			<button class="product-card__btn ajax-add-to-cart" data-product-id="<?php echo esc_attr( $product->get_id() ); ?>">
				<?php esc_html_e( 'Add to Cart', 'charlies-theme' ); ?>
			</button>
		<?php else : ?>
			<a href="<?php the_permalink(); ?>" class="product-card__btn">
				<?php esc_html_e( 'Select Options', 'charlies-theme' ); ?>
			</a>
		<?php endif; ?>
	<?php else : ?>
		<span class="product-card__btn product-card__btn--disabled">
			<?php esc_html_e( 'Out of Stock', 'charlies-theme' ); ?>
		</span>
	<?php endif; ?>
</div>
