import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Input, Select, Textarea } from '../../../shared/ui';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { notifyToast } from '../../../toastBus';
import { useUploadArtifactMutation } from '../model/use-upload-artifact-mutation';
import { uploadArtifactSchema, type UploadArtifactInput } from '../model/upload-artifact.schema';

const CATEGORIES = [
  'networking software',
  'cracked applications',
  'school projects',
  'entertainment software',
  'developer tools',
  'security tools',
  'others',
];

const ACCEPTED_EXTENSIONS = ['zip', 'tar', 'gz', 'rar', '7z', 'exe', 'msi', 'deb', 'rpm', 'whl'];

function titleCase(value: string) {
  return String(value)
    .split(' ')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function formatMoney(price: number, currency: string) {
  if (price <= 0) return 'Free';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(price);
}

type Props = {
  onSuccessNavigate: () => void;
};

export function UploadArtifactForm({ onSuccessNavigate }: Props) {
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const mutation = useUploadArtifactMutation(setProgress);

  const form = useForm<UploadArtifactInput>({
    resolver: zodResolver(uploadArtifactSchema),
    defaultValues: {
      name: '',
      description: '',
      category: CATEGORIES[0],
      isPublic: true,
      price: 0,
      currency: 'USD',
      version: '1.0.0',
      changelog: '',
    } as any,
  });

  const file = form.watch('file');
  const visibility = form.watch('isPublic');
  const price = Number(form.watch('price') || 0);
  const currency = form.watch('currency') || 'USD';
  const version = form.watch('version') || '1.0.0';
  const category = form.watch('category') || CATEGORIES[0];

  const summary = useMemo(
    () => ({ visibility: visibility ? 'Public' : 'Private', price: formatMoney(price, currency), version, category: titleCase(category), fileName: file?.name || 'No file selected' }),
    [visibility, price, currency, version, category, file],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setResult(null);
    setProgress(0);
    try {
      const response = await mutation.mutateAsync(values);
      setResult(response);
      notifyToast({ variant: 'success', title: 'Project uploaded', message: `${values.name} v${response.version || values.version} is ready.` });
      form.reset({ name: '', description: '', category: CATEGORIES[0], isPublic: true, price: 0, currency: 'USD', version: '1.0.0', changelog: '' } as any);
      setProgress(100);
    } catch (error: any) {
      notifyToast({ variant: 'error', title: 'Upload failed', message: error?.response?.data?.detail || 'Upload failed.' });
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <Card>
        <form className="space-y-3" onSubmit={onSubmit}>
          <h2 className="text-lg font-semibold text-white">Upload Artifact</h2>
          <Input placeholder="Project name" {...form.register('name')} />
          {form.formState.errors.name && <FeedbackMessage compact variant="warning" title="Validation" message={form.formState.errors.name.message || ''} />}

          <Textarea placeholder="Description" {...form.register('description')} />
          <Select {...form.register('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </Select>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input type="text" placeholder="Version" {...form.register('version')} />
            <Input type="number" min="0" step="0.01" placeholder="Price" {...form.register('price')} />
            <Select {...form.register('currency')}>
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...form.register('isPublic')} /> Public visibility
          </label>

          <Textarea placeholder="Changelog" {...form.register('changelog')} />

          <Input
            type="file"
            accept={ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) form.setValue('file', selected as any, { shouldValidate: true });
            }}
          />
          {form.formState.errors.file && <FeedbackMessage compact variant="warning" title="Validation" message={form.formState.errors.file.message || ''} />}

          <div className="h-2 rounded bg-slate-800"><div className="h-full rounded bg-cyan-500" style={{ width: `${progress}%` }} /></div>

          {mutation.isSuccess && <FeedbackMessage compact variant="success" title="Upload complete" message="Artifact published successfully." />}
          {mutation.isError && <FeedbackMessage compact variant="error" title="Upload failed" message="Please review fields and try again." />}

          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Uploading...' : 'Upload Project'}</Button>
            <Button type="button" variant="secondary" onClick={onSuccessNavigate}>View Project Library</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-white">Upload Summary</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          <div>Visibility: <strong>{summary.visibility}</strong></div>
          <div>Price: <strong>{summary.price}</strong></div>
          <div>Version: <strong>{summary.version}</strong></div>
          <div>Category: <strong>{summary.category}</strong></div>
          <div>File: <strong>{summary.fileName}</strong></div>
          {result?.software_id && <div>ID: <strong>{result.software_id}</strong></div>}
        </div>
      </Card>
    </div>
  );
}
