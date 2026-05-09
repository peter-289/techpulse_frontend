import React, { useMemo, useState } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import { TIER_LABELS } from './constants/registryEnums';
import FeedbackMessage from './components/FeedbackMessage';
import useSoftwareRegistry from './hooks/useSoftwareRegistry';
import { errorMessageFrom, notifyToast } from './toastBus';
import './CheckoutPage.css';

function formatMoney(cents, currency = 'USD') {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

export default function CheckoutPage({
  user,
  onNavigate,
  onLogout,
  selectedPlan,
  selectedProject,
  onBack,
  onComplete,
}) {
  const { createCheckout, confirmCheckout } = useSoftwareRegistry();
  const [form, setForm] = useState({
    name: user?.full_name || user?.username || '',
    email: user?.email || '',
    company: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentSession, setPaymentSession] = useState(null);

  const planName = selectedPlan?.name || TIER_LABELS[selectedPlan?.id] || 'Selected Plan';
  const isProjectCheckout = !!selectedProject;
  const hasCheckoutTarget = isProjectCheckout || !!selectedPlan;
  const itemName = isProjectCheckout ? selectedProject.name : planName;
  const itemPrice = isProjectCheckout ? formatMoney(selectedProject.price_cents, selectedProject.currency) : selectedPlan?.price || '$0';
  const itemSubtext = isProjectCheckout ? 'Lifetime download access' : selectedPlan?.highlight || 'Subscription access';

  const isComplete = useMemo(
    () => hasCheckoutTarget && form.name.trim() && form.email.trim(),
    [form, hasCheckoutTarget]
  );

  const confirmPurchase = async () => {
    if (!isComplete) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      if (isProjectCheckout) {
        const payment = await createCheckout(selectedProject.id);
        setPaymentSession(payment);

        if (payment.checkout_url) {
          window.location.assign(payment.checkout_url);
          return;
        }

        const completed = await confirmCheckout(payment.id);
        setPaymentSession(completed);
        setFeedback({
          variant: 'success',
          title: 'Purchase complete',
          message: 'Project access is now active.',
        });
        notifyToast({
          variant: 'success',
          title: 'Access unlocked',
          message: `${selectedProject.name} is ready to download.`,
        });
        setTimeout(() => onComplete?.({ ...selectedProject, viewer_has_access: true }), 900);
      } else {
        setFeedback({
          variant: 'info',
          title: 'Plan checkout pending',
          message: 'Project purchases are wired. Plan billing needs the subscription provider adapter.',
        });
        notifyToast({
          variant: 'info',
          title: 'Provider integration needed',
          message: 'Connect the subscription provider adapter to complete plan checkout.',
        });
      }
    } catch (err) {
      const message = errorMessageFrom(err, 'Try again.');
      if (isProjectCheckout && /already own/i.test(message)) {
        setFeedback({
          variant: 'success',
          title: 'Access already active',
          message: 'You already have access to this project.',
        });
        notifyToast({
          variant: 'success',
          title: 'Access already active',
          message: `${selectedProject.name} is ready to download.`,
        });
        setTimeout(() => onComplete?.({ ...selectedProject, viewer_has_access: true }), 700);
      } else {
        setFeedback({
          variant: 'error',
          title: 'Checkout failed',
          message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasCheckoutTarget) {
    return (
      <DashboardLayout
        user={user}
        activePage="checkout"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title="Checkout"
        subtitle="Choose a project or plan before paying"
      >
        <section className="tp-dashboard-grid checkout-grid">
          <article className="tp-panel tp-span-8 checkout-empty">
            <h1>No item selected</h1>
            <p>Return to the project library or plans page and choose what you want to buy.</p>
            <div className="checkout-actions">
              <button className="tp-btn tp-btn-primary" type="button" onClick={() => onNavigate('projects')}>
                Browse projects
              </button>
              <button className="tp-btn tp-btn-secondary" type="button" onClick={() => onNavigate('plans')}>
                View plans
              </button>
            </div>
          </article>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={user}
      activePage="checkout"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Checkout"
      subtitle={isProjectCheckout ? 'Complete project purchase' : 'Secure your subscription'}
    >
      <section className="tp-dashboard-grid checkout-grid">
        <article className="tp-panel tp-span-7 checkout-form">
          <h1>Checkout</h1>
          <p>Complete your purchase for {itemName}.</p>
          {feedback && <FeedbackMessage {...feedback} onClose={() => setFeedback(null)} compact />}

          <form
            className="checkout-fields"
            onSubmit={(event) => {
              event.preventDefault();
              confirmPurchase();
            }}
          >
            <div className="checkout-steps" aria-label="Checkout progress">
              <span className="active">Review</span>
              <span className={paymentSession ? 'active' : ''}>Payment</span>
              <span className={paymentSession?.status === 'completed' ? 'active' : ''}>Access</span>
            </div>

            <label>
              Full name
              <input
                className="checkout-input"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                className="checkout-input"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label>
              Company (optional)
              <input
                className="checkout-input"
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
              />
            </label>
            <label>
              Billing address
              <input
                className="checkout-input"
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </label>

            <div className="checkout-methods" role="tablist" aria-label="Payment method">
              <button
                type="button"
                className={paymentMethod === 'card' ? 'active' : ''}
                onClick={() => setPaymentMethod('card')}
              >
                Card
              </button>
              <button
                type="button"
                className={paymentMethod === 'mobile_money' ? 'active' : ''}
                onClick={() => setPaymentMethod('mobile_money')}
              >
                Mobile money
              </button>
            </div>

            <div className="checkout-payment-box">
              <strong>{paymentMethod === 'card' ? 'Card payment' : 'Mobile money'}</strong>
              <span>
                {paymentMethod === 'card'
                  ? 'Your card fields will be mounted here by the payment provider.'
                  : 'The provider prompt will collect and verify the mobile payment.'}
              </span>
            </div>

            {paymentSession && (
              <div className="checkout-provider-note">
                <strong>Payment reference</strong>
                <span>{paymentSession.provider_reference || paymentSession.id}</span>
              </div>
            )}

            <div className="checkout-actions">
              <button className="tp-btn tp-btn-secondary" type="button" onClick={onBack}>
                {isProjectCheckout ? 'Back to projects' : 'Back to plans'}
              </button>
              <button
                className="tp-btn tp-btn-primary"
                type="submit"
                disabled={!isComplete || submitting}
              >
                {submitting ? 'Processing...' : isProjectCheckout ? 'Pay and unlock' : 'Continue'}
              </button>
            </div>
          </form>
        </article>

        <aside className="tp-panel tp-span-5 checkout-summary">
          <h2>Order summary</h2>
          <div className="summary-card">
            <strong>{itemName}</strong>
            <p>{itemPrice} {isProjectCheckout ? '' : selectedPlan?.period || ''}</p>
            <span>{itemSubtext}</span>
          </div>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{itemPrice}</span>
          </div>
          <div className="summary-line">
            <span>Tax</span>
            <span>$0</span>
          </div>
          <div className="summary-total">
            <span>Total due today</span>
            <strong>{itemPrice}</strong>
          </div>
          <div className="summary-access">
            <span>Access after payment</span>
            <strong>{isProjectCheckout ? 'Lifetime project download' : 'Plan activation'}</strong>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
