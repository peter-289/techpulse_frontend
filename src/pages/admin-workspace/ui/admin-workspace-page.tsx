import AdminPage from '../../../AdminPage';

type Props = {
  user: any;
  onBack: () => void;
  onNavigate: (target: string) => void;
};

export function AdminWorkspacePage({ user, onBack, onNavigate }: Props) {
  return <AdminPage user={user} onBack={onBack} onNavigate={onNavigate} />;
}
