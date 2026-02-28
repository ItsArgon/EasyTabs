import React, { useState } from 'react';
import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import MidiUpload from './components/MidiUpload';
import TabSearch from './components/TabSearch';
import TabViewer from './components/TabViewer';
import './theme.css';

function App() {
  const [selectedTab, setSelectedTab] = useState(null);
  const [activeView, setActiveView] = useState('search'); // 'search' | 'upload' | 'view'

  const handleTabSelect = (tab) => {
    console.log('Tab selected:', tab);
    if (tab && tab.id) {
      setSelectedTab(tab);
      setActiveView('view');
    } else {
      console.error('Invalid tab data:', tab);
      alert('Unable to load this tab. Please try another one.');
    }
  };

  const handleUploadComplete = (tabData) => {
    console.log('Upload complete:', tabData);
    alert('Tab uploaded successfully!');
    if (tabData && tabData.id) {
      setSelectedTab(tabData);
      setActiveView('view');
    } else {
      setActiveView('search');
    }
  };

  const handleBackToSearch = () => {
    setSelectedTab(null);
    setActiveView('search');
  };

  return (
    <ThemeProvider>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-content">
            <div className="navbar-left">
              <h1 className="app-title">
                <span className="guitar-icon">🎸</span>
                Guitar Tabs
              </h1>
            </div>
            
            <div className="navbar-center">
              <div className="nav-buttons">
                <button 
                  className={`nav-button ${activeView === 'search' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView('search');
                    setSelectedTab(null);
                  }}
                >
                  <span className="nav-icon">🔍</span>
                  Search
                </button>
                <button 
                  className={`nav-button ${activeView === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView('upload');
                    setSelectedTab(null);
                  }}
                >
                  <span className="nav-icon">📤</span>
                  Upload
                </button>
              </div>
            </div>

            <div className="navbar-right">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <main className="main-content">
          {activeView === 'search' && (
            <TabSearch onTabSelect={handleTabSelect} />
          )}
          
          {activeView === 'upload' && (
            <MidiUpload onUploadComplete={handleUploadComplete} />
          )}
          
          {activeView === 'view' && selectedTab && (
            <TabViewer 
              tab={selectedTab} 
              onBack={handleBackToSearch}
            />
          )}

          {activeView === 'view' && !selectedTab && (
            <div className="error-state">
              <h2>No tab selected</h2>
              <p>Please select a tab from the search results.</p>
              <button onClick={() => setActiveView('search')}>
                Go to Search
              </button>
            </div>
          )}
        </main>

        <style jsx>{`
          .app {
            min-height: 100vh;
            background-color: var(--bg-primary);
          }

          .navbar {
            background: var(--bg-elevated);
            border-bottom: 1px solid var(--border-primary);
            padding: 0;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: var(--shadow-md);
          }

          .navbar-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 12px 24px;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 20px;
          }

          .navbar-left {
            display: flex;
            align-items: center;
          }

          .navbar-center {
            display: flex;
            justify-content: center;
          }

          .navbar-right {
            display: flex;
            justify-content: flex-end;
          }

          .app-title {
            margin: 0;
            font-size: 24px;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
          }

          .guitar-icon {
            font-size: 28px;
          }

          .nav-buttons {
            display: flex;
            gap: 8px;
            background: var(--bg-secondary);
            padding: 4px;
            border-radius: 10px;
          }

          .nav-button {
            padding: 10px 20px;
            border: 2px solid transparent;
            background: transparent;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .nav-button:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
          }

          .nav-button.active {
            background: var(--accent-color);
            color: var(--text-inverse);
          }

          .nav-icon {
            font-size: 18px;
          }

          .main-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
          }

          .error-state {
            text-align: center;
            padding: 80px 20px;
            background: var(--bg-secondary);
            border-radius: 12px;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-primary);
          }

          .error-state h2 {
            color: var(--text-primary);
            margin-bottom: 12px;
            font-size: 24px;
          }

          .error-state p {
            color: var(--text-secondary);
            margin-bottom: 24px;
            font-size: 16px;
          }

          .error-state button {
            padding: 12px 28px;
            background: var(--accent-color);
            color: var(--text-inverse);
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .error-state button:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .navbar-content {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .navbar-center {
              order: 3;
            }

            .navbar-right {
              order: 2;
              justify-content: flex-start;
            }

            .app-title {
              font-size: 20px;
            }

            .nav-buttons {
              width: 100%;
            }

            .nav-button {
              flex: 1;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </ThemeProvider>
  );
}

export default App;