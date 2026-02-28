import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from './firebase-Config';

const MidiUploadDark = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    tuning: 'standard',
    difficulty: 'intermediate',
    tags: '',
    instrument: 'guitar',
    uploadedBy: 'user123'
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.mid') && !file.name.endsWith('.midi')) {
        setError('Please select a valid MIDI file (.mid or .midi)');
        return;
      }
      
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      setSuccess(false);
      
      if (!formData.title) {
        const titleFromFile = file.name.replace(/\.(mid|midi)$/i, '');
        setFormData(prev => ({ ...prev, title: titleFromFile }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!formData.title || !formData.artist) {
      setError('Title and artist are required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      const storagePath = `tabs/${filename}`;
      
      const storageRef = ref(storage, storagePath);
      const metadata = {
        contentType: 'audio/midi',
        customMetadata: {
          originalName: selectedFile.name,
          uploadedBy: formData.uploadedBy,
          title: formData.title,
          artist: formData.artist
        }
      };
      
      const snapshot = await uploadBytes(storageRef, selectedFile, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const tabData = {
        id: timestamp.toString(),
        title: formData.title,
        artist: formData.artist,
        midiUrl: downloadURL,
        storagePath: storagePath,
        uploadedBy: formData.uploadedBy,
        uploadedAt: new Date().toISOString(),
        fileSize: selectedFile.size,
        fileName: selectedFile.name,
        source: 'user_upload',
        tuning: formData.tuning,
        difficulty: formData.difficulty,
        tags: tags,
        instrument: formData.instrument
      };
      
      await setDoc(doc(db, 'tabs', tabData.id), tabData);
      
      setSelectedFile(null);
      setFormData({
        title: '',
        artist: '',
        tuning: 'standard',
        difficulty: 'intermediate',
        tags: '',
        instrument: 'guitar',
        uploadedBy: formData.uploadedBy
      });
      
      setSuccess(true);
      setUploading(false);

      if (onUploadComplete) {
        onUploadComplete(tabData);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      
      let errorMessage = 'Upload failed. ';
      
      switch (err.code) {
        case 'storage/unauthorized':
          errorMessage += 'Permission denied. Check Firebase Security Rules.';
          break;
        case 'storage/retry-limit-exceeded':
          errorMessage += 'Upload timed out. Check your network connection.';
          break;
        default:
          errorMessage += err.message;
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  return (
    <div className="midi-upload-container">
      <div className="upload-header">
        <h2>Upload MIDI Tab</h2>
        <p className="subtitle">Share your tabs with the community</p>
      </div>
      
      <form onSubmit={handleUpload} className="upload-form">
        <div className="form-section">
          <h3 className="section-title">File Selection</h3>
          
          <div className="file-upload-area">
            <input
              id="file-input"
              type="file"
              accept=".mid,.midi"
              onChange={handleFileSelect}
              disabled={uploading}
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {selectedFile ? (
                <>
                  <span className="file-icon">✓</span>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </span>
                </>
              ) : (
                <>
                  <span className="upload-icon">📁</span>
                  <span>Click to select MIDI file</span>
                  <span className="file-hint">.mid or .midi files only</span>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Tab Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter song title"
                required
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="artist">Artist *</label>
              <input
                id="artist"
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleInputChange}
                placeholder="Enter artist name"
                required
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="instrument">Instrument</label>
              <select
                id="instrument"
                name="instrument"
                value={formData.instrument}
                onChange={handleInputChange}
                disabled={uploading}
              >
                <option value="guitar">Guitar</option>
                <option value="bass">Bass</option>
                <option value="drums">Drums</option>
                <option value="piano">Piano</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                disabled={uploading}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tuning">Tuning</label>
              <select
                id="tuning"
                name="tuning"
                value={formData.tuning}
                onChange={handleInputChange}
                disabled={uploading}
              >
                <option value="standard">Standard (E A D G B E)</option>
                <option value="drop_d">Drop D</option>
                <option value="drop_c">Drop C</option>
                <option value="half_step_down">Half Step Down</option>
                <option value="open_g">Open G</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="rock, acoustic, fingerstyle (comma separated)"
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        {success && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            Tab uploaded successfully!
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">✗</span>
            {error}
          </div>
        )}

        {uploading && (
          <div className="uploading-indicator">
            <div className="spinner"></div>
            <p>Uploading to Firebase Storage...</p>
          </div>
        )}

        <button 
          type="submit" 
          className="upload-button"
          disabled={uploading || !selectedFile}
        >
          {uploading ? 'Uploading...' : 'Upload Tab'}
        </button>
      </form>

      <style jsx>{`
        .midi-upload-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .upload-header {
          margin-bottom: 32px;
        }

        .upload-header h2 {
          color: var(--text-primary);
          font-size: 32px;
          margin-bottom: 8px;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 16px;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 24px;
        }

        .section-title {
          color: var(--text-primary);
          font-size: 18px;
          margin: 0 0 20px 0;
          font-weight: 600;
        }

        .file-upload-area {
          margin-bottom: 0;
        }

        .file-input {
          display: none;
        }

        .file-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          border: 2px dashed var(--border-secondary);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          background: var(--bg-primary);
        }

        .file-label:hover {
          border-color: var(--accent-color);
          background: var(--bg-hover);
        }

        .upload-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .file-icon {
          font-size: 48px;
          color: var(--success);
        }

        .file-name {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 16px;
        }

        .file-size {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .file-hint {
          color: var(--text-muted);
          font-size: 14px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .form-group input,
        .form-group select {
          padding: 12px 16px;
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          font-size: 15px;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-bg-subtle);
        }

        .form-group input::placeholder {
          color: var(--text-muted);
        }

        .success-message {
          padding: 16px 20px;
          background: var(--success-bg);
          color: var(--success);
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 4px solid var(--success);
        }

        .success-icon {
          font-size: 24px;
        }

        .error-message {
          padding: 16px 20px;
          background: var(--error-bg);
          color: var(--error);
          border-radius: 8px;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 4px solid var(--error);
        }

        .error-icon {
          font-size: 24px;
        }

        .uploading-indicator {
          text-align: center;
          padding: 32px;
          background: var(--accent-bg-subtle);
          border-radius: 12px;
          border: 1px solid var(--accent-color);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--bg-hover);
          border-top: 4px solid var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .uploading-indicator p {
          margin: 0;
          color: var(--accent-light);
          font-weight: 600;
        }

        .upload-button {
          padding: 16px 32px;
          background: var(--accent-color);
          color: var(--text-inverse);
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .upload-button:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .upload-button:disabled {
          background: var(--bg-hover);
          color: var(--text-muted);
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MidiUploadDark;