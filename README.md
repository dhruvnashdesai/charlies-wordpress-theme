# Charlie's Store Finder WordPress Theme

A custom WordPress theme featuring a full-screen store finder with GTA-style interface, age verification, and Mapbox integration.

## Features

- 🗺️ **Full-screen Mapbox integration** with dark theme
- 🎯 **GTA-style crosshair overlay** and radius vignette
- 🔞 **Two-step age verification** with session management
- 📍 **Canadian postal code geocoding**
- 🏪 **Custom store post type** with location management
- 📱 **Mobile-responsive design**
- ⚡ **Performance optimized** with caching

## Installation

### Automatic Deployment (Recommended)
This theme uses automated deployment via GitHub Actions. Simply push to the `main` branch and changes will be automatically deployed to the WordPress server.

### Manual Installation
1. Upload the theme folder to `/wp-content/themes/`
2. Activate the theme in WordPress Admin
3. Go to Settings → Store Settings to configure

## Configuration

### Required Settings
1. **Mapbox Access Token**: Get from [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. **Age Verification**: Set minimum age (default: 19)
3. **Search Radius**: Configure default search radius in kilometers

### Store Finder Page Setup
1. Create a new page in WordPress
2. Select "Store Finder" template
3. Enable full-screen mode in page settings
4. Publish the page

## Theme Structure

```
charlies-theme/
├── style.css                    # WordPress theme header & styles
├── functions.php                # WordPress integration & asset loading
├── index.php                    # Main theme template
├── page-store-finder.php        # Store finder page template
├── README.md                    # This file
└── charlie-stores/
    ├── css/                     # Store finder styles
    ├── js/                      # Store finder JavaScript
    ├── assets/images/           # Theme assets
    └── includes/                # WordPress PHP classes
        ├── class-store-manager.php
        ├── class-rest-api.php
        └── class-admin.php
```

## Development

### Local Development
1. Clone the repository
2. Make changes to theme files
3. Test locally
4. Push to GitHub for automatic deployment

### Adding Stores
1. Go to WordPress Admin → Stores
2. Add new store with address and coordinates
3. Set store features and product categories
4. Stores will automatically appear on the map

## API Endpoints

The theme creates several REST API endpoints:

- `GET /wp-json/charlie-stores/v1/stores/nearby` - Get nearby stores
- `GET /wp-json/charlie-stores/v1/geocode/{postal_code}` - Geocode postal codes

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

GPL v2 or later

## Changelog

### Version 1.0.0
- Initial release
- Full-screen store finder
- GTA-style interface
- Age verification system
- Mapbox integration