<?php
/**
 * The template for displaying product content within loops
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-product.php.
 */

defined( 'ABSPATH' ) || exit;

global $product;

// Ensure visibility.
if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}
?>
<li <?php wc_product_class( 'charlies-product-card lucy-style', $product ); ?>>
	<?php
	/**
	 * Hook: woocommerce_before_shop_loop_item.
	 * @hooked woocommerce_template_loop_product_link_open - 10
	 */
	do_action( 'woocommerce_before_shop_loop_item' );
	?>

	<div class="charlies-product-image">
		<?php
		/**
		 * Hook: woocommerce_before_shop_loop_item_title.
		 * @hooked woocommerce_show_product_loop_sale_flash - 10
		 * @hooked woocommerce_template_loop_product_thumbnail - 10
		 */
		do_action( 'woocommerce_before_shop_loop_item_title' );
		?>
	</div>

	<div class="charlies-product-content">
		<p class="product-title">
			<?php echo esc_html($product->get_name()); ?>
		</p>
		<p class="product-price">
			<?php echo $product->get_price_html(); ?>
		</p>
		<?php
		// Get product attributes for additional info
		$product_id = $product->get_id();
		$attributes = $product->get_attributes();
		$strength = '';
		$flavor = '';

		foreach ($attributes as $attribute) {
			$name = strtolower($attribute->get_name());
			if (strpos($name, 'strength') !== false || strpos($name, 'mg') !== false) {
				$terms = wc_get_product_terms($product_id, $attribute->get_name(), array('fields' => 'names'));
				if (!empty($terms)) {
					$strength = $terms[0];
				}
			}
			if (strpos($name, 'flavor') !== false || strpos($name, 'taste') !== false) {
				$terms = wc_get_product_terms($product_id, $attribute->get_name(), array('fields' => 'names'));
				if (!empty($terms)) {
					$flavor = $terms[0];
				}
			}
		}

		$additional_info = '';
		if ($strength && $flavor) {
			$additional_info = $strength . ' / ' . $flavor;
		} elseif ($strength) {
			$additional_info = $strength;
		} elseif ($flavor) {
			$additional_info = $flavor;
		} else {
			// Fallback to category name
			$categories = wp_get_post_terms($product_id, 'product_cat', array('fields' => 'names'));
			if (!empty($categories)) {
				$additional_info = $categories[0];
			}
		}

		if ($additional_info) : ?>
		<p class="product-details">
			<?php echo esc_html($additional_info); ?>
		</p>
		<?php endif; ?>
	</div>

	<?php
	/**
	 * Hook: woocommerce_after_shop_loop_item.
	 * @hooked woocommerce_template_loop_product_link_close - 5
	 */
	do_action( 'woocommerce_after_shop_loop_item' );
	?>
</li>