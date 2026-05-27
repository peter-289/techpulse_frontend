import { Button, Card } from '../../../../shared/ui';

type Props = {
  onBack: () => void;
};

export function CheckEmailRoutePage({ onBack }: Props) {
  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <h1 className="mb-2 text-xl font-semibold text-white">Check your inbox</h1>
        <p className="mb-4 text-sm text-slate-300">We sent password reset instructions if an account with that email exists.</p>
        <Button type="button" variant="secondary" onClick={onBack}>Back to login</Button>
      </Card>
    </div>
  );
}
