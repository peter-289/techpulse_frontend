import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MailWarning, Loader2 } from 'lucide-react';
import { httpClient as api } from '@/shared/api/http-client';
import { getErrorDetail } from '@/shared/lib/api/api-error';
import { Button, Card } from '../../../../shared/ui';
import '@/pages/auth/ui/auth.css';

type Status = 'verifying' | 'success' | 'error';

type Props = {
  token?: string | undefined;
  onBack: () => void;
  onLogin: () => void;
};

export function EmailVerificationRoutePage({ token, onBack, onLogin }: Props) {
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [message, setMessage] = useState(
    token ? 'We are confirming your email address…' : 'This verification link is missing its token.',
  );
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    let alive = true;

    api
      .get('/api/v1/auth/email-verification', { params: { token } })
      .then((res) => {
        if (!alive) return;
        setStatus('success');
        setMessage(res.data?.detail || 'Your email address has been verified.');
      })
      .catch((err) => {
        if (!alive) return;
        setStatus('error');
        setMessage(
          getErrorDetail(err) ||
            'This verification link is invalid or has expired. Request a new verification email.',
        );
      });

    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="tp-auth-page">
      <div className="tp-auth-shell tp-auth-shell-simple">
        <Card className="tp-auth-card">
          <div className="tp-auth-card-top">
            <span className="tp-auth-lock">Encrypted connection</span>
            <button className="tp-auth-back tp-auth-back-inline" type="button" onClick={onBack}>
              Back to login
            </button>
          </div>

          <div className="tp-auth-heading">
            <p className="tp-auth-kicker">Email verification</p>
            <h1>
              {status === 'verifying' && 'Verifying your email'}
              {status === 'success' && 'Email verified'}
              {status === 'error' && 'Verification failed'}
            </h1>
            <p>{message}</p>
          </div>

          <div className="tp-auth-verification" role="status" aria-live="polite">
            {status === 'verifying' && <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />}
            {status === 'success' && <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />}
            {status === 'error' && <MailWarning className="h-8 w-8 text-amber-600" aria-hidden="true" />}
          </div>

          <div className="tp-auth-success-actions">
            {status === 'success' ? (
              <Button className="tp-auth-submit" type="button" onClick={onLogin}>
                Sign in
              </Button>
            ) : (
              <Button className="tp-auth-submit" type="button" variant="secondary" onClick={onBack}>
                Back to sign in
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
