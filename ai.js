// Sorting notes into projects. With an API key for Claude, ChatGPT or Gemini,
// the note (and any screenshot) goes to the chosen model, which splits it into
// separate ideas, cleans up the dictation and files each one under an existing
// or new project. Without a key, or offline, a keyword matcher files it by
// category instead and the note is marked so it can be re-sorted with AI later.

export const CATEGORIES = [
  { id: 'interior-design', label: 'Interior design', emoji: '🛋️', group: 'Project ideas' },
  { id: 'games', label: 'Vibe-coding games', emoji: '🎮', group: 'Project ideas' },
  { id: 'websites', label: 'Websites', emoji: '🌐', group: 'Project ideas' },
  { id: 'apps', label: 'Apps', emoji: '📱', group: 'Project ideas' },
  { id: 'ai-videos', label: 'AI videos', emoji: '🎬', group: 'Project ideas' },
  { id: 'singing', label: 'Singing recordings', emoji: '🎤', group: 'Project ideas' },
  { id: 'photography', label: 'Photography', emoji: '📷', group: 'Project ideas' },
  { id: 'other-project', label: 'Other project ideas', emoji: '💡', group: 'Project ideas' },
  { id: 'wedding', label: 'Wedding planning', emoji: '💍', group: 'Life projects' },
  { id: 'reading', label: 'Reading list', emoji: '📚', group: 'Life projects' },
  { id: 'travel', label: 'Travel', emoji: '✈️', group: 'Life projects' },
  { id: 'health', label: 'Health & fitness', emoji: '🏃', group: 'Life projects' },
  { id: 'home-life', label: 'Home & errands', emoji: '🏡', group: 'Life projects' },
  { id: 'other-life', label: 'Other life stuff', emoji: '🗂️', group: 'Life projects' },
];

export const categoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES.find((c) => c.id === 'other-project');

export const KINDS = ['idea', 'todo', 'reference', 'question', 'journal'];

// ---------- What every provider is asked to return ----------

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'title',
          'note',
          'kind',
          'tags',
          'project_id',
          'new_project_name',
          'new_project_category',
          'project_summary',
        ],
        properties: {
          title: { type: 'string', description: 'Short headline for this note, 2-8 words.' },
          note: {
            type: 'string',
            description:
              "The note itself, cleaned up from dictation (filler words, false starts and repeats removed) but keeping all of the user's details and their voice. For a screenshot, what it shows and why it matters for the project.",
          },
          kind: { type: 'string', enum: KINDS },
          tags: { type: 'array', items: { type: 'string' }, description: '0-4 short lowercase tags.' },
          project_id: {
            type: 'string',
            description: 'id of the existing project this belongs to, or "" to create a new project.',
          },
          new_project_name: {
            type: 'string',
            description: 'Name for the new project when project_id is "", otherwise "".',
          },
          new_project_category: {
            type: 'string',
            enum: CATEGORIES.map((c) => c.id),
            description: 'Category of the project (existing or new).',
          },
          project_summary: {
            type: 'string',
            description:
              'An up-to-date 1-3 sentence summary of where the whole project stands, folding this note into the previous summary.',
          },
        },
      },
    },
  },
};

const SYSTEM = `You are the filing assistant inside Idea Catcher, a voice notebook the user talks to while walking the dog, driving or falling asleep. Their notes arrive as raw speech-to-text, sometimes with a phone screenshot attached.

For each message:
- Split it into separate items only when it clearly covers unrelated ideas; a single idea with several details stays one item.
- File every item under the existing project it belongs to whenever one fits. Only start a new project when nothing fits, and give it a short, specific name (e.g. "Living room makeover", "Cozy farming game", not "Ideas").
- Keep a project's category stable unless it is clearly wrong.
- Speech-to-text mangles names and words; fix obvious mis-hearings from context, but never invent details the user didn't say.
- Use the user's language for titles and notes.`;

// ---------- Providers: Claude, ChatGPT (OpenAI) and Gemini ----------
// Each provider gets the same instructions and the same JSON schema, and must
// return { items: [...] } matching SCHEMA. Keys and model choices are stored
// per provider on this phone only.

