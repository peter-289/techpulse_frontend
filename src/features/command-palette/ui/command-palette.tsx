import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../processes/auth/model/session-store';
import { workspaceNavItems } from '../../../shared/navigation/workspace-navigation';
import { useUiStore } from '../../../shared/store/ui-store';
import './command-palette.css';

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setHelpCentreOpen = useUiStore((s) => s.setHelpCentreOpen);
  const user = useSessionStore((s) => s.user);
  const isAdmin = String((user as any)?.role || '').toLowerCase() === 'admin';

  const items = workspaceNavItems.filter((item) => !item.adminOnly || isAdmin);

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
        <Command.Group heading="Workspace" className="cp-group">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Command.Item
                key={item.id}
                className="cp-item"
                onSelect={() => {
                  if (item.action === 'help') {
                    setHelpCentreOpen(true);
                  } else if (item.to) {
                    navigate(item.to);
                  }
                  setOpen(false);
                }}
              >
                <Icon size={16} />
                {item.label}
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
