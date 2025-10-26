<footer class="charlies-footer">
    <div class="charlies-container">
        <div class="charlies-footer-content">
            <div class="charlies-footer-section">
                <h3><?php bloginfo('name'); ?></h3>
                <p>Premium nicotine products for the modern consumer.</p>
            </div>

            <div class="charlies-footer-section">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></li>
                    <?php if (class_exists('WooCommerce')) : ?>
                        <li><a href="<?php echo wc_get_page_permalink('shop'); ?>">Products</a></li>
                        <li><a href="<?php echo wc_get_account_endpoint_url('dashboard'); ?>">My Account</a></li>
                    <?php endif; ?>
                    <li><a href="<?php echo esc_url(home_url('/about')); ?>">About</a></li>
                    <li><a href="<?php echo esc_url(home_url('/contact')); ?>">Contact</a></li>
                </ul>
            </div>

            <div class="charlies-footer-section">
                <h4>Customer Service</h4>
                <ul>
                    <li><a href="<?php echo esc_url(home_url('/shipping')); ?>">Shipping Info</a></li>
                    <li><a href="<?php echo esc_url(home_url('/returns')); ?>">Returns</a></li>
                    <li><a href="<?php echo esc_url(home_url('/faq')); ?>">FAQ</a></li>
                    <li><a href="<?php echo esc_url(home_url('/support')); ?>">Support</a></li>
                </ul>
            </div>

            <div class="charlies-footer-section">
                <h4>Legal</h4>
                <ul>
                    <li><a href="<?php echo esc_url(home_url('/privacy')); ?>">Privacy Policy</a></li>
                    <li><a href="<?php echo esc_url(home_url('/terms')); ?>">Terms of Service</a></li>
                    <li><a href="<?php echo esc_url(home_url('/age-verification')); ?>">Age Verification</a></li>
                </ul>
            </div>
        </div>

        <div class="charlies-footer-bottom">
            <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. All rights reserved.</p>
            <p class="age-warning">This website contains nicotine products intended for adults 19+ only.</p>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>