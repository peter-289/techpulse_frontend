import { Button, Card } from '../../../../shared/ui';

type Props = {
  onRegister: () => void;
  onLogin: () => void;
};

export function LandingRoutePage({ onRegister, onLogin }: Props) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 py-12 md:grid-cols-2">
      <Card className="tp-card p-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tp-muted">Tech Pulse Control Plane</h1>
        <p className="mt-3 text-base tp-muted max-w-prose">Tech Pulse streamlines software delivery and governance for engineering teams. Ship packages securely, manage access and approvals, and get actionable analytics across releases and support workflows.</p>

        <div className="mt-5 space-y-3 text-sm tp-muted">
          <p>Trusted by platform and security teams to reduce risk, accelerate distribution, and keep audit trails in one place.</p>
          <ul className="list-disc ml-5 mt-1">
            <li>Fine-grained role and permission controls</li>
            <li>Reliable, signed package distribution</li>
            <li>Integrated incident and support tooling</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button className="tp-btn tp-btn-primary w-full sm:w-auto" onClick={onRegister}>Create Account</Button>
          <Button className="tp-btn tp-btn-secondary w-full sm:w-auto" variant="secondary" onClick={onLogin}>Sign In</Button>
        </div>
      </Card>

      <Card className="tp-card p-6">
        <h2 className="text-lg font-semibold tp-muted">Platform Highlights</h2>
        <div className="mt-4 space-y-3 text-sm tp-muted">
          <div>
            <strong>Security-first:</strong> Immutable audit logs, signed artifacts, and policy enforcement.
          </div>
          <div>
            <strong>Observability:</strong> Release metrics, usage dashboards and post-release analytics.
          </div>
          <div>
            <strong>Developer Experience:</strong> Simple CLI integrations, fast uploads, and web-based workflows.
          </div>
        </div>

        <div className="mt-6 lp-metrics">
          <div className="lp-metric-card">
            <span>Organizations</span>
            <div className="mt-1"><strong>1,200+</strong></div>
          </div>
          <div className="lp-metric-card">
            <span>Packages served</span>
            <div className="mt-1"><strong>4M+</strong></div>
          </div>
        </div>
      </Card>
    </div>
  );
}
