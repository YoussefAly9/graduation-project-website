/**
 * PWA Utility Functions
 * Helper functions for Progressive Web App features
 */

/**
 * Check if the app is running as an installed PWA
 * @returns {boolean}
 */
export function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the app is running on iOS
 * @returns {boolean}
 */
export function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Check if the app is running on Android
 * @returns {boolean}
 */
export function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if Service Worker is supported
 * @returns {boolean}
 */
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

/**
 * Check if the device is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Register callback for online/offline events
 * @param {Function} onOnline - Callback when connection is restored
 * @param {Function} onOffline - Callback when connection is lost
 * @returns {Function} Cleanup function to remove event listeners
 */
export function onConnectionChange(onOnline, onOffline) {
  const handleOnline = () => {
    console.log('🌐 Connection restored');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('📡 Connection lost');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get the current service worker registration
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function getServiceWorkerRegistration() {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
}

/**
 * Check for service worker updates
 * @returns {Promise<boolean>} True if update is available
 */
export async function checkForUpdates() {
  const registration = await getServiceWorkerRegistration();
  
  if (!registration) {
    return false;
  }

  try {
    await registration.update();
    return !!registration.waiting;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return false;
  }
}

/**
 * Skip waiting and activate new service worker
 * @returns {Promise<void>}
 */
export async function skipWaitingAndReload() {
  const registration = await getServiceWorkerRegistration();
  
  if (!registration?.waiting) {
    return;
  }

  // Send message to waiting service worker to skip waiting
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  
  // Reload after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

/**
 * Clear all caches (useful for debugging)
 * @returns {Promise<void>}
 */
export async function clearAllCaches() {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('✅ All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

/**
 * Request notification permission
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show a local notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @returns {Promise<void>}
 */
export async function showNotification(title, options = {}) {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const registration = await getServiceWorkerRegistration();
  
  if (registration) {
    // Use service worker notification (better for PWA)
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options
    });
  } else {
    // Fallback to regular notification
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      ...options
    });
  }
}

/**
 * Share content using Web Share API (if supported)
 * @param {Object} data - Share data (title, text, url)
 * @returns {Promise<boolean>} True if share was successful
 */
export async function shareContent(data) {
  if (!navigator.share) {
    console.warn('Web Share API not supported');
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

/**
 * Get display mode (standalone, browser, etc.)
 * @returns {string}
 */
export function getDisplayMode() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

/**
 * Track display mode changes
 * @param {Function} callback - Called when display mode changes
 * @returns {Function} Cleanup function
 */
export function onDisplayModeChange(callback) {
  const queries = [
    window.matchMedia('(display-mode: standalone)'),
    window.matchMedia('(display-mode: fullscreen)'),
    window.matchMedia('(display-mode: minimal-ui)')
  ];

  const handleChange = () => {
    callback(getDisplayMode());
  };

  queries.forEach(query => {
    query.addEventListener('change', handleChange);
  });

  // Return cleanup function
  return () => {
    queries.forEach(query => {
      query.removeEventListener('change', handleChange);
    });
  };
}

/**
 * Add to home screen prompt helper for iOS
 * @returns {boolean} True if iOS and can show instructions
 */
export function canShowIOSInstallPrompt() {
  return isIOS() && !isPWA();
}

/**
 * Get browser info
 * @returns {Object}
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  return {
    isChrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
    isSafari: /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor),
    isFirefox: /Firefox/.test(ua),
    isEdge: /Edg/.test(ua),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isPWA: isPWA()
  };
}

export default {
  isPWA,
  isIOS,
  isAndroid,
  isServiceWorkerSupported,
  isOnline,
  onConnectionChange,
  getServiceWorkerRegistration,
  checkForUpdates,
  skipWaitingAndReload,
  clearAllCaches,
  requestNotificationPermission,
  showNotification,
  shareContent,
  getDisplayMode,
  onDisplayModeChange,
  canShowIOSInstallPrompt,
  getBrowserInfo
};

