# Idea Catcher

A voice notebook for iPhone. Tap the mic, say what's on your mind while walking the dog, and it's saved with a timestamp, cleaned up and filed into the right project. Screenshots get pinned to a per-project whiteboard.

**Open on your iPhone:** https://xinggao531.github.io/idea-catcher/ (after GitHub Pages is turned on for this repo), then Safari › Share › **Add to Home Screen**. It opens full screen from its icon, like an app.

## What it does

- **Talk or type.** The big mic uses live speech recognition. When you tap stop, the note saves automatically (you can turn that off in Settings). The 🎤 on the iPhone keyboard also works in the text box.
- **Sorts itself.** Connect the AI of your choice in Settings: **Claude**, **ChatGPT** or **Gemini**, with your own API key, and pick the model. Each note goes to that model, which:
  - splits a ramble into separate ideas when they're unrelated,
  - removes the "um"s and fixes mis-heard words without adding anything,
  - files each idea under an existing project, or starts a new one in the right category,
  - keeps a short running summary on each project.
- **Screenshots.** Attach one on the capture screen and the AI reads it to decide which project it belongs to. You can also add several at once from inside a project. They go on that project's **Board**, a whiteboard where notes and images are cards you drag around.
- **Categories.** Project ideas: interior design, vibe-coding games, websites, apps, AI videos, singing recordings, photography, other. Life projects: wedding planning, reading list, travel, health, home & errands, other. You can change a project's category, rename it or create one by hand.
- **Find it later.** Projects are grouped by category. Search covers every note, tag, project and screenshot caption.
- **Timestamps and delete.** Every note and image shows when you captured it, and each one can be deleted. So can whole projects, or everything at once from Settings. Notes can also be moved to another project.
- **Works offline.** With no signal or no key, notes are filed by keywords. Use Settings › *Re-sort* later to sort them properly.

## Privacy and data

Everything is stored on the phone, in the browser's IndexedDB. Nothing is uploaded anywhere except the note text and screenshots sent to the AI provider you chose (Anthropic, OpenAI or Google) for sorting, using your own key. Keys are stored only on the phone. Use Settings › **Export backup** now and then (save it to Files or iCloud Drive). Restore it on a new phone with **Restore backup**.

## Choosing the AI

| Provider | Get a key | Models |
| --- | --- | --- |
| Claude (Anthropic) | console.anthropic.com | Claude Opus 5.5 (default, smartest), Claude Sonnet 5.5 (about half the cost), Claude Haiku 4.5 (cheapest) |
| ChatGPT (OpenAI) | platform.openai.com/api-keys | Loaded live from your account when you save the key; pick any chat model |
| Gemini (Google) | aistudio.google.com/apikey | Loaded live from your account when you save the key; a current Flash model is picked to start |

For ChatGPT and Gemini you can also type a model ID. Every provider gets the same instructions and must answer in the same JSON format (structured output), so notes are filed the same way whichever you pick. Each note is one small request billed to your key. A ChatGPT Plus or Gemini app subscription doesn't include API access; you need an API key from the links above.

## Files

| File | What it is |
| --- | --- |
| `index.html`, `styles.css` | Page shell and styles (light and dark mode) |
| `app.js` | Screens: capture, projects, project notes and board, search, settings |
| `ai.js` | Categories, the Claude / ChatGPT / Gemini calls that sort notes, and the offline keyword sorter |
| `db.js` | IndexedDB storage, export and import |
| `sw.js`, `manifest.webmanifest`, `icons/` | Home Screen install and offline support |
| `vendor/anthropic-sdk.js` | The official `@anthropic-ai/sdk`, bundled for the browser with esbuild |

There's no build step. To try it on a computer, serve the folder (for example `python3 -m http.server` in the repo root) and open `http://localhost:8000`.

## Limits

- iOS doesn't let web apps record in the background or appear in the Share sheet. To add a screenshot, open the app and pick it from Photos.
- Live speech recognition depends on Safari. If the big mic button doesn't respond, the keyboard 🎤 always works.
