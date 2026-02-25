import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import FeedbackMessage from './components/FeedbackMessage';
import './APIDocs.css';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseInlineCode(text) {
  const chunks = String(text || '').split(/(`[^`]+`)/g);
  return chunks.map((chunk, index) => {
    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      return <code key={`inline-${index}`}>{chunk.slice(1, -1)}</code>;
    }
    return <React.Fragment key={`inline-${index}`}>{chunk}</React.Fragment>;
  });
}

function parseMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  const headings = [];

  let paragraph = [];
  let list = [];
  let code = null;
  let table = null;
  let callout = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: [...list] });
      list = [];
    }
  };

  const flushTable = () => {
    if (table && table.rows.length) {
      blocks.push({ type: 'table', headers: table.headers, rows: table.rows });
    }
    table = null;
  };

  const flushCallout = () => {
    if (callout) {
      blocks.push({
        type: 'callout',
        tone: callout.tone,
        title: callout.title,
        body: callout.body.join('\n').trim(),
      });
      callout = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    const codeStart = line.match(/^```(.*)$/);
    if (codeStart) {
      flushParagraph();
      flushList();
      flushTable();
      flushCallout();
      if (!code) {
        code = { lang: codeStart[1].trim() || 'text', lines: [] };
      } else {
        blocks.push({ type: 'code', lang: code.lang, code: code.lines.join('\n') });
        code = null;
      }
      continue;
    }

    if (code) {
      code.lines.push(line);
      continue;
    }

    const calloutStart = line.match(/^>\s*\[!(INFO|WARNING|ERROR|SUCCESS)\]\s*(.*)$/i);
    if (calloutStart) {
      flushParagraph();
      flushList();
      flushTable();
      flushCallout();
      callout = {
        tone: calloutStart[1].toLowerCase(),
        title: calloutStart[2] || calloutStart[1],
        body: [],
      };
      continue;
    }

    if (callout && /^>\s?/.test(line)) {
      callout.body.push(line.replace(/^>\s?/, ''));
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushTable();
      flushCallout();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(text);
      blocks.push({ type: 'heading', level, text, id });
      if (level >= 2 && level <= 3) {
        headings.push({ level, text, id });
      }
      continue;
    }

    if (/^\|(.+)\|$/.test(line.trim())) {
      flushParagraph();
      flushList();
      flushCallout();
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((item) => item.trim());
      if (!table) {
        table = { headers: cells, rows: [] };
      } else if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
        table.rows.push(cells);
      }
      continue;
    }

    const listMatch = line.match(/^-\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      flushTable();
      flushCallout();
      list.push(listMatch[1]);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushTable();
      flushCallout();
      continue;
    }

    paragraph.push(line.trim());
  }

  if (code) {
    blocks.push({ type: 'code', lang: code.lang, code: code.lines.join('\n') });
  }
  flushParagraph();
  flushList();
  flushTable();
  flushCallout();

  return { blocks, headings };
}

function findFirstDoc(config, versionId) {
  const section = (config?.sections || []).find((sec) => sec.items?.length);
  if (!section) return null;
  const item = section.items[0];
  return { ...item, version: versionId, sectionId: section.id, sectionLabel: section.label };
}

function getDocEntries(config, versionId) {
  const entries = [];
  (config?.sections || []).forEach((section) => {
    (section.items || []).forEach((item) => {
      entries.push({
        ...item,
        version: versionId,
        sectionId: section.id,
        sectionLabel: section.label,
        fetchPath: `/docs/${versionId}/${item.path}`,
      });
    });
  });
  return entries;
}

