import React, { useMemo, useState } from 'react';
import { authApi as api } from './API_Wrapper';
import DashboardLayout from './dashboard/DashboardLayout';
import './UploadProjectPage.css';
import FeedbackMessage from './components/FeedbackMessage';
import { errorMessageFrom, notifyToast } from './toastBus';

const CATEGORIES = [
  'networking software',
  'cracked applications',
  'school projects',
  'entertainment software',
  'developer tools',
  'security tools',
  'others',
];

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['zip', 'tar', 'gz', 'rar', '7z', 'exe', 'msi', 'deb', 'rpm', 'whl'];

function titleCase(value) {
  return String(value)
    .split(' ')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function hasAcceptedExtension(fileName) {
  const ext = String(fileName.split('.').pop() || '').toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatMoney(price, currency) {
  const amount = Number(price || 0);
  if (amount <= 0) return 'Free';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

export default function UploadProjectPage({ user, onNavigate, onLogout, activePage = 'upload_project' }) {
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0],
    isPublic: true,
    price: '0.00',
    currency: 'USD',
    version: '1.0.0',
    changelog: '',
    screenshot: null,
    file: null,
  });

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Project name is required.';
    if (form.description.trim().length < 20) return 'Description must be at least 20 characters.';
    if (!form.version.trim()) return 'Version number is required.';
    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) return 'Project price cannot be negative.';
    if (!form.file) return 'Project package file is required.';
    if (!hasAcceptedExtension(form.file.name)) return 'Unsupported file type.';
    if (form.file.size > MAX_FILE_SIZE) return 'File exceeds 500MB size limit.';
    return '';
  }, [form]);

  const uploadSummary = useMemo(() => ({
    visibility: form.isPublic ? 'Public' : 'Private',
    price: formatMoney(form.price, form.currency),
    version: form.version || '1.0.0',
    category: titleCase(form.category),
    fileName: form.file?.name || 'No file selected',
    fileSize: form.file ? formatBytes(form.file.size) : '-',
  }), [form]);

  const setFile = (file) => {
    if (file && !hasAcceptedExtension(file.name)) {
      setError('Unsupported file type. Use zip, tar, gz, rar, 7z, exe, msi, deb, rpm, or whl.');
      setForm((prev) => ({ ...prev, file: null }));
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      setError('File exceeds 500MB size limit.');
      setForm((prev) => ({ ...prev, file: null }));
      return;
    }
    setForm((prev) => ({ ...prev, file }));
    setError('');
    setSuccess('');
    setUploadResult(null);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0] || null;
    if (file) setFile(file);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setAttemptedSubmit(true);
    if (validationError) {
      setError(validationError);
      notifyToast({
        variant: 'warning',
        title: 'Upload needs attention',
        message: validationError,
      });
      return;
    }

    const payload = new FormData();
    payload.append('software_name', form.name);
    const descriptionParts = [form.description.trim(), `Category: ${form.category}`];
    if (form.changelog.trim()) descriptionParts.push(`Release notes: ${form.changelog.trim()}`);
    payload.append('software_description', descriptionParts.join('\n\n'));
    payload.append('version', form.version || '1.0.0');
    payload.append('is_public', String(form.isPublic));
    payload.append('price_cents', String(Math.max(0, Math.round(Number(form.price || 0) * 100))));
    payload.append('currency', form.currency || 'USD');
    payload.append('file', form.file);

    setSubmitting(true);
    setProgress(0);
    setError('');
    setSuccess('');
    setUploadResult(null);

    try {
      const response = await api.post('/api/v1/software-management/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      const result = response.data || {};
      setUploadResult(result);
      setSuccess(`Upload complete. Version ${result.version || form.version} is published and ready in Project Library.`);
      notifyToast({
        variant: 'success',
        title: 'Project uploaded',
        message: `${form.name} v${result.version || form.version} is ready.`,
      });
      setForm({
        name: '',
        description: '',
        category: CATEGORIES[0],
        isPublic: true,
        price: '0.00',
        currency: 'USD',
        version: '1.0.0',
        changelog: '',
        screenshot: null,
        file: null,
      });
      setProgress(100);
      setAttemptedSubmit(false);
      setFileInputKey((prev) => prev + 1);
    } catch (err) {
      const message = errorMessageFrom(err, 'Upload failed.');
      setError(message);
      notifyToast({
        variant: 'error',
        title: 'Upload failed',
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      user={user}
      activePage={activePage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Upload Project"
      subtitle="Create and publish new software packages"
    >
      <section className="tp-dashboard-grid">
        <article className="tp-panel tp-span-8 up-main-card">
          <h1>Upload Project</h1>
          <p>Markdown descriptions, versioning, and private/public controls are supported.</p>

          <form className="up-form" onSubmit={onSubmit}>
            <label>
              Project name
              <input
                type="text"
                className="up-input"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                aria-label="Project name"
                required
              />
            </label>

            <label>
              Description (Markdown)
              <textarea
                className="up-textarea"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Write project summary, usage notes, and requirements"
                aria-label="Project description"
              />
            </label>

            <div className="up-two-col">
              <label>
                Category
                <select
                  className="up-input"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {titleCase(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Version number
                <input
                  type="text"
                  className="up-input"
                  value={form.version}
                  onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))}
                  placeholder="1.0.0"
                />
              </label>
            </div>

            <div className="up-visibility-field">
              <span className="up-field-label">Visibility</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.isPublic}
                className={`up-visibility-switch ${form.isPublic ? 'public' : 'private'}`}
                onClick={() => setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
              >
                <span className="up-visibility-knob" aria-hidden="true" />
                <span className={`up-visibility-text ${form.isPublic ? 'active' : ''}`}>Public</span>
                <span className={`up-visibility-text ${!form.isPublic ? 'active' : ''}`}>Private</span>
              </button>
              <p className="up-visibility-help">
                {form.isPublic
                  ? 'Public projects can be discovered and downloaded by authorized users.'
                  : 'Private projects are restricted and require subscription access for non-owners.'}
              </p>
            </div>

            <div className="up-two-col">
              <label>
                Project price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="up-input"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  aria-label="Project price"
                />
              </label>
              <label>
                Currency
                <select
                  className="up-input"
                  value={form.currency}
                  onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}
                  aria-label="Project currency"
                >
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
            </div>

            <label>
              Changelog
              <textarea
                className="up-textarea up-textarea-small"
                value={form.changelog}
                onChange={(event) => setForm((prev) => ({ ...prev, changelog: event.target.value }))}
                placeholder="What changed in this release"
              />
            </label>

            <label>
              Screenshot upload (optional)
              <input
                key={`screenshot-${fileInputKey}`}
                type="file"
                className="up-input"
                accept="image/*"
                onChange={(event) => setForm((prev) => ({ ...prev, screenshot: event.target.files?.[0] || null }))}
              />
            </label>

            <div
              className={`up-drop-zone ${dragActive ? 'active' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              aria-label="Drag and drop project file"
            >
              <p>{form.file ? `Selected file: ${form.file.name}` : 'Drag and drop file here, or click to browse'}</p>
              <input
                key={`package-${fileInputKey}`}
                className="up-file"
                type="file"
                accept={ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </div>

            <div className="up-progress" aria-live="polite">
              <div className="up-progress-bar" style={{ width: `${progress}%` }} />
            </div>

            {attemptedSubmit && validationError && (
              <FeedbackMessage
                variant="warning"
                title="Validation required"
                message={validationError}
                compact
              />
            )}
            {error && <FeedbackMessage variant="error" title="Upload failed" message={error} compact />}
            {success && <FeedbackMessage variant="success" title="Upload complete" message={success} compact />}
            {uploadResult && (
              <div className="up-result-card" aria-live="polite">
                <div>
                  <span>Project ID</span>
                  <strong>{uploadResult.software_id || uploadResult.id}</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>{uploadResult.version}</strong>
                </div>
                <div>
                  <span>Package size</span>
                  <strong>{formatBytes(uploadResult.size_bytes)}</strong>
                </div>
                <div>
                  <span>SHA256</span>
                  <strong className="up-hash">{uploadResult.sha256}</strong>
                </div>
              </div>
            )}

            <div className="up-actions">
              <button className="tp-btn tp-btn-primary" type="submit" disabled={submitting || !!validationError}>
                {submitting ? 'Uploading...' : 'Upload Project'}
              </button>
              <button className="tp-btn tp-btn-secondary" type="button" onClick={() => onNavigate('projects')}>
                View Project Library
              </button>
            </div>
          </form>
        </article>

        <article className="tp-panel tp-span-4 up-side-card">
          <h2>Upload Summary</h2>
          <div className="up-summary-list">
            <div><span>Visibility</span><strong>{uploadSummary.visibility}</strong></div>
            <div><span>Price</span><strong>{uploadSummary.price}</strong></div>
            <div><span>Version</span><strong>{uploadSummary.version}</strong></div>
            <div><span>Category</span><strong>{uploadSummary.category}</strong></div>
            <div><span>File</span><strong>{uploadSummary.fileName}</strong></div>
            <div><span>Size</span><strong>{uploadSummary.fileSize}</strong></div>
          </div>

          <h2>Upload Guidance</h2>
          <ul className="up-list">
            <li>Allowed package types: zip, tar, gz, rar, 7z, exe, msi, deb, rpm, whl.</li>
            <li>Maximum file size: 500MB per upload session.</li>
            <li>Private projects are visible to the owner and authorized users.</li>
            <li>Paid public projects require purchase before download.</li>
          </ul>
        </article>
      </section>
    </DashboardLayout>
  );
}
