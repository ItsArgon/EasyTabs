import { useState } from "react";
import TabEditor from "../components/TabEditor";
import TabPlayer from "../components/TabPlayer";
import TabUpload from "../components/TabUpload";

export default function MyTabs({ user, tabs, onCreateTab, onFavorite, onUploadTab, onNavigate, onLogout }) {
  const [showUpload, setShowUpload] = useState(false);

  const handleTabUpload = async (tabData) => {
    try {
      await onUploadTab(tabData);
      setShowUpload(false);
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full border-b border-slate-800 sticky top-0 z-50 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">EasyTabs</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => onNavigate("browse")}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
            >
              Search & Import
            </button>
            <button
              onClick={() => onNavigate("myTabs")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              My Tabs
            </button>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex justify-center">
        <div className="max-w-6xl w-full px-6 py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">My Tab Collection</h2>
            <p className="text-slate-400">Manage, play, and upload your tabs.</p>
          </div>

          {/* Upload Section */}
          <div className="mb-12">
            {showUpload ? (
              <TabUpload user={user} onTabUploaded={handleTabUpload} />
            ) : (
              <button
                onClick={() => setShowUpload(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-lg transition text-lg"
              >
                + Upload MIDI Tab
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-center">Your Tabs</h3>

            {tabs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg mb-6">No tabs yet. Start by searching, importing, or uploading!</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => onNavigate("browse")}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Search Tabs
                  </button>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Upload MIDI
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {tabs.map((tab) => (
                  <div key={tab.id} className="bg-slate-700 p-6 rounded-xl border border-slate-600">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-2">{tab.title}</h3>
                      {tab.artist && <p className="text-slate-400">Artist: {tab.artist}</p>}
                      {tab.difficulty && <p className="text-slate-400">Difficulty: {tab.difficulty}</p>}
                      {tab.source && <p className="text-slate-500 text-sm">Source: {tab.source}</p>}
                      {tab.description && (
                        <p className="text-slate-300 mt-2">{tab.description}</p>
                      )}
                    </div>

                    <div className="space-y-6">
                      {tab.measures && tab.measures.length > 0 && (
                        <>
                          <TabPlayer tab={tab} />
                          <TabEditor tab={tab} onSave={(updatedTab) => {
                            // implement updateTab in tabService
                          }} />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
