import React, { useState } from 'react';
import { ref, uploadBytes, uploadString, getDownloadURL, listAll } from 'firebase/storage';
import { storage, db } from './firebase-Config';

const FirebaseStorageDiagnostic = () => {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date() }]);
  };

  const runDiagnostics = async () => {
    setResults([]);
    setTesting(true);

    // Test 1: Check Firebase Storage instance
    try {
      addResult('Storage Instance', 'info', 'Checking Firebase Storage initialization...');
      
      if (!storage) {
        addResult('Storage Instance', 'fail', 'Storage is not initialized');
        setTesting(false);
        return;
      }
      
      const bucketName = storage.app.options.storageBucket;
      addResult('Storage Instance', 'pass', `Storage initialized successfully`, { bucket: bucketName });
    } catch (error) {
      addResult('Storage Instance', 'fail', error.message, error);
      setTesting(false);
      return;
    }

    // Test 2: Check Storage bucket configuration
    try {
      addResult('Bucket Config', 'info', 'Checking bucket configuration...');
      
      const bucket = storage.app.options.storageBucket;
      
      if (!bucket) {
        addResult('Bucket Config', 'fail', 'No storage bucket configured in Firebase config');
        setTesting(false);
        return;
      }
      
      if (!bucket.includes('.appspot.com') && !bucket.includes('.firebasestorage.app')) {
        addResult('Bucket Config', 'warn', 'Bucket name format looks unusual', { bucket });
      } else {
        addResult('Bucket Config', 'pass', 'Bucket configuration looks correct', { bucket });
      }
    } catch (error) {
      addResult('Bucket Config', 'fail', error.message, error);
    }

    // Test 3: Try to list files (test read permission)
    try {
      addResult('Read Permission', 'info', 'Testing read access...');
      
      const listRef = ref(storage, 'tabs');
      await listAll(listRef);
      
      addResult('Read Permission', 'pass', 'Read access works - can list files');
    } catch (error) {
      addResult('Read Permission', 'fail', `Read access failed: ${error.code}`, error);
      
      if (error.code === 'storage/unauthorized') {
        addResult('Read Permission', 'fail', 'Security rules are blocking read access');
      }
    }

    // Test 4: Upload a tiny text file
    try {
      addResult('Text Upload', 'info', 'Attempting to upload test text file...');
      
      const testRef = ref(storage, `test/diagnostic_${Date.now()}.txt`);
      const result = await uploadString(testRef, 'Hello from diagnostic test!');
      
      addResult('Text Upload', 'pass', 'Successfully uploaded text file', { 
        path: result.ref.fullPath 
      });

      // Test 4b: Get download URL
      try {
        const url = await getDownloadURL(testRef);
        addResult('Download URL', 'pass', 'Successfully retrieved download URL', { url });
      } catch (error) {
        addResult('Download URL', 'fail', `Failed to get download URL: ${error.code}`, error);
      }
    } catch (error) {
      addResult('Text Upload', 'fail', `Upload failed: ${error.code}`, error);
      
      if (error.code === 'storage/unauthorized') {
        addResult('Security Rules', 'fail', 'SECURITY RULES ARE BLOCKING UPLOADS!', {
          solution: 'Go to Firebase Console → Storage → Rules and set: allow write: if true;'
        });
      } else if (error.code === 'storage/retry-limit-exceeded') {
        addResult('Network Issue', 'fail', 'Network timeout or connectivity issue', {
          possibleCauses: [
            'Firewall blocking Firebase',
            'VPN interfering with connection',
            'Network instability',
            'CORS configuration issue'
          ]
        });
      }
    }

    // Test 5: Upload a small binary file (simulating MIDI)
    try {
      addResult('Binary Upload', 'info', 'Attempting to upload binary data...');
      
      // Create a small binary blob
      const binaryData = new Uint8Array([0x4D, 0x54, 0x68, 0x64]); // MIDI header
      const blob = new Blob([binaryData], { type: 'audio/midi' });
      
      const testRef = ref(storage, `test/diagnostic_${Date.now()}.mid`);
      const result = await uploadBytes(testRef, blob, {
        contentType: 'audio/midi'
      });
      
      addResult('Binary Upload', 'pass', 'Successfully uploaded binary file', { 
        path: result.ref.fullPath,
        size: blob.size
      });
    } catch (error) {
      addResult('Binary Upload', 'fail', `Binary upload failed: ${error.code}`, error);
    }

    // Test 6: Test tabs directory specifically
    try {
      addResult('Tabs Directory', 'info', 'Testing uploads to /tabs directory...');
      
      const tabsRef = ref(storage, `tabs/diagnostic_${Date.now()}.txt`);
      await uploadString(tabsRef, 'Test in tabs directory');
      
      addResult('Tabs Directory', 'pass', 'Can upload to /tabs directory');
    } catch (error) {
      addResult('Tabs Directory', 'fail', `Cannot upload to /tabs: ${error.code}`, error);
    }

    // Test 7: Network connectivity
    try {
      addResult('Network', 'info', 'Testing network connectivity to Firebase...');
      
      const response = await fetch('https://firebasestorage.googleapis.com/', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      addResult('Network', 'pass', 'Can reach Firebase Storage servers');
    } catch (error) {
      addResult('Network', 'fail', 'Cannot reach Firebase Storage servers', error);
    }

    setTesting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return '#4CAF50';
      case 'fail': return '#f44336';
      case 'warn': return '#ff9800';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'warn': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div className="diagnostic-container">
      <h2>🔧 Firebase Storage Diagnostics</h2>
      <p>This tool will test your Firebase Storage configuration and identify issues.</p>

      <button 
        onClick={runDiagnostics} 
        disabled={testing}
        className="run-button"
      >
        {testing ? 'Running Tests...' : 'Run Diagnostic Tests'}
      </button>

      {results.length > 0 && (
        <div className="results-container">
          <h3>Test Results:</h3>
          {results.map((result, index) => (
            <div 
              key={index} 
              className="result-item"
              style={{ borderLeftColor: getStatusColor(result.status) }}
            >
              <div className="result-header">
                <span 
                  className="status-icon"
                  style={{ color: getStatusColor(result.status) }}
                >
                  {getStatusIcon(result.status)}
                </span>
                <strong>{result.test}</strong>
                <span className="timestamp">
                  {result.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="result-message">{result.message}</div>
              {result.details && (
                <div className="result-details">
                  <pre>{JSON.stringify(result.details, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {results.some(r => r.status === 'fail') && (
        <div className="action-items">
          <h3>⚡ Action Items:</h3>
          <ul>
            {results.find(r => r.test === 'Security Rules' && r.status === 'fail') && (
              <li className="critical">
                <strong>CRITICAL:</strong> Fix Firebase Security Rules
                <ol>
                  <li>Go to Firebase Console</li>
                  <li>Navigate to Storage → Rules</li>
                  <li>Set: <code>allow read, write: if true;</code></li>
                  <li>Click "Publish"</li>
                </ol>
              </li>
            )}
            {results.find(r => r.test === 'Network Issue') && (
              <li>
                <strong>Network Issue Detected:</strong>
                <ul>
                  <li>Try disabling VPN</li>
                  <li>Check firewall settings</li>
                  <li>Try different network (mobile hotspot)</li>
                  <li>Check browser console for CORS errors</li>
                </ul>
              </li>
            )}
            {results.find(r => r.test === 'Bucket Config' && r.status === 'fail') && (
              <li>
                <strong>Fix Storage Bucket:</strong>
                <ul>
                  <li>Check firebase-config.js storageBucket value</li>
                  <li>Should be: your-project.appspot.com</li>
                  <li>Verify in Firebase Console → Project Settings</li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      )}

      <style jsx>{`
        .diagnostic-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        h2 {
          color: #333;
          margin-bottom: 10px;
        }

        p {
          color: #666;
          margin-bottom: 20px;
        }

        .run-button {
          padding: 15px 30px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 30px;
          transition: background 0.3s;
        }

        .run-button:hover:not(:disabled) {
          background: #45a049;
        }

        .run-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .results-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .results-container h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
        }

        .result-item {
          background: #f9f9f9;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 6px;
          border-left: 4px solid #ddd;
          transition: all 0.3s;
        }

        .result-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .status-icon {
          font-size: 20px;
          font-weight: bold;
        }

        .timestamp {
          margin-left: auto;
          font-size: 12px;
          color: #999;
        }

        .result-message {
          color: #555;
          margin-left: 30px;
        }

        .result-details {
          margin-top: 10px;
          margin-left: 30px;
          background: white;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }

        .result-details pre {
          margin: 0;
          font-size: 12px;
          color: #333;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .action-items {
          background: #fff3e0;
          border: 2px solid #ff9800;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }

        .action-items h3 {
          margin-top: 0;
          color: #e65100;
        }

        .action-items ul {
          margin: 0;
          padding-left: 20px;
        }

        .action-items li {
          margin-bottom: 15px;
          color: #555;
        }

        .action-items li.critical {
          background: #ffebee;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #f44336;
          list-style: none;
          margin-left: -20px;
          padding-left: 35px;
        }

        .action-items code {
          background: #333;
          color: #4CAF50;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }

        .action-items ol {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default FirebaseStorageDiagnostic;