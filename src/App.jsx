import React, { useState } from 'react';
import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import MidiUpload from './components/midiUpload';
import TabSearch from './components/tabSearch';
import TabViewer from './components/tabViewer';
import TabPlayer from './tabPlayer';
import TabEditor from './tabEditor';
import './theme.css';

function App() {
  const [selectedTab, setSelectedTab] = useState(null);
  const [activeView, setActiveView] = useState('search'); // 'search' | 'upload' | 'view' | 'player' | 'editor'

  const handleTabSelect = (tab) => {
    console.log('Tab selected:', tab);
    if (tab && tab.id) {
      setSelectedTab(tab);
      setActiveView('player'); // Switch to player view
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
      setActiveView('player');
    } else {
      setActiveView('search');
    }
  };

  const handleBackToSearch = () => {
    setSelectedTab(null);
    setActiveView('search');
  };

  const handleSaveCreatedTab = async (tabData) => {
    // Convert tab editor data to saveable format
    // In a real app, you'd save this to Firestore
    console.log('Saving created tab:', tabData);
    
    // For now, just show success message
    alert(`Tab "${tabData.title}" by ${tabData.artist} created successfully!`);
    
    // Optionally switch to player view with the created tab
    // setSelectedTab(tabData);
    // setActiveView('player');
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
                <button 
                  className={`nav-button ${activeView === 'player' ? 'active' : ''}`}
                  onClick={() => setActiveView('player')}
                  disabled={!selectedTab}
                >
                  <span className="nav-icon">▶️</span>
                  Player
                </button>
                <button 
                  className={`nav-button ${activeView === 'editor' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView('editor');
                    setSelectedTab(null);
                  }}
                >
                  <span className="nav-icon">✏️</span>
                  Create
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
          
          {activeView === 'player' && selectedTab && (
            <div className="player-view">
              <div className="player-header">
                <button onClick={handleBackToSearch} className="back-button">
                  ← Back to Search
                </button>
                <div className="tab-info">
                  <h2>{selectedTab.title}</h2>
                  <p>{selectedTab.artist}</p>
                </div>
              </div>
              <TabPlayer midiUrl={selectedTab.midiUrl} />
            </div>
          )}

          {activeView === 'player' && !selectedTab && (
            <div className="error-state">
              <h2>No tab selected</h2>
              <p>Please select a tab from the search results to play.</p>
              <button onClick={() => setActiveView('search')}>
                Go to Search
              </button>
            </div>
          )}
          
          {activeView === 'editor' && (
            <TabEditor onSave={handleSaveCreatedTab} />
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

          .nav-button:hover:not(:disabled) {
            background: var(--bg-hover);
            color: var(--text-primary);
          }

          .nav-button.active {
            background: var(--accent-color);
            color: var(--text-inverse);
          }

          .nav-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .nav-icon {
            font-size: 18px;
          }

          .main-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
          }

          .player-view {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .player-header {
            display: flex;
            align-items: center;
            gap: 24px;
          }

          .back-button {
            padding: 10px 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .back-button:hover {
            background: var(--bg-hover);
            border-color: var(--accent-color);
          }

          .tab-info h2 {
            margin: 0;
            color: var(--text-primary);
            font-size: 28px;
          }

          .tab-info p {
            margin: 4px 0 0 0;
            color: var(--text-secondary);
            font-size: 18px;
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
              overflow-x: auto;
            }

            .nav-button {
              flex: 1;
              justify-content: center;
              min-width: 100px;
            }
          }
        `}</style>
      </div>
    </ThemeProvider>
  );
}

export default App;