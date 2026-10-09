import { Building2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUpdateUserProfile } from '@/entities/admin/api/admin.mutations';
import { useSessionStore } from '@/processes/auth/model/session-store';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/ui/button/button';
import { Segmented } from '@/shared/ui';
import { Input } from '@/shared/ui/input/input';
import { Select } from '@/shared/ui/select/select';
import { useThemeStore } from '@/shared/store/theme-store';
import {
  SectionCard,
  SectionNote,
  SectionPageHeader,
} from './section-page';

type NotificationPref = {
  id: string;
  label: string;
  hint: string;
};

const notificationPrefs: NotificationPref[] = [
  { id: 'email-digest', label: 'Email digest', hint: 'A weekly summary of uploads, scans and subscriber activity.' },
  { id: 'security-alerts', label: 'Security alerts', hint: 'Immediate notice when a scan flags a threat or quarantine is triggered.' },
  { id: 'product-updates', label: 'Product updates', hint: 'Release notes and new feature announcements from the TechPulse team.' },
];

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toast = useToast();
  const user = useSessionStore((s) => s.user);
  const setSession = useSessionStore((s) => s.setSession);
  const updateProfile = useUpdateUserProfile();

  const userId = String((user as { id?: unknown } | null)?.id ?? '');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('contributor');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    'email-digest': true,
    'security-alerts': true,
    'product-updates': false,
  });

  useEffect(() => {
    if (!user) return;
    setDisplayName(String((user as { full_name?: unknown }).full_name ?? (user as { username?: unknown }).username ?? ''));
    setEmail(String((user as { email?: unknown }).email ?? ''));
    setRole(String((user as { role?: unknown }).role ?? 'contributor'));
  }, [user]);

  const togglePref = (id: string, checked: boolean) => {
    setPrefs((previous) => ({ ...previous, [id]: checked }));
  };

  const onSave = async () => {
    try {
      if (userId) {
        await updateProfile.mutateAsync({ userId, fullName: displayName, email, role });
        setSession({ ...(user ?? {}), full_name: displayName, email, role });
      }
      toast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Your workspace preferences have been updated.',
      });
    } catch {
      toast({
        variant: 'error',
        title: 'Could not save settings',
        description: 'Please try again in a moment.',
      });
    }
  };

  return (
    <div className="sec-page">
      <SectionPageHeader
        eyebrow="Account · Settings"
        title="Settings"
        description="Your profile, appearance and notification preferences — applied across the whole console."
        actions={
          <Button variant="primary" onClick={onSave} disabled={updateProfile.isPending}>
            <Save size={16} />
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      <div className="sec-grid sec-cols-2">
        <SectionCard title="Profile" subtitle="Shown to teammates in the audit trail">
          <div className="sec-form-grid">
            <div className="sec-field">
              <label htmlFor="settings-name">Display name</label>
              <Input
                id="settings-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div className="sec-field">
              <label htmlFor="settings-email">Email</label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>
          <div className="sec-field">
            <label htmlFor="settings-role">Role</label>
            <Select
              id="settings-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="owner">Workspace owner</option>
              <option value="admin">Catalog administrator</option>
              <option value="contributor">Contributor</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>
        </SectionCard>

        <SectionCard title="Appearance" subtitle="Theme applies to every TechPulse page">
          <div className="sec-field">
            <span className="sec-field-label">Theme</span>
            <Segmented
              className="sec-seg"
              ariaLabel="Color theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
            <p className="sec-hint">Switching here updates the global theme — the header toggle does the same.</p>
          </div>

          <div className="sec-field">
            <span className="sec-field-label">Notifications</span>
            {notificationPrefs.map((pref) => (
              <div className="sec-check" key={pref.id}>
                <input
                  id={`notif-${pref.id}`}
                  type="checkbox"
                  checked={prefs[pref.id] ?? false}
                  onChange={(event) => togglePref(pref.id, event.target.checked)}
                />
                <label className="sec-check-label" htmlFor={`notif-${pref.id}`}>
                  <span>{pref.label}</span>
                  <span className="sec-hint">{pref.hint}</span>
                </label>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Workspace" subtitle="Plan and infrastructure context">
        <div className="sec-grid sec-cols-4">
          <div className="sec-field">
            <span className="sec-field-label">Workspace</span>
            <p className="sec-hint">Acme Platforms</p>
          </div>
          <div className="sec-field">
            <span className="sec-field-label">Plan</span>
            <p className="sec-hint">Pro</p>
          </div>
          <div className="sec-field">
            <span className="sec-field-label">Region</span>
            <p className="sec-hint">eu-west-1</p>
          </div>
          <div className="sec-field">
            <span className="sec-field-label">Seats</span>
            <p className="sec-hint">8 of 25 used</p>
          </div>
        </div>
        <SectionNote icon={<Building2 size={16} />}>
          <p>
            <strong>Need more?</strong> Upgrade from the Pro to Enterprise plan to unlock runtime
            sandboxing, SBOM export and priority scanning.
          </p>
        </SectionNote>
      </SectionCard>
    </div>
  );
}
