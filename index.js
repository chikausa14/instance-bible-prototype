// Instance Bible — safe, opt-in prototype for SillyTavern + Megumin V11.
// Saves ONLY a harmless test Bible and injects it into eligible story prompts.
import { getContext, saveMetadataDebounced } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';
import { META_KEY, getLockedBible, lockBible, isStoryPrompt, injectBible } from './core.mjs';

const SAMPLE_TITLE = 'TEST-ONLY · Persistence Probe';
const SAMPLE_BODY = [
  'ID: TEST-ONLY',
  'Purpose: Confirm that a per-chat immutable text record survives a reload and reaches the story model.',
  'Premise: NONE. This is not a playable mystery.',
  'Fixed rule: The phrase PAPER CRANE stays unchanged across turns.',
  'Clear conditions: UNSPECIFIED.',
  'No secret endings or narrative developments are authorized by this test data.',
].join('\n');

let lastInjectedChat = null;
let lastInjectedAt = null;

function active() {
  const c = getContext();
  if (!c?.chatId || !c?.chatMetadata) return null;
  const characterName = c?.characters?.[c.characterId]?.name || c?.name2 || '';
  // Strict scope: don't inject fixed GM secrets into a different character/chat.
  if (!String(characterName).includes('Infinite Flow BL Survival Simulator')) return null;
  return c;
}

function status(message = '') {
  const target = document.getElementById('ibp-status');
  if (!target) return;
  const c = active();
  if (!c) {
    target.textContent = 'Open your Infinite Flow GM chat to use this test.';
    return;
  }
  const b = getLockedBible(c.chatMetadata);
  const state = b ? 'Saved in this chat: ' + b.title : 'No test Bible saved in this chat.';
  const injected = lastInjectedChat === c.chatId
    ? ' Last story-prompt injection: ' + lastInjectedAt
    : ' No injection observed for this chat since page load.';
  target.textContent = message ? `${message} · ${state}${injected}` : state + injected;
}

function buildUi() {
  if (document.getElementById('ibp-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'ibp-panel';
  const heading = document.createElement('h3');
  heading.textContent = '📖 Instance Bible — Prototype';
  panel.append(heading);
  const desc = document.createElement('p');
  desc.textContent = 'Storage + prompt-injection test ONLY. Does not generate an instance or modify your GM card.';
  panel.append(desc);
  const controls = document.createElement('div');
  controls.className = 'ibp-controls';
  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = 'Save harmless TEST Bible';
  save.addEventListener('click', () => {
    const c = active();
    if (!c) return status();
    try {
      lockBible(c.chatMetadata, { title: SAMPLE_TITLE, body: SAMPLE_BODY, source: 'test' });
      saveMetadataDebounced();
      status('Saved and locked. Switch chats or reload to test persistence.');
    } catch (e) { status(e.message); }
  });
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = 'Delete TEST Bible';
  clear.addEventListener('click', () => {
    const c = active();
    if (!c) return status();
    const b = getLockedBible(c.chatMetadata);
    if (!b || b.source !== 'test') return status('Only the harmless test record can be deleted here.');
    if (!confirm('Delete the test Instance Bible for this chat?')) return;
    delete c.chatMetadata[META_KEY];
    saveMetadataDebounced();
    status('Test record deleted.');
  });
  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.textContent = 'Check status';
  refresh.addEventListener('click', () => status());
  controls.append(save, refresh, clear);
  panel.append(controls);
  const st = document.createElement('p');
  st.id = 'ibp-status';
  st.setAttribute('aria-live','polite');
  panel.append(st);
  const mount = document.getElementById('extensions_settings') || document.body;
  mount.append(panel);
  status();
}

function onPromptReady(payload, type) {
  if (type === 'count' || type === 'dry' || type === 'dryRun' || payload?.dryRun || payload?.dry) return;
  const c = active();
  if (!c) return;
  const b = getLockedBible(c.chatMetadata);
  if (!b) return;
  const messages = payload?.messages || payload?.chat || (Array.isArray(payload) ? payload : null);
  if (!isStoryPrompt(messages)) return;
  if (injectBible(messages, b)) {
    lastInjectedChat = c.chatId;
    lastInjectedAt = new Date().toLocaleTimeString();
    status();
  }
}

function init() {
  eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
  eventSource.on(event_types.CHAT_CHANGED, () => status());
  buildUi();
  console.info('[Instance Bible POC] Loaded. Harmless test mode only.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