export const PROVIDERS = {
  anthropic: {
    label: 'Claude (Anthropic)',
    short: 'Claude',
    keyHint: 'sk-ant-…',
    keyUrl: 'console.anthropic.com',
    // Curated, because request options differ per Claude model.
    models: [
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 · smartest' },
      { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 · fast, about half the cost' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 · fastest, cheapest' },
    ],
    defaultModel: 'claude-opus-5-5',
  },
  openai: {
    label: 'ChatGPT (OpenAI)',
    short: 'ChatGPT',
    keyHint: 'sk-…',
    keyUrl: 'platform.openai.com/api-keys',
    models: null, // loaded live from the account
    defaultModel: '',
  },
  gemini: {
    label: 'Gemini (Google)',
    short: 'Gemini',
    keyHint: 'AIza…',
    keyUrl: 'aistudio.google.com/apikey',
    models: null,
    defaultModel: '',
  },
};

const LS = {
  provider: 'ic.provider',
  key: (p) => `ic.key.${p}`,
  model: (p) => `ic.model.${p}`,
};

// The first version stored a single Claude key under ic.apiKey.
try {
  const legacy = localStorage.getItem('ic.apiKey');
  if (legacy && !localStorage.getItem(LS.key('anthropic'))) localStorage.setItem(LS.key('anthropic'), legacy);
  localStorage.removeItem('ic.apiKey');
} catch {}

export const getProvider = () => (PROVIDERS[localStorage.getItem(LS.provider)] ? localStorage.getItem(LS.provider) : 'anthropic');
export const setProvider = (p) => localStorage.setItem(LS.provider, p);
export const getKey = (p = getProvider()) => localStorage.getItem(LS.key(p)) || '';
export const setKey = (p, v) => (v ? localStorage.setItem(LS.key(p), v) : localStorage.removeItem(LS.key(p)));
export const getModel = (p = getProvider()) => localStorage.getItem(LS.model(p)) || PROVIDERS[p].defaultModel;
export const setModel = (p, v) => (v ? localStorage.setItem(LS.model(p), v) : localStorage.removeItem(LS.model(p)));

/** Ready to sort with AI: a key and a model for the chosen provider. */
export const hasKey = () => !!getKey() && !!getModel();

/** e.g. "Claude Opus 5.5" or "Gemini · gemini-…" for toasts and labels. */
export function aiName(p = getProvider()) {
  const curated = PROVIDERS[p].models?.find((m) => m.id === getModel(p));
  return curated ? curated.label.split(' · ')[0] : `${PROVIDERS[p].short} · ${getModel(p)}`;
}

function projectList(projects) {
  if (!projects.length) return '(none yet)';
  return projects
    .map((p) => `- id: ${p.id} | name: ${p.name} | category: ${p.category} | summary: ${p.summary || '—'}`)
    .join('\n');
}

function userText({ text, image, projects, when }) {
  return `Existing projects:\n${projectList(projects)}\n\nNote recorded ${when.toLocaleString()}:\n"""\n${
    text || (image ? '(no words, just the screenshot above)' : '')
  }\n"""`;
}

function parseItems(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(parsed?.items) || !parsed.items.length) throw new Error('The AI returned no items.');
  return parsed.items;
}

async function httpError(res, who) {
  let detail = '';
  try {
    const body = await res.json();
    detail = body.error?.message || body.message || '';
  } catch {}
  return new Error(`${who} ${res.status}${detail ? `: ${detail}` : ''}`);
}

// ----- Claude -----

async function anthropicOrganize(input, model) {
  const { default: Anthropic } = await import('./vendor/anthropic-sdk.js');
  const client = new Anthropic({ apiKey: getKey('anthropic'), dangerouslyAllowBrowser: true });
  const content = [];
  if (input.image) {
    content.push({ type: 'image', source: { type: 'base64', media_type: input.image.mediaType, data: input.image.base64 } });
  }
  content.push({ type: 'text', text: userText(input) });

  const isHaiku = model.startsWith('claude-haiku');
  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
    output_config: isHaiku ? { format: { type: 'json_schema', schema: SCHEMA } } : { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    // Opus 5.5 and Sonnet 5.5: if the model declines, the API retries on its recommended fallback.
    ...(isHaiku ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }),
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude declined to sort this note.');
  if (response.stop_reason === 'max_tokens') throw new Error('The note was too long to sort in one go.');
  return parseItems(response.content.find((b) => b.type === 'text').text);
}

