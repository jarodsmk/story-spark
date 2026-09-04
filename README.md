# StorySpark ⚡

**StorySpark** is a private, local-first author studio and replacement for Novelcrafter built with **Tauri 2, React, TypeScript, SQLite, and a Rust filesystem layer**.

StorySpark is designed specifically for fiction writers who want:
- **Zero manuscript uploads**: The whole project remains entirely on your machine.
- **Three-pane authoring workspace**: Source manuscript text, suggestion/drafting passes, and live accepted diff preview.
- **Deterministic style and typography passes**: Instant, offline detection of repeated words, run-on sentence lengths, passive constructions, and typographic anomalies.
- **Privacy-first Bring-Your-Own-Model (BYOM)**: Connect your local Ollama, LM Studio, vLLM, or OpenAI/OpenRouter key. Only the highlighted passage is sent for drafting passes—never your full novel.
- **Accept-or-Reject diffs with full undo**: Review each change as a visual diff before adopting it.
- **Novel Bible & Markdown preservation**: Manage characters, world notes, and scenes in standard Markdown with seamless export.

---

## 🚀 Quick Start (First Run in One Command)

To run the application immediately in local desktop preview mode:

```bash
npm run dev
```

Open your browser at `http://localhost:1420`.

To build the standalone Tauri 2 desktop executable (requires Rust and Cargo installed):

```bash
npm run tauri dev
```

---

## 🏗️ Architecture

```
story-spark/
├── src-tauri/                     # Tauri 2 Desktop Core
│   ├── src/
│   │   ├── fs_layer.rs            # Safe sandboxed filesystem IO & atomic writes
│   │   ├── lib.rs                 # Tauri IPC handlers & plugins
│   │   └── main.rs                # Native binary entry point
│   ├── capabilities/default.json  # Tauri 2 security permissions & capabilities
│   └── tauri.conf.json            # Desktop window configuration
│
├── src/                           # React 18 Frontend
│   ├── components/
│   │   ├── Navigation/Sidebar.tsx # Scenes, Characters, World notes & actions
│   │   ├── Editor/                # 3-Pane authoring layout
│   │   │   ├── SourcePane.tsx     # Manuscript text & live word counter
│   │   │   ├── SuggestionsPane.tsx# Deterministic checks + AI rewrite passes
│   │   │   ├── SuggestionCard.tsx # Individual accept/reject cards
│   │   │   ├── PreviewPane.tsx    # Live clean/diff view with undo/redo
│   │   │   └── EditorContainer.tsx# Layout orchestrator
│   │   ├── Settings/              # BYOM keys, rules toggles & dictionary
│   │   └── Modals/                # Import / Export / Manuscript compilation
│   ├── engine/
│   │   ├── checks/                # Deterministic check engines
│   │   │   ├── repeatedWords.ts   # Consecutive repeated token detector
│   │   │   ├── sentenceLength.ts  # Configurable run-on sentence flagger
│   │   │   ├── passiveVoice.ts    # Auxiliary + past participle detector
│   │   │   └── typography.ts      # Curly quotes, em-dashes, ellipses, spaces
│   │   ├── ai/index.ts            # Isolated passage BYOM client (OpenAI/Ollama)
│   │   ├── diff/index.ts          # Word & line level diff generator and patcher
│   │   └── markdown/index.ts      # Safe filename sanitizer & novel compiler
│   ├── storage/
│   │   ├── fs.ts                  # Tauri IPC filesystem bridge with storage fallback
│   │   └── db.ts                  # SQLite schema & settings storage
│   └── hooks/                     # Custom hooks (history, files, settings, export)
│
├── tests/                         # Vitest Unit & Integration Suites
│   ├── deterministic-checks.test.ts
│   ├── diff-and-patch.test.ts
│   ├── import-export.test.ts
│   └── e2e-happy-path.test.ts
└── .env.example                   # Environment configuration template
```

---

## 🛡️ Security, Privacy & Permissions

StorySpark was created to protect author intellectual property:
- **No telemetry, tracking, or accounts**: No analytics, phone-home metrics, or hosted control plane exist.
- **Local SQLite & Filesystem**: All rules, ignored terms, story bible entries, and scene files reside on your local disk.
- **Tauri 2 Sandboxed Capabilities**: File access is strictly scoped to the novel project directory (`src-tauri/capabilities/default.json`). Directory traversal sequences (`..`) are actively scrubbed and denied.
- **Bring-Your-Own-Model Privacy Guarantee**:
  - The application **never** sends your full manuscript to an LLM provider.
  - When triggering a drafting pass, **only the highlighted text snippet** is transmitted along with the specific rewrite instruction.
  - Compatible with 100% offline local LLMs via Ollama (`http://localhost:11434/v1`) or LM Studio (`http://localhost:1234/v1`).

---

## ⚙️ Environment Variables & Secrets

Never commit real API keys to version control. StorySpark provides a template in `.env.example`:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your desired model parameters:
   ```env
   # Leave blank if using a local offline LLM (e.g. Ollama)
   VITE_LLM_API_KEY=

   # Local Ollama or remote OpenAI/OpenRouter
   VITE_LLM_BASE_URL=https://api.openai.com/v1

   # Desired model name
   VITE_LLM_MODEL=gpt-4o-mini
   ```
   *Note: Settings can also be updated directly within the application's UI via the Settings modal.*

---

## 📂 Data Location & Backup Steps

### Where Data is Stored
- **Desktop (Tauri Mode)**:
  - Manuscript markdown files: `StorySparkProject/scenes/*.md`
  - Story Bible entries: `StorySparkProject/bible/characters/*.md` and `StorySparkProject/bible/world/*.md`
  - SQLite database: Stored locally in the user application data directory.
- **Browser/Preview Mode**:
  - Scenes and Bible entries: Backed up continuously to browser `localStorage` under `storyspark_fs_backup`.
  - Settings and Rules: Persisted under `storyspark_user_rules`, `storyspark_ignored_terms`, and `storyspark_llm_settings`.

### How to Back Up Your Manuscript
1. **Single Scene Export**: Click the `.md` or `.txt` button in the top right of the Preview Pane to export the active scene.
2. **Compile Full Novel**: Click **Compile Novel** in the sidebar. This compiles all scenes in sequence, appends the Story Bible appendix, and allows you to download a complete `.md` or `.txt` manuscript file.
3. **Directory Backup**: Simply copy the `StorySparkProject/` folder to an external drive, USB stick, or your encrypted offline backup location.

---

## 🧪 Testing & Validation

Run the test suite with Vitest:

```bash
npm test
```

All 19 tests in 4 test suites validate:
1. `tests/deterministic-checks.test.ts`: Repeated words, sentence length thresholds, passive voice auxiliary constructions, and typographic transforms.
2. `tests/diff-and-patch.test.ts`: Word diff calculations, exact range replacements, and manuscript isolation.
3. `tests/import-export.test.ts`: Filename sanitization against path traversal, heading extraction, markdown export, and compiled manuscript ordering.
4. `tests/e2e-happy-path.test.ts`: End-to-end author workflow (drafting -> rule checks -> isolated passage rewrite -> accept diff -> manuscript compilation).
