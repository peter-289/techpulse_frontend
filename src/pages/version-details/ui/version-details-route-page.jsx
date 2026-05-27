import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../../dashboard/DashboardLayout';
import { VersionStatus } from '../../../constants/registryEnums';
import useSoftwareRegistry from '../../../hooks/useSoftwareRegistry';
import './version-details-route-page.css';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '-';
  }
}

export default function VersionDetailPage({
  user,
  software,
  version,
  onBack,
  onLogout,
  onNavigate,
}) {
  const [notes, setNotes] = useState(version?.release_notes || '');
  const [status, setStatus] = useState(version?.status || (version?.is_published ? VersionStatus.PUBLISHED : VersionStatus.DRAFT));
  const [feedback, setFeedback] = useState(null);
  const { updateVersionState } = useSoftwareRegistry();
  const isOwner = String(software?.owner_id) === String(user?.id);

  const headline = useMemo(() => {
    if (!software || !version) return 'Version details';
    return `${software.name} - v${version.version}`;
  }, [software, version]);

  if (!software || !version) {
    return (
      <DashboardLayout
        user={user}
        activePage="projects"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title="Version Details"
        subtitle="Select a version to inspect"
      >
        <section className="tp-dashboard-grid">
          <article className="tp-panel tp-span-8">
            <h1>No version selected</h1>
            <p>Please return to the project details page and choose a version.</p>
            <button className="tp-btn tp-btn-primary" type="button" onClick={onBack}>
              Back to Project
            </button>
          </article>
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
      title={headline}
      subtitle={isOwner ? 'Lifecycle controls and release metadata' : 'Release information'}
    >
      <section className="tp-dashboard-grid vd-grid">
        <article className="tp-panel tp-span-8">
          <header className="vd-header">
            <div>
              <h1>{software.name}</h1>
              <p>Version v{version.version}</p>
            </div>
            <button className="tp-btn tp-btn-secondary" type="button" onClick={onBack}>
              Back to Project
            </button>
          </header>

          <div className="vd-status-row">
            <span className={`vd-status vd-${String(status).toLowerCase()}`}>{status}</span>
            <span>Created {formatDate(version.created_at)}</span>
            <span>Published {formatDate(version.published_at)}</span>
          </div>

          <section className="vd-section">
            <h2>Release notes</h2>
            {isOwner ? (
              <>
                <textarea
                  className="vd-textarea"
                  rows={5}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add release notes and change log details"
                />
                <button className="tp-btn tp-btn-primary" type="button">
                  Save notes (UI only)
                </button>
              </>
            ) : (
              <p className="vd-readonly-notes">{notes || 'No release notes were published for this version.'}</p>
            )}
          </section>

          <section className="vd-section">
            <h2>Integrity</h2>
            <div className="vd-metrics">
              <div>
                <strong>SHA256</strong>
                <p>{version.file_hash || 'Not reported'}</p>
              </div>
              <div>
                <strong>File size</strong>
                <p>{version.size_bytes ? `${version.size_bytes} bytes` : '-'}</p>
              </div>
              <div>
                <strong>Content type</strong>
                <p>{version.content_type || 'application/octet-stream'}</p>
              </div>
            </div>
          </section>
        </article>

        {isOwner ? (
          <aside className="tp-panel tp-span-4 vd-side">
            <h2>Lifecycle actions</h2>
            <p>Use these controls to enforce package hygiene and prevent risky versions from being used.</p>
            <div className="vd-actions">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await updateVersionState({
                      softwareId: software.id,
                      version: version.version,
                      status: VersionStatus.DEPRECATED,
                    });
                    setStatus(VersionStatus.DEPRECATED);
                    setFeedback({ variant: 'success', title: 'Version deprecated', message: 'Lifecycle updated.' });
                  } catch (err) {
                    setFeedback({ variant: 'error', title: 'Update failed', message: err?.message || 'Try again.' });
                  }
                }}
              >
                Deprecate
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await updateVersionState({
                      softwareId: software.id,
                      version: version.version,
                      status: VersionStatus.REVOKED,
                    });
                    setStatus(VersionStatus.REVOKED);
                    setFeedback({ variant: 'success', title: 'Version revoked', message: 'Lifecycle updated.' });
                  } catch (err) {
                    setFeedback({ variant: 'error', title: 'Update failed', message: err?.message || 'Try again.' });
                  }
                }}
              >
                Revoke
              </button>
            </div>
            {feedback && (
              <div className={`vd-feedback ${feedback.variant}`}>
                <strong>{feedback.title}</strong>
                <p>{feedback.message}</p>
              </div>
            )}

            <div className="vd-alert">
              <strong>Reminder</strong>
              <p>Revoked versions are blocked from downloads. Deprecation keeps them available but warns users.</p>
            </div>
          </aside>
        ) : (
          <aside className="tp-panel tp-span-4 vd-side">
            <h2>Version availability</h2>
            <p>This release is shown for inspection only. Downloads and purchase access are handled from the project library.</p>
            <button className="tp-btn tp-btn-primary" type="button" onClick={onBack}>
              Back to Project
            </button>
          </aside>
        )}
      </section>
    </DashboardLayout>
  );
}
