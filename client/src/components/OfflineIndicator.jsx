import { useEffect, useState } from 'react';
import { isOnline, onConnectionChange } from '@/utils/pwaUtils.js';

/**
 * OfflineIndicator Component
 * Shows a banner when the user goes offline
 */
function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const cleanup = onConnectionChange(
      // On online
      () => {
        setOnline(true);
        setShowReconnected(true);
        
        // Hide "reconnected" message after 3 seconds
        setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      },
      // On offline
      () => {
        setOnline(false);
        setShowReconnected(false);
      }
    );

    return cleanup;
  }, []);

  // Don't show anything if online and haven't just reconnected
  if (online && !showReconnected) {
    return null;
  }

  return (
    <div className={`offline-indicator ${online ? 'offline-indicator--online' : ''}`}>
      <div className="offline-indicator__content">
        {online ? (
          <>
            <span className="offline-indicator__icon">✅</span>
            <span className="offline-indicator__text">
              Back online! Syncing...
            </span>
          </>
        ) : (
          <>
            <span className="offline-indicator__icon">📡</span>
            <span className="offline-indicator__text">
              You're offline. Some features may be limited.
            </span>
          </>
        )}
      </div>

      <style>{`
        .offline-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10000;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .offline-indicator__content {
          background: #ef4444;
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .offline-indicator--online .offline-indicator__content {
          background: #10b981;
          animation: slideDown 0.3s ease-out;
        }

        .offline-indicator__icon {
          font-size: 18px;
          line-height: 1;
        }

        .offline-indicator__text {
          margin: 0;
        }

        @media (max-width: 640px) {
          .offline-indicator__content {
            padding: 10px 16px;
            font-size: 13px;
          }

          .offline-indicator__icon {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default OfflineIndicator;

