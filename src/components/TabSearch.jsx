import { useState } from "react";
import { searchTabs } from "../services/tabService";
import TabDetails from "./TabDetails";

export default function TabSearch({ user, onImportTab }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(null);
  const [importedMessage, setImportedMessage] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await searchTabs(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportTab = async (tab) => {
    try {
      await onImportTab(tab);
      setImportedMessage(`"${tab.title}" imported successfully!`);
      setTimeout(() => setImportedMessage(""), 3000);
    } catch (error) {
      console.error("Import error:", error);
      setImportedMessage("Failed to import tab");
      setTimeout(() => setImportedMessage(""), 3000);
    }
  };

  if (selectedTab) {
    return (
      <div>
        <button
          onClick={() => setSelectedTab(null)}
          className="mb-4 text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          ← Back to Results
        </button>
        <TabDetails tab={selectedTab} onImport={() => handleImportTab(selectedTab)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-12 rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-bold mb-6 text-center">Search & Import Tabs</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs, artists, or tabs..."
            className="flex-1 px-6 py-3 rounded-lg text-white bg-slate-800 border border-slate-700 focus:border-blue-400 focus:outline-none placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Import Success Message */}
      {importedMessage && (
        <div className="bg-green-600 text-white p-4 rounded-lg text-center">
          {importedMessage}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-6">
            Results ({searchResults.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((tab) => (
              <div
                key={tab.id}
                className="bg-slate-800 rounded-xl overflow-hidden hover:bg-slate-700 transition cursor-pointer border border-slate-700 hover:border-blue-500"
              >
                {/* Tab Cover/Preview */}
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 h-40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎸</div>
                    <p className="text-sm text-slate-300">Tab Preview</p>
                  </div>
                </div>

                {/* Tab Info */}
                <div className="p-6">
                  <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {tab.title}
                  </h4>
                  <p className="text-slate-400 text-sm mb-2">{tab.artist || "Unknown Artist"}</p>
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-4">
                    <span>📊 Difficulty: {tab.difficulty || "N/A"}</span>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedTab(tab)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleImportTab(tab)}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition font-semibold"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {!loading && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No tabs found. Try a different search.</p>
        </div>
      )}

      {/* Initial State */}
      {!loading && searchResults.length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg mb-4">Search for your favorite songs to get started</p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {["Guitar", "Bass", "Piano"].map((type) => (
              <button
                key={type}
                onClick={() => setSearchQuery(type)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