function extractSummary(markdown) {
  const clean = String(markdown || '').replace(/\r/g, '');
  const match = clean.match(/^#\s+.*\n\n([^\n]+)/m);
  return match ? match[1].trim() : '';
}

function extractLastUpdated(markdown) {
  const match = String(markdown || '').match(/##\s+Last Updated\s*\n\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  return match ? match[1] : 'N/A';
}

function highlight(text, query) {
  const source = String(text || '');
  const term = String(query || '').trim();
  if (!term) return source;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return source.split(regex).map((part, idx) => (
    regex.test(part) ? <mark key={`m-${idx}`}>{part}</mark> : <React.Fragment key={`p-${idx}`}>{part}</React.Fragment>
  ));
}

function SnippetTabs({ slug }) {
  const [lang, setLang] = useState('curl');
  const snippets = {
    curl: `curl -X GET https://api.example.com/v2/${slug || 'projects'} \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
    javascript: `const response = await fetch('https://api.example.com/v2/${slug || 'projects'}', {\n  headers: { Authorization: 'Bearer YOUR_API_KEY' }\n});\nconst data = await response.json();`,
    python: `import requests\nresponse = requests.get('https://api.example.com/v2/${slug || 'projects'}', headers={'Authorization': 'Bearer YOUR_API_KEY'})\nprint(response.json())`,
    go: `req, _ := http.NewRequest("GET", "https://api.example.com/v2/${slug || 'projects'}", nil)\nreq.Header.Set("Authorization", "Bearer YOUR_API_KEY")`,
  };

  return (
    <section className="docs-snippet-tabs">
      <div className="docs-snippet-head">
        <h3>SDK Snippets</h3>
        <div className="docs-segment" role="tablist" aria-label="Code snippet language selector">
          {Object.keys(snippets).map((item) => (
            <button
              key={item}
              type="button"
              className={lang === item ? 'active' : ''}
              onClick={() => setLang(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <pre className="docs-code-block"><code>{snippets[lang]}</code></pre>
    </section>
  );
}

function ApiPlayground({ activeDoc }) {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/v2/projects');
  const [token, setToken] = useState('');
  const [body, setBody] = useState('{\n  "name": "My Project",\n  "visibility": "public"\n}');
  const [response, setResponse] = useState('');

  const runRequest = () => {
    const mock = {
      request_id: `req_${Math.random().toString(36).slice(2, 10)}`,
      method,
      endpoint,
      status: 200,
      message: `Mock response for ${activeDoc?.title || 'documentation endpoint'}`,
      time: new Date().toISOString(),
    };
    setResponse(JSON.stringify(mock, null, 2));
  };

  return (
    <section className="docs-playground">
      <div className="docs-playground-head">
        <h3>API Playground</h3>
        <p>Interactive request builder for quick endpoint testing.</p>
      </div>
      <div className="docs-playground-grid">
        <label>
          Method
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option>GET</option>
            <option>POST</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
        </label>
        <label>
          Endpoint
          <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
        </label>
      </div>
      <label>
        Bearer token
        <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="sk_live_..." />
      </label>
      <label>
        JSON Body
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={7} />
      </label>
      <div className="docs-playground-actions">
        <button className="tp-btn tp-btn-primary" type="button" onClick={runRequest}>Run Request</button>
      </div>
      {response && (
        <pre className="docs-code-block docs-playground-output"><code>{response}</code></pre>
      )}
    </section>
  );
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="docs-code-wrap">
      <div className="docs-code-top">
        <span>{lang || 'text'}</span>
        <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="docs-code-block"><code>{code}</code></pre>
    </div>
  );
}

export default function APIDocs({ user, onNavigate, onLogout, activePage = 'developers' }) {
  const [config, setConfig] = useState(null);
  const [version, setVersion] = useState('v2');
  const [activeDoc, setActiveDoc] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [activeHeading, setActiveHeading] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [helpful, setHelpful] = useState(null);

  const searchInputRef = useRef(null);
  const articleRef = useRef(null);
  const docCacheRef = useRef(new Map());
  const indexCacheRef = useRef(new Map());

  const versions = useMemo(() => config?.versions || [], [config]);
  const versionMeta = useMemo(() => versions.find((item) => item.id === version), [versions, version]);

  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const toc = parsed.headings;

  const loadDoc = useCallback(async (doc) => {
    if (!doc) return;
    const key = `${doc.version}/${doc.path}`;
    const fetchPath = `/docs/${doc.version}/${doc.path}`;
    setLoading(true);
    setError('');
    try {
      let content = docCacheRef.current.get(key);
      if (!content) {
        const res = await fetch(fetchPath);
        if (!res.ok) throw new Error('Failed to load documentation');
        content = await res.text();
        docCacheRef.current.set(key, content);
      }
      setMarkdown(content);
      setActiveDoc(doc);
      setSearch('');
      setSearchResults([]);
      setHelpful(null);
      setMobileNavOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to load documentation page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const res = await fetch('/docs/sidebar.json');
        if (!res.ok) throw new Error('Unable to load docs sidebar.');
        const sidebar = await res.json();
        if (!mounted) return;
        setConfig(sidebar);
        const firstVersion = sidebar.defaultVersion || sidebar.versions?.[0]?.id || 'v2';
        setVersion(firstVersion);
        const firstDoc = findFirstDoc(sidebar, firstVersion);
        if (firstDoc) {
          loadDoc(firstDoc);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to initialize docs.');
        setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [loadDoc]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      const editable = target?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
      if (event.key === '/' && !editable) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        setMobileTocOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!toc.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveHeading(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
    );

    const root = articleRef.current;
    if (!root) return undefined;
    toc.forEach((item) => {
      const element = root.querySelector(`#${item.id}`);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [toc, markdown]);

  const switchVersion = async (nextVersion) => {
    setVersion(nextVersion);
    setSearch('');
    setSearchResults([]);
    const firstDoc = findFirstDoc(config, nextVersion);
    if (firstDoc) {
      await loadDoc(firstDoc);
    }
  };

  const runSearch = useCallback(async (query, activeVersion) => {
    const text = String(query || '').trim().toLowerCase();
    if (!text || !config) {
      setSearchResults([]);
      return;
    }

    let index = indexCacheRef.current.get(activeVersion);
    if (!index) {
      const entries = getDocEntries(config, activeVersion);
      const docs = await Promise.all(
        entries.map(async (entry) => {
          const key = `${entry.version}/${entry.path}`;
          let content = docCacheRef.current.get(key);
          if (!content) {
            const res = await fetch(entry.fetchPath);
            if (!res.ok) return null;
            content = await res.text();
            docCacheRef.current.set(key, content);
          }
          return {
            ...entry,
            content,
            summary: extractSummary(content),
          };
        })
      );
      index = docs.filter(Boolean);
      indexCacheRef.current.set(activeVersion, index);
    }

    const results = index
      .map((doc) => {
        const haystack = `${doc.title}\n${doc.summary}\n${doc.content}`.toLowerCase();
        const found = haystack.indexOf(text);
        if (found < 0) return null;
        const snippet = doc.content.replace(/\s+/g, ' ').slice(Math.max(0, found - 80), found + 140);
        return { doc, snippet };
      })
      .filter(Boolean)
      .slice(0, 10);

    setSearchResults(results);
  }, [config]);

  useEffect(() => {
    runSearch(search, version);
  }, [search, version, runSearch]);

  const sections = useMemo(() => config?.sections || [], [config]);
  const breadcrumbs = useMemo(() => {
    const section = sections.find((item) => item.id === activeDoc?.sectionId);
    return ['Docs', versionMeta?.label || version, section?.label || 'Section', activeDoc?.title || ''];
  }, [sections, activeDoc, versionMeta, version]);

  const lastUpdated = useMemo(() => extractLastUpdated(markdown), [markdown]);

  return (
    <DashboardLayout
      user={user}
      activePage={activePage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Developers"
      subtitle="Versioned documentation and API guides"
    >
      <section className="docs-portal">
        <button className="docs-mobile-nav-btn" type="button" onClick={() => setMobileNavOpen((prev) => !prev)}>
          {mobileNavOpen ? 'Close Menu' : 'Open Menu'}
        </button>

        {mobileNavOpen && <button className="docs-mobile-overlay" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close docs navigation" />}

        <aside className={`docs-sidebar ${mobileNavOpen ? 'open' : ''}`} aria-label="Documentation navigation">
          <div className="docs-sidebar-sticky">
            <div className="docs-search-wrap">
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search docs (Press /)"
                aria-label="Search documentation"
              />
            </div>

            <label className="docs-version-select">
              Version
              <select value={version} onChange={(event) => switchVersion(event.target.value)}>
                {versions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}{item.latest ? ' (latest)' : ''}{item.deprecated ? ' (deprecated)' : ''}
                  </option>
                ))}
              </select>
            </label>

            {versionMeta?.deprecated && (
              <FeedbackMessage
                variant="warning"
                compact
                title="Deprecated version"
                message="This version is maintained for compatibility only."
              />
            )}

            {search.trim() ? (
              <div className="docs-search-results" role="listbox" aria-label="Search results">
                {searchResults.map((result) => (
                  <button
                    key={`${result.doc.version}-${result.doc.path}`}
                    type="button"
                    onClick={() => loadDoc(result.doc)}
                    className="docs-search-result"
                  >
                    <strong>{highlight(result.doc.title, search)}</strong>
                    <span>{highlight(result.snippet, search)}</span>
                  </button>
                ))}
                {!searchResults.length && <p className="docs-empty-results">No matches found.</p>}
              </div>
            ) : (
              <nav className="docs-nav" aria-label="Documentation sections">
                {sections.map((section) => {
                  const isCollapsed = !!collapsed[section.id];
                  return (
                    <section key={section.id} className="docs-nav-section">
                      <button
                        type="button"
                        className="docs-nav-section-head"
                        onClick={() => setCollapsed((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                        aria-expanded={!isCollapsed}
                      >
                        <span>{section.label}</span>
                        <span>{isCollapsed ? '+' : '-'}</span>
                      </button>

                      {!isCollapsed && (
                        <div className="docs-nav-links">
                          {section.items.map((item) => {
                            const selected = activeDoc && activeDoc.path === item.path && activeDoc.version === version;
                            return (
                              <button
                                key={`${version}-${item.path}`}
                                type="button"
                                className={`docs-nav-link ${selected ? 'active' : ''}`}
                                onClick={() => loadDoc({ ...item, version, sectionId: section.id, sectionLabel: section.label })}
                              >
                                {item.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </nav>
            )}
          </div>
        </aside>

        <main className="docs-main">
          {loading && <p className="docs-state">Loading documentation...</p>}
          {!!error && <FeedbackMessage variant="error" title="Documentation error" message={error} />}
          {!loading && !error && activeDoc && (
            <article className="docs-article" ref={articleRef}>
              <header className="docs-article-head">
                <nav className="docs-breadcrumbs" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={`${crumb}-${index}`}>{crumb}</span>
                  ))}
                </nav>
                <h1>{activeDoc.title}</h1>
                <div className="docs-meta">
                  <span>Last updated: {lastUpdated}</span>
                  <span>Version: {versionMeta?.label || version}</span>
                </div>
              </header>

              <section className="docs-content">
                {parsed.blocks.map((block, index) => {
                  if (block.type === 'heading') {
                    if (block.level === 1) return <h1 key={`h-${index}`}>{block.text}</h1>;
                    if (block.level === 2) return <h2 id={block.id} key={`h-${index}`}>{block.text}</h2>;
                    return <h3 id={block.id} key={`h-${index}`}>{block.text}</h3>;
                  }
                  if (block.type === 'paragraph') return <p key={`p-${index}`}>{parseInlineCode(block.text)}</p>;
                  if (block.type === 'list') {
                    return (
                      <ul key={`l-${index}`}>
                        {block.items.map((item, idx) => <li key={`li-${index}-${idx}`}>{parseInlineCode(item)}</li>)}
                      </ul>
                    );
                  }
                  if (block.type === 'code') return <CodeBlock key={`c-${index}`} lang={block.lang} code={block.code} />;
                  if (block.type === 'table') {
                    return (
                      <div className="docs-table-wrap" key={`t-${index}`}>
                        <table className="docs-table">
                          <thead>
                            <tr>{block.headers.map((head, idx) => <th key={`th-${idx}`}>{head}</th>)}</tr>
                          </thead>
                          <tbody>
                            {block.rows.map((row, rowIdx) => (
                              <tr key={`tr-${rowIdx}`}>
                                {row.map((cell, cellIdx) => <td key={`td-${rowIdx}-${cellIdx}`}>{parseInlineCode(cell)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (block.type === 'callout') {
                    return (
                      <div className={`docs-callout ${block.tone}`} key={`co-${index}`}>
                        <strong>{block.title}</strong>
                        <p>{block.body}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </section>

              <SnippetTabs slug={activeDoc.id} />
              <ApiPlayground activeDoc={activeDoc} />

              <section className="docs-helpful" aria-label="Documentation feedback">
                <h3>Was this helpful?</h3>
                <div>
                  <button type="button" onClick={() => setHelpful('yes')} className={helpful === 'yes' ? 'active' : ''}>Yes</button>
                  <button type="button" onClick={() => setHelpful('no')} className={helpful === 'no' ? 'active' : ''}>No</button>
                </div>
                {helpful && <p>Thanks, your feedback helps improve docs quality.</p>}
              </section>
            </article>
          )}
        </main>

        <aside className="docs-toc" aria-label="Table of contents">
          <div className="docs-toc-sticky">
            <button className="docs-mobile-toc-btn" type="button" onClick={() => setMobileTocOpen((prev) => !prev)}>
              {mobileTocOpen ? 'Hide TOC' : 'Show TOC'}
            </button>
            <h3>On this page</h3>
            <nav className={`docs-toc-links ${mobileTocOpen ? 'open' : ''}`}>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`${item.level === 3 ? 'sub' : ''} ${activeHeading === item.id ? 'active' : ''}`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
