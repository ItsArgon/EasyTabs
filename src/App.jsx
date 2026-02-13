import { useEffect, useState } from "react";
import { auth } from "./services/firebase";
import { loginWithGoogle, logout } from "./services/authService";
import { createTab, getUserTabs, addFavorite } from "./services/tabService";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // 🔐 Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // 📥 Fetch tabs when user logs in
  useEffect(() => {
    if (!user) return;

    const fetchTabs = async () => {
      const data = await getUserTabs(user.uid);
      setTabs(data);
    };

    fetchTabs();
  }, [user]);

  // ➕ Create new tab
  const handleCreateTab = async (e) => {
    e.preventDefault();

    if (!title || !url) return;

    await createTab(user.uid, { title, url });

    setTitle("");
    setUrl("");

    const updatedTabs = await getUserTabs(user.uid);
    setTabs(updatedTabs);
  };

  // ⭐ Favorite tab
  const handleFavorite = async (tab) => {
    await addFavorite(user.uid, tab);
    alert("Added to favorites!");
  };

  // 🚪 If not logged in
  if (!user) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>EasyTabs</h1>
        <button onClick={loginWithGoogle}>
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>EasyTabs</h1>

      <p>Welcome, {user.displayName}</p>
      <button onClick={logout}>Logout</button>

      <hr />

      {/* Create Tab Form */}
      <h2>Create Tab</h2>
      <form onSubmit={handleCreateTab}>
        <input
          type="text"
          placeholder="Tab Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <br />
        <button type="submit">Add Tab</button>
      </form>

      <hr />

      {/* Display Tabs */}
      <h2>My Tabs</h2>

      {tabs.length === 0 && <p>No tabs yet.</p>}

      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "6px"
          }}
        >
          <h4>{tab.title}</h4>
          <a href={tab.url} target="_blank" rel="noopener noreferrer">
            {tab.url}
          </a>
          <br />
          <button onClick={() => handleFavorite(tab)}>
            ⭐ Favorite
          </button>
        </div>
      ))}
    </div>
  );
}
