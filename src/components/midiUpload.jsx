import React, { useState } from 'react';
import { uploadMidiTab } from './firebaseStorage';

const MidiUpload = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    tuning: 'standard',
    difficulty: 'intermediate',
    tags: '',
    instrument: 'guitar',
    uploadedBy: 'user123' // Replace with actual user ID from auth
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.mid') && !file.name.endsWith('.midi')) {
        setError('Please select a valid MIDI file (.mid or .midi)');
        return;
      }
      
      // Check file size (optional, but good practice)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      
      // Auto-fill title from filename if not set
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
    setUploadProgress(0);

    try {
      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Upload the file
      const result = await uploadMidiTab(selectedFile, {
        ...formData,
        tags
      });

      setUploadProgress(100);
      
      // Reset form
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

      // Callback to parent component
      if (onUploadComplete) {
        onUploadComplete(result.tabData);
      }

      // Show success message
      alert('Tab uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload tab. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="midi-upload-container">
      <h2>Upload MIDI Tab</h2>
      
      <form onSubmit={handleUpload} className="upload-form">
        {/* File Input */}
        <div className="form-group">
          <label htmlFor="file-input">MIDI File *</label>
          <input
            id="file-input"
            type="file"
            accept=".mid,.midi"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {selectedFile && (
            <p className="file-info">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Title */}
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

        {/* Artist */}
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

        {/* Instrument */}
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

        {/* Tuning */}
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

        {/* Difficulty */}
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

        {/* Tags */}
        <div className="form-group">
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

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
            <span>{uploadProgress}%</span>
          </div>
        )}

        {/* Submit Button */}
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
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .file-info {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .error-message {
          padding: 12px;
          background-color: #ffebee;
          color: #c62828;
          border-radius: 4px;
          font-size: 14px;
        }

        .progress-bar {
          width: 100%;
          height: 30px;
          background-color: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s ease;
        }

        .progress-bar span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
          font-weight: 600;
        }

        .upload-button {
          padding: 12px 24px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .upload-button:hover:not(:disabled) {
          background-color: #45a049;
        }

        .upload-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MidiUpload;