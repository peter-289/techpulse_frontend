// DEPRECATED: legacy JSX page kept for reference.
// Preferred implementation: use the modern TypeScript route under `src/pages/auth/...`.
// This file will be kept as a reference during the style consolidation process.
import React, { useState } from 'react';
import api from './API_Wrapper';
import qs from 'qs';
import FeedbackMessage from './components/FeedbackMessage';
import Button from './shared/ui/button/Button';
import Input from './shared/ui/input/Input';

export default function ForgotPasswordPage({ onBack, onCheckEmail }){
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try{
      const res = await api.post('/api/v1/auth/password-reset/requests', qs.stringify({ email }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      setFeedback({
        variant: 'success',
        title: 'Reset link sent',
        message: res.data.detail || 'If the e-mail is registered, you will receive a reset link.',
      });
      onCheckEmail?.();
    }catch(err){
      setFeedback({
        variant: 'error',
        title: 'Request failed',
        message: err.response?.data?.detail || 'Failed to submit.',
      });
    }finally{ setLoading(false); }
  }

  return (
    <div style={{maxWidth:560,margin:'2rem auto'}}>
      <h2>Forgot your password?</h2>
      <p>Enter the email address for your account and we'll send a password reset link.</p>
      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:8}}>
        <Input name="email" type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
          <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</Button>
        </div>
      </form>
      {feedback && (
        <div style={{ marginTop: 12 }}>
          <FeedbackMessage
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        </div>
      )}
    </div>
  )
}
