import { useState, useRef } from 'react';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default function ArchitectureUpload({ onSourcesDetected }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    setError('');
    setResults(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a PNG, JPEG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be smaller than 4MB.');
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await fetch('/api/parse-architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      setResults(data);
      // Pre-select all detected databases
      setSelectedItems(data.databases.map((_, i) => i));
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const toggleItem = (idx) => {
    setSelectedItems(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleConfirm = () => {
    if (!results) return;
    const selected = results.databases
      .filter((_, i) => selectedItems.includes(i))
      .map(db => ({
        sourceType: db.type !== 'unknown' ? db.type : 'oracle',
        edition: 'enterprise',
        servers: db.count,
        coresPerServer: db.estimatedCoresPerServer || 16,
        ramPerServer: db.estimatedRamGb || 64,
        storageGbPerServer: db.estimatedStorageGb || 500,
        pricingTerm: 'onDemand',
        haRequired: false,
        customMonthlyCost: 0,
        label: db.label,
        aiDetected: true,
      }));
    onSourcesDetected(selected);
    setResults(null);
    setSelectedItems([]);
  };

  const confidenceColor = (c) => {
    if (c >= 0.8) return '#2e7d32';
    if (c >= 0.5) return '#f57c00';
    return '#c62828';
  };

  return (
    <div className="architecture-upload">
      <h3>📐 Upload Architecture Diagram</h3>
      <p className="upload-note">
        Upload an architecture diagram and AI will detect database components to add as sources.
        <br /><small>Images are sent to Azure OpenAI for analysis. No images are stored.</small>
      </p>

      {!results && !loading && (
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="drop-icon">📁</span>
          <p>Drag & drop an architecture image here, or click to browse</p>
          <small>PNG, JPEG, WebP, GIF — max 4MB</small>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {loading && (
        <div className="upload-loading">
          <div className="spinner"></div>
          <p>Analyzing architecture diagram...</p>
        </div>
      )}

      {error && <div className="upload-error">⚠️ {error}</div>}

      {results && (
        <div className="upload-results">
          <h4>Detected Components</h4>
          {results.warnings?.length > 0 && (
            <div className="upload-warnings">
              {results.warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
            </div>
          )}

          {results.databases.length === 0 ? (
            <p>No database components detected. Try a clearer diagram.</p>
          ) : (
            <>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>✓</th>
                    <th>Type</th>
                    <th>Label</th>
                    <th>Count</th>
                    <th>Cores</th>
                    <th>RAM (GB)</th>
                    <th>Storage (GB)</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.databases.map((db, i) => (
                    <tr key={i} className={selectedItems.includes(i) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(i)}
                          onChange={() => toggleItem(i)}
                        />
                      </td>
                      <td>{db.type === 'unknown' ? <em>{db.originalType || '?'}</em> : db.type}</td>
                      <td>{db.label}</td>
                      <td>{db.count}</td>
                      <td>{db.estimatedCoresPerServer || '—'}</td>
                      <td>{db.estimatedRamGb || '—'}</td>
                      <td>{db.estimatedStorageGb || '—'}</td>
                      <td style={{ color: confidenceColor(db.confidence) }}>
                        {Math.round(db.confidence * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {results.biTools?.length > 0 && (
                <div className="bi-tools-detected">
                  <h5>BI Tools Detected</h5>
                  {results.biTools.map((tool, i) => (
                    <span key={i} className="bi-tool-badge">{tool.label || tool.type}</span>
                  ))}
                </div>
              )}

              <div className="upload-actions">
                <button className="btn-primary" onClick={handleConfirm} disabled={selectedItems.length === 0}>
                  Add {selectedItems.length} Source{selectedItems.length !== 1 ? 's' : ''}
                </button>
                <button className="btn-secondary" onClick={() => { setResults(null); setSelectedItems([]); }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
