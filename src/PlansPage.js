import React from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import { SubscriptionTier, TIER_LABELS } from './constants/registryEnums';
import './PlansPage.css';

const PLANS = [
  {
    id: SubscriptionTier.STARTER,
    name: 'Starter',
    price: '$19',
    period: '/month',
    highlight: 'Best for personal research',
    features: ['Private downloads (Starter tier)', 'Basic audit log', 'Email support'],
  },
  {
    id: SubscriptionTier.PRO,
    name: 'Pro',
    price: '$49',
    period: '/month',
    highlight: 'Team-ready access',
    features: ['All Starter benefits', 'Priority scanning queue', 'Team workspace access'],
  },
  {
    id: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    price: '$129',
    period: '/month',
    highlight: 'Security + compliance',
    features: ['All Pro benefits', 'Dedicated support', 'Compliance exports'],
  },
];

export default function PlansPage({ user, onNavigate, onLogout, onSelectPlan, onBack }) {
  return (
    <DashboardLayout
      user={user}
      activePage="plans"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Subscription Plans"
      subtitle="Unlock private downloads with the right tier"
    >
      <section className="tp-dashboard-grid plans-grid">
        <article className="tp-panel tp-span-12 plans-header">
          <div>
            <h1>Choose your plan</h1>
            <p>Private packages require an active subscription. Upgrade anytime.</p>
          </div>
          <button className="tp-btn tp-btn-secondary" type="button" onClick={onBack}>
            Back to Library
          </button>
        </article>

        {PLANS.map((plan) => (
          <article key={plan.id} className={`tp-panel tp-span-4 plan-card ${plan.id}`}>
            <div className="plan-top">
              <span className="plan-pill">{plan.name}</span>
              <p className="plan-highlight">{plan.highlight}</p>
            </div>
            <div className="plan-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              className="tp-btn tp-btn-primary"
              type="button"
              onClick={() => onSelectPlan(plan)}
            >
              Select {TIER_LABELS[plan.id] || plan.name}
            </button>
          </article>
        ))}
      </section>
    </DashboardLayout>
  );
}
