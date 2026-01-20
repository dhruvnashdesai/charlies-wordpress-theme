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
		this.initFaqAccordion();
		this.initShopFilters();
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
	},

	/**
	 * FAQ Accordion
	 */
	initFaqAccordion() {
		const faqItems = document.querySelectorAll('.faq-item');

		faqItems.forEach(item => {
			const question = item.querySelector('.faq-item__question');
			if (!question) return;

			question.addEventListener('click', () => {
				const isOpen = item.classList.contains('is-open');
				const expanded = question.getAttribute('aria-expanded') === 'true';

				// Close all other items
				faqItems.forEach(otherItem => {
					if (otherItem !== item) {
						otherItem.classList.remove('is-open');
						const otherQuestion = otherItem.querySelector('.faq-item__question');
						if (otherQuestion) {
							otherQuestion.setAttribute('aria-expanded', 'false');
						}
					}
				});

				// Toggle current item
				item.classList.toggle('is-open', !isOpen);
				question.setAttribute('aria-expanded', !expanded);
			});
		});
	},

	/**
	 * Shop AJAX Filters
	 */
	initShopFilters() {
		const filtersContainer = document.querySelector('.shop-filters');
		const productsContainer = document.getElementById('shop-products');

		if (!filtersContainer || !productsContainer) return;

		// Current filter state
		const filters = {
			type: '',
			brand: ''
		};

		// Get brand taxonomy from data attribute
		const brandTaxonomy = filtersContainer.dataset.brandTaxonomy || 'product_cat';

		// Handle pill clicks
		filtersContainer.addEventListener('click', (e) => {
			const pill = e.target.closest('.filter-pills__item');
			if (!pill) return;

			const filterType = pill.dataset.filter;
			const filterValue = pill.dataset.value;

			// Update filter state
			filters[filterType] = filterValue;

			// Update active states
			const pillGroup = pill.closest('.filter-pills');
			pillGroup.querySelectorAll('.filter-pills__item').forEach(p => {
				p.classList.remove('filter-pills__item--active');
			});
			pill.classList.add('filter-pills__item--active');

			// Fetch filtered products
			this.fetchProducts(filters, brandTaxonomy, productsContainer);
		});
	},

	/**
	 * Fetch products via AJAX
	 */
	fetchProducts(filters, brandTaxonomy, container) {
		// Show loading state
		container.classList.add('is-loading');

		// Build form data
		const formData = new FormData();
		formData.append('action', 'charlies_filter_products');
		formData.append('nonce', charliesAjax.nonce);
		formData.append('product_type', filters.type);
		formData.append('brand', filters.brand);
		formData.append('brand_taxonomy', brandTaxonomy);

		fetch(charliesAjax.url, {
			method: 'POST',
			body: formData
		})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				container.innerHTML = data.data.html;

				// Update URL without page reload
				const url = new URL(window.location);
				if (filters.type) {
					url.searchParams.set('product_type', filters.type);
				} else {
					url.searchParams.delete('product_type');
				}
				if (filters.brand) {
					url.searchParams.set('brand', filters.brand);
				} else {
					url.searchParams.delete('brand');
				}
				window.history.pushState({}, '', url);
			}
		})
		.catch(error => {
			console.error('Filter error:', error);
		})
		.finally(() => {
			container.classList.remove('is-loading');
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
