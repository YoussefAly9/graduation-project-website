# FreshMart PWA Icons

This directory contains app icons required for the Progressive Web App functionality.

## Required Icon Sizes

- **72x72** - Small favicon and Android
- **96x96** - Android, Windows
- **128x128** - Android
- **144x144** - Windows tile, Android
- **152x152** - iOS Safari
- **192x192** - Android (standard)
- **384x384** - Android
- **512x512** - Android (high-res), splash screens

## Quick Start: Generate Placeholder Icons

We've provided an icon generator to create placeholder icons quickly:

1. Open `icon-generator.html` in your browser:
   ```
   # From the icons directory
   open icon-generator.html
   # Or on Windows
   start icon-generator.html
   ```

2. Click "Generate All Icons"

3. Download each icon using the "Download" button beneath it

4. Save them in this directory with the correct filenames

## Using Custom Icons

For a production app, you should replace these placeholder icons with your own branded icons:

### Option 1: Design Tools
- Design your icon in Figma, Adobe Illustrator, or Sketch
- Export at each required size
- Save as PNG with transparent background
- Use consistent design across all sizes

### Option 2: Online Icon Generators
- **[PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)** - Upload one image, generates all sizes
- **[RealFaviconGenerator](https://realfavicongenerator.net/)** - Comprehensive favicon and icon generator
- **[App Icon Generator](https://appicon.co/)** - Simple drag-and-drop generator

### Design Guidelines

- **Use a simple, recognizable shape** - Icons appear small on home screens
- **High contrast** - Ensure good visibility on various backgrounds
- **Centered design** - Leave padding around edges (safe zone ~10%)
- **Consistent branding** - Match your app's color scheme
- **Test on devices** - Preview on actual iOS/Android devices

## File Format Requirements

- Format: PNG with transparency
- Color: RGB color space
- Compression: Optimize for web (use tools like TinyPNG)
- Naming: Exactly as specified in manifest.json

## Maskable Icons

Modern Android devices support "maskable" icons that adapt to different shapes (circle, squircle, rounded square). For best results:

1. Keep important content in the center "safe zone" (80% of canvas)
2. Extend design to full canvas edges for visual appeal
3. Test with [Maskable.app](https://maskable.app/)

## Screenshots

The manifest also references screenshots for app store listings:

- `screenshots/home.png` - Mobile screenshot (540x720)
- `screenshots/products.png` - Desktop screenshot (1280x720)

Create these by taking actual screenshots of your app and placing them in `public/screenshots/`.

## Verification

After adding all icons, verify they work:

1. Run the dev server: `npm run dev`
2. Open DevTools → Application → Manifest
3. Check that all icons load correctly
4. Test "Add to Home Screen" on mobile device

