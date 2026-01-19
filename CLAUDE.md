# Charlie's Theme

WordPress + WooCommerce theme cloning [dipski.co](https://dipski.co/) design.

## Commands

```bash
npm run build      # Compile SCSS → CSS
npm run watch      # Watch mode
wp theme activate charlies-theme
```

## Design Tokens

```
Background:    #000000, #0F0F0F (cards)
Accent:        #ED207B (pink), #D21269 (hover)
Text:          #FFFFFF, #8d8d8d (muted)
Border:        #444444, 2px, 10px radius
Font:          Inter (400, 600)
```

## Code Style

- **PHP:** WordPress standards, escape output (`esc_html`, `esc_attr`, `esc_url`), prefix functions `charlies_`
- **SCSS:** BEM naming, use `$variables`, no `!important`, max 3 levels nesting
- **JS:** ES6+, no jQuery, prefix globals `charlies`

## File Structure

```
assets/scss/     → Source styles (_variables, _header, _products, etc.)
assets/css/      → Compiled main.css
assets/js/       → main.js, cart.js
template-parts/  → Reusable components
woocommerce/     → WooCommerce template overrides
```

## Testing

1. Run `npm run build` after SCSS changes
2. Hard refresh (Cmd+Shift+R)
3. Compare against dipski.co
