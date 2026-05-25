import { useState, useEffect } from 'react';

/**
 * ThemeToggle Component
 * Toggles between light and dark mode with smooth transitions
 */
function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Default to light mode (let user choose)
    return false;
  });

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <span className="theme-icon">☀️</span>
      ) : (
        <span className="theme-icon">🌙</span>
      )}

      <style>{`
        .theme-toggle {
          position: fixed;
          bottom: 80px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--primary);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          z-index: 999;
        }

        .theme-toggle:hover {
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        .theme-icon {
          font-size: 24px;
          line-height: 1;
          transition: transform 0.3s ease;
        }

        .theme-toggle:hover .theme-icon {
          transform: rotate(180deg);
        }

        @media (max-width: 768px) {
          .theme-toggle {
            bottom: 20px;
            right: 20px;
            width: 48px;
            height: 48px;
          }

          .theme-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </button>
  );
}

export default ThemeToggle;

