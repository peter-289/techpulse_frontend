import React, { useMemo, useState } from 'react';
import api from './API_Wrapper';
import DashboardLayout from './dashboard/DashboardLayout';
import './UploadProjectPage.css';
import FeedbackMessage from './components/FeedbackMessage';

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

export default function UploadProjectPage({ user, onNavigate, onLogout, activePage = 'upload_project' }) {
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0],
    isPublic: true,
    version: 'v1.0.0',
    changelog: '',
    screenshot: null,
    file: null,
  });

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Project name is required.';
    if (form.description.trim().length < 20) return 'Description must be at least 20 characters.';
    if (!form.file) return 'Project package file is required.';
    if (!hasAcceptedExtension(form.file.name)) return 'Unsupported file type.';
    if (form.file.size > MAX_FILE_SIZE) return 'File exceeds 500MB size limit.';
    return '';
  }, [form]);

  const setFile = (file) => {
    setForm((prev) => ({ ...prev, file }));
    setError('');
    setSuccess('');
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0] || null;
    if (file) setFile(file);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('description', form.description);
    payload.append('category', form.category);
    payload.append('language', 'Unknown');
    payload.append('version', form.version || 'v1.0.0');
    payload.append('is_public', String(form.isPublic));
    payload.append('file', form.file);

    setSubmitting(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      await api.post('/api/v1/software-packages', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      setSuccess('Upload complete. Your project is now available in Project Library.');
      setForm({
        name: '',
        description: '',
        category: CATEGORIES[0],
        isPublic: true,
        version: 'v1.0.0',
        changelog: '',
        screenshot: null,
        file: null,
      });
      setProgress(100);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed.');
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
                  placeholder="v1.0.0"
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
                className="up-file"
                type="file"
                accept={ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </div>

            <div className="up-progress" aria-live="polite">
              <div className="up-progress-bar" style={{ width: `${progress}%` }} />
            </div>

            {validationError && (
              <FeedbackMessage
                variant="warning"
                title="Validation required"
                message={validationError}
                compact
              />
            )}
            {error && <FeedbackMessage variant="error" title="Upload failed" message={error} compact />}
            {success && <FeedbackMessage variant="success" title="Upload complete" message={success} compact />}

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

        <article className="tp-panel tp-span-4">
          <h2>Upload Guidance</h2>
          <ul className="up-list">
            <li>Allowed package types: zip, tar, gz, rar, 7z, exe, msi, deb, rpm, whl.</li>
            <li>Maximum file size: 500MB per upload session.</li>
            <li>Private files are visible only to authorized users.</li>
            <li>Version history appears on project details after upload.</li>
          </ul>
        </article>
      </section>
    </DashboardLayout>
  );
}
