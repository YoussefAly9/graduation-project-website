# 🧪 Complete Features Test Script

Run through this checklist to verify **ALL features work together**.

---

## ✅ **Master Test Checklist**

### **Setup**
```powershell
cd client
npm run build
npm run preview
```
Visit: `http://localhost:4173`

---

## 1️⃣ **Initial Load Test**

- [ ] Page loads without errors
- [ ] **Loading skeletons** appear first
- [ ] Products **fade in** smoothly after loading
- [ ] **Theme** matches system preference (or defaults to light)
- [ ] **Service Worker** registers (check console: "✅ Service Worker registered")

**Console should show:**
```
✅ Service Worker registered successfully
[Service Worker] Installing...
[Service Worker] Precaching app shell
```

---

## 2️⃣ **Dark Mode Test**

- [ ] **Theme toggle** button visible (🌙 at bottom-right)
- [ ] Click toggle → Theme changes to dark
- [ ] All components turn dark:
  - [ ] Background
  - [ ] Header/Navbar/Footer
  - [ ] Product cards
  - [ ] Text color
  - [ ] Buttons
- [ ] Icon changes to ☀️
- [ ] **Refresh page** → Dark mode persists
- [ ] Click again → Back to light mode

---

## 3️⃣ **Product Browsing Test**

- [ ] **Hover over product cards** → Card lifts up
- [ ] **Hover over buttons** → Button moves slightly
- [ ] **Search** for a product
- [ ] **Filter** by category
- [ ] Animations are **smooth** (not janky)

---

## 4️⃣ **Add to Cart Test**

- [ ] Click **"Add to Cart"** on any product
- [ ] **Toast notification** appears: "Added [product] to cart! ✓"
- [ ] Toast has **green border** (success)
- [ ] Toast **auto-dismisses** after 3 seconds
- [ ] **Cart count badge** increments in header
- [ ] Can **click toast** to dismiss early

**Test in Dark Mode:**
- [ ] Toast is dark-themed
- [ ] Still readable

---

## 5️⃣ **Cart Drawer Test**

- [ ] Click **cart icon** in header
- [ ] **Cart drawer slides in** from right
- [ ] Shows cart items
- [ ] Shows **two new sections**:
  - [ ] 📍 **Delivery Address** with "Add" button
  - [ ] 🚚 **Delivery Options** with "Select" button
- [ ] Shows "**Complete Delivery Details**" button (disabled)
- [ ] Shows **Subtotal** and **Total**

---

## 6️⃣ **Address Manager Test**

- [ ] Click **"Add"** under Delivery Address
- [ ] **Address Manager modal** opens
- [ ] Empty state shows: "📍 No saved addresses"
- [ ] Click **"Add Your First Address"**
- [ ] Form appears with fields:
  - [ ] Full Name *
  - [ ] Phone *
  - [ ] Street *
  - [ ] Building *
  - [ ] Floor
  - [ ] Apartment
  - [ ] Area
  - [ ] City * (dropdown)
- [ ] Fill in required fields
- [ ] Cities dropdown works (15 Egyptian cities)
- [ ] Click **"Save Address"**
- [ ] Modal closes
- [ ] Cart drawer updates with address:
  - [ ] Shows name
  - [ ] Shows full address
  - [ ] Shows phone
  - [ ] "Add" button becomes "Change"

**Test Dark Mode:**
- [ ] Modal is dark-themed
- [ ] Form inputs are dark
- [ ] Dropdown is dark

---

## 7️⃣ **Delivery Options Test**

- [ ] Click **"Select"** under Delivery Options
- [ ] **Delivery Options modal** opens
- [ ] Three delivery speeds shown:
  - [ ] 🚚 Standard Delivery (Free)
  - [ ] ⚡ Express Delivery (+EGP 30)
  - [ ] 📅 Scheduled Delivery (Free)
- [ ] Click **"Express Delivery"**
  - [ ] Card highlights in green
- [ ] Add **delivery instructions** (optional)
  - [ ] Character counter shows (200 max)
- [ ] Click **"Save Delivery Options"**
- [ ] Modal closes
- [ ] Cart drawer updates:
  - [ ] Shows "⚡ Express Delivery"
  - [ ] Shows delivery instructions if added
  - [ ] **Delivery Fee** shows: +EGP 30
  - [ ] **Total** updates: Subtotal + 30

**Test Scheduled Delivery:**
- [ ] Open delivery options again
- [ ] Select **"Scheduled Delivery"**
- [ ] **Date picker** appears
  - [ ] Shows next 8 days
  - [ ] "Today" and "Tomorrow" labels
- [ ] Select a date
- [ ] **Time slot** buttons appear
  - [ ] 4 time slots (9AM-9PM)
  - [ ] Some marked "Express Available"
- [ ] Select a time slot
- [ ] Click **"Save"**
- [ ] Cart shows scheduled date & time

---

## 8️⃣ **Checkout Test**

- [ ] Both address and delivery options complete
- [ ] Button text changes to **"Proceed to Checkout"**
- [ ] Button is **enabled** (not grayed)
- [ ] Click **"Proceed to Checkout"**
- [ ] **Success toast** appears: "Order placed successfully! 🎉"
- [ ] Toast duration: 4 seconds
- [ ] Console logs order summary
- [ ] No alert popups!

