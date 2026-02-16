import React, { useState } from 'react';
import MidiUpload from './components/midiUpload';
import TabSearch from './components/TabSearch';
import TabViewer from './components/tabViewerSafe';
import FirebaseStorageDiagnostic from './components/FirebaseStorageDiagnostic';
import './App.css'; // You'll need to create this for styling

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
    // Optionally switch to view the uploaded tab
    if (tabData && tabData.id) {
      setSelectedTab(tabData);
      setActiveView('view');
    } else {
      // Just go back to search
      setActiveView('search');
    }
  };

  const handleBackToSearch = () => {
    setSelectedTab(null);
    setActiveView('search');
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="app-title">🎸 Guitar Tabs</h1>
          <div className="nav-buttons">
            <button 
              className={`nav-button ${activeView === 'search' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('search');
                setSelectedTab(null);
              }}
            >
              🔍 Search
            </button>
            <button 
              className={`nav-button ${activeView === 'upload' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('upload');
                setSelectedTab(null);
              }}
            >
              📤 Upload
            </button>
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
          background-color: #f5f5f5;
        }

        .navbar {
          background: white;
          border-bottom: 1px solid #e0e0e0;
          padding: 0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .app-title {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .nav-buttons {
          display: flex;
          gap: 10px;
        }

        .nav-button {
          padding: 10px 20px;
          border: 2px solid transparent;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .nav-button:hover {
          background: #e0e0e0;
        }

        .nav-button.active {
          background: #4CAF50;
          color: white;
        }

        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .error-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .error-state h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .error-state p {
          color: #666;
          margin-bottom: 20px;
        }

        .error-state button {
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .error-state button:hover {
          background: #45a049;
        }
      `}</style>
    </div>
  );
}

export default App;