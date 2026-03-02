import { useEffect, useState } from 'react';
import './LoginPage.css';
import { authApi } from './API_Wrapper';
import qs from 'qs';
import FeedbackMessage from './components/FeedbackMessage';

export default function LoginPage({ onBack, onLogin, onForgot }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const showFeedback = (message, variant = 'error', title = 'Sign in failed') => {
    setFeedback({ message, variant, title });
  };

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), 5200);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      await authApi.post(
        '/api/v1/auth/login',
        qs.stringify({
          username: form.username,
          password: form.password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      showFeedback('Welcome back! Redirecting to your workspace.', 'success', 'Authentication successful');
      onLogin?.();
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Login failed.';
      showFeedback(message, 'error', 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tp-auth-page">
      {feedback && (
        <FeedbackMessage
          floating
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <div className="tp-auth-shell">
        <aside className="tp-auth-panel">
          <span className="tp-auth-badge">Secure Access</span>
          <h1>Sign in to your workspace</h1>
          <p>Manage software projects, resources, and support flows in one place.</p>
          <ul>
            <li>Role-aware dashboard access</li>
            <li>Session-protected authentication</li>
            <li>Integrated operational tooling</li>
          </ul>
        </aside>

        <form className="tp-auth-form" onSubmit={handleSubmit}>
          <h2>Sign In</h2>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <button
            className="tp-btn tp-btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="tp-auth-links">
            <button
              type="button"
              className="tp-auth-link"
              onClick={() => onForgot?.()}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="button"
            className="tp-btn tp-btn-secondary"
            onClick={onBack}
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
}
