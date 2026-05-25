import { useEffect } from 'react';

/**
 * Toast Component
 * Shows temporary notification messages
 */
function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  return (
    <div className={`toast toast--${type}`} onClick={onClose}>
      <span className="toast__icon">{icons[type]}</span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Close">×</button>

      <style>{`
        .toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 300px;
          max-width: 500px;
          z-index: 10002;
          animation: slideUp 0.3s ease-out;
          cursor: pointer;
        }

        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        .toast--success {
          border-left: 4px solid #10b981;
        }

        .toast--error {
          border-left: 4px solid #ef4444;
        }

        .toast--info {
          border-left: 4px solid #3b82f6;
        }

        .toast--warning {
          border-left: 4px solid #f59e0b;
        }

        .toast__icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          flex-shrink: 0;
        }

        .toast--success .toast__icon {
          background: #d1fae5;
          color: #10b981;
        }

        .toast--error .toast__icon {
          background: #fee2e2;
          color: #ef4444;
        }

        .toast--info .toast__icon {
          background: #dbeafe;
          color: #3b82f6;
        }

        .toast--warning .toast__icon {
          background: #fef3c7;
          color: #f59e0b;
        }

        .toast__message {
          flex: 1;
          color: #111;
          font-size: 14px;
          font-weight: 500;
        }

        .toast__close {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .toast__close:hover {
          background: #f3f4f6;
          color: #111;
        }

        .dark-mode .toast {
          background: #1f2937;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .dark-mode .toast__message {
          color: #f3f4f6;
        }

        .dark-mode .toast__close {
          color: #6b7280;
        }

        .dark-mode .toast__close:hover {
          background: #374151;
          color: #f3f4f6;
        }

        @media (max-width: 640px) {
          .toast {
            min-width: auto;
            width: calc(100% - 40px);
            left: 20px;
            transform: none;
          }

          @keyframes slideUp {
            from {
              transform: translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ToastContainer Component
 * Manages multiple toast notifications
 */
function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export { Toast, ToastContainer };
export default Toast;

