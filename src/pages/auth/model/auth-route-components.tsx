import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { httpClient as authApi } from '@/shared/api/http-client';
import { useSessionStore } from '../../../processes/auth/model/session-store';
import { ROUTE_PATHS } from '../../../app/router/route-paths';
import { LandingRoutePage } from '../../public/landing/ui/landing-route-page';
import { RegisterRoutePage } from '../register/ui/register-route-page';
import { LoginRoutePage } from '../login/ui/login-route-page';
import { ForgotPasswordRoutePage } from '../forgot-password/ui/forgot-password-route-page';
import { CheckEmailRoutePage } from '../check-email/ui/check-email-route-page';
import { PasswordResetRoutePage } from '../password-reset/ui/password-reset-route-page';
import { EmailVerificationRoutePage } from '../email-verification/ui/email-verification-route-page';

export function LandingRoute() {
  const navigate = useNavigate();
  return <LandingRoutePage onRegister={() => navigate(ROUTE_PATHS.register)} onLogin={() => navigate(ROUTE_PATHS.login)} />;
}

export function RegisterRoute() {
  const navigate = useNavigate();
  return <RegisterRoutePage onBack={() => navigate(ROUTE_PATHS.landing)} onLogin={() => navigate(ROUTE_PATHS.login)} />;
}

export function ForgotPasswordRoute() {
  const navigate = useNavigate();
  return <ForgotPasswordRoutePage onBack={() => navigate(ROUTE_PATHS.login)} onCheckEmail={() => navigate(ROUTE_PATHS.checkEmail)} />;
}

export function CheckEmailRoute() {
  const navigate = useNavigate();
  return <CheckEmailRoutePage onBack={() => navigate(ROUTE_PATHS.login)} />;
}

export function PasswordResetRoute() {
  const navigate = useNavigate();
  const { token } = useParams();
  return (
    <PasswordResetRoutePage
      token={token}
      onBack={() => navigate(ROUTE_PATHS.login)}
      onSuccess={() => navigate(ROUTE_PATHS.login, { replace: true })}
    />
  );
}

export function EmailVerificationRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? undefined;
  return (
    <EmailVerificationRoutePage
      token={token}
      onBack={() => navigate(ROUTE_PATHS.login)}
      onLogin={() => navigate(ROUTE_PATHS.login)}
    />
  );
}

export function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useSessionStore((s) => s.setSession);

  const onLogin = async () => {
    try {
      const res = await authApi.get('/api/v1/users/me');
      const profile = res.data || null;
      setSession(profile);
      const from = (location.state as { from?: string } | null)?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if (String(profile?.role || '').toLowerCase() === 'admin') {
        navigate(ROUTE_PATHS.workspaceAdmin, { replace: true });
      } else {
        navigate(ROUTE_PATHS.workspaceOverview, { replace: true });
      }
    } catch {
      setSession(null);
      throw new Error('Unable to restore the authenticated session after login.');
    }
  };

  return (
    <LoginRoutePage
      onBack={() => navigate(ROUTE_PATHS.landing)}
      onLogin={onLogin}
      onForgot={() => navigate(ROUTE_PATHS.forgotPassword)}
      onRegister={() => navigate(ROUTE_PATHS.register)}
    />
  );
}
