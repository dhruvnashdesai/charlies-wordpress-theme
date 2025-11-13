<?php
/**
 * Custom Shop Page Template - Category Grouped Layout
 * Inspired by Lucy.co design with left filtering sidebar
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' ); ?>

<main class="charlies-main charlies-shop-custom">
    <div class="charlies-container">


        <!-- Shop Layout: Sidebar + Content -->
        <div class="charlies-shop-layout">

            <!-- Left Sidebar - Filtering System -->
            <aside class="charlies-shop-sidebar">
                <div class="charlies-filter-section">
                    <h3 class="filter-title">Product</h3>
                    <div class="charlies-filter-group">
                        <?php
                        // Get all product categories
                        $product_categories = get_terms(array(
                            'taxonomy' => 'product_cat',
                            'hide_empty' => true,
                            'parent' => 0,
                        ));

                        if ($product_categories) :
                            foreach ($product_categories as $category) : ?>
                                <label class="charlies-filter-item">
                                    <input type="checkbox" name="product_categories[]" value="<?php echo esc_attr($category->slug); ?>" class="filter-checkbox">
                                    <span class="checkbox-custom"></span>
                                    <?php echo esc_html($category->name); ?>
                                </label>
                            <?php endforeach;
                        endif;
                        ?>
                    </div>
                </div>

                <!-- Additional Filter Sections -->
                <div class="charlies-filter-section">
                    <h3 class="filter-title">Strength</h3>
                    <div class="charlies-filter-group">
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="strength[]" value="2mg" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            2mg
                        </label>
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="strength[]" value="4mg" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            4mg
                        </label>
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="strength[]" value="6mg" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            6mg
                        </label>
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="strength[]" value="12mg" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            12mg
                        </label>
                    </div>
                </div>

                <div class="charlies-filter-section">
                    <h3 class="filter-title">Flavor</h3>
                    <div class="charlies-filter-group">
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="flavor[]" value="tobacco" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            Tobacco
                        </label>
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="flavor[]" value="menthol" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            Menthol
                        </label>
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="flavor[]" value="mint" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            Mint
                        </label>
                        <label class="charlies-filter-item">
                            <input type="checkbox" name="flavor[]" value="fruit" class="filter-checkbox">
                            <span class="checkbox-custom"></span>
                            Fruit
                        </label>
                    </div>
                </div>
            </aside>

            <!-- Main Content - Category Grouped Products -->
            <div class="charlies-shop-content">
                <?php
                // Get all product categories
                $categories = get_terms(array(
                    'taxonomy' => 'product_cat',
                    'hide_empty' => true,
                    'parent' => 0,
                ));

                if ($categories && !is_wp_error($categories)) :
                    foreach ($categories as $category) :
                        // Get products in this category
                        $products = wc_get_products(array(
                            'category' => array($category->slug),
                            'limit' => 10, // Limit per category
                            'status' => 'publish',
                        ));

                        if (!empty($products)) : ?>

                            <!-- Category Section -->
                            <section class="charlies-category-section" data-category="<?php echo esc_attr($category->slug); ?>">

                                <!-- Category Header -->
                                <div class="charlies-category-header">
                                    <h2 class="category-title"><?php echo esc_html($category->name); ?></h2>
                                    <p class="category-description">
                                        <?php
                                        if ($category->description) {
                                            echo esc_html($category->description);
                                        } else {
                                            echo "Premium " . esc_html(strtolower($category->name)) . " products for the modern consumer.";
                                        }
                                        ?>
                                    </p>
                                </div>

                                <!-- Category Products Grid -->
                                <div class="charlies-category-products">
                                    <?php foreach ($products as $product) :
                                        $product_id = $product->get_id(); ?>

                                        <a href="<?php echo get_permalink($product_id); ?>" class="charlies-product-card lucy-style" data-product-id="<?php echo $product_id; ?>">
                                            <!-- Product Image -->
                                            <div class="charlies-product-image">
                                                <?php echo $product->get_image('medium'); ?>
                                            </div>

                                            <!-- Product Content -->
                                            <div class="charlies-product-content">
                                                <p class="product-title">
                                                    <?php echo esc_html($product->get_name()); ?>
                                                </p>
                                                <p class="product-price">
                                                    <?php echo $product->get_price_html(); ?>
                                                </p>
                                                <?php
                                                // Get product attributes for additional info
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
                                        </a>

                                    <?php endforeach; ?>
                                </div>

                            </section>

                        <?php endif;
                    endforeach;
                endif;
                ?>
            </div>

        </div> <!-- End shop layout -->

    </div> <!-- End container -->
</main>

<script>
// Simple filtering functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const categoryFilters = document.querySelectorAll('input[name="product_categories[]"]');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            filterProducts();
        });
    });

    function filterProducts() {
        const selectedCategories = Array.from(categoryFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const categorySections = document.querySelectorAll('.charlies-category-section');

        categorySections.forEach(section => {
            const categorySlug = section.getAttribute('data-category');

            if (selectedCategories.length === 0 || selectedCategories.includes(categorySlug)) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }
});
</script>

<?php get_footer( 'shop' ); ?>