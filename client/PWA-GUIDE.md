# Progressive Web App (PWA) Guide

This guide covers the PWA implementation for FreshMart and how to use, test, and customize it.

## 🚀 What's Included

Your FreshMart app now has full PWA capabilities:

- ✅ **Offline Support** - Browse products and view cached content when offline
- ✅ **Install to Home Screen** - Add FreshMart as an app on any device
- ✅ **Fast Loading** - Cached assets load instantly
- ✅ **Background Sync** - Queue orders when offline, sync when online (ready for implementation)
- ✅ **Push Notifications** - Send order updates (infrastructure ready)
- ✅ **App-like Experience** - Fullscreen mode, splash screen, app icons

## 📁 Files Added

```
client/
├── public/
│   ├── manifest.json           # PWA manifest with app metadata
│   ├── sw.js                   # Service Worker for offline caching
│   ├── browserconfig.xml       # Windows tile configuration
│   └── icons/
│       ├── icon-generator.html # Tool to generate placeholder icons
│       └── README.md          # Icon documentation
├── src/
│   ├── components/
│   │   ├── InstallPrompt.jsx  # "Install App" banner component
│   │   └── OfflineIndicator.jsx # Online/offline status indicator
│   └── utils/
│       └── pwaUtils.js        # PWA utility functions
└── PWA-GUIDE.md               # This file
```

## 🎨 Step 1: Generate Icons

Before testing, you need to generate app icons:

### Quick Method (Placeholder Icons)

1. Navigate to `client/public/icons/`
2. Open `icon-generator.html` in your browser
3. Click "Generate All Icons"
4. Download each icon using the buttons
5. Save them in `client/public/icons/` with the exact filenames shown

### Professional Method (Custom Branded Icons)