**Test Validation:**
- [ ] Clear cart or open new cart
- [ ] Try checkout **without address**
  - [ ] **Error toast**: "Please complete delivery address..."
  - [ ] Button stays disabled
- [ ] Add address only, try checkout
  - [ ] **Error toast**: Same message
  - [ ] Button stays disabled

---

## 9️⃣ **PWA Features Test**

### **Service Worker:**
- [ ] Open **DevTools → Application → Service Workers**
- [ ] Status: **"activated and running"** with green dot
- [ ] Scope: `http://localhost:4173/`

### **Manifest:**
- [ ] Go to **Application → Manifest**
- [ ] Shows **"FreshMart Egypt"**
- [ ] Shows all **8 icons** (72px to 512px)
- [ ] Theme color: **#10b981** (green)

### **Cache Storage:**
- [ ] Go to **Application → Cache Storage**
- [ ] Should see **3 caches**:
  - [ ] `freshmart-v2`
  - [ ] `freshmart-runtime-v2`
  - [ ] `freshmart-images-v2`
- [ ] Each cache has files in it

### **Install Prompt:**
- [ ] After ~3 seconds, **install prompt** appears at bottom
- [ ] Shows: "📱 Install FreshMart"
- [ ] Shows: "Get quick access and offline support!"
- [ ] Buttons: **[Install]** and **[Later]**
- [ ] Click **"Install"** → Browser install dialog
- [ ] Or use **browser menu** → Install app

---

## 🔟 **Offline Mode Test**

### **Preparation:**
- [ ] With app loaded, wait **10 seconds**
- [ ] Let Service Worker cache everything

### **Go Offline:**
- [ ] Open **DevTools → Network** tab
- [ ] Check **"Offline"** checkbox at top
- [ ] **Refresh the page (Ctrl+R)**

### **Verify App Works Offline:**
- [ ] Page loads successfully ✅
- [ ] **Offline indicator** appears at top:
  - [ ] Red banner
  - [ ] "📡 You're offline. Some features may be limited."
- [ ] Can browse cached products
- [ ] Can view cached orders
- [ ] **Dark mode toggle** still works
- [ ] **Cart** still works
- [ ] **Modals** still work (address, delivery)
- [ ] **Toast notifications** still work

### **Go Back Online:**
- [ ] Uncheck "Offline"
- [ ] **Green banner** appears:
  - [ ] "✅ Back online! Syncing..."
  - [ ] Auto-dismisses after 3 seconds

---

## 1️⃣1️⃣ **Loading States Test**

- [ ] Refresh page (Ctrl+R)
- [ ] **Before products load**:
  - [ ] 8 **skeleton cards** appear
  - [ ] Skeletons have **shimmer animation**
  - [ ] Layout matches actual products
- [ ] **When products load**:
  - [ ] Skeletons disappear
  - [ ] Products **fade in** smoothly
  - [ ] No layout shift

**Test in Dark Mode:**
- [ ] Skeletons are dark-themed
- [ ] Shimmer still visible

---

## 1️⃣2️⃣ **Accessibility Test**

### **Keyboard Navigation:**
- [ ] Press **Tab** key repeatedly
- [ ] **Focus indicators** appear (blue outline)
- [ ] Can tab through:
  - [ ] Theme toggle
  - [ ] Search box
  - [ ] Category buttons
  - [ ] Product "Add to Cart" buttons
  - [ ] Cart icon
  - [ ] Modal buttons
- [ ] Press **Shift+Tab** to go backwards

### **Skip to Content:**
- [ ] Reload page
- [ ] Immediately press **Tab**
- [ ] First focus: **"Skip to main content"** link
- [ ] Press **Enter**
- [ ] Page scrolls to main content

### **ARIA Labels:**
- [ ] Right-click theme toggle → Inspect
- [ ] Has `aria-label`
- [ ] All buttons have proper labels

---

## 1️⃣3️⃣ **Responsive Design Test**

### **Desktop (Full Screen):**
- [ ] Layout is wide
- [ ] Multiple columns
- [ ] All features accessible
- [ ] Hover effects work

### **Tablet (Resize to ~800px):**
- [ ] Layout adjusts
- [ ] Cards resize
- [ ] Modals fit screen
- [ ] Touch + hover work

### **Mobile (Resize to ~375px):**
- [ ] Single column layout
- [ ] Large touch targets
- [ ] Theme toggle smaller but accessible
- [ ] Modals go full-screen
- [ ] Cart drawer full-width
- [ ] No horizontal scroll

---

## 1️⃣4️⃣ **Animation Test**

- [ ] **Hover animations** (cards lift, buttons shift)
- [ ] **Click animations** (buttons press)
- [ ] **Toast animations** (slide up from bottom)
- [ ] **Modal animations** (fade in with backdrop)
- [ ] **Theme toggle** (smooth color transitions)
- [ ] **Loading** (shimmer effect)
- [ ] All animations are **smooth** (60 FPS)
- [ ] No **janky** or **stuttering** animations

