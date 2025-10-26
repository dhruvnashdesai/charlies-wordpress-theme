/**
 * Simple Age Verification for Nicotine Products
 * Lucy.co inspired - clean and minimal
 */

(function($) {
    'use strict';

    // Check if user is already verified
    const isVerified = localStorage.getItem('charlies_age_verified');
    const expirationTime = localStorage.getItem('charlies_age_verified_expires');
    const now = new Date().getTime();

    // If not verified or expired, show modal
    if (!isVerified || !expirationTime || now > parseInt(expirationTime)) {
        showAgeModal();
    }

    function showAgeModal() {
        // Create simple modal HTML
        const modalHTML = `
            <div id="charlies-age-modal" class="charlies-modal-overlay">
                <div class="charlies-modal">
                    <div class="charlies-modal-content">
                        <h2>Age Verification</h2>
                        <p>You must be ${charlies_config.minimum_age} years or older to access this site.</p>
                        <p>Are you ${charlies_config.minimum_age} years of age or older?</p>
                        <div class="charlies-age-buttons">
                            <button id="charlies-age-yes" class="btn btn-primary">Yes, I'm ${charlies_config.minimum_age}+</button>
                            <button id="charlies-age-no" class="btn btn-secondary">No, I'm under ${charlies_config.minimum_age}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        $('body').append(modalHTML);
        $('body').addClass('charlies-modal-open');

        // Handle button clicks
        $('#charlies-age-yes').on('click', function() {
            verifyAge(true);
        });

        $('#charlies-age-no').on('click', function() {
            verifyAge(false);
        });
    }

    function verifyAge(isOfAge) {
        if (isOfAge) {
            // Set verification for 24 hours
            const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('charlies_age_verified', 'true');
            localStorage.setItem('charlies_age_verified_expires', expirationTime.toString());

            // Remove modal
            $('#charlies-age-modal').fadeOut(300, function() {
                $(this).remove();
                $('body').removeClass('charlies-modal-open');
            });
        } else {
            // Redirect to appropriate page or show denial message
            alert('You must be ' + charlies_config.minimum_age + ' or older to access this site.');
            window.location.href = 'https://www.google.com'; // Redirect away
        }
    }

})(jQuery);