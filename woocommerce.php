<?php
/**
 * WooCommerce Template
 * This template is used for all WooCommerce pages (shop, product archives, etc.)
 */

// TEST: Output directly to verify file is loading
echo '<div style="background: blue; color: white; padding: 10px;">WOOCOMMERCE.PHP FILE IS EXECUTING</div>';

get_header();

// DEBUG: Show which template is loading with timestamp
echo '<!-- DEBUG: woocommerce.php template is loading at ' . date('Y-m-d H:i:s') . ' -->';
echo '<!-- DEBUG: Current URL: ' . $_SERVER['REQUEST_URI'] . ' -->';
echo '<!-- DEBUG: is_shop(): ' . (is_shop() ? 'true' : 'false') . ' -->';

// Check if this is the shop page
if (is_shop()) {
    // Use our custom shop layout
    ?>
<main class="charlies-main charlies-shop-custom">
    <div class="charlies-container">

        <!-- TESTING: Very visible indicator that new template is loading -->
        <div style="background: red; color: white; padding: 20px; font-size: 24px; text-align: center; margin: 20px 0; border: 5px solid yellow;">
            🚨 NEW TEMPLATE IS LOADING - THIS SHOULD BE VISIBLE 🚨
        </div>

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

                                        <div class="charlies-product-card" data-product-id="<?php echo $product_id; ?>">
                                            <div class="charlies-product-inner">

                                                <!-- Product Image -->
                                                <div class="charlies-product-image">
                                                    <a href="<?php echo get_permalink($product_id); ?>">
                                                        <?php echo $product->get_image('medium'); ?>
                                                    </a>
                                                </div>

                                                <!-- Product Content -->
                                                <div class="charlies-product-content">
                                                    <h3 class="product-title">
                                                        <a href="<?php echo get_permalink($product_id); ?>">
                                                            <?php echo esc_html($product->get_name()); ?>
                                                        </a>
                                                    </h3>

                                                    <div class="charlies-product-meta">
                                                        <span class="product-price"><?php echo $product->get_price_html(); ?></span>
                                                    </div>

                                                    <div class="charlies-product-actions">
                                                        <a href="<?php echo $product->add_to_cart_url(); ?>"
                                                           class="charlies-add-to-cart"
                                                           data-product-id="<?php echo $product_id; ?>">
                                                            Add to cart
                                                        </a>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

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
</main>
    <?php
} else {
    // For non-shop pages, use default WooCommerce content
    ?>
<main class="charlies-main woocommerce-page">
    <div class="charlies-container">
        <?php
        // WooCommerce content
        woocommerce_content();
        ?>
    </div>
</main>
    <?php
}
?>

<?php get_footer(); ?>