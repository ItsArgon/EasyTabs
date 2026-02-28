import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeToggle = () => {
  const { accentColor, changeAccent } = useTheme();

  const themes = [
    { name: 'purple', label: 'Purple', color: '#9333ea' },
    { name: 'blue', label: 'Blue', color: '#3b82f6' },
    { name: 'red', label: 'Red', color: '#ef4444' }
  ];

  return (
    <div className="theme-toggle">
      <span className="theme-label">Theme:</span>
      <div className="theme-buttons">
        {themes.map(theme => (
          <button
            key={theme.name}
            className={`theme-button ${accentColor === theme.name ? 'active' : ''}`}
            onClick={() => changeAccent(theme.name)}
            style={{ 
              '--theme-color': theme.color,
              backgroundColor: accentColor === theme.name ? theme.color : 'transparent'
            }}
            aria-label={`Switch to ${theme.label} theme`}
            title={theme.label}
          >
            <span className="theme-dot" style={{ backgroundColor: theme.color }} />
          </button>
        ))}
      </div>

      <style jsx>{`
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .theme-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .theme-buttons {
          display: flex;
          gap: 8px;
          background: var(--bg-secondary);
          padding: 4px;
          border-radius: 8px;
        }

        .theme-button {
          width: 32px;
          height: 32px;
          border: 2px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .theme-button:hover {
          border-color: var(--theme-color);
          transform: scale(1.1);
        }

        .theme-button.active {
          border-color: var(--theme-color);
        }

        .theme-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .theme-button.active .theme-dot {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
};

export default ThemeToggle;