import { useEffect, useRef, useState } from 'react';
import { canShowIOSInstallPrompt, isIOS, isPWA } from '@/utils/pwaUtils.js';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DATE_KEY = 'pwa-install-dismissed-date';

function isLocalhostHost() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

/**
 * InstallPrompt — PWA install banner with fallbacks when the browser does not
 * fire beforeinstallprompt (dev mode, iOS, or phone opened via localhost).
 */
function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState('install'); // install | ios | manual | phone-localhost
  const [pageUrl, setPageUrl] = useState('');
  const installPromptReceived = useRef(false);

  const lanOrigin = import.meta.env.VITE_LAN_ORIGIN?.replace(/\/$/, '') || '';

  useEffect(() => {
    if (isPWA()) {
      return;
    }

    setPageUrl(window.location.origin);

    const dismissed = localStorage.getItem(DISMISS_KEY);
    const dismissedDate = localStorage.getItem(DISMISS_DATE_KEY);

    if (dismissed && dismissedDate) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedDate, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      installPromptReceived.current = true;
      setInstallPrompt(event);
      setMode('install');
      setTimeout(() => setIsVisible(true), 2000);
    };

    const showFallback = () => {
      if (isPWA() || installPromptReceived.current) {
        return;
      }

      if (isLocalhostHost() && !isIOS() && /Android|Mobile/i.test(navigator.userAgent)) {
        setMode('phone-localhost');
      } else if (canShowIOSInstallPrompt()) {
        setMode('ios');
      } else {
        setMode('manual');
      }

      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setInstallPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
      localStorage.removeItem(DISMISS_DATE_KEY);
    });

    const fallbackTimer = setTimeout(showFallback, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_KEY, 'true');
    localStorage.setItem(DISMISS_DATE_KEY, Date.now().toString());
  };

  if (!isVisible || isPWA()) {
    return null;
  }

  const renderMessage = () => {
    switch (mode) {
      case 'phone-localhost':
        return (
          <>
            <strong>Can&apos;t install from localhost on your phone</strong>
            <p>
              <code>localhost</code> on your phone points to the phone itself, not your PC.
              Use your computer&apos;s network address instead (same Wi‑Fi).
            </p>
            {lanOrigin ? (
              <p className="install-prompt__url">
                On your phone, open:{' '}
                <a href={lanOrigin}>{lanOrigin}</a>
              </p>
            ) : (
              <p className="install-prompt__hint">
                On your PC run <code>npm run build</code> then <code>npm run preview</code>,
                copy the <strong>Network</strong> URL (e.g. <code>http://192.168.x.x:4173</code>),
                and set <code>VITE_LAN_ORIGIN</code> in <code>.env</code> to that address.
              </p>
            )}
          </>
        );

      case 'ios':
        return (
          <>
            <strong>Add FreshMart to your home screen</strong>
            <p>
              Tap <strong>Share</strong> <span aria-hidden="true">⎋</span> then{' '}
              <strong>Add to Home Screen</strong>. Use this exact page URL every time you open the app.
            </p>
            <p className="install-prompt__url">
              <code>{pageUrl}</code>
            </p>
          </>
        );

      case 'manual':
        return (
          <>
            <strong>Install FreshMart on this device</strong>
            {import.meta.env.DEV ? (
              <p>
                Dev mode (<code>npm run dev</code>) does not support install. Run{' '}
                <code>npm run build</code> and <code>npm run preview</code>, then open{' '}
                <code>http://localhost:4173</code> on this computer.
              </p>
            ) : (
              <p>
                Use the browser menu: Chrome <strong>⋮ → Install app</strong> or the install icon in
                the address bar. The installed app only opens this same address.
              </p>
            )}
            <p className="install-prompt__url">
              Install from: <code>{pageUrl}</code>
            </p>
            {lanOrigin && lanOrigin !== pageUrl && (
              <p className="install-prompt__hint">
                On another device, use <a href={lanOrigin}>{lanOrigin}</a> (not localhost).
              </p>
            )}
          </>
        );

      default:
        return (
          <>
            <strong>Install FreshMart</strong>
            <p>Quick access and offline support. Installs for this address only.</p>
            <p className="install-prompt__url">
              <code>{pageUrl}</code>
            </p>
          </>
        );
    }
  };

  return (
    <div className="install-prompt" role="region" aria-label="Install app">
      <div className="install-prompt__content">
        <div className="install-prompt__icon" aria-hidden="true">
          📱
        </div>
        <div className="install-prompt__text">{renderMessage()}</div>
        <div className="install-prompt__actions">
          {mode === 'install' && installPrompt && (
            <button
              type="button"
              className="install-prompt__button install-prompt__button--primary"
              onClick={handleInstallClick}
            >
              Install
            </button>
          )}
          {mode === 'phone-localhost' && lanOrigin && (
            <a
              className="install-prompt__button install-prompt__button--primary"
              href={lanOrigin}
            >
              Open network URL
            </a>
          )}
          <button
            type="button"
            className="install-prompt__button install-prompt__button--secondary"
            onClick={handleDismiss}
          >
            Later
          </button>
        </div>
      </div>

      <style>{`
        .install-prompt {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          max-width: 520px;
          width: calc(100% - 40px);
          animation: installSlideUp 0.3s ease-out;
        }

        @keyframes installSlideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        .install-prompt__content {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 12px 16px;
          border: 2px solid #10b981;
        }

        .install-prompt__icon {
          font-size: 28px;
          line-height: 1;
        }

        .install-prompt__text {
          flex: 1;
          min-width: 200px;
        }

        .install-prompt__text strong {
          display: block;
          font-size: 15px;
          color: #111;
          margin-bottom: 6px;
        }

        .install-prompt__text p {
          margin: 0 0 6px;
          font-size: 13px;
          color: #444;
          line-height: 1.45;
        }

        .install-prompt__text code {
          font-size: 12px;
          background: #f3f4f6;
          padding: 1px 4px;
          border-radius: 4px;
          word-break: break-all;
        }

        .install-prompt__url {
          font-size: 12px !important;
        }

        .install-prompt__url a {
          color: #059669;
          font-weight: 600;
          word-break: break-all;
        }

        .install-prompt__hint {
          color: #6b7280 !important;
          font-size: 12px !important;
        }

        .install-prompt__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          justify-content: flex-end;
        }

        .install-prompt__button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .install-prompt__button--primary {
          background: #10b981;
          color: white;
        }

        .install-prompt__button--primary:hover {
          background: #059669;
        }

        .install-prompt__button--secondary {
          background: #f3f4f6;
          color: #6b7280;
        }

        .install-prompt__button--secondary:hover {
          background: #e5e7eb;
        }

        @media (max-width: 640px) {
          .install-prompt {
            bottom: 10px;
            width: calc(100% - 20px);
          }

          .install-prompt__actions {
            justify-content: stretch;
          }

          .install-prompt__button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default InstallPrompt;
