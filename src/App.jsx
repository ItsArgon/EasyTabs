import { useEffect, useState } from "react";
import { auth } from "./services/firebase";
import { loginWithGoogle, logout } from "./services/authService";
import { createTab, getUserTabs, addFavorite } from "./services/tabService";
import { onAuthStateChanged } from "firebase/auth";
import Home from "./pages/home";

export default function App() {
  const [user, setUser] = useState(null);
  const [tabs, setTabs] = useState([]);

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

  const handleCreateTab = async (tabData) => {
    await createTab(user.uid, tabData);
    const updatedTabs = await getUserTabs(user.uid);
    setTabs(updatedTabs);
  };

  const handleFavorite = async (tab) => {
    await addFavorite(user.uid, tab);
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
    <Home
      user={user}
      tabs={tabs}
      onCreateTab={handleCreateTab}
      onFavorite={handleFavorite}
      onLogout={logout}
    />
  );
}