**Check for Reduced Motion:**
- [ ] If system has "Reduce Motion" enabled
- [ ] Animations should be instant/minimal

---

## 1️⃣5️⃣ **Integration Test (Full Flow)**

Complete a full user journey:

1. [ ] **Load app** → Skeletons → Products fade in
2. [ ] **Toggle dark mode** → Everything dark
3. [ ] **Search** for a product
4. [ ] **Add 3 items** to cart → 3 success toasts
5. [ ] **Open cart** → See all items
6. [ ] **Add address** → Save successfully
7. [ ] **Select express delivery** → See fee added
8. [ ] **Checkout** → Success toast with 🎉
9. [ ] **Toggle offline** → Offline banner shows
10. [ ] **Refresh** → App still works
11. [ ] **Toggle online** → Online banner shows
12. [ ] **Install PWA** → Works from home screen

---

## 1️⃣6️⃣ **Performance Test**

### **Lighthouse Audit:**
- [ ] Open **DevTools → Lighthouse**
- [ ] Select **"Progressive Web App"**
- [ ] Click **"Generate report"**
- [ ] **PWA Score: 90+** ✅
- [ ] All PWA checks pass:
  - [ ] ✅ Installable
  - [ ] ✅ Has manifest
  - [ ] ✅ Has service worker
  - [ ] ✅ Works offline
  - [ ] ✅ Fast load

### **Network Tab:**
- [ ] Reload page
- [ ] Check **"Initiator"** column
- [ ] Should see many **(ServiceWorker)** entries
- [ ] This means caching is working!

---

## 1️⃣7️⃣ **Console Errors Check**

- [ ] Open **DevTools → Console**
- [ ] Should be **NO red errors**
- [ ] Only green ✅ messages
- [ ] Warnings (yellow) are okay

**Expected console messages:**
```
✅ Service Worker registered successfully
[Service Worker] Installing...
[Service Worker] Precaching app shell
[Service Worker] Cached: /
[Service Worker] Cached: /index.html
...
```

---

## 1️⃣8️⃣ **Mobile Device Test**

### **Setup:**
```powershell
# Terminal 1: Start preview
npm run preview

# Terminal 2: Start ngrok
npx ngrok http 4173
```

Get HTTPS URL: `https://abc123.ngrok.io`

### **On Your Phone:**

**Android:**
- [ ] Visit ngrok URL in Chrome
- [ ] Install banner appears
- [ ] Tap "Install"
- [ ] App installs to home screen
- [ ] Launch app from home screen
- [ ] Opens in standalone mode (no browser UI)
- [ ] All features work
- [ ] Turn off WiFi → Offline mode works
- [ ] Turn on WiFi → Online mode works

**iOS:**
- [ ] Visit ngrok URL in Safari
- [ ] Tap **Share (📤)** button
- [ ] Tap **"Add to Home Screen"**
- [ ] Tap **"Add"**
- [ ] App icon appears on home screen
- [ ] Launch app
- [ ] All features work (except push notifications)
- [ ] Offline mode works

---

## 🎯 **Success Criteria**

### **All features must:**
- ✅ Work in **light mode**
- ✅ Work in **dark mode**
- ✅ Work **online**
- ✅ Work **offline** (cached content)
- ✅ Work on **desktop**
- ✅ Work on **mobile**
- ✅ Have **smooth animations**
- ✅ Show **proper feedback** (toasts)
- ✅ Be **keyboard accessible**
- ✅ Have **no console errors**

---

## 🐛 **If Something Fails**

### **Clear Everything:**
```javascript
// Run in Console:
(async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (let reg of regs) await reg.unregister();
  const names = await caches.keys();
  for (let name of names) await caches.delete(name);
  localStorage.clear();
  location.reload();
})();
```

### **Rebuild:**
```powershell
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force node_modules\.vite
npm run build
npm run preview
```

---

## ✅ **Final Verification**

If all tests pass, you have:

- ✅ **Complete e-commerce flow** (browse, cart, checkout)
- ✅ **Full delivery system** (address, options, integration)
- ✅ **Working PWA** (install, offline, caching)
- ✅ **Modern UX** (dark mode, toasts, animations)
- ✅ **Accessibility** (keyboard, screen readers, focus)
- ✅ **Responsive** (mobile, tablet, desktop)
- ✅ **Professional polish** (smooth, fast, reliable)

**🎉 Your FreshMart app is production-ready!**

---

## 📸 **Screenshots to Take**

Document your success:

1. Light mode homepage
2. Dark mode homepage
3. Toast notification appearing
4. Loading skeletons
5. Address manager filled
6. Delivery options modal
7. Cart with delivery info
8. PWA installed on phone
9. Offline mode banner
10. Lighthouse PWA score

---

## 🚀 **Next Steps**

After all tests pass:

1. **Deploy to production** (Vercel/Netlify)
2. **Test live URL** on real devices
3. **Share with users** 🎊
4. **Monitor analytics**
5. **Gather feedback**
6. **Iterate and improve**

---

**Test thoroughly. Ship confidently.** 🚀✨

