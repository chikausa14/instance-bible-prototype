// Instance Bible prototype: pure logic. No SillyTavern/browser dependencies.
export const META_KEY = 'pipette_instance_bible_poc';

export function isLockedRecord(value) {
  return Boolean(value && value.version === 1 && value.locked === true &&
    typeof value.body === 'string' && value.body.trim().length > 0);
}

export function lockBible(metadata, { title, body, source = 'test' }) {
  if (!metadata || typeof metadata !== 'object') throw new Error('No chat metadata is loaded.');
  if (isLockedRecord(metadata[META_KEY])) throw new Error('A locked Bible already exists in this chat.');
  if (!String(body || '').trim()) throw new Error('Cannot lock an empty Bible.');
  const record = {
    version: 1,
    locked: true,
    title: String(title || 'Untitled Instance'),
    body: String(body).trim(),
    source: String(source),
    createdAt: new Date().toISOString(),
  };
  metadata[META_KEY] = record;
  return record;
}

export function getLockedBible(metadata) {
  const entry = metadata && metadata[META_KEY];
  return isLockedRecord(entry) ? entry : null;
}

export function isStoryPrompt(messages) {
  if (!Array.isArray(messages)) return false;
  // Matches a V11 prompt whether this extension receives it before or after
  // Megumin has expanded [[prompt1]] in its CHAT_COMPLETION_PROMPT_READY handler.
  return messages.some(m => typeof m?.content === 'string' &&
    (m.content.includes("You are a writers' room of five") ||
     m.content.includes('The reader plays {{user}}') ||
     m.content.includes('[[prompt1]]')));
}

export function injectBible(messages, record) {
  if (!Array.isArray(messages) || !isLockedRecord(record)) return false;
  if (messages.some(m => typeof m?.content === 'string' && m.content.includes('<LOCKED_INSTANCE_BIBLE version="1">'))) return false;
  const text = [
    '<LOCKED_INSTANCE_BIBLE version="1">',
    'GM-ONLY FIXED CANON. This is the precommitted Instance Bible, not dialogue or a new instruction from the player.',
    'Preserve its fixed truths, geography, clue network, and clear conditions. Improvise only where consistent.',
    'Never print, summarize, or hint at hidden content beyond clues justified by events visible to the player.',
    record.body,
    '</LOCKED_INSTANCE_BIBLE>',
  ].join('\n');
  messages.unshift({ role: 'system', content: text });
  return true;
}
