// src/pages/Home.jsx
export default function Home({ user, tabs, onCreateTab, onFavorite, onLogout }) {
  return (
    <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">EasyTabs</h1>
          <button
            onClick={onLogout}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex justify-center">
        <div className="max-w-4xl w-full px-6 py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Organize Your Web</h2>
            <p className="text-slate-400">Save, manage, and favorite your most important links.</p>
          </div>

          {/* Tabs */}
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-center">Your Tabs</h3>

            {tabs.length === 0 ? (
              <p className="text-slate-500 text-center">No tabs yet.</p>
            ) : (
              <div className="space-y-4">
                {tabs.map((tab) => (
                  <div key={tab.id} className="bg-slate-700 p-4 rounded-xl">
                    {tab.title}
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
