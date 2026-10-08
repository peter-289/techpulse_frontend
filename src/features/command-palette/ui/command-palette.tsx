import { Command } from 'cmdk';
import { Compass, Gauge, LayoutDashboard, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../../shared/store/ui-store';
import './command-palette.css';

const entries = [
  { label: 'Dashboard', path: '/workspace/overview', icon: Gauge },
  { label: 'My Software', path: '/workspace/softwares', icon: LayoutDashboard },
  { label: 'Discover', path: '/workspace/discover', icon: Compass },
  { label: 'Upload Software', path: '/workspace/upload-software', icon: UploadCloud },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Palette"
      className="cp-root"
      overlayClassName="cp-overlay"
      contentClassName="cp-dialog"
    >
      <Command.Input className="cp-input" placeholder="Search workspaces, software and modules…" />
      <Command.List className="cp-list">
        <Command.Empty className="cp-empty">No results found.</Command.Empty>
        <Command.Group heading="Navigation" className="cp-group">
          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <Command.Item
                key={entry.path}
                className="cp-item"
                onSelect={() => {
                  navigate(entry.path);
                  setOpen(false);
                }}
              >
                <Icon size={16} />
                {entry.label}
              </Command.Item>
            );
          })}
        </Command.Group>
      </Command.List>
      <div className="cp-hints">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> to navigate
        </span>
        <span>
          <kbd>Enter</kbd> to open
        </span>
        <span>
          <kbd>Esc</kbd> to close
        </span>
      </div>
    </Command.Dialog>
  );
}
