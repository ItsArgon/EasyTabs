import { useState, useRef } from "react";
import { parseMidiFile } from "../services/midiParser";

export default function TabUpload({ user, onTabUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    difficulty: "Beginner",
    description: ""
  });
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".mid") && !ext.endsWith(".midi")) {
      setMessage("Please select a valid MIDI file (.mid or .midi)");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const data = await parseMidiFile(file);
      setParsedData(data);
      setMessage("");
      
      // Auto-fill title from filename if possible
      const filename = file.name.replace(/\.(mid|midi)$/i, "");
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: filename
        }));
      }
    } catch (error) {
      console.error("MIDI Parse Error:", error);
      setMessage(`⚠️ Error: ${error.message}. Make sure the file is a valid MIDI file.`);
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (!parsedData) {
      setMessage("No MIDI file parsed yet");
      return;
    }

    if (!formData.title.trim()) {
      setMessage("Please enter a tab title");
      return;
    }

    setIsLoading(true);

    try {
      const tabData = {
        ...formData,
        ...parsedData,
        userId: user.uid,
        uploadedBy: user.displayName || user.email,
        uploadedAt: new Date(),
        source: "user-uploaded"
      };

      await onTabUploaded(tabData);
      
      setMessage("Tab uploaded successfully!");
      setParsedData(null);
      setFormData({
        title: "",
        artist: "",
        difficulty: "Beginner",
        description: ""
      });
      fileInputRef.current.value = "";
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setParsedData(null);
    setFormData({
      title: "",
      artist: "",
      difficulty: "Beginner",
      description: ""
    });
    setMessage("");
    fileInputRef.current.value = "";
  };

  if (parsedData) {
    return (
      <div className="bg-slate-800 p-6 rounded-2xl border border-blue-500">
        <h3 className="text-2xl font-bold mb-6">Upload New Tab</h3>

        {/* Preview */}
        <div className="bg-slate-700 p-4 rounded-lg mb-6">
          <p className="text-slate-400 text-sm">Parsed MIDI Data:</p>
          <p className="text-white">Tempo: {parsedData.tempo} BPM</p>
          <p className="text-white">Measures: {parsedData.measures.length}</p>
          <p className="text-white">Total Notes: {parsedData.notes.length}</p>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Song Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Stairway to Heaven"
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Artist</label>
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleInputChange}
                placeholder="e.g., Led Zeppelin"
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add any notes about this tab..."
              rows="3"
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
          >
            {isLoading ? "Uploading..." : "Upload Tab"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
      <h3 className="text-2xl font-bold mb-6">Upload a Tab from MIDI</h3>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-600 hover:border-slate-500"
        }`}
      >
        <div className="text-4xl mb-4">🎵</div>
        <p className="text-white text-lg font-semibold mb-2">
          Drop your MIDI file here
        </p>
        <p className="text-slate-400 text-sm mb-4">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mid,.midi"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition"
        >
          {isLoading ? "Loading..." : "Select File"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 p-4 rounded-lg text-sm ${
            message.includes("Error") || message.includes("⚠️") || message.includes("Please")
              ? "bg-red-600/20 text-red-300 border border-red-600/50"
              : "bg-blue-600/20 text-blue-300 border border-blue-600/50"
          }`}
        >
          <p className="font-semibold mb-1">{message.includes("⚠️") ? "Upload Error" : "Info"}</p>
          <p>{message.replace("⚠️ ", "")}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-slate-700 rounded-lg text-slate-300 text-sm">
        <p className="font-semibold mb-2">📝 How it works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Upload a MIDI file (.mid format)</li>
          <li>We'll automatically parse the notes and tempo</li>
          <li>Add song details like title, artist, and difficulty</li>
          <li>Your tab will be searchable and playable</li>
        </ul>
      </div>
    </div>
  );
}
