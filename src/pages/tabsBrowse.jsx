import { useState } from "react";
import TabSearch from "../components/TabSearch";

export default function TabsBrowse({ user, onImportTab, onNavigate, onLogout }) {
  return (
    <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full border-b border-slate-800 sticky top-0 z-50 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">EasyTabs</h1>
          <div className="flex gap-4">
            <button
              onClick={() => onNavigate("browse")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Search & Import
            </button>
            <button
              onClick={() => onNavigate("myTabs")}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
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
      <main className="flex-1 w-full flex justify-center py-12">
        <div className="max-w-6xl w-full px-6">
          <TabSearch user={user} onImportTab={onImportTab} />
        </div>
      </main>
    </div>
  );
}
