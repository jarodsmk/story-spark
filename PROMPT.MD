Build a personal replacement for Novelcrafter, called 'StorySpark' in an empty repository.
Use Tauri 2, React, TypeScript, SQLite, and a small Rust filesystem layer; do not offer alternative stacks.
The core loop is: organize a novel bible, scenes, and characters in local Markdown, apply optional bring-your-own-model drafting passes with diffs, and save or export without uploading the manuscript.
Make the first run work locally with one documented command.
Store all user data locally by default and make export straightforward.
Put secrets in .env, ship .env.example, and never commit credentials.
Create a three-pane editor with source text, suggestion list, and accepted-result preview.
Implement deterministic checks for repeated words, sentence length, passive constructions, and typography.
Add an optional API-backed rewrite action that sends only the selected passage.
Show every change as an accept-or-reject diff and support undo.
Import and export .txt and .md while preserving headings and lists.
Persist user rules, ignored terms, and recent documents in SQLite.
Include clear empty, loading, success, and recoverable error states.
Add input validation, safe filenames, and graceful handling of unavailable APIs.
Write focused tests for the core transformation and one end-to-end happy path.
Create a README with setup, architecture, permissions, data location, and backup steps.
Do not add accounts, billing, telemetry, analytics, or a hosted control plane.
Deliberately leave out a browser extension.
Deliberately leave out Office or Google Docs plugins.
Deliberately leave out collaborative editing and cloud sync.
Finish by running the tests and listing the exact commands used.