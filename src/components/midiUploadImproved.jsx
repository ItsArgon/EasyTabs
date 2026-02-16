import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from './firebase-config';

const MidiUploadImproved = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadTask, setUploadTask] = useState(null);
  
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
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      
      console.log('File selected:', file.name, 'Size:', file.size, 'bytes');
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

  const cancelUpload = () => {
    if (uploadTask) {
      uploadTask.cancel();
      setUploadTask(null);
      setUploading(false);
      setUploadProgress(0);
      setError('Upload cancelled');
    }
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
      // Create unique filename
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      
      console.log('Starting upload to Firebase Storage...');
      console.log('Path:', `tabs/${filename}`);
      
      // Create storage reference
      const storageRef = ref(storage, `tabs/${filename}`);
      
      // Create upload task with metadata
      const metadata = {
        contentType: 'audio/midi',
        customMetadata: {
          originalName: selectedFile.name,
          uploadedBy: formData.uploadedBy,
          title: formData.title,
          artist: formData.artist
        }
      };
      
      const task = uploadBytesResumable(storageRef, selectedFile, metadata);
      setUploadTask(task);
      
      // Monitor upload progress
      task.on('state_changed', 
        (snapshot) => {
          // Progress updates
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
          console.log(`Upload progress: ${progress}%`);
          
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error);
          setUploadTask(null);
          
          switch (error.code) {
            case 'storage/unauthorized':
              setError('You do not have permission to upload files. Please check Firebase Security Rules.');
              break;
            case 'storage/canceled':
              setError('Upload was cancelled');
              break;
            case 'storage/unknown':
              setError('An unknown error occurred. Please check your internet connection and try again.');
              break;
            case 'storage/retry-limit-exceeded':
              setError('Upload timed out. Please check your internet connection and Firebase configuration.');
              break;
            default:
              setError(`Upload failed: ${error.message}`);
          }
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          try {
            console.log('Upload complete! Getting download URL...');
            const downloadURL = await getDownloadURL(task.snapshot.ref);
            console.log('Download URL:', downloadURL);
            
            // Parse tags
            const tags = formData.tags
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0);

            // Prepare Firestore document
            const tabData = {
              id: timestamp.toString(),
              title: formData.title,
              artist: formData.artist,
              midiUrl: downloadURL,
              storagePath: `tabs/${filename}`,
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
            
            console.log('Saving metadata to Firestore...');
            await setDoc(doc(db, 'tabs', tabData.id), tabData);
            console.log('Metadata saved successfully!');
            
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
            setUploadTask(null);
            setUploading(false);

            // Callback to parent component
            if (onUploadComplete) {
              onUploadComplete(tabData);
            }

            alert('Tab uploaded successfully!');
          } catch (err) {
            console.error('Error saving metadata:', err);
            setError(`File uploaded but failed to save metadata: ${err.message}`);
            setUploading(false);
          }
        }
      );
    } catch (err) {
      console.error('Upload initialization error:', err);
      setError(`Failed to start upload: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="midi-upload-container">
      <h2>Upload MIDI Tab</h2>
      
      {/* Debug Info */}
      <div className="debug-info">
        <p><strong>Firebase Storage Status:</strong> {storage ? '✓ Connected' : '✗ Not Connected'}</p>
        <p><strong>Firestore Status:</strong> {db ? '✓ Connected' : '✗ Not Connected'}</p>
      </div>
      
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
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="progress-text">{uploadProgress}%</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="button-group">
          <button 
            type="submit" 
            className="upload-button"
            disabled={uploading || !selectedFile}
          >
            {uploading ? 'Uploading...' : 'Upload Tab'}
          </button>
          
          {uploading && (
            <button 
              type="button"
              className="cancel-button"
              onClick={cancelUpload}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        .midi-upload-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .debug-info {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 13px;
        }

        .debug-info p {
          margin: 5px 0;
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

        .progress-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .progress-bar {
          flex: 1;
          height: 30px;
          background-color: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          min-width: 45px;
        }

        .button-group {
          display: flex;
          gap: 10px;
        }

        .upload-button {
          flex: 1;
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

        .cancel-button {
          padding: 12px 24px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .cancel-button:hover {
          background-color: #da190b;
        }
      `}</style>
    </div>
  );
};

export default MidiUploadImproved;