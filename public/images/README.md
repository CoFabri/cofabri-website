# Images Directory

This directory contains all the images used in the CoFabri website.

## Directory Structure

```
images/
├── logo.svg              # Main logo (light version)
├── logo-inverted.svg     # Inverted logo (dark version)
├── apps/                 # App screenshots and icons
│   ├── project-manager.jpg
│   ├── crm-suite.jpg
│   └── analytics-dashboard.jpg
├── testimonials/         # Testimonial profile pictures
│   ├── sarah.jpg
│   ├── michael.jpg
│   └── emily.jpg
└── social/              # Social media images
    ├── og-image.jpg     # Open Graph image
    └── twitter-image.jpg # Twitter card image
```

## Adding a New Logo

1. Place your SVG logo files in the root of the `images` directory:
   - `logo.svg` - Main logo (light version)
   - `logo-inverted.svg` - Inverted logo (dark version)

2. The logo should be:
   - In SVG format for best quality and performance
   - Optimized for web use
   - Have a transparent background
   - Be properly sized (recommended width: 150px)

3. The logo will be automatically used by the `Logo` component in `src/components/ui/Logo.tsx`

## Image Guidelines

- Use WebP format for photos when possible
- Optimize all images before adding them
- Keep file sizes as small as possible
- Use descriptive filenames
- Maintain aspect ratios
- Follow the directory structure for organization

## Social Media Images

- `og-image.jpg`: 1200x630px (Open Graph image)
- `twitter-image.jpg`: 1200x600px (Twitter card image)

These images should be high quality and represent the brand well. 