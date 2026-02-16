import React, { useState, useEffect } from 'react';
import { searchAllTabs, sortCombinedResults } from './unifiedSearch';

const TabSearch = ({ onTabSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'user', 'songsterr'

  // Debounced search
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

      console.log('Search results:', results);
      console.log('User tabs:', results.userTabs);
      console.log('Songsterr tabs:', results.songsterrTabs);
      
      // Validate results
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
    
    // Filter out any null/undefined tabs
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
    // Safety check: return null if tab is invalid
    if (!tab || !tab.id || !tab.source) {
      console.error('Invalid tab data:', tab);
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
          <h3>{tab.title}</h3>
          <span className={`source-badge ${isUserTab ? 'user' : 'songsterr'}`}>
            {isUserTab ? 'User Upload' : 'Songsterr'}
          </span>
        </div>
        
        <p className="artist">{tab.artist}</p>
        
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
        
        {/* Search Input */}
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for songs, artists, or bands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loading && <span className="loading-spinner">🔄</span>}
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          {/* Source Tabs */}
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

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="title">Sort by Title</option>
            <option value="date">Sort by Date</option>
          </select>

          {/* Instrument Filter */}
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

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Results */}
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
            <p>Start typing to search for tabs...</p>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .tab-search-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .search-header {
          margin-bottom: 30px;
        }

        .search-input-wrapper {
          position: relative;
          margin: 20px 0;
        }

        .search-input {
          width: 100%;
          padding: 15px 50px 15px 15px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          transition: border-color 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .loading-spinner {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }

        .filter-controls {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          align-items: center;
        }

        .source-tabs {
          display: flex;
          gap: 5px;
          background-color: #f0f0f0;
          padding: 4px;
          border-radius: 8px;
        }

        .source-tabs button {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .source-tabs button.active {
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .sort-select,
        .instrument-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .error-message {
          padding: 15px;
          background-color: #ffebee;
          color: #c62828;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .results-header {
          margin-bottom: 20px;
          color: #666;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .tab-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .tab-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .source-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .source-badge.user {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .source-badge.songsterr {
          background-color: #fff3e0;
          color: #f57c00;
        }

        .artist {
          color: #666;
          margin: 5px 0 15px 0;
          font-size: 14px;
        }

        .tab-details {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .detail-badge {
          padding: 4px 10px;
          background-color: #f5f5f5;
          border-radius: 12px;
          font-size: 12px;
          color: #555;
        }

        .tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .tag {
          padding: 3px 8px;
          background-color: #e8f5e9;
          color: #2e7d32;
          border-radius: 10px;
          font-size: 11px;
        }

        .no-results,
        .search-prompt {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .no-results p:first-child {
          font-size: 18px;
          color: #666;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default TabSearch;