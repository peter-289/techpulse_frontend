import { create } from 'zustand';

export type HelpMessageRole = 'assistant' | 'user';

export type HelpMessage = {
  id: string;
  role: HelpMessageRole;
  text: string;
  createdAt: number;
};

let sequence = 0;
const nextId = () => `hm_${Date.now().toString(36)}_${(sequence++).toString(36)}`;

const GREETING: HelpMessage = {
  id: 'hm_greeting',
  role: 'assistant',
  text: "Hi! I'm the TechPulse assistant. Ask me how to upload software, manage versions, or keep releases secure.",
  createdAt: Date.now(),
};

const REPLIES: Array<{ match: RegExp; text: string }> = [
  {
    match: /upload|publish|release|submit/i,
    text: 'To publish software:\n1. Open Upload Software in the sidebar.\n2. Fill in the Software Information card (name, description, category, version).\n3. Drop your artifacts into the Software Artifacts card.\n4. Select Upload Software — every artifact is scanned before it goes live.',
  },
  {
    match: /security|scan|virus|threat|safe/i,
    text: 'Every uploaded artifact is scanned automatically. The Security Center shows scan status per artifact, along with the checks that passed and anything that needs your attention.',
  },
  {
    match: /version|changelog|history/i,
    text: 'Versions tracks every release across your software. From a version you can inspect artifacts, lifecycle status, and the change log — and roll forward with a new upload when needed.',
  },
  {
    match: /price|buy|purchase|plan|billing|checkout/i,
    text: 'Public software is free to download. Private software requires an active subscription — you can compare plans from the Plans page and complete checkout securely.',
  },
  {
    match: /download|artifact|install/i,
    text: 'Artifacts are the downloadable files for a release (installers, archives, packages). The Artifacts page lists them with size, checksum and scan status.',
  },
  {
    match: /audit|log|activity|history of/i,
    text: 'The Audit Center records workspace activity — uploads, lifecycle changes and access events — so you can review who did what and when.',
  },
];

const DEFAULT_REPLY =
  'I can help with uploads, versions, artifacts, security scans, audit history and billing. Tell me what you are trying to do and I will point you to the right place.';

export function replyFor(text: string): string {
  const entry = REPLIES.find((item) => item.match.test(text));
  return entry ? entry.text : DEFAULT_REPLY;
}

type HelpMessagesState = {
  messages: HelpMessage[];
  send: (text: string) => void;
  remove: (id: string) => void;
};

/**
 * UI-level conversation state for the Help Centre assistant.
 * Deliberately local: the assistant backend is not a current priority,
 * so messages live in memory for the duration of the session.
 */
export const useHelpMessagesStore = create<HelpMessagesState>((set, get) => ({
  messages: [GREETING],

  send: (raw) => {
    const text = raw.trim();
    if (!text) return;

    const userMessage: HelpMessage = {
      id: nextId(),
      role: 'user',
      text,
      createdAt: Date.now(),
    };
    set({ messages: [...get().messages, userMessage] });

    window.setTimeout(() => {
      const reply: HelpMessage = {
        id: nextId(),
        role: 'assistant',
        text: replyFor(text),
        createdAt: Date.now(),
      };
      set({ messages: [...get().messages, reply] });
    }, 650);
  },

  remove: (id) => {
    set({ messages: get().messages.filter((message) => message.id !== id) });
  },
}));