// ----- ChatGPT (OpenAI Chat Completions with Structured Outputs) -----

async function openaiOrganize(input, model) {
  const content = [{ type: 'text', text: userText(input) }];
  if (input.image) {
    content.unshift({ type: 'image_url', image_url: { url: `data:${input.image.mediaType};base64,${input.image.base64}` } });
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey('openai')}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'filing', strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok) throw await httpError(res, 'OpenAI');
  const data = await res.json();
  const choice = data.choices?.[0];
  if (choice?.message?.refusal) throw new Error('ChatGPT declined to sort this note.');
  if (choice?.finish_reason === 'length') throw new Error('The note was too long to sort in one go.');
  return parseItems(choice?.message?.content);
}

// ----- Gemini (generateContent with a JSON schema) -----

// Gemini's schema support is narrower; drop keywords it may reject.
function geminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(geminiSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const out = {};
  for (const [k, v] of Object.entries(schema)) if (k !== 'additionalProperties') out[k] = geminiSchema(v);
  return out;
}

async function geminiOrganize(input, model) {
  const parts = [];
  if (input.image) parts.push({ inlineData: { mimeType: input.image.mediaType, data: input.image.base64 } });
  parts.push({ text: userText(input) });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getKey('gemini') },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: geminiSchema(SCHEMA) },
    }),
  });
  if (!res.ok) throw await httpError(res, 'Gemini');
  const data = await res.json();
  if (data.promptFeedback?.blockReason) throw new Error('Gemini declined to sort this note.');
  const cand = data.candidates?.[0];
  if (cand?.finishReason === 'MAX_TOKENS') throw new Error('The note was too long to sort in one go.');
  const text = (cand?.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) throw new Error(`Gemini returned nothing${cand?.finishReason ? ` (${cand.finishReason})` : ''}.`);
  return parseItems(text);
}

/**
 * Sort a note with the chosen provider and model.
 * @param {{text: string, image?: {base64: string, mediaType: string}, projects: object[], when: Date}} input
 */
export async function organizeWithAI(input) {
  const p = getProvider();
  const model = getModel(p);
  if (!getKey(p) || !model) throw new Error(`No ${PROVIDERS[p].short} key or model set.`);
  if (p === 'openai') return openaiOrganize(input, model);
  if (p === 'gemini') return geminiOrganize(input, model);
  return anthropicOrganize(input, model);
}

// ----- Live model lists (so the picker always shows what the account can use) -----

const OPENAI_SKIP = /audio|realtime|tts|transcribe|whisper|dall-e|image|embedding|moderation|search|codex|instruct|babbage|davinci|computer-use|-\d{4}-\d{2}-\d{2}$/;
const GEMINI_SKIP = /image|tts|live|embedding|aqa|imagen|veo|transcribe|translate|robotics|computer-use|gemma/;

// Newest version numbers first, e.g. "6.1" before "5.5".
const byVersionDesc = (a, b) => b.localeCompare(a, undefined, { numeric: true });

