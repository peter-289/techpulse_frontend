import DashboardLayout from '../../../dashboard/DashboardLayout';
import { UploadArtifactForm } from '../../../features/upload-artifact/ui/upload-artifact-form';

type Props = {
  user: any;
  onNavigate: (target: string) => void;
  onLogout: () => void;
};

export function UploadWorkspacePage({ user, onNavigate, onLogout }: Props) {
  return (
    <DashboardLayout
      user={user}
      activePage="upload_project"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Upload Project"
      subtitle="Create and publish new software packages"
    >
      <UploadArtifactForm onSuccessNavigate={() => onNavigate('projects')} />
    </DashboardLayout>
  );
}
