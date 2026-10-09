import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../../shared/ui/button/button';

function describe(error: unknown): { title: string; message: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`,
      message: typeof error.data === 'string' ? error.data : 'The page could not be loaded.',
    };
  }
  if (error instanceof Error) {
    return { title: 'Something went wrong', message: error.message };
  }
  return { title: 'Something went wrong', message: 'An unexpected error occurred.' };
}

/** Route-level error boundary attached via `errorElement`. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { title, message } = describe(error);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-blue-600/10 bg-white/80 p-6 text-center shadow-[0_18px_42px_rgba(15,23,42,0.09)] backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate('/workspace/overview')}>
            <RotateCcw size={15} /> Workspace home
          </Button>
        </div>
      </div>
    </div>
  );
}
