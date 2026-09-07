# StorySpark ⚡

**StorySpark** is a private, local-first author studio and personal replacement for Novelcrafter built with **Tauri 2, React 18, TypeScript, SQLite, MongoDB, and a Rust filesystem layer**.

Designed from the ground up for fiction writers and novelists, StorySpark delivers a high-craft authoring environment where your manuscript never leaves your machine unless you explicitly choose to invoke an isolated AI drafting pass.

---

## 🌟 Key Capabilities

### 1. Three-Pane Authoring Studio
* **Collapsible Tri-Pane Workspace**: Ergonomic layout featuring:
  * **Left**: Suggestions & Editorial Passes Pane (filterable by rule categories, severity, and AI passes; toggleable via shortcut `Ctrl+[` / `Cmd+[` or header icon).
  * **Center**: Source Manuscript Pane (distraction-free prose editor, live word counter, cursor tracking, inline lore link highlighting, scene summary indicators, and full-bleed zen writing mode).
  * **Right**: Live Accepted Diff & Preview Pane (real-time word- and line-level diff against baseline manuscript, visual addition/deletion highlights, undo/redo stack, and quick scene export; toggleable via `Ctrl+\` / `Cmd+\`).
* **Suggestion Focus & Navigation**: Clicking any suggestion card smoothly highlights and scrolls to the exact text range in the manuscript editor with floating quick-action badges.
* **Full Undo / Redo**: Comprehensive history management tracking every accepted suggestion, manual edit, and AI pass.

### 2. Multi-Novel Project Management
* **Switch Between Novels**: Manage multiple active manuscripts, series, or standalone novels within a single interface.
* **Rich Novel Metadata**: Configure title, genre, description, target word count, and custom model system prompts per novel.
* **Novel Cover Art**: Upload custom cover imagery with automated aspect-ratio fitting and preview integration.
* **Isolated File Trees**: Project files and lore entries are partitioned cleanly per novel (`novels/<id>/scenes/` and `novels/<id>/bible/` or root `scenes/` and `bible/`).

### 3. Story Bible & Inline Lore Reference Engine
* **Character & World Lore Management**: Organize characters, world notes, locations, factions, and items in structured Markdown files with bullet-attribute metadata (`Role`, `Appearance`, `Goal`, `Atmosphere`).
* **Inline Manuscript Lore References**:
  * Cross-reference characters and world elements using standard Markdown links (`[Kaelen](bible/characters/kaelen.md)`), `@mentions`, or wiki-links (`[[District 9]]`, `[[Kaelen|The Scout]]`).
  * Hover over referenced names in the editor to inspect instant popover tooltips displaying character role, physical appearance, motivations, or location ambiance.
  * Right-click context menu to quickly wrap words into lore links, unlink references, or create a brand-new Story Bible entry on the fly.

### 4. 10 Deterministic Craft & Linguistic Check Engines
Runs 100% offline with zero latency powered by `@compromise` NLP and token analyzers:
1. **Repeated Words**: Flags accidental consecutive duplicate words (*"the the"*, *"had had"*).
2. **Sentence Length**: Warns when prose sentences exceed a configurable word threshold (default: 30 words) to maintain narrative cadence.
3. **Passive Voice**: Detects auxiliary verb + past participle constructions (*"was abandoned"*, *"were seen"*) to encourage active, gripping prose.
4. **Typography Standards**: Automatically standardizes curly quotation marks (“” ‘’), em-dashes (—), contraction apostrophes, ellipses (…), double spaces, and dialogue punctuation.
5. **Grammar & Homophone Confusions**: Catches commonly confused word pairs (*could of* → *could have*, *then/than*, *loose/lose*, *its/it's*, *their/there/they're*).
6. **Indefinite Article Agreement**: Detects *a* vs *an* sound mismatches (*"a hour"*, *"an sword"*).
7. **Sensory Filter Words**: Highlights perception verbs (*saw*, *heard*, *noticed*, *felt*) that distance readers from deep point-of-view (POV).
8. **Pacing & Weak Intensifiers**: Identifies crutch adverbs and weak narrative phrasing (*"suddenly"*, *"began to"*, *"very"*, *"really"*).
9. **Redundant Modifiers & Tautologies**: Cuts redundant dialogue and action modifiers (*"whispered softly"*, *"nodded his head"*, *"shrugged his shoulders"*).
10. **Fiction Clichés**: Flags overused idioms and worn narrative expressions (*"cold as ice"*, *"dark and stormy"*, *"heart in throat"*).
* **Custom Ignored Terms Dictionary**: Mark character names, fantasy terminology, or stylistic quirks to ignore across all checks.

### 5. Privacy-First Bring-Your-Own-Model (BYOM) AI Suite
* **10+ Pre-Configured Model Providers**:
  * **OpenRouter** (Claude 3.7 Sonnet, Claude 3.5 Sonnet, GPT-4o, DeepSeek V3, DeepSeek R1, Llama 3.3 70B, MythoMax 13B, WizardLM-2 8x22B)
  * **OpenAI Direct** (GPT-4o, GPT-4o Mini, o3-mini, o1, GPT-4 Turbo)
  * **Anthropic Direct** (Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus)
  * **Google Gemini** (Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash via server proxy or direct OpenAI-compatible endpoint)
  * **Groq Ultra-Fast LPU** (Llama 3.3 70B Versatile at 300+ tok/s, DeepSeek R1 Distill 70B, Mixtral 8x7B)
  * **Ollama (100% Offline / Local)** (Llama 3.3, Llama 3.1 8B, Qwen 2.5 14B/32B, DeepSeek R1 8B/14B, Mistral 7B)
  * **LM Studio (Local Inference Server)** (Connects to `http://localhost:1234/v1` with loaded model auto-detection)
  * **Mistral AI** (Mistral Large, Mistral Small, Mistral NeMo, Codestral)
  * **Together AI** (Llama 3.3 70B Turbo, DeepSeek V3/R1, Qwen 2.5 72B)
  * **Custom Endpoints** (Any self-hosted vLLM, Text Generation WebUI, or OpenAI-compatible proxy)
  * **Live Model Discovery**: Query provider `/models` endpoints dynamically with 1-click model detection.
* **Isolated Passage Rewrites**: Highlight any sentence or paragraph, specify or pick a rewrite instruction, and receive a dedicated accept/reject diff card. **Only the selected snippet is sent—never your full manuscript**.
* **Targeted AI Editorial Passes**:
  * *Show, Don't Tell*: Replaces internal emotion statements with visceral sensory cues and involuntary micro-expressions.
  * *Sensory & Atmosphere*: Infuses grounded tactile textures, lighting, and ambient acoustics without bloating word counts.
  * *Prose Flow & Cadence*: Sharpens syntax variety, sentence rhythm, and eliminates unintentional repetition.
  * *Sharp Dialogue*: Tightens character subtext, removes on-the-nose exposition, and polishes speech rhythm.
  * *Pacing & Filter Removal*: Eliminates narrative deadweight and filter phrases.
* **Creative Scene Generation**:
  * Generate dialogue exchanges, scene expansions, or transitions from scratch.
  * Configurable length presets (*Brief 50-100w*, *Standard 150-250w*, *Extended 350-500w*, or exact target count).
  * Style presets: *Vivid & Sensory*, *Fast-Paced & Tense*, *Atmospheric & Lyrical*, *Sharp & Dialogue-Driven*, *Dark & Gritty*, or *Custom*.
  * Injects surrounding scene context and chronological scene summaries for flawless narrative continuity.
* **Scene Summarization & Narrative Memory**: Automatically generates concise 60-120 word plot, character dynamic, and conflict state summaries per scene to maintain chronological continuity across your novel.
* **Story Brainstorming Consultant**: Generates high-stakes plot twists, character conflicts, lore revelations, subplots, and actionable scene hooks grounded directly in your active Story Bible entries and prior scene summaries.

### 6. Novelcrafter ZIP & JSON Importer
* **One-Click Archive Ingestion**: Import `.zip` or `.json` project backups exported directly from Novelcrafter.
* **Intelligent Asset Parsing**:
  * Automatically separates and reconstructs chapters and scenes into structured Markdown files.
  * Extracts character profiles, locations, and world lore notes into dedicated Story Bible directories.
  * Imports novel metadata (title, genre, synopsis, word counts).
  * Option to import as a brand-new novel or merge into your existing active project.

### 7. Publication-Ready Export & Compilation
* **Single Scene Export**: Export the active scene to `.md` or `.txt`.
* **Full Novel Compilation**: Merges all ordered scenes into a unified manuscript with clean heading hierarchy and an optional Story Bible Appendix.
* **Typeset PDF Generation (via jsPDF)**:
  * Publication-ready formatting with customizable typography (*Times* or *Helvetica*).
  * Elegant title and cover page with novel title, author name, genre, scene count, word count, and compilation timestamp.
  * Chapter headings (*Numbered*, *Original*, or *Simple Caps*).
  * Scene separators (*Page Break*, *Subtle Divider Line*, or *Asterisms `* * *`*).
  * Running headers with novel title and bottom page numbering (*"Page X of Y"*).
  * Optional Story Bible Lore Appendix with formatted character profiles and world descriptions.

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Desktop Shell** | Tauri 2 (`@tauri-apps/api`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-sql`), Rust 2021 |
| **Frontend Framework** | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Lucide React icons |
| **Linguistic & Diffing Engine** | Compromise 14 (`compromise`), Diff (`diff`), JSZip (`jszip`), jsPDF (`jspdf`) |
| **Unified Backend Server** | Node.js 20, Express 5, TSX runtime, esbuild |
| **AI Integration** | Google GenAI SDK (`@google/genai`), Fetch-based OpenAI/BYOM client with model discovery |
| **Database & Persistence** | MongoDB 7.0 (`mongodb`), SQLite (`sql.js` / Tauri plugin-sql), LocalStorage fallback |
| **Container & Reverse Proxy** | Multi-stage Dockerfile, Docker Compose, Nginx (Alpine) with gzip & SPA routing |
| **Testing & QA** | Vitest 2.1 (13 test suites, 73 tests) |

---

## 🏗️ Architecture & Directory Structure

```
story-spark/
├── src-tauri/                     # Tauri 2 Desktop Core
│   ├── src/
│   │   ├── fs_layer.rs            # Sandboxed filesystem IO, path validation & atomic writes
│   │   ├── lib.rs                 # Tauri IPC handlers & system plugins
│   │   └── main.rs                # Native desktop binary entry point
│   ├── capabilities/default.json  # Scoped sandboxed filesystem permissions
│   ├── tauri.conf.json            # Desktop window sizing, titles & asset configurations
│   └── Cargo.toml                 # Rust dependencies
│
├── src/                           # React 18 Frontend
│   ├── components/
│   │   ├── Navigation/
│   │   │   └── Sidebar.tsx        # Multi-novel picker, scenes, character/world bible, actions
│   │   ├── Editor/
│   │   │   ├── EditorContainer.tsx# 3-pane orchestrator with collapse state & shortcuts
│   │   │   ├── SourcePane.tsx     # Manuscript text editor, live word counter & lore highlights
│   │   │   ├── SuggestionsPane.tsx# Deterministic checks + AI editorial pass launcher
│   │   │   ├── SuggestionCard.tsx # Accept/reject/ignore cards with diff previews
│   │   │   ├── PreviewPane.tsx    # Clean accepted diff view, export triggers, undo/redo
│   │   │   ├── LoreContextMenu.tsx# Editor right-click menu for lore links
│   │   │   ├── LoreHoverTooltip.tsx# Popover card displaying character & world details
│   │   │   ├── LoreTextRenderer.tsx# Markdown link and wiki-link highlighter
│   │   │   ├── GenerateContentModal.tsx # Creative fiction prose generator
│   │   │   ├── NewLoreModal.tsx   # Fast lore entry creator
│   │   │   └── StorySuggestionsTab.tsx # Narrative ideas & plot twist brainstormer
│   │   ├── Modals/
│   │   │   ├── ModalsContainer.tsx # Central modal coordinator
│   │   │   ├── NovelModal.tsx     # Multi-novel creator and metadata editor
│   │   │   ├── NovelCrafterImportView.tsx # Novelcrafter ZIP/JSON archive importer
│   │   │   ├── ExportModal.tsx    # PDF, Markdown, and TXT compilation & download
│   │   │   ├── CoverUploadModal.tsx # Novel cover art upload & generator
│   │   │   └── SceneSummaryModal.tsx# AI scene summarizer & narrative hook tracker
│   │   └── Settings/
│   │       ├── SettingsModal.tsx  # Unified configuration dialog
│   │       ├── AITab.tsx          # Provider picker, API keys, model discovery & prompts
│   │       ├── RulesTab.tsx       # Toggles for all 10 deterministic checks & thresholds
│   │       └── TermsTab.tsx       # Ignored terms & dictionary management
│   │
│   ├── engine/
│   │   ├── ai/
│   │   │   ├── index.ts           # Isolated passage BYOM client (OpenAI/Ollama/Gemini/Claude)
│   │   │   ├── providers.ts       # Provider definitions, curated models & live model fetcher
│   │   │   └── prompts.ts         # System prompts for editorial passes & prose generation
│   │   ├── checks/                # 10 deterministic linguistic check engines
│   │   │   ├── repeatedWords.ts   # Consecutive duplicated token analyzer
│   │   │   ├── sentenceLength.ts  # Configurable run-on sentence flagger
│   │   │   ├── passiveVoice.ts    # Auxiliary + past participle construction detector
│   │   │   ├── typography.ts      # Curly quotes, em-dashes, ellipses & dialogue punctuation
│   │   │   ├── grammarConfusions.ts # Homophones & confused pairs (could of, then/than)
│   │   │   ├── articleAgreement.ts# Phonetic "a" vs "an" vowel/consonant agreements
│   │   │   ├── filterWords.ts     # Sensory POV filter verbs (saw, heard, felt)
│   │   │   ├── styleCraft.ts      # Weak intensifiers, redundant modifiers & clichés
│   │   │   ├── compromise.ts      # Shared Compromise NLP instance orchestrator
│   │   │   └── index.ts           # Unified rule runner & default rule definitions
│   │   ├── diff/index.ts          # Word- and line-level diff calculation & text patcher
│   │   ├── export/pdfExport.ts    # Typeset PDF generator with running headers & cover page
│   │   ├── lore/loreReference.ts  # Lore reference parser, wiki-link matcher & link formatter
│   │   ├── markdown/index.ts      # Filename sanitizer & full-novel compiler
│   │   └── novelcrafter/          # Novelcrafter ZIP / JSON unpacker & entity mapper
│   │
│   ├── storage/
│   │   ├── fs.ts                  # Filesystem bridge (Tauri IPC -> Express API -> LocalStorage)
│   │   └── db.ts                  # Database manager (SQLite -> MongoDB -> LocalStorage)
│   ├── server/
│   │   ├── index.ts               # Express 5 backend with MongoDB driver & in-memory fallback
│   │   └── gemini.ts              # Server-side Gemini API router with automatic model fallback
│   ├── hooks/                     # Custom React hooks (novels, files, lore, history, settings)
│   └── types/index.ts             # TypeScript interfaces (Suggestions, Novels, Bible, LLM)
│
├── tests/                         # Vitest Test Suites (13 suites, 73 tests)
├── server.ts                      # Unified dev & production server entry point
├── nginx.conf                     # Production Nginx reverse-proxy & SPA routing config
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Full stack with MongoDB 7.0
└── package.json                   # Project dependencies & build scripts
```

---

## 🚀 Setup & Run Guides

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm** or **bun**
* *Optional for Native Desktop*: **Rust & Cargo** (for Tauri 2 desktop builds)
* *Optional for Containers*: **Docker & Docker Compose**

---

### Option A: Local Unified Dev Server (Fastest)

Runs the Express API backend and the Vite React frontend concurrently on port `3000`:

```bash
# 1. Install dependencies
npm install

# 2. Start the unified development server
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

### Option B: Native Desktop App (Tauri 2)

To run as a native desktop application with direct local filesystem access:

```bash
# Ensure Rust is installed (rustc --version)
# 1. Run in Tauri desktop development mode
npm run tauri dev

# 2. Build the production standalone desktop installer (.dmg / .deb / .msi)
npm run tauri build
```

---

### Option C: Docker Compose (Full-Stack with MongoDB)

To spin up StorySpark alongside a dedicated, persistent MongoDB 7 database:

```bash
docker compose up -d --build
```

* Access the studio at: **`http://localhost:8080`**
* MongoDB service runs at: **`localhost:27017`**
* All manuscript files, lore entries, settings, and novels are automatically persisted to the `mongodb_data` volume.

To stop the containers:
```bash
docker compose down
```

---

### Option D: Standalone Docker Container

```bash
# Build the Docker image
docker build -t story-spark:latest .

# Run the container
docker run -d -p 8080:80 --name story-spark story-spark:latest
```

Access StorySpark at `http://localhost:8080`. The container automatically runs the internal Express API and proxies traffic via Nginx.

---

## ⚙️ Environment Variables & Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Optional: Server-side Google Gemini API Key for AI editorial passes & generation
GEMINI_API_KEY=

# Optional: MongoDB connection (defaults to in-memory fallback if empty or offline)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=storyspark

# Optional: API base URL override (leave blank for relative /api proxy)
VITE_API_BASE_URL=

# Optional default BYOM settings (can also be entered inside the UI Settings modal)
VITE_LLM_API_KEY=
VITE_LLM_BASE_URL=https://openrouter.ai/api/v1
VITE_LLM_MODEL=anthropic/claude-3.7-sonnet
```

> **Note on API Keys**: You never need to hardcode keys into files. You can enter and switch your OpenRouter, OpenAI, Anthropic, Groq, or Gemini keys directly in the **Settings → AI Models** tab within the app. Keys are stored locally in your private database or browser storage.

---

## 🔌 Offline / Local AI Setup (100% Air-Gapped)

StorySpark is completely compatible with offline, privately hosted language models.

### Using Ollama
1. Install and launch Ollama:
   ```bash
   ollama serve
   ```
2. Pull your favorite fiction writing model:
   ```bash
   ollama pull llama3.3
   # or for fast lightweight execution:
   ollama pull llama3.1:8b
   # or for deep reasoning & plot twists:
   ollama pull deepseek-r1:14b
   ```
3. Open StorySpark **Settings → AI Models**:
   * Select **Ollama (Local / Offline)** as your provider.
   * Base URL is pre-filled to: `http://localhost:11434/v1`.
   * Click **Fetch Live Models from Endpoint** to auto-select your installed model.
   * Leave API Key blank.

### Using LM Studio
1. Open LM Studio and download any GGUF model (e.g., *Mistral-7B-Instruct*, *Llama-3-8B-Instruct*, *Hermes-3*).
2. Go to the **Local Server** tab in LM Studio and click **Start Server** (default port `1234`).
3. In StorySpark **Settings → AI Models**:
   * Select **LM Studio (Local Server)**.
   * Base URL defaults to: `http://localhost:1234/v1`.
   * Model: `loaded-model` (will use whichever model is loaded in LM Studio).

---

## 📂 Data Storage & Backup Procedures

### Multi-Tier Storage Architecture
StorySpark uses an intelligent fallback storage pipeline:
1. **Desktop Native**: Files are stored as plain `.md` files in your project directory via the Rust sandboxed filesystem layer. Settings and rules persist to SQLite.
2. **Container / Server**: Files and novel structures are saved to MongoDB under the `files` and `settings` collections.
3. **Browser / Preview**: If MongoDB or native filesystem is not connected, StorySpark seamlessly falls back to browser `localStorage` with full offline functionality.

### Backing Up Your Work
* **Method 1: Compile Full Manuscript**: Click **Compile Novel** in the sidebar. Select **Markdown (.md)** or **Plain Text (.txt)** to download a complete, sequentially compiled copy of your novel including Story Bible appendices.
* **Method 2: Typeset PDF Export**: Click **Compile Novel**, choose **PDF Document**, customize your layout styling, and download a publication-ready PDF.
* **Method 3: Native Project Directory Backup**: In desktop mode, simply copy your `StorySparkProject/` folder to an external SSD, USB key, or cloud backup.
* **Method 4: MongoDB Dump**: When running with Docker Compose:
  ```bash
  docker compose exec mongodb mongodump --out=/data/db/backup
  ```

---

## 🧪 Testing & Validation Suite

StorySpark maintains a test suite powered by Vitest verifying linguistic rules, diff calculations, import/export pipelines, and API integrations:

```bash
# Run the complete test suite
npm test

# Run tests in watch mode during active development
npm run test:watch
```

### Verified Test Suites (13 Suites, 73 Tests)
1. `tests/deterministic-checks.test.ts` (22 tests): Verifies repeated word detection, sentence length thresholds, passive voice auxiliary constructions, typography transformations, grammar confusions, and article agreements.
2. `tests/import-export.test.ts` (10 tests): Validates path traversal sanitization, Markdown compilation order, heading extraction, and plain text export.
3. `tests/lore-reference.test.ts` (7 tests): Tests Markdown link parsing, wiki-link detection (`[[Target|Anchor]]`), hover tooltip attribute parsing, and cursor boundary detection.
4. `tests/byom-providers.test.ts` (5 tests): Tests provider resolution, default endpoints, live model fetching, and OpenAI compatibility mappings.
5. `tests/character-world-suggestions-ai.test.ts` (5 tests): Validates AI story suggestion schema, character/lore payload assembly, and prompt construction.
6. `tests/suggestion-navigation.test.ts` (4 tests): Tests index matching, selection synchronizations, and focus navigation across the 3-pane layout.
7. `tests/diff-and-patch.test.ts` (4 tests): Verifies word-level diffing, replacement range patching, and clean undo state preservation.
8. `tests/ai-generate-content.test.ts` (4 tests): Tests length constraints, writing style guidance, and narrative prose generator endpoints.
9. `tests/novelcrafter-import.test.ts` (3 tests): Tests parsing of Novelcrafter `.zip` archives, scene splitting, character mapping, and location extraction.
10. `tests/ai-editorial-pass.test.ts` (3 tests): Validates "Show Don't Tell", sensory depth, dialogue, and pacing editorial analyzers.
11. `tests/collapsible-panes.test.ts` (3 tests): Tests 3-pane collapse persistence, keyboard shortcut event handling, and expanded source width calculations.
12. `tests/mongodb-persistence.test.ts` (2 tests): Tests file CRUD operations, settings upserts, and in-memory mock fallback logic.
13. `tests/e2e-happy-path.test.ts` (1 test): Full end-to-end authoring loop (scene creation → deterministic checks → passage rewrite → accept diff → compile novel).

---

## 🛡️ Privacy & Intellectual Property Guarantees

* **Zero Telemetry or Phone-Home Code**: No analytics beacons, Google Analytics, Sentry trackers, or external telemetry of any kind.
* **No Cloud Account Required**: No sign-ups, no monthly platform subscriptions, and no vendor lock-in.
* **Passage Isolation Guarantee**: When using AI drafting features, only the highlighted text snippet is sent alongside your specific instructions. StorySpark will never transmit your entire manuscript or project bible in the background.
* **Standard Open Formats**: Your writing is stored as standard Markdown (`.md`) and plain text (`.txt`), ensuring your work remains accessible in any text editor for decades to come.

