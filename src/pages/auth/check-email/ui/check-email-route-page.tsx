import { Button, Card } from '../../../../shared/ui';
import '@/pages/auth/ui/auth.css';

type Props = {
  onBack: () => void;
};

export function CheckEmailRoutePage({ onBack }: Props) {
  return (
    <div className="tp-auth-page">
      <div className="tp-auth-shell tp-auth-shell-simple">
        <Card className="tp-auth-card">
          <div className="tp-auth-card-top">
            <span className="tp-auth-lock">Encrypted connection</span>
          </div>
          <div className="tp-auth-heading">
            <p className="tp-auth-kicker">Check your email</p>
            <h1>Check your inbox</h1>
            <p>We sent password reset instructions if an account with that email exists.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onBack}>Back to login</Button>
        </Card>
      </div>
    </div>
  );
}
