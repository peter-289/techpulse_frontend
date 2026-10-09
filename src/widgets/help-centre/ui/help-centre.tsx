import { LifeBuoy, MessageSquare, Send, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSendSupportMessage } from '@/entities/support/api/support.mutations';
import { useSupportMessages } from '@/entities/support/api/support.queries';
import { cn } from '../../../shared/lib/cn';
import { replyFor } from '../../../shared/store/help-messages-store';
import { useUiStore } from '../../../shared/store/ui-store';
import './help-centre.css';

type DisplayMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  createdAt: number;
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageItem({
  message,
  onRemove,
}: {
  message: DisplayMessage;
  onRemove: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className={cn('hc-msg', message.role === 'user' && 'user')}>
      <div className="hc-msg-head">
        <span className="hc-msg-author">
          {message.role === 'assistant' ? 'Assistant' : 'You'}
        </span>
        <time className="hc-msg-time" dateTime={new Date(message.createdAt).toISOString()}>
          {formatTime(message.createdAt)}
        </time>
        <div className="hc-msg-actions">
          <button
            type="button"
            className="hc-msg-action"
            aria-label="Delete message"
            aria-expanded={confirming}
            title="Delete message"
            onClick={() => setConfirming(true)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p className="hc-msg-text">{message.text}</p>

      {confirming && (
        <div className="hc-msg-confirm">
          <span>Delete this message?</span>
          <button
            type="button"
            className="danger"
            onClick={() => {
              onRemove(message.id);
              setConfirming(false);
            }}
          >
            Delete
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}

let localSequence = 0;
const localId = () => `local_${Date.now().toString(36)}_${(localSequence++).toString(36)}`;

export function HelpCentre() {
  const open = useUiStore((s) => s.helpCentreOpen);
  const setOpen = useUiStore((s) => s.setHelpCentreOpen);

  const historyQuery = useSupportMessages(100);
  const sendMutation = useSendSupportMessage();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!historyQuery.data) return;
    setMessages(
      historyQuery.data.map((message) => ({
        id: message.id,
        role: message.role === 'assistant' || message.role === 'bot' ? 'assistant' : 'user',
        text: message.content,
        createdAt: message.created_at ? new Date(message.created_at).getTime() : Date.now(),
      })),
    );
  }, [historyQuery.data]);

  useEffect(() => {
    if (!open) return undefined;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    return () => trigger?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    const list = listRef.current;
    if (list && open) list.scrollTop = list.scrollHeight;
  }, [messages.length, open]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const optimistic: DisplayMessage = { id: localId(), role: 'user', text, createdAt: Date.now() };
    setMessages((previous) => [...previous, optimistic]);
    setDraft('');

    try {
      const reply = await sendMutation.mutateAsync(text);
      setMessages((previous) => [
        ...previous,
        {
          id: reply.id,
          role: 'assistant',
          text: reply.content || replyFor(text),
          createdAt: reply.created_at ? new Date(reply.created_at).getTime() : Date.now(),
        },
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: localId(),
          role: 'assistant',
          text: replyFor(text),
          createdAt: Date.now(),
        },
      ]);
    }
  };

  const removeMessage = (id: string) => {
    setMessages((previous) => previous.filter((message) => message.id !== id));
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="hc-overlay"
          onClick={() => setOpen(false)}
          aria-label="Close help centre"
        />
      )}

      <aside
        className={cn('hc-panel', open && 'is-open')}
        inert={!open}
        aria-hidden={!open}
        aria-label="TechPulse Assistant"
      >
        <header className="hc-head">
          <div>
            <h2 className="hc-head-title">TechPulse Assistant</h2>
            <p className="hc-head-sub">Guidance for your workspace</p>
          </div>
          <button
            type="button"
            className="hc-close"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            title="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div
          className="hc-messages"
          ref={listRef}
          role="log"
          aria-live="polite"
          aria-label="Conversation with the assistant"
        >
          {historyQuery.isLoading && messages.length === 0 ? (
            <div className="hc-empty">
              <p className="hc-empty-title">Loading conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="hc-empty">
              <span className="hc-empty-icon" aria-hidden="true">
                <MessageSquare size={20} />
              </span>
              <p className="hc-empty-title">No messages yet</p>
              <p className="hc-empty-text">
                Ask how to upload, verify or distribute software — replies appear here.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem key={message.id} message={message} onRemove={removeMessage} />
            ))
          )}
        </div>

        <form className="hc-composer" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            aria-label="Type a message"
            maxLength={600}
          />
          <button
            type="submit"
            className="hc-send"
            disabled={!draft.trim() || sendMutation.isPending}
            aria-label="Send message"
            title="Send"
          >
            <Send size={17} />
          </button>
        </form>
      </aside>
    </>
  );
}

export function HelpFab() {
  const open = useUiStore((s) => s.helpCentreOpen);
  const setOpen = useUiStore((s) => s.setHelpCentreOpen);

  if (open) return null;

  return (
    <button
      type="button"
      className="hc-fab"
      onClick={() => setOpen(true)}
      aria-label="Open Help Centre"
      title="Help Centre — ask the TechPulse assistant"
    >
      <LifeBuoy size={22} />
    </button>
  );
}
