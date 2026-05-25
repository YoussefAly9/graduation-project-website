# PWA Setup Checklist ✅

Quick checklist to get your PWA up and running.

## 🎯 Essential Steps (Do These First)

### 1. Generate App Icons
- [ ] Open `client/public/icons/icon-generator.html` in your browser
- [ ] Click "Generate All Icons"
- [ ] Download each icon (72, 96, 128, 144, 152, 192, 384, 512 px)
- [ ] Save them in `client/public/icons/` directory

**Shortcut:** Right-click each canvas and "Save Image As..." or use the download buttons.

### 2. Test the PWA Locally
```bash
cd client
npm run build
npm run preview
```
- [ ] Open the preview URL in your browser
- [ ] Open DevTools → Application tab
- [ ] Verify Manifest loads correctly
- [ ] Verify Service Worker is "activated and running"
- [ ] Test offline mode (DevTools → Network → Offline checkbox)

### 3. Test on Mobile Device
- [ ] Deploy to a test server with HTTPS (or use ngrok/localtunnel)
- [ ] Visit on Android Chrome - look for install prompt
- [ ] Visit on iOS Safari - test Add to Home Screen
- [ ] Launch installed app and verify it works

## 🎨 Customization (Optional)

### Branding
- [ ] Update `client/public/manifest.json`:
  - [ ] Change `name` and `short_name`
  - [ ] Update `description`
  - [ ] Set `theme_color` to match your brand
  - [ ] Set `background_color`
- [ ] Update `client/index.html`:
  - [ ] Change meta description
  - [ ] Update Open Graph tags
  - [ ] Update Twitter card info

### Replace Placeholder Icons
- [ ] Design professional icons (or hire a designer)
- [ ] Use [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [ ] Replace all icons in `client/public/icons/`
- [ ] Test icons appear correctly on all platforms

### Add Screenshots (For App Stores)
- [ ] Take screenshot of home page (540×720 for mobile)
- [ ] Take screenshot of products page (1280×720 for desktop)
- [ ] Save as `client/public/screenshots/home.png`
- [ ] Save as `client/public/screenshots/products.png`

## 🚀 Production Deployment

### Pre-Deployment
- [ ] Run Lighthouse audit (aim for 90+ PWA score)
- [ ] Test on multiple devices and browsers
- [ ] Verify all icons load correctly
- [ ] Test offline functionality thoroughly
- [ ] Ensure HTTPS is enabled on production server

### Server Configuration
- [ ] Configure proper cache headers
- [ ] Ensure `manifest.json` served with `application/json` MIME type
- [ ] Ensure service worker served with proper headers
- [ ] Set up CSP (Content Security Policy) if needed

### Post-Deployment
- [ ] Test install flow on production URL
- [ ] Verify offline mode works in production
- [ ] Check analytics for PWA installs
- [ ] Monitor Service Worker errors in production

## 🧪 Testing Checklist

### Basic Functionality
- [ ] App loads without errors
- [ ] Service Worker registers successfully
- [ ] Manifest file loads correctly
- [ ] All icons are present and display correctly
- [ ] Install prompt appears (after a few visits)

### Offline Mode
- [ ] Previously visited pages load offline
- [ ] Images load from cache
- [ ] Fallback message appears for network requests
- [ ] Offline indicator shows when connection lost
- [ ] App reconnects when back online

### Install Experience
- [ ] **Android Chrome:** Install banner appears
- [ ] **Android Chrome:** Manual install works (⋮ → Install app)
- [ ] **iOS Safari:** Add to Home Screen works
- [ ] **Desktop Chrome:** Install button appears in address bar
- [ ] Installed app launches in standalone mode
- [ ] Splash screen shows on app launch

### Icons & Branding
- [ ] Home screen icon looks correct
- [ ] Splash screen shows correct icon and colors
- [ ] Taskbar/app switcher shows correct icon
- [ ] Theme color appears in browser UI

## 📊 Quality Metrics

Run Lighthouse audit and check these scores:

- [ ] **PWA Score:** 90+ (aim for 100)
- [ ] **Performance:** 90+
- [ ] **Accessibility:** 90+
- [ ] **Best Practices:** 90+
- [ ] **SEO:** 90+

### Lighthouse PWA Checklist Items
- [ ] ✅ Installable
- [ ] ✅ Provides a valid manifest
- [ ] ✅ Has a registered service worker
- [ ] ✅ Works offline
- [ ] ✅ Optimized for mobile
- [ ] ✅ Fast loading on 3G
- [ ] ✅ Themed address bar
- [ ] ✅ Splash screen configured

## 🐛 Troubleshooting

### Install Prompt Not Showing
- [ ] Manifest is valid and loads correctly
- [ ] All required icons are present
- [ ] Service Worker is registered and active
- [ ] Site is served over HTTPS (or localhost)
- [ ] User has visited at least twice (Chrome requirement)
- [ ] Clear "Add to Home Screen" dismissals in chrome://flags

### Service Worker Issues
- [ ] Check DevTools → Application → Service Workers
- [ ] Look for errors in Console
- [ ] Try unregistering and re-registering
- [ ] Clear cache and hard refresh
- [ ] Check service worker scope is correct

### Offline Mode Not Working
- [ ] Service Worker is active
- [ ] Cache is populated (check DevTools → Application → Cache Storage)
- [ ] Network requests are being intercepted
- [ ] Check fetch event handlers in sw.js

### Icons Not Displaying
- [ ] Verify file paths in manifest.json
- [ ] Check icons are valid PNG files
- [ ] Ensure correct file sizes
- [ ] Clear browser cache and reinstall

## 📚 Next Steps

Once basic PWA is working:

- [ ] Implement push notifications
- [ ] Add background sync for orders
- [ ] Set up analytics for PWA metrics
- [ ] Add app shortcuts in manifest
- [ ] Implement share target API
- [ ] Add file handling (if needed)
- [ ] Consider advanced caching strategies
- [ ] Set up automatic cache invalidation

## 🎉 Launch Checklist

Before announcing to users:

- [ ] All essential steps completed
- [ ] Tested on major platforms (Android, iOS, Desktop)
- [ ] No console errors
- [ ] Professional icons installed
- [ ] Lighthouse PWA score 90+
- [ ] Analytics tracking configured
- [ ] User documentation ready
- [ ] Support team briefed on PWA features

---

**🚨 Most Common Mistake:** Forgetting to generate icons before testing. The install prompt won't show if icons are missing!

**💡 Pro Tip:** Test on a real mobile device, not just browser DevTools. The install experience is different on actual hardware.

**📖 Full Documentation:** See [PWA-GUIDE.md](PWA-GUIDE.md) for detailed information.

