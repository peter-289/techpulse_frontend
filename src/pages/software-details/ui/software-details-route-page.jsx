import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../dashboard/DashboardLayout';
import FeedbackMessage from '../../../components/FeedbackMessage';
import useSoftwareRegistry from '../../../hooks/useSoftwareRegistry';
import { VersionStatus } from '../../../constants/registryEnums';
import { errorMessageFrom, notifyToast } from '../../../toastBus';
import './software-details-route-page.css';

const EMPTY_NOTES = 'Add release notes or change log entries for this action.';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '-';
  }
}

function centsToPrice(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function formatMoney(cents, currency = 'USD') {
  const amount = Number(cents || 0) / 100;
  if (amount <= 0) return 'Free';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function userIdOf(user) {
  return user?.id ?? user?.user_id ?? user?.sub ?? null;
}

export default function SoftwareDetailsPage({
  user,
  software,
  onBack,
  onLogout,
  onNavigate,
  onOpenVersion,
  onCheckoutProject,
  purchasedProjectIds = [],
}) {
  const { fetchSoftwareVersions, uploadSoftwareVersion, updateVersionState, updatePricing } = useSoftwareRegistry();
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
  const [versionUploadProgress, setVersionUploadProgress] = useState(0);
  const [versionUploading, setVersionUploading] = useState(false);
  const [pricing, setPricing] = useState({
    price: centsToPrice(software?.price_cents),
    currency: software?.currency || 'USD',
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
    setPricing({
      price: centsToPrice(software?.price_cents),
      currency: software?.currency || 'USD',
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

  const loadVersions = async () => {
    const items = await fetchSoftwareVersions(software.id, 30);
    setVersions(items);
  };

  const handleNewVersion = async (event) => {
    event.preventDefault();
    if (!newVersion.number.trim()) {
      setFeedback({ variant: 'warning', title: 'Version required', message: 'Provide a version number.' });
      return;
    }
    if (!newVersion.file) {
      setFeedback({ variant: 'warning', title: 'Artifact required', message: 'Choose a package file for this version.' });
      return;
    }
    setVersionUploading(true);
    setVersionUploadProgress(0);
    try {
      const uploaded = await uploadSoftwareVersion({
        softwareId: software.id,
        version: newVersion.number,
        releaseNotes: newVersion.notes,
        file: newVersion.file,
        onUploadProgress: (evt) => {
          if (evt.total) setVersionUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setVersions((prev) => [uploaded, ...prev.filter((row) => row.version !== uploaded.version)]);
      setNewVersion({ number: '', notes: '', file: null });
      setVersionUploadProgress(100);
      const clean = uploaded.artifact_status === 'active';
      setFeedback({
        variant: clean ? 'success' : 'warning',
        title: clean ? 'Version published' : 'Version quarantined',
        message: clean
          ? `Version ${uploaded.version} passed scan and is published.`
          : uploaded.quarantine_reason || 'The uploaded artifact did not pass scan and remains unavailable.',
      });
      notifyToast({
        variant: clean ? 'success' : 'warning',
        title: clean ? 'Version published' : 'Version quarantined',
        message: clean ? `${software.name} v${uploaded.version} is live.` : 'Scanner blocked this artifact.',
      });
      await loadVersions();
    } catch (err) {
      const message = errorMessageFrom(err, 'Version upload failed.');
      setFeedback({ variant: 'error', title: 'Version upload failed', message });
      notifyToast({ variant: 'error', title: 'Version upload failed', message });
    } finally {
      setVersionUploading(false);
    }
  };

  const handlePricingSave = async () => {
    try {
      await updatePricing({
        softwareId: software.id,
        priceCents: Math.max(0, Math.round(Number(pricing.price || 0) * 100)),
        currency: pricing.currency,
      });
      setFeedback({ variant: 'success', title: 'Pricing saved', message: 'Project pricing is now updated.' });
    } catch (err) {
      setFeedback({
        variant: 'error',
        title: 'Pricing update failed',
        message: err?.response?.data?.detail || err?.message || 'Try again.',
      });
    }
  };

  const canDelete = confirmText.trim().toLowerCase() === String(software.name || '').trim().toLowerCase();
  const currentUserId = userIdOf(user);
  const isOwner = String(software.owner_id) === String(currentUserId);
  const hasPurchased = purchasedProjectIds.map(String).includes(String(software.id));
  const viewerHasAccess = isOwner || Number(software.price_cents || 0) <= 0 || software.viewer_has_access || hasPurchased;
  const canPurchase = Number(software.price_cents || 0) > 0 && software.is_public && !viewerHasAccess;

  if (!isOwner) {
    const publishedVersions = resolvedVersions.filter((row) => row.status !== VersionStatus.DRAFT);
    return (
      <DashboardLayout
        user={user}
        activePage="projects"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title={software.name || 'Project Details'}
        subtitle="Project information"
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

            <section className="sd-section sd-public-overview">
              <h2>Overview</h2>
              <div className="sd-public-facts">
                <div>
                  <span>Access</span>
                  <strong>{viewerHasAccess ? 'Available' : 'Purchase required'}</strong>
                </div>
                <div>
                  <span>Price</span>
                  <strong>{formatMoney(software.price_cents, software.currency)}</strong>
                </div>
                <div>
                  <span>Visibility</span>
                  <strong>{software.is_public ? 'Public' : 'Private'}</strong>
                </div>
                <div>
                  <span>Downloads</span>
                  <strong>{software.download_count || 0}</strong>
                </div>
              </div>
            </section>

            <section className="sd-section">
              <h2>Available versions</h2>
              <div className="sd-version-list">
                {publishedVersions.map((row) => (
                  <div key={row.version} className="sd-version-card sd-version-card-readonly">
                    <div>
                      <strong>v{row.version}</strong>
                      <span className={`sd-status sd-${String(row.status).toLowerCase()}`}>{row.status}</span>
                      <p>Published {formatDate(row.published_at)} · {row.download_count || 0} downloads</p>
                    </div>
                    {row.release_notes && <p className="sd-release-notes">{row.release_notes}</p>}
                  </div>
                ))}
                {!publishedVersions.length && <p className="sd-muted">No public versions are available yet.</p>}
              </div>
            </section>
          </article>

          <aside className="tp-panel tp-span-4 sd-side">
            <h2>Project access</h2>
            <p className="sd-muted">
              {viewerHasAccess
                ? 'Use the project library to download available releases.'
                : 'Purchase access to unlock downloads for this project.'}
            </p>
            {canPurchase && (
              <button className="tp-btn tp-btn-primary" type="button" onClick={() => onCheckoutProject?.(software)}>
                Buy {formatMoney(software.price_cents, software.currency)}
              </button>
            )}
            <button className="tp-btn tp-btn-secondary" type="button" onClick={onBack}>
              Return to Project Library
            </button>
          </aside>
        </section>
      </DashboardLayout>
    );
  }

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

          {isOwner && (
          <section className="sd-section">
            <h2>Pricing</h2>
            <div className="sd-form-grid">
              <label>
                Project price
                <input
                  className="sd-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.price}
                  onChange={(event) => setPricing((prev) => ({ ...prev, price: event.target.value }))}
                />
              </label>
              <label>
                Currency
                <select
                  className="sd-input"
                  value={pricing.currency}
                  onChange={(event) => setPricing((prev) => ({ ...prev, currency: event.target.value }))}
                >
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
            </div>
            <button className="tp-btn tp-btn-primary" type="button" onClick={handlePricingSave}>
              Save pricing
            </button>
          </section>
          )}

          <section className="sd-section">
            <h2>Versions</h2>
            <div className="sd-version-list">
              {resolvedVersions.map((row) => (
                <div key={row.version} className="sd-version-card">
                  <div>
                    <strong>v{row.version}</strong>
                    <span className={`sd-status sd-${row.status.toLowerCase()}`}>{row.status}</span>
                    {row.artifact_status && (
                      <span className={`sd-status sd-artifact-${String(row.artifact_status).toLowerCase()}`}>
                        Scan: {row.artifact_status}
                      </span>
                    )}
                    <p>Created {formatDate(row.created_at)}</p>
                    {row.quarantine_reason && <p className="sd-quarantine-reason">{row.quarantine_reason}</p>}
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
                Artifact file
                <input
                  className="sd-input"
                  type="file"
                  onChange={(event) => setNewVersion((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                />
              </label>
              <div className="sd-upload-progress" aria-live="polite">
                <div style={{ width: `${versionUploadProgress}%` }} />
              </div>
              <button className="tp-btn tp-btn-primary" type="submit" disabled={versionUploading}>
                {versionUploading ? 'Uploading and scanning...' : 'Upload version'}
              </button>
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
