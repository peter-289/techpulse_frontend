import { Button, Card } from '../../../../shared/ui';

type Props = {
  onRegister: () => void;
  onLogin: () => void;
};

export function LandingRoutePage({ onRegister, onLogin }: Props) {
  return (
    <div className="mx-auto grid max-w-4xl gap-4 py-10 md:grid-cols-2">
      <Card>
        <h1 className="text-2xl font-semibold text-white">Tech Pulse Control Plane</h1>
        <p className="mt-2 text-sm text-slate-300">Manage software artifacts, access controls, and operational workflows in one workspace.</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={onRegister}>Create Account</Button>
          <Button variant="secondary" onClick={onLogin}>Sign In</Button>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-white">Platform Benefits</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>Role-aware access and lifecycle controls</li>
          <li>Secure package distribution</li>
          <li>Integrated support and analytics workflows</li>
        </ul>
      </Card>
    </div>
  );
}
