import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../API_Wrapper';
import { useSessionStore } from '../../../processes/auth/model/session-store';
import { LandingRoutePage } from '../../public/landing/ui/landing-route-page';
import { RegisterRoutePage } from '../register/ui/register-route-page';
import { LoginRoutePage } from '../login/ui/login-route-page';
import { ForgotPasswordRoutePage } from '../forgot-password/ui/forgot-password-route-page';
import { CheckEmailRoutePage } from '../check-email/ui/check-email-route-page';

export function LandingRoute() {
  const navigate = useNavigate();
  return <LandingRoutePage onRegister={() => navigate('/register')} onLogin={() => navigate('/login')} />;
}

export function RegisterRoute() {
  const navigate = useNavigate();
  return <RegisterRoutePage onBack={() => navigate('/')} onRegistered={() => navigate('/login')} />;
}

export function ForgotPasswordRoute() {
  const navigate = useNavigate();
  return <ForgotPasswordRoutePage onBack={() => navigate('/login')} onCheckEmail={() => navigate('/check-email')} />;
}

export function CheckEmailRoute() {
  const navigate = useNavigate();
  return <CheckEmailRoutePage onBack={() => navigate('/login')} />;
}

export function LoginRoute() {
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);

  const onLogin = async () => {
    try {
      const res = await authApi.get('/api/v1/users/me');
      const profile = res.data || null;
      setSession(profile);
      if (String(profile?.role || '').toLowerCase() === 'admin') navigate('/workspace/admin');
      else navigate('/workspace/overview');
    } catch {
      setSession(null);
    }
  };

  return <LoginRoutePage onBack={() => navigate('/')} onLogin={onLogin} onForgot={() => navigate('/forgot-password')} />;
}
