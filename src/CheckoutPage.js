import React, { useMemo, useState } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import { TIER_LABELS } from './constants/registryEnums';
import './CheckoutPage.css';

export default function CheckoutPage({ user, onNavigate, onLogout, selectedPlan, onBack }) {
  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    card: '',
    expiry: '',
    cvc: '',
    company: '',
    address: '',
  });
  const planName = selectedPlan?.name || TIER_LABELS[selectedPlan?.id] || 'Selected Plan';

  const isComplete = useMemo(
    () => form.name && form.email && form.card && form.expiry && form.cvc,
    [form]
  );

  return (
    <DashboardLayout
      user={user}
      activePage="checkout"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Checkout"
      subtitle="Secure your subscription"
    >
      <section className="tp-dashboard-grid checkout-grid">
        <article className="tp-panel tp-span-7 checkout-form">
          <h1>Checkout</h1>
          <p>Complete your subscription for {planName}.</p>

          <form className="checkout-fields">
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

            <div className="checkout-card-grid">
              <label>
                Card number
                <input
                  className="checkout-input"
                  value={form.card}
                  onChange={(event) => setForm((prev) => ({ ...prev, card: event.target.value }))}
                  placeholder="1234 5678 9012 3456"
                />
              </label>
              <label>
                Expiry
                <input
                  className="checkout-input"
                  value={form.expiry}
                  onChange={(event) => setForm((prev) => ({ ...prev, expiry: event.target.value }))}
                  placeholder="MM/YY"
                />
              </label>
              <label>
                CVC
                <input
                  className="checkout-input"
                  value={form.cvc}
                  onChange={(event) => setForm((prev) => ({ ...prev, cvc: event.target.value }))}
                  placeholder="123"
                />
              </label>
            </div>

            <div className="checkout-actions">
              <button className="tp-btn tp-btn-secondary" type="button" onClick={onBack}>
                Back to plans
              </button>
              <button className="tp-btn tp-btn-primary" type="button" disabled={!isComplete}>
                Confirm purchase
              </button>
            </div>
          </form>
        </article>

        <aside className="tp-panel tp-span-5 checkout-summary">
          <h2>Order summary</h2>
          <div className="summary-card">
            <strong>{planName}</strong>
            <p>{selectedPlan?.price || '$0'} {selectedPlan?.period || ''}</p>
            <span>{selectedPlan?.highlight || 'Subscription access'}</span>
          </div>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{selectedPlan?.price || '$0'}</span>
          </div>
          <div className="summary-line">
            <span>Tax</span>
            <span>$0</span>
          </div>
          <div className="summary-total">
            <span>Total due today</span>
            <strong>{selectedPlan?.price || '$0'}</strong>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
