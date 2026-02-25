import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from './API_Wrapper';
import './SupportChatPage.css';
import FeedbackMessage from './components/FeedbackMessage';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMarkdown(text) {
  const raw = String(text || '');
  const blocks = raw.split('```');

  return blocks.map((block, idx) => {
    if (idx % 2 === 1) {
      return (
        <pre key={`code-${idx}`} className="tp-chat-code">
          <code>{block.trim()}</code>
        </pre>
      );
    }

    const lines = block.split('\n');
    return lines.map((line, lineIdx) => {
      const key = `line-${idx}-${lineIdx}`;
      if (!line.trim()) return <br key={key} />;
      if (line.startsWith('### ')) return <h4 key={key}>{line.replace(/^###\s/, '')}</h4>;
      if (line.startsWith('## ')) return <h3 key={key}>{line.replace(/^##\s/, '')}</h3>;
      if (line.startsWith('# ')) return <h2 key={key}>{line.replace(/^#\s/, '')}</h2>;
      return <p key={key}>{line}</p>;
    });
  });
}

export default function SupportChatPage({ isOpen, onOpen, onClose, contextPage = 'dashboard' }) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messageFeedRef = useRef(null);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/support-chat/messages');
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const feed = messageFeedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [history, isOpen]);

  const transcriptRows = useMemo(
    () =>
      history.flatMap((entry) => [
        {
          key: `${entry.id}-user`,
          role: 'user',
          text: entry.user_message,
          timestamp: formatTime(entry.created_at),
        },
        {
          key: `${entry.id}-assistant`,
          role: 'assistant',
          text: entry.assistant_message,
          timestamp: formatTime(entry.created_at),
        },
      ]),
    [history]
  );

  const onSend = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      const contextualMessage = `[page:${contextPage}] ${message}`;
      await api.post('/api/v1/support-chat/messages', { message: contextualMessage });
      setMessage('');
      await loadHistory();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className="tp-chat-launcher" onClick={isOpen ? onClose : onOpen} type="button" aria-label="Toggle AI assistant chat">
        <span className="tp-chat-launcher-icon">AI</span>
        <span className="tp-chat-launcher-text">Assistant</span>
      </button>

      {isOpen && <button type="button" className="tp-chat-backdrop" onClick={onClose} aria-label="Close AI assistant" />}

      <aside className={`tp-chat-panel ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} onMouseDown={(event) => event.stopPropagation()}>
        <header className="tp-chat-header">
          <div>
            <h2>AI Assistant</h2>
            <p>Context: {contextPage}</p>
          </div>
          <div className="tp-chat-header-actions">
            <button className="tp-chat-icon-btn" type="button" onClick={loadHistory} disabled={loading}>
              {loading ? '...' : 'Refresh'}
            </button>
            <button className="tp-chat-icon-btn" type="button" onClick={onClose} aria-label="Close chat">
              Close
            </button>
          </div>
        </header>

        <div className="tp-chat-feed" ref={messageFeedRef}>
          {transcriptRows.length === 0 && (
            <div className="tp-chat-empty">
              Ask about project metadata, API usage, docs, or summarize package descriptions.
            </div>
          )}

          {transcriptRows.map((row) => (
            <article
              key={row.key}
              className={`tp-chat-row ${row.role === 'user' ? 'tp-chat-row-user' : 'tp-chat-row-assistant'}`}
            >
              <div className={`tp-chat-bubble ${row.role === 'user' ? 'tp-chat-bubble-user' : 'tp-chat-bubble-assistant'}`}>
                <div className="tp-chat-markdown">{renderMarkdown(row.text)}</div>
                <time>{row.timestamp}</time>
              </div>
            </article>
          ))}
        </div>

        <form className="tp-chat-compose" onSubmit={onSend}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="tp-chat-input"
          />
          <button className="tp-chat-send-btn" type="submit" disabled={sending || !message.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        {error && (
          <div className="tp-chat-error">
            <FeedbackMessage variant="error" title="Message failed" message={error} compact />
          </div>
        )}
      </aside>
    </>
  );
}
