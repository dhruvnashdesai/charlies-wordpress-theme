/**
 * iOS Safari Viewport Fix
 * Addresses white gap and safe area issues
 */

(function() {
    'use strict';

    function setViewportHeight() {
        // Set CSS custom property for viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        // Also set full height for body (with safety check)
        if (document.body) {
            document.body.style.height = `${window.innerHeight}px`;
        }

        console.log('Viewport height set:', window.innerHeight);
    }

    function handleOrientationChange() {
        // Delay to ensure proper measurement after rotation
        setTimeout(setViewportHeight, 100);
    }

    function handleResize() {
        // Throttle resize events
        clearTimeout(window.viewportResizeTimer);
        window.viewportResizeTimer = setTimeout(setViewportHeight, 100);
    }

    // Initial setup - wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setViewportHeight);
    } else {
        setViewportHeight();
    }

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Handle iOS Safari address bar show/hide
    window.addEventListener('scroll', function() {
        if (window.scrollY === 0) {
            setTimeout(setViewportHeight, 50);
        }
    });

    // Ensure proper height when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(setViewportHeight, 100);
        }
    });

})();