import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../../shared/store/ui-store';

const entries = [
  { label: 'Workspace Overview', path: '/workspace/overview' },
  { label: 'Software Registry', path: '/workspace/software-registry' },
  { label: 'Project Library', path: '/workspace/project-library' },
  { label: 'Legacy Resources', path: '/workspace/resources' },
  { label: 'Legacy Projects', path: '/workspace/projects' },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Palette">
      <Command.Input placeholder="Search workflows and modules" />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Navigation">
          {entries.map((entry) => (
            <Command.Item
              key={entry.path}
              onSelect={() => {
                navigate(entry.path);
                setOpen(false);
              }}
            >
              {entry.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
