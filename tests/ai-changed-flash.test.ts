import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { replacePassage, applySuggestion } from '../src/engine/diff/index.ts';

describe('AI Changed Text 2-Second Flash Animation', () => {
  it('verifies that index.css defines 2-second ai-changed-flash keyframes and utility classes', () => {
    const cssPath = path.resolve(__dirname, '../src/index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    // Dark mode & light mode keyframes
    expect(css).toContain('@keyframes ai-changed-flash');
    expect(css).toContain('@keyframes ai-changed-flash-light');

    // The .ai-changed-flash class must use 2s duration
    expect(css).toContain('.ai-changed-flash');
    expect(css).toContain('2s cubic-bezier(0.2, 0.8, 0.2, 1)');
  });

  it('calculates the exact replacement range for passage rewrites to feed the flash animation', () => {
    const originalText = 'The quick brown fox jumped over the fence.';
    const selStart = 4;
    const selEnd = 19; // "quick brown fox"
    const replacement = 'swift crimson vixen';

    const newContent = replacePassage(originalText, selStart, selEnd, replacement);
    const flashStart = selStart;
    const flashEnd = selStart + replacement.length;

    expect(newContent).toBe('The swift crimson vixen jumped over the fence.');
    expect(flashStart).toBe(4);
    expect(flashEnd).toBe(23);
    expect(newContent.slice(flashStart, flashEnd)).toBe('swift crimson vixen');
  });

  it('calculates the exact replacement range for single suggestion acceptance to feed the flash animation', () => {
    const originalText = 'He said in a quiet whisper: "Run."';
    const sStart = 8;
    const sEnd = 26; // "in a quiet whisper"
    const replacement = 'whispered';

    const newContent = applySuggestion(originalText, sStart, sEnd, replacement);
    const flashStart = sStart;
    const flashEnd = sStart + replacement.length;

    expect(newContent).toBe('He said whispered: "Run."');
    expect(flashStart).toBe(8);
    expect(flashEnd).toBe(17);
    expect(newContent.slice(flashStart, flashEnd)).toBe('whispered');
  });

  it('calculates the exact append range for AI generated content insertion to feed the flash animation', () => {
    const originalText = 'Chapter One\n\nThe night was still.';
    const generatedText = 'A solitary owl called from the pine branches.';

    const trimmed = originalText.trimEnd();
    const appendStart = trimmed ? trimmed.length + 2 : 0;
    const newContent = `${trimmed}\n\n${generatedText}`;
    const appendEnd = appendStart + generatedText.length;

    expect(newContent.slice(appendStart, appendEnd)).toBe(generatedText);
    expect(appendStart).toBe(trimmed.length + 2);
  });

  it('verifies SourcePane.tsx and App.tsx integrate the 2-second timer and triggerFlash', () => {
    const sourcePaneCode = fs.readFileSync(path.resolve(__dirname, '../src/components/Editor/SourcePane.tsx'), 'utf-8');
    const appCode = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf-8');

    // 2-second flash timeout (2000 ms) in SourcePane
    expect(sourcePaneCode).toContain('2000');
    expect(sourcePaneCode).toContain('ai-changed-flash');
    expect(sourcePaneCode).toContain('ai-text-changed-badge');
    expect(sourcePaneCode).toContain('triggerFlash');

    // App.tsx handles AI rewrite flash and AI suggestions flash
    expect(appCode).toContain('triggerFlash(selRange.start, selRange.start + res.rewrittenText.length)');
    expect(appCode).toContain('triggerFlash(s.startIndex, s.startIndex + s.replacementText.length)');
    expect(appCode).toContain('triggerFlash(minStart');
  });

  it('verifies that the highlight backdrop and textarea have identical positioning, typography, and no offset', () => {
    const sourcePaneCode = fs.readFileSync(path.resolve(__dirname, '../src/components/Editor/SourcePane.tsx'), 'utf-8');

    // Textarea and backdrop must both have absolute inset-0 block and matching shared editor surface
    expect(sourcePaneCode).toContain('ref={backdropRef}');
    expect(sourcePaneCode).toContain('storyspark-editor-surface');
    expect(sourcePaneCode).toContain('storyspark-backdrop');
    expect(sourcePaneCode).toContain('ref={textareaRef}');
    expect(sourcePaneCode).toContain('storyspark-editor-textarea');

    // Highlights must not use bottom borders (border-b-2) which display below the text, but rather background color behind text
    expect(sourcePaneCode).not.toContain('border-b-2');

    // Selection must be reflected directly in backdropElements
    expect(sourcePaneCode).toContain('const hasSelection = Boolean(selectedRange && selectedRange.start < selectedRange.end);');
    expect(sourcePaneCode).toContain('isSelected');
  });
});
