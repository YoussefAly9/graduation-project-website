import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';
import './styles/global.css';
import './styles/responsive.css';

// Register Service Worker for PWA (production build / preview, or dev with VITE_ENABLE_PWA_DEV=true)
const enablePwa =
  import.meta.env.PROD || import.meta.env.VITE_ENABLE_PWA_DEV === 'true';

if ('serviceWorker' in navigator && enablePwa) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, notify user
              console.log('🔄 New version available! Refresh to update.');
              // You can show a toast/banner here to prompt user to refresh
              if (confirm('New version of FreshMart is available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });

  // Handle controller change (when new SW takes over)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

