import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSoftwareList } from '@/entities/software/api/software.queries';
import { useUploadVersion } from '@/entities/software/api/software.mutations';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui';
import { errorMessageFrom, notifyToast } from '@/shared/lib/toast/toast';
import { SectionCard, SectionPageHeader } from '@/pages/workspace-sections/ui/section-page';
import './upload-version-page.css';

export function UploadVersionPage() {
  const navigate = useNavigate();
  const softwareQuery = useSoftwareList(200);
  const uploadMutation = useUploadVersion();
  const [softwareId, setSoftwareId] = useState('');
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const software = softwareQuery.data ?? [];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setProgress(0);
    if (!softwareId || !version.trim() || files.length === 0) {
      const message = 'Select software, enter a version, and choose at least one artifact.';
      setErrorMessage(message);
      notifyToast({ variant: 'warning', title: 'Complete the release details', description: message });
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        softwareId,
        version: version.trim(),
        releaseNotes,
        files,
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      const selectedSoftware = software.find((item) => item.id === softwareId);
      notifyToast({
        variant: 'success',
        title: 'Version uploaded',
        description: `${selectedSoftware?.name ?? 'Your software'} v${version.trim()} was accepted and is being processed.`,
        duration: 4500,
      });
      navigate(ROUTE_PATHS.workspaceVersions);
    } catch (error: any) {
      const message = errorMessageFrom(error, 'The version could not be uploaded. Please try again.');
      setErrorMessage(message);
      notifyToast({
        variant: 'destructive',
        title: 'Version upload failed',
        description: message,
        duration: 6000,
      });
    }
  }

  return (
    <div className="sec-page">
      <SectionPageHeader
        eyebrow="Distribution · New version"
        title="Upload a version"
        description="Attach a release to an existing software listing. This does not create a new software product."
        actions={<Link to={ROUTE_PATHS.workspaceSoftwares} className="tp-btn tp-btn-secondary">My Software</Link>}
      />
      <SectionCard className="version-upload-card" title="Release details" subtitle="Only software returned for your account can be selected.">
        {softwareQuery.isLoading ? <LoadingState label="Loading your software…" /> : softwareQuery.isError ? (
          <ErrorState message="We could not load your software listings." onRetry={() => softwareQuery.refetch()} />
        ) : software.length === 0 ? (
          <EmptyState
            title="Create software first"
            message="You need an owned software listing before you can publish a version."
            action={<Link to={ROUTE_PATHS.workspaceUploadSoftware} className="tp-btn tp-btn-primary">Upload software</Link>}
          />
        ) : (
          <form className="version-upload-form" onSubmit={submit}>
            <label className="version-upload-field">
              <span>Software</span>
              <select value={softwareId} onChange={(event) => setSoftwareId(event.target.value)} required disabled={uploadMutation.isPending}>
                <option value="">Select owned software</option>
                {software.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="version-upload-field">
              <span>Version</span>
              <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="1.1.0" required disabled={uploadMutation.isPending} />
            </label>
            <label className="version-upload-field version-upload-span">
              <span>Release notes <em>Optional</em></span>
              <textarea value={releaseNotes} onChange={(event) => setReleaseNotes(event.target.value)} rows={5} placeholder="Summarize what changed in this release." disabled={uploadMutation.isPending} />
            </label>
            <label className="version-upload-field version-upload-span">
              <span>Artifacts</span>
              <span className="version-upload-file-control">
                <input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} required disabled={uploadMutation.isPending} />
                <small>Choose one or more release files. They will be scanned after upload.</small>
              </span>
            </label>
            {files.length > 0 && (
              <div className="version-upload-files version-upload-span" aria-live="polite">
                <strong>{files.length} artifact{files.length === 1 ? '' : 's'} selected</strong>
                <ul>
                  {files.map((file) => <li key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name}</li>)}
                </ul>
              </div>
            )}
            {progress > 0 && (
              <div className="version-upload-progress version-upload-span" aria-live="polite">
                <div className="version-upload-progress-label"><span>{uploadMutation.isPending ? 'Uploading artifacts' : 'Upload complete'}</span><strong>{progress}%</strong></div>
                <progress value={progress} max="100">{progress}%</progress>
              </div>
            )}
            {errorMessage && <p className="version-upload-feedback version-upload-span" role="alert">{errorMessage}</p>}
            <div className="version-upload-actions version-upload-span">
              <Link to={ROUTE_PATHS.workspaceVersions} className="tp-btn tp-btn-secondary">Cancel</Link>
              <button className="tp-btn tp-btn-primary" type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Uploading…' : 'Upload version'}
              </button>
            </div>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
