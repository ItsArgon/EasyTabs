import React, { useState, useEffect } from 'react';
import { searchAllTabs, sortCombinedResults } from './unifiedSearch';

const TabSearchDark = ({ onTabSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await searchAllTabs(searchTerm, {
        includeUserTabs: activeTab === 'all' || activeTab === 'user',
        includeSongsterr: activeTab === 'all' || activeTab === 'songsterr',
        instrument: filterInstrument || null,
        maxResults: 50
      });

      if (results.userTabs) {
        results.userTabs = results.userTabs.filter(tab => tab && tab.id && tab.source);
      }
      if (results.songsterrTabs) {
        results.songsterrTabs = results.songsterrTabs.filter(tab => tab && tab.id && tab.source);
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search tabs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSortedResults = () => {
    if (!searchResults) return [];
    return sortCombinedResults(searchResults, sortBy);
  };

  const getFilteredResults = () => {
    const sorted = getSortedResults();
    const validTabs = sorted.filter(tab => tab && tab.id && tab.source);
    
    if (activeTab === 'user') {
      return validTabs.filter(tab => tab.source === 'user_upload');
    } else if (activeTab === 'songsterr') {
      return validTabs.filter(tab => tab.source === 'songsterr');
    }
    
    return validTabs;
  };

  const handleTabClick = (tab) => {
    if (!tab || !tab.id || !tab.source) {
      console.error('Attempted to select invalid tab:', tab);
      setError('Unable to load this tab. Please try another one.');
      return;
    }
    
    if (onTabSelect) {
      onTabSelect(tab);
    }
  };

  const renderTabCard = (tab) => {
    if (!tab || !tab.id || !tab.source) {
      return null;
    }
    
    const isUserTab = tab.source === 'user_upload';
    
    return (
      <div 
        key={tab.id} 
        className="tab-card"
        onClick={() => handleTabClick(tab)}
      >
        <div className="tab-header">
          <h3>{tab.title || 'Untitled'}</h3>
          <span className={`source-badge ${isUserTab ? 'user' : 'songsterr'}`}>
            {isUserTab ? 'User Upload' : 'Songsterr'}
          </span>
        </div>
        
        <p className="artist">{tab.artist || 'Unknown Artist'}</p>
        
        <div className="tab-details">
          {tab.instrument && (
            <span className="detail-badge">{tab.instrument}</span>
          )}
          {tab.difficulty && (
            <span className="detail-badge">{tab.difficulty}</span>
          )}
          {tab.tuning && (
            <span className="detail-badge">{tab.tuning}</span>
          )}
          {tab.tracks && tab.tracks.length > 0 && (
            <span className="detail-badge">{tab.tracks.length} tracks</span>
          )}
        </div>

        {tab.tags && tab.tags.length > 0 && (
          <div className="tags">
            {tab.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tab-search-container">
      <div className="search-header">
        <h2>Search Tabs</h2>
        
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search for songs, artists, or bands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loading && <span className="loading-spinner">⟳</span>}
        </div>

        <div className="filter-controls">
          <div className="source-tabs">
            <button
              className={activeTab === 'all' ? 'active' : ''}
              onClick={() => setActiveTab('all')}
            >
              All Sources
            </button>
            <button
              className={activeTab === 'user' ? 'active' : ''}
              onClick={() => setActiveTab('user')}
            >
              My Uploads
            </button>
            <button
              className={activeTab === 'songsterr' ? 'active' : ''}
              onClick={() => setActiveTab('songsterr')}
            >
              Songsterr
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="title">Sort by Title</option>
            <option value="date">Sort by Date</option>
          </select>

          <select
            value={filterInstrument}
            onChange={(e) => setFilterInstrument(e.target.value)}
            className="instrument-select"
          >
            <option value="">All Instruments</option>
            <option value="guitar">Guitar</option>
            <option value="bass">Bass</option>
            <option value="drums">Drums</option>
            <option value="piano">Piano</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="search-results">
        {searchResults && (
          <div className="results-header">
            <p>
              Found {searchResults.total} results
              {searchResults.userTabs.length > 0 && 
                ` (${searchResults.userTabs.length} user uploads, ${searchResults.songsterrTabs.length} from Songsterr)`
              }
            </p>
          </div>
        )}

        {getFilteredResults().length > 0 ? (
          <div className="results-grid">
            {getFilteredResults()
              .map(tab => renderTabCard(tab))
              .filter(card => card !== null)}
          </div>
        ) : searchTerm.length >= 2 && !loading && searchResults ? (
          <div className="no-results">
            <p>No tabs found for "{searchTerm}"</p>
            <p>Try a different search term or check your spelling.</p>
          </div>
        ) : searchTerm.length < 2 && !loading ? (
          <div className="search-prompt">
            <span className="prompt-icon">🎵</span>
            <p>Start typing to search for tabs...</p>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .tab-search-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .search-header h2 {
          color: var(--text-primary);
          margin-bottom: 24px;
          font-size: 28px;
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 24px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          opacity: 0.5;
        }

        .search-input {
          width: 100%;
          padding: 16px 50px 16px 50px;
          font-size: 16px;
          border: 2px solid var(--border-primary);
          border-radius: 12px;
          transition: all 0.3s;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-color);
          background: var(--bg-tertiary);
          box-shadow: 0 0 0 4px var(--accent-bg-subtle);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .loading-spinner {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }

        .filter-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 24px;
        }

        .source-tabs {
          display: flex;
          gap: 6px;
          background: var(--bg-secondary);
          padding: 4px;
          border-radius: 10px;
        }

        .source-tabs button {
          padding: 10px 18px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          color: var(--text-secondary);
        }

        .source-tabs button:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .source-tabs button.active {
          background: var(--accent-color);
          color: var(--text-inverse);
        }

        .sort-select,
        .instrument-select {
          padding: 10px 16px;
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: var(--bg-secondary);
          color: var(--text-primary);
          transition: all 0.3s;
        }

        .sort-select:hover,
        .instrument-select:hover {
          border-color: var(--accent-color);
        }

        .sort-select:focus,
        .instrument-select:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-bg-subtle);
        }

        .error-message {
          padding: 16px;
          background: var(--error-bg);
          color: var(--error);
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid var(--error);
        }

        .results-header {
          margin-bottom: 20px;
        }

        .results-header p {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .tab-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab-card:hover {
          border-color: var(--accent-color);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
          background: var(--bg-tertiary);
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .tab-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .source-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
          letter-spacing: 0.5px;
        }

        .source-badge.user {
          background: var(--accent-bg-subtle);
          color: var(--accent-light);
          border: 1px solid var(--accent-color);
        }

        .source-badge.songsterr {
          background: rgba(251, 146, 60, 0.1);
          color: #fb923c;
          border: 1px solid #ea580c;
        }

        .artist {
          color: var(--text-secondary);
          margin: 0 0 16px 0;
          font-size: 15px;
        }

        .tab-details {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .detail-badge {
          padding: 6px 12px;
          background: var(--bg-hover);
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          border: 1px solid var(--border-secondary);
        }

        .tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .tag {
          padding: 4px 10px;
          background: var(--accent-bg-subtle);
          color: var(--accent-light);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .no-results,
        .search-prompt {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-secondary);
        }

        .prompt-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
          opacity: 0.3;
        }

        .no-results p:first-child {
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default TabSearchDark;