export async function listModels(p, key = getKey(p)) {
  if (p === 'anthropic') return PROVIDERS.anthropic.models;
  if (!key) throw new Error('Enter a key first.');
  if (p === 'openai') {
    const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) throw await httpError(res, 'OpenAI');
    const ids = (await res.json()).data.map((m) => m.id).filter((id) => /^(gpt-|o\d|chatgpt-)/.test(id) && !OPENAI_SKIP.test(id));
    return ids.sort(byVersionDesc).map((id) => ({ id, label: id }));
  }
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': key } });
  if (!res.ok) throw await httpError(res, 'Gemini');
  const models = ((await res.json()).models || []).filter(
    (m) => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name) && !GEMINI_SKIP.test(m.name)
  );
  return models
    .map((m) => ({ id: m.name.replace(/^models\//, ''), label: m.displayName ? `${m.displayName} · ${m.name.replace(/^models\//, '')}` : m.name }))
    .sort((a, b) => byVersionDesc(a.id, b.id));
}

/** A sensible starting choice from a live list: newest fast/flash model, else newest overall. */
export function suggestModel(p, models) {
  if (!models.length) return '';
  if (p === 'gemini') return (models.find((m) => /flash/.test(m.id) && !/lite|preview|exp/.test(m.id)) || models[0]).id;
  if (p === 'openai') return (models.find((m) => /^gpt-[\d.]+$/.test(m.id)) || models[0]).id;
  return PROVIDERS[p].defaultModel;
}

// ---------- Offline keyword fallback ----------

const KEYWORDS = {
  'interior-design': ['interior', 'sofa', 'couch', 'paint', 'wall', 'living room', 'bedroom', 'kitchen', 'furniture', 'rug', 'lamp', 'decor', 'curtain', 'shelf', 'tile'],
  games: ['game', 'level', 'player', 'boss', 'enemy', 'quest', 'sprite', 'unity', 'godot', 'pixel', 'npc', 'gameplay'],
  websites: ['website', 'site', 'landing page', 'domain', 'blog', 'homepage', 'portfolio'],
  apps: ['app', 'iphone', 'android', 'notification', 'feature', 'ios'],
  'ai-videos': ['video', 'clip', 'scene', 'shot', 'sora', 'veo', 'runway', 'animation', 'storyboard', 'reel'],
  singing: ['sing', 'song', 'vocal', 'cover', 'recording', 'lyrics', 'melody', 'karaoke', 'harmony'],
  photography: ['photo', 'camera', 'lens', 'shoot', 'portrait', 'golden hour', 'lighting', 'edit', 'lightroom'],
  wedding: ['wedding', 'bride', 'groom', 'venue', 'guest', 'dress', 'florist', 'flowers', 'ceremony', 'reception', 'rsvp', 'caterer', 'honeymoon'],
  reading: ['book', 'read', 'novel', 'author', 'chapter', 'audiobook', 'kindle'],
  travel: ['trip', 'flight', 'hotel', 'travel', 'vacation', 'airbnb', 'itinerary'],
  health: ['gym', 'workout', 'run', 'diet', 'doctor', 'sleep', 'yoga', 'walk'],
  'home-life': ['buy', 'groceries', 'errand', 'call', 'appointment', 'bill', 'vet', 'dog'],
};

const STOP = new Set('the a an and or but to of for in on at with my our i we it this that is be about some maybe think should'.split(' '));
const words = (s) => (s.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []).filter((w) => w.length > 2 && !STOP.has(w));

export function organizeOffline({ text, projects }) {
  const lower = ` ${text.toLowerCase()} `;
  const noteWords = new Set(words(text));

  // 1. A project whose name the note mentions wins.
  let best = null;
  let bestScore = 0;
  for (const p of projects) {
    const nameWords = words(p.name);
    const hits = nameWords.filter((w) => noteWords.has(w)).length;
    const score = nameWords.length ? hits / nameWords.length : 0;
    if (hits && score > bestScore) {
      best = p;
      bestScore = score;
    }
  }

  // 2. Otherwise guess a category from keywords.
  let category = best?.category;
  if (!category) {
    let top = 0;
    for (const [cat, list] of Object.entries(KEYWORDS)) {
      const n = list.filter((k) => lower.includes(` ${k}`)).length;
      if (n > top) {
        top = n;
        category = cat;
      }
    }
  }
  category ||= 'other-project';

  const first = text.trim().split(/[.!?\n]/)[0].split(/\s+/).slice(0, 7).join(' ');
  const cat = categoryById(category);
  return [
    {
      title: first || 'Screenshot',
      note: text.trim(),
      kind: /\b(need to|have to|remember to|buy|call|book|todo|to do)\b/i.test(text) ? 'todo' : 'idea',
      tags: [],
      project_id: best?.id || '',
      new_project_name: best ? '' : `${cat.label} inbox`,
      new_project_category: category,
      project_summary: best?.summary || '',
    },
  ];
}
