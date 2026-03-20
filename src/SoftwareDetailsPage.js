import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import FeedbackMessage from './components/FeedbackMessage';
import useSoftwareRegistry from './hooks/useSoftwareRegistry';
import { VersionStatus } from './constants/registryEnums';
import './SoftwareDetailsPage.css';

const EMPTY_NOTES = 'Add release notes or change log entries for this action.';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '-';
  }
}

export default function SoftwareDetailsPage({
  user,
  software,
  onBack,
  onLogout,
  onNavigate,
  onOpenVersion,
}) {
  const { fetchSoftwareVersions, updateVersionState } = useSoftwareRegistry();
  const [versions, setVersions] = useState([]);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [notesByVersion, setNotesByVersion] = useState({});
  const [metadata, setMetadata] = useState({
    name: software?.name || '',
    description: software?.description || '',
    docs: software?.docs || '',
  });
  const [newVersion, setNewVersion] = useState({
    number: '',
    notes: '',
    file: null,
  });
  const [confirmText, setConfirmText] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setMetadata({
      name: software?.name || '',
      description: software?.description || '',
      docs: software?.docs || '',
    });
  }, [software]);

  useEffect(() => {
    let alive = true;
    if (!software?.id) return undefined;
    const load = async () => {
      try {
        const items = await fetchSoftwareVersions(software.id, 30);
        if (!alive) return;
        setVersions(items);
      } catch {
        if (alive) setFeedback({ variant: 'error', title: 'Failed to load versions', message: 'Try again shortly.' });
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [fetchSoftwareVersions, software?.id]);

  const resolvedVersions = useMemo(
    () =>
      versions.map((row) => ({
        ...row,
        status: statusOverrides[row.version]
          || (row.is_published ? VersionStatus.PUBLISHED : VersionStatus.DRAFT),
        notes: notesByVersion[row.version] || row.release_notes || '',
      })),
    [versions, statusOverrides, notesByVersion]
  );

  if (!software) {
    return (
      <DashboardLayout
        user={user}
        activePage="projects"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title="Project Details"
        subtitle="Select a project to manage it"
      >
        <section className="tp-dashboard-grid">
          <article className="tp-panel tp-span-8">
            <h1>No project selected</h1>
            <p>Please return to the project library and choose a project to manage.</p>
            <button className="tp-btn tp-btn-primary" type="button" onClick={onBack}>
              Back to Project Library
            </button>
          </article>
        </section>
      </DashboardLayout>
    );
  }

  const handleStatusUpdate = async (version, status) => {
    try {
      await updateVersionState({
        softwareId: software.id,
        version,
        status,
      });
      setStatusOverrides((prev) => ({ ...prev, [version]: status }));
      setNotesByVersion((prev) => ({ ...prev, [version]: prev[version] || EMPTY_NOTES }));
      setFeedback({ variant: 'success', title: 'Lifecycle updated', message: `Version ${version} marked ${status}.` });
    } catch (err) {
      setFeedback({ variant: 'error', title: 'Lifecycle update failed', message: err?.message || 'Try again.' });
    }
  };

  const handleDeleteVersion = (version) => {
    setDeleteCandidate(version);
    setDeleteConfirmText('');
  };

  const confirmDeleteVersion = () => {
    if (!deleteCandidate) return;
    if (deleteConfirmText.trim() !== deleteCandidate) {
      setFeedback({ variant: 'warning', title: 'Confirmation required', message: 'Type the version to confirm deletion.' });
      return;
    }
    setVersions((prev) => prev.filter((row) => row.version !== deleteCandidate));
    setDeleteCandidate('');
    setDeleteConfirmText('');
    setFeedback({ variant: 'success', title: 'Version deleted', message: `Version ${deleteCandidate} removed.` });
  };

  const handleNewVersion = (event) => {
    event.preventDefault();
    if (!newVersion.number.trim()) {
      setFeedback({ variant: 'warning', title: 'Version required', message: 'Provide a version number.' });
      return;
    }
    setVersions((prev) => [
      {
        id: `temp-${newVersion.number}`,
        software_id: software.id,
        version: newVersion.number,
        is_published: false,
        download_count: 0,
        created_at: new Date().toISOString(),
        published_at: null,
      },
      ...prev,
    ]);
    setNotesByVersion((prev) => ({ ...prev, [newVersion.number]: newVersion.notes || EMPTY_NOTES }));
    setNewVersion({ number: '', notes: '', file: null });
    setFeedback({ variant: 'success', title: 'Draft created', message: 'Version draft added to the list.' });
  };

  const canDelete = confirmText.trim().toLowerCase() === String(software.name || '').trim().toLowerCase();

  return (
    <DashboardLayout
      user={user}
      activePage="projects"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={software.name || 'Project Details'}
      subtitle="Manage versions, metadata, and lifecycle"
    >
      <section className="tp-dashboard-grid sd-grid">
        <article className="tp-panel tp-span-8 sd-main">
          <header className="sd-header">
            <div>
              <h1>{software.name || 'Untitled project'}</h1>
              <p>{software.description || 'No description provided.'}</p>
            </div>
            <div className="sd-header-actions">
              <button className="tp-btn tp-btn-secondary" type="button" onClick={onBack}>Back to Library</button>
            </div>
          </header>

          {feedback && <FeedbackMessage {...feedback} onClose={() => setFeedback(null)} />}

          <section className="sd-section">
            <h2>Project metadata</h2>
            <div className="sd-form-grid">
              <label>
                Project name
                <input
                  className="sd-input"
                  value={metadata.name}
                  onChange={(event) => setMetadata((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label>
                Documentation link
                <input
                  className="sd-input"
                  value={metadata.docs}
                  onChange={(event) => setMetadata((prev) => ({ ...prev, docs: event.target.value }))}
                  placeholder="https://docs.example.com"
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                className="sd-textarea"
                rows={4}
                value={metadata.description}
                onChange={(event) => setMetadata((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <button className="tp-btn tp-btn-primary" type="button">
              Save metadata (UI only)
            </button>
          </section>

          <section className="sd-section">
            <h2>Versions</h2>
            <div className="sd-version-list">
              {resolvedVersions.map((row) => (
                <div key={row.version} className="sd-version-card">
                  <div>
                    <strong>v{row.version}</strong>
                    <span className={`sd-status sd-${row.status.toLowerCase()}`}>{row.status}</span>
                    <p>Created {formatDate(row.created_at)}</p>
                  </div>
                  <div className="sd-version-actions">
                    <button type="button" onClick={() => onOpenVersion?.(software, row)}>View</button>
                    <button type="button" onClick={() => handleStatusUpdate(row.version, VersionStatus.DEPRECATED)}>
                      Deprecate
                    </button>
                    <button type="button" onClick={() => handleStatusUpdate(row.version, VersionStatus.REVOKED)}>
                      Revoke
                    </button>
                    <button type="button" className="sd-danger" onClick={() => handleDeleteVersion(row.version)}>
                      Delete
                    </button>
                  </div>
                  <div className="sd-version-notes">
                    <label>
                      Change log
                      <textarea
                        rows={2}
                        value={row.notes || ''}
                        onChange={(event) =>
                          setNotesByVersion((prev) => ({ ...prev, [row.version]: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              {!resolvedVersions.length && <p className="sd-muted">No versions yet. Upload your first release.</p>}
            </div>
            {deleteCandidate && (
              <div className="sd-delete-confirm">
                <p>Type <strong>{deleteCandidate}</strong> to delete this version.</p>
                <input
                  className="sd-input"
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  placeholder="Version number"
                />
                <div className="sd-delete-actions">
                  <button type="button" className="tp-btn tp-btn-secondary" onClick={() => setDeleteCandidate('')}>
                    Cancel
                  </button>
                  <button type="button" className="tp-btn sd-danger-btn" onClick={confirmDeleteVersion}>
                    Delete version
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="sd-section">
            <h2>Upload new version</h2>
            <form className="sd-upload" onSubmit={handleNewVersion}>
              <div className="sd-form-grid">
                <label>
                  Version number
                  <input
                    className="sd-input"
                    value={newVersion.number}
                    onChange={(event) => setNewVersion((prev) => ({ ...prev, number: event.target.value }))}
                    placeholder="1.1.0"
                  />
                </label>
                <label>
                  Release notes
                  <input
                    className="sd-input"
                    value={newVersion.notes}
                    onChange={(event) => setNewVersion((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Summarize changes"
                  />
                </label>
              </div>
              <label>
                Artifact file (UI only)
                <input
                  className="sd-input"
                  type="file"
                  onChange={(event) => setNewVersion((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                />
              </label>
              <button className="tp-btn tp-btn-primary" type="submit">Create draft</button>
            </form>
          </section>
        </article>

        <aside className="tp-panel tp-span-4 sd-side">
          <h2>Lifecycle guide</h2>
          <ul className="sd-list">
            <li>Draft versions are private until published.</li>
            <li>Deprecated releases remain downloadable but warn users.</li>
            <li>Revoked versions are blocked from use.</li>
            <li>Use detailed change logs to explain deprecations.</li>
          </ul>

          <div className="sd-danger-zone">
            <h3>Delete project</h3>
            <p>Type the project name to confirm deletion.</p>
            <input
              className="sd-input"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={software.name || 'Project name'}
            />
            <button className="tp-btn sd-danger-btn" type="button" disabled={!canDelete}>
              Permanently delete
            </button>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
