<?php
/**
 * Template for Home Page (slug: home)
 * This will automatically be used for the page with slug "home"
 */

get_header(); ?>

<main class="charlies-main">
    <!-- Hero Section -->
    <section class="charlies-hero">
        <div class="charlies-container">
            <h1>Join the Club</h1>
            <p>Discover our carefully curated selection of high-quality nicotine products designed for the modern consumer.</p>
            <?php if (class_exists('WooCommerce')) : ?>
                <a href="<?php echo wc_get_page_permalink('shop'); ?>" class="btn btn-primary">Shop Now</a>
            <?php endif; ?>
        </div>
    </section>

    <!-- Featured Products -->
    <?php if (class_exists('WooCommerce')) : ?>
        <section class="charlies-featured-products">
            <div class="charlies-container">
                <h2 class="section-title">Featured Products</h2>

                <?php
                // Get featured products
                $featured_query = new WP_Query(array(
                    'post_type' => 'product',
                    'posts_per_page' => 6,
                    'meta_query' => array(
                        array(
                            'key' => '_featured',
                            'value' => 'yes'
                        )
                    )
                ));

                if ($featured_query->have_posts()) : ?>
                    <div class="charlies-products-grid">
                        <?php while ($featured_query->have_posts()) : $featured_query->the_post();
                            global $product; ?>
                            <div class="charlies-product-card">
                                <div class="charlies-product-image">
                                    <?php if (has_post_thumbnail()) : ?>
                                        <img src="<?php echo get_the_post_thumbnail_url(get_the_ID(), 'medium'); ?>" alt="<?php the_title(); ?>">
                                    <?php else : ?>
                                        <div class="no-image">No Image</div>
                                    <?php endif; ?>
                                </div>
                                <div class="charlies-product-content">
                                    <h3 class="charlies-product-title"><?php the_title(); ?></h3>
                                    <div class="charlies-product-price"><?php echo $product->get_price_html(); ?></div>
                                    <p class="charlies-product-description"><?php echo wp_trim_words(get_the_excerpt(), 15); ?></p>
                                    <button class="charlies-add-to-cart" data-product-id="<?php echo get_the_ID(); ?>">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        <?php endwhile; ?>
                    </div>
                    <?php wp_reset_postdata(); ?>

                    <div class="charlies-view-all">
                        <a href="<?php echo wc_get_page_permalink('shop'); ?>" class="btn btn-outline">View All Products</a>
                    </div>
                <?php else : ?>
                    <p>No featured products found. <a href="<?php echo admin_url('edit.php?post_type=product'); ?>">Add some products</a> to get started.</p>
                    <div class="charlies-view-all">
                        <a href="<?php echo wc_get_page_permalink('shop'); ?>" class="btn btn-outline">Go to Shop</a>
                    </div>
                <?php endif; ?>
            </div>
        </section>
    <?php endif; ?>

    <!-- About Section -->
    <section class="charlies-about">
        <div class="charlies-container">
            <div class="charlies-about-content">
                <div class="charlies-about-text">
                    <h2>Why Choose Charlie's</h2>
                    <p>We're committed to providing the highest quality nicotine products with a focus on innovation, safety, and customer satisfaction.</p>
                    <ul class="charlies-features">
                        <li>Premium quality products</li>
                        <li>Lab-tested for purity</li>
                        <li>Fast, secure shipping</li>
                        <li>Expert customer support</li>
                    </ul>
                </div>
                <div class="charlies-about-image">
                    <div class="placeholder-image">About Image</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Categories Section -->
    <?php if (class_exists('WooCommerce')) : ?>
        <section class="charlies-categories">
            <div class="charlies-container">
                <h2 class="section-title">Shop by Category</h2>
                <div class="charlies-categories-grid">
                    <?php
                    $product_categories = get_terms(array(
                        'taxonomy' => 'product_cat',
                        'hide_empty' => true,
                        'parent' => 0,
                        'number' => 4
                    ));

                    if ($product_categories) :
                        foreach ($product_categories as $category) : ?>
                            <div class="charlies-category-card">
                                <a href="<?php echo get_term_link($category); ?>">
                                    <div class="charlies-category-image">
                                        <?php
                                        $thumbnail_id = get_term_meta($category->term_id, 'thumbnail_id', true);
                                        if ($thumbnail_id) {
                                            echo wp_get_attachment_image($thumbnail_id, 'medium');
                                        } else {
                                            echo '<div class="placeholder-category">' . esc_html($category->name) . '</div>';
                                        }
                                        ?>
                                    </div>
                                    <h3><?php echo esc_html($category->name); ?></h3>
                                    <p><?php echo $category->count; ?> products</p>
                                </a>
                            </div>
                        <?php endforeach;
                    else : ?>
                        <p>No product categories found.</p>
                    <?php endif; ?>
                </div>
            </div>
        </section>
    <?php endif; ?>

</main>

<?php get_footer(); ?>