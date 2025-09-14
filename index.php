<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<header class="site-header">
    <div class="site-content">
        <div class="header-content">
            <?php if (has_custom_logo()) : ?>
                <div class="site-logo">
                    <?php the_custom_logo(); ?>
                </div>
            <?php else : ?>
                <h1 class="site-title">
                    <a href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a>
                </h1>
            <?php endif; ?>

            <nav class="main-navigation">
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'menu_id' => 'primary-menu',
                    'fallback_cb' => false,
                ));
                ?>
            </nav>
        </div>
    </div>
</header>

<main class="site-content">
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
</main>

<aside class="sidebar">
    <?php if (is_active_sidebar('sidebar-1')) : ?>
        <?php dynamic_sidebar('sidebar-1'); ?>
    <?php endif; ?>
</aside>

<footer class="site-footer">
    <div class="site-content">
        <div class="footer-content">
            <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. All rights reserved.</p>

            <?php if (has_nav_menu('footer')) : ?>
                <nav class="footer-navigation">
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'footer',
                        'menu_id' => 'footer-menu',
                        'depth' => 1,
                    ));
                    ?>
                </nav>
            <?php endif; ?>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>