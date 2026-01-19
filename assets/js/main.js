/**
 * Charlie's Theme - Main JavaScript
 *
 * @package CharliesTheme
 */

const charliesTheme = {
	/**
	 * Initialize theme functionality
	 */
	init() {
		this.initMobileMenu();
		this.initBackToTop();
		this.initScrollAnimations();
		this.initSmoothScroll();
	},

	/**
	 * Mobile menu toggle
	 */
	initMobileMenu() {
		const toggle = document.querySelector('.mobile-menu-toggle');
		const menu = document.querySelector('.mobile-menu');

		if (!toggle || !menu) return;

		toggle.addEventListener('click', () => {
			const isOpen = menu.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', isOpen);
			document.body.classList.toggle('menu-open', isOpen);
		});

		// Close menu on escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && menu.classList.contains('is-open')) {
				menu.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
				document.body.classList.remove('menu-open');
			}
		});

		// Close menu when clicking outside
		document.addEventListener('click', (e) => {
			if (menu.classList.contains('is-open') &&
				!menu.contains(e.target) &&
				!toggle.contains(e.target)) {
				menu.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
				document.body.classList.remove('menu-open');
			}
		});
	},

	/**
	 * Back to top button
	 */
	initBackToTop() {
		const btn = document.querySelector('.back-to-top');
		if (!btn) return;

		const toggleVisibility = () => {
			if (window.scrollY > 500) {
				btn.classList.add('is-visible');
			} else {
				btn.classList.remove('is-visible');
			}
		};

		// Throttled scroll handler
		let ticking = false;
		window.addEventListener('scroll', () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					toggleVisibility();
					ticking = false;
				});
				ticking = true;
			}
		});

		btn.addEventListener('click', () => {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		});

		// Initial check
		toggleVisibility();
	},

	/**
	 * Scroll reveal animations
	 */
	initScrollAnimations() {
		const animatedElements = document.querySelectorAll('[data-animate], .animate-stagger, .animate-fade, .animate-scale');

		if (!animatedElements.length) return;

		// Check if user prefers reduced motion
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			animatedElements.forEach(el => el.classList.add('is-visible'));
			return;
		}

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			});
		}, {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		});

		animatedElements.forEach(el => observer.observe(el));
	},

	/**
	 * Smooth scroll for anchor links
	 */
	initSmoothScroll() {
		document.querySelectorAll('a[href^="#"]').forEach(anchor => {
			anchor.addEventListener('click', (e) => {
				const href = anchor.getAttribute('href');
				if (href === '#') return;

				const target = document.querySelector(href);
				if (target) {
					e.preventDefault();
					target.scrollIntoView({ behavior: 'smooth' });
				}
			});
		});
	}
};

/**
 * Cart count animation helper
 */
const charliesCartAnimation = {
	bump() {
		const counts = document.querySelectorAll('.charlies-cart-count');
		counts.forEach(count => {
			count.classList.add('bump');
			setTimeout(() => count.classList.remove('bump'), 300);
		});
	}
};

// Make available globally for cart.js
window.charliesCartAnimation = charliesCartAnimation;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
	charliesTheme.init();
});
