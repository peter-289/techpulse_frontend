import { useNavigate } from 'react-router-dom';
import { SoftwareUploadPage } from '../../../features/upload-software/ui/upload-software-page';

export function UploadWorkspacePage() {
  const navigate = useNavigate();
  return <SoftwareUploadPage onSuccessNavigate={() => navigate('/workspace/softwares')} />;
}