1. Design your icon (512×512px minimum, square)
2. Use an online generator:
   - **[PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)** (recommended)
   - **[RealFaviconGenerator](https://realfavicongenerator.net/)**
3. Upload your design
4. Download the generated icons
5. Place them in `client/public/icons/`

**Required icon sizes:** 72, 96, 128, 144, 152, 192, 384, 512 (all in px)

## 🧪 Step 2: Test Locally

### Development Testing

```bash
cd client
npm run dev
```

**Note:** Service Workers don't work fully in dev mode. For complete testing, build and preview:

```bash
npm run build
npm run preview
```

### Browser DevTools Testing

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Check sections:
   - **Manifest**: Verify manifest.json loads correctly
   - **Service Workers**: Should show "activated and running"
   - **Cache Storage**: View cached assets
   - **Offline**: Toggle to test offline mode

### Lighthouse Audit

1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select "Progressive Web App"
4. Click "Generate report"
5. Aim for 90+ score

## 📱 Step 3: Test on Devices

### Android (Chrome)

1. Visit your app URL on mobile Chrome
2. Look for "Install app" banner at bottom
3. Or tap **⋮ → Install app** in menu
4. Confirm installation
5. App appears on home screen
6. Launch like a native app

### iOS (Safari)

1. Visit your app URL in Safari
2. Tap the **Share** button (📤)
3. Scroll and tap **Add to Home Screen**
4. Customize name if desired
5. Tap **Add**
6. App appears on home screen

**Note:** iOS has limited PWA support compared to Android. Push notifications and some features are restricted.

## 🔧 Customization

### Update App Metadata

Edit `client/public/manifest.json`:

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "description": "Your app description",
  "theme_color": "#your-color",
  "background_color": "#your-color",
  ...
}
```

### Customize Caching Strategy

Edit `client/public/sw.js`:

- **Cache-First**: Good for images, fonts (currently used for images)
- **Network-First**: Good for API calls (currently used for `/api/*`)
- **Stale-While-Revalidate**: Good for app shell (currently used for HTML/JS/CSS)

### Customize Install Prompt

Edit `client/src/components/InstallPrompt.jsx`:

- Change delay: `setTimeout(() => { setIsVisible(true); }, 3000)`
- Change dismiss duration: `daysSinceDismissed < 7`
- Customize styling in the `<style>` block

### Disable Install Prompt

If you don't want the install prompt:

Remove from `App.jsx`:
```jsx
import InstallPrompt from '@/components/InstallPrompt.jsx';
// ...
<InstallPrompt />
```

## 🌐 Offline Functionality

### What Works Offline

- ✅ Previously visited pages
- ✅ Cached product images
- ✅ App shell (layout, styles)
- ✅ Browse cached products
- ✅ View cached orders

### What Doesn't Work Offline

- ❌ Fetching new products
- ❌ Placing new orders (can be queued for later)
- ❌ Real-time updates
- ❌ Search for new items

### Implement Background Sync (Optional)

To queue orders when offline and sync when back online:

1. The infrastructure is ready in `sw.js`
2. Implement IndexedDB storage for pending orders
3. Trigger background sync: `navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-orders'))`
4. The service worker's `sync` event handler will process queued orders

## 🔔 Push Notifications

The infrastructure is ready in `sw.js`. To implement:

### Backend (Server)

Install web-push library:
```bash
cd server
npm install web-push
```

Generate VAPID keys:
```javascript
const webPush = require('web-push');
const vapidKeys = webPush.generateVAPIDKeys();
console.log(vapidKeys);
```

### Frontend (Client)

1. Request permission:
```javascript
import { requestNotificationPermission } from '@/utils/pwaUtils';
const permission = await requestNotificationPermission();
```

2. Subscribe to push notifications:
```javascript
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
});
// Send subscription to your backend
```

3. Backend sends notifications when orders update

## 🛠️ Utility Functions

Import from `@/utils/pwaUtils.js`:

```javascript
import {
  isPWA,              // Check if running as installed app
  isOnline,           // Check connection status
  shareContent,       // Use Web Share API
  showNotification,   // Show local notification
  clearAllCaches,     // Clear all caches (debugging)
  checkForUpdates     // Check for app updates
} from '@/utils/pwaUtils';

// Example: Share a product
await shareContent({
  title: 'Check out this product!',
  text: 'Fresh Apples - only EGP 30/kg',
  url: window.location.href
});
```

## 🐛 Debugging Tips

### Clear Everything and Start Fresh

```javascript
// Run in browser console
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
location.reload();
```

Or use the utility:
```javascript
import { clearAllCaches } from '@/utils/pwaUtils';
await clearAllCaches();
```

### Service Worker Not Updating

1. Open DevTools → Application → Service Workers
2. Check "Update on reload"
3. Click "Unregister" if needed
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Manifest Not Loading

1. Check browser console for errors
2. Verify `manifest.json` is valid JSON
3. Ensure icons paths are correct
4. Check that server serves JSON with correct MIME type

### Cache Issues

1. Open DevTools → Application → Storage
2. Click "Clear site data"
3. Refresh the page

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Replace placeholder icons with branded icons
- [ ] Update manifest.json with production URLs
- [ ] Test on multiple devices (Android, iOS)
- [ ] Run Lighthouse audit (aim for 90+)
- [ ] Test offline functionality
- [ ] Verify HTTPS is enabled (required for PWA)
- [ ] Add screenshots to `public/screenshots/` for app listings
- [ ] Test install flow on real devices
- [ ] Configure proper cache headers on server
- [ ] Set up analytics to track PWA installs

## 📊 Analytics

Track PWA engagement:

```javascript
// Detect when app is installed
window.addEventListener('appinstalled', () => {
  console.log('PWA installed!');
  // Send to analytics
  gtag('event', 'app_installed');
});

// Track standalone usage
if (isPWA()) {
  console.log('Running as installed PWA');
  // Send to analytics
  gtag('event', 'pwa_usage');
}
```

## 🔒 Security Considerations

- Service Workers only work over HTTPS (except localhost)
- Validate all cached data before using
- Set appropriate cache expiration times
- Don't cache sensitive user data
- Be cautious with background sync permissions

## 📚 Additional Resources

- [PWA Documentation (MDN)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox (Google's PWA toolkit)](https://developers.google.com/web/tools/workbox)
- [PWA Builder](https://www.pwabuilder.com/)
- [Can I Use - PWA Features](https://caniuse.com/?search=pwa)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)

## 🆘 Common Issues

### "Add to Home Screen" not showing

- Ensure you have a valid manifest.json
- Check that all required icons are present
- Service Worker must be registered and active
- Must be served over HTTPS (or localhost)
- User must visit site at least twice (Chrome requirement)

### Icons not displaying

- Verify icon file paths in manifest.json
- Check that icons are in correct directory
- Ensure icon files are valid PNG format
- Try clearing cache and reinstalling

### Offline mode not working

- Check Service Worker is registered in DevTools
- Verify cache strategy in sw.js
- Test with DevTools → Network → Offline
- Check console for caching errors

## 🎉 Success Metrics

Your PWA is working well if:

- ✅ Lighthouse PWA score > 90
- ✅ "Install app" prompt appears
- ✅ App works offline (at least cached pages)
- ✅ Loads in < 3 seconds on 3G
- ✅ Icons display correctly on all platforms
- ✅ Service Worker stays active
- ✅ No console errors related to PWA

---

**Need Help?** Check the browser console for detailed error messages, or review the MDN PWA documentation.

