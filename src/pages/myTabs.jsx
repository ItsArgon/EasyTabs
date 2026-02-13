import { useEffect, useState } from "react";
import { getUserTabs, addFavorite } from "../services/tabService";
import { auth } from "../services/firebase";

export default function MyTabs() {
  const [tabs, setTabs] = useState([]);

  useEffect(() => {
    const fetchTabs = async () => {
      if (!auth.currentUser) return;

      const data = await getUserTabs(auth.currentUser.uid);
      setTabs(data);
    };

    fetchTabs();
  }, []);

  const handleFavorite = async (tab) => {
    if (!auth.currentUser) return;

    await addFavorite(auth.currentUser.uid, tab);
    alert("Added to favorites!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Tabs</h2>

      {tabs.length === 0 && <p>No tabs yet.</p>}

      {tabs.map(tab => (
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
