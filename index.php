<?php get_header(); ?>

<main class="charlies-main">
    <?php if (is_home() && !have_posts()) : ?>
        <!-- Show landing page content if this is homepage with no posts -->
        <section class="charlies-hero">
            <div class="charlies-container">
                <h1>Premium Nicotine Products</h1>
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
                    <p>No products set up yet. <a href="<?php echo admin_url('edit.php?post_type=product'); ?>">Add some products</a> to get started.</p>
                    <div class="charlies-view-all">
                        <a href="<?php echo wc_get_page_permalink('shop'); ?>" class="btn btn-outline">Go to Shop</a>
                    </div>
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

    <?php else : ?>
        <!-- Standard blog/page content -->
        <div class="charlies-container">
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <header class="entry-header">
                        <?php if (is_single()) : ?>
                            <h1 class="entry-title"><?php the_title(); ?></h1>
                        <?php else : ?>
                            <h2 class="entry-title">
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </h2>
                        <?php endif; ?>

                        <?php if (!is_page()) : ?>
                            <div class="entry-meta">
                                <span class="posted-on">
                                    <?php echo get_the_date(); ?>
                                </span>
                                <span class="byline">
                                    by <?php the_author(); ?>
                                </span>
                            </div>
                        <?php endif; ?>
                    </header>

                    <div class="entry-content">
                        <?php
                        if (is_single() || is_page()) {
                            the_content();
                        } else {
                            the_excerpt();
                        }
                        ?>
                    </div>

                    <?php if (!is_single() && !is_page()) : ?>
                        <footer class="entry-footer">
                            <a href="<?php the_permalink(); ?>" class="read-more">Read More</a>
                        </footer>
                    <?php endif; ?>
                </article>
            <?php endwhile; ?>

            <?php if (!is_single() && !is_page()) : ?>
                <div class="pagination">
                    <?php
                    the_posts_pagination(array(
                        'prev_text' => '&laquo; Previous',
                        'next_text' => 'Next &raquo;',
                    ));
                    ?>
                </div>
            <?php endif; ?>

        <?php else : ?>
            <div class="no-content">
                <h1>Nothing Found</h1>
                <p>It seems we can't find what you're looking for. Perhaps searching can help.</p>
                <?php get_search_form(); ?>
            </div>
        <?php endif; ?>
        </div>
    <?php endif; ?>
</main>

<?php get_footer(); ?>