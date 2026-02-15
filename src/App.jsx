import { useEffect, useState } from "react";
import { auth } from "./services/firebase";
import { loginWithGoogle, logout } from "./services/authService";
import { createTab, getUserTabs, addFavorite, importTab, uploadTab } from "./services/tabService";
import { onAuthStateChanged } from "firebase/auth";
import TabsBrowse from "./pages/tabsBrowse";
import MyTabs from "./pages/myTabs";

export default function App() {
  const [user, setUser] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [currentPage, setCurrentPage] = useState("browse");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchTabs = async () => {
      const data = await getUserTabs(user.uid);
      setTabs(data);
    };

    fetchTabs();
  }, [user]);

  const handleImportTab = async (tab) => {
    try {
      await importTab(user.uid, tab);
      // Refresh tabs list
      const updatedTabs = await getUserTabs(user.uid);
      setTabs(updatedTabs);
    } catch (error) {
      console.error("Failed to import tab:", error);
      throw error;
    }
  };

  const handleCreateTab = async (tabData) => {
    await createTab(user.uid, tabData);
    const updatedTabs = await getUserTabs(user.uid);
    setTabs(updatedTabs);
  };

  const handleFavorite = async (tab) => {
    await addFavorite(user.uid, tab);
  };

  const handleUploadTab = async (tabData) => {
    try {
      await uploadTab(user.uid, tabData);
      // Refresh tabs list
      const updatedTabs = await getUserTabs(user.uid);
      setTabs(updatedTabs);
    } catch (error) {
      console.error("Failed to upload tab:", error);
      throw error;
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-xl p-10 rounded-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">EasyTabs</h1>
          <button
            onClick={loginWithGoogle}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentPage === "browse" && (
        <TabsBrowse
          user={user}
          onImportTab={handleImportTab}
          onNavigate={handleNavigate}
          onLogout={logout}
        />
      )}
      {currentPage === "myTabs" && (
        <MyTabs
          user={user}
          tabs={tabs}
          onCreateTab={handleCreateTab}
          onFavorite={handleFavorite}
          onUploadTab={handleUploadTab}
          onNavigate={handleNavigate}
          onLogout={logout}
        />
      )}
    </>
  );
}
