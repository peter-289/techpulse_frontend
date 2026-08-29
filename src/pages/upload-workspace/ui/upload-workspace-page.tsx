import DashboardLayout from '../../../dashboard/DashboardLayout';
import { SoftwareUploadPage } from '../../../features/upload-software/ui/upload-software-page';

type Props = {
  user: any;
  onNavigate: (target: string) => void;
  onLogout: () => void;     
};

export function UploadWorkspacePage({ user, onNavigate, onLogout }: Props) {
  return (
    <DashboardLayout
      user={user}
      activePage="upload_software"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Upload Software"
      subtitle="Create and publish new software packages"
    >
      <SoftwareUploadPage onSuccessNavigate={() => onNavigate('softwares')} />
    </DashboardLayout>
  );
}
