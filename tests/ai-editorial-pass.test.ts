import { describe, it, expect } from 'vitest';
import { Suggestion } from '../src/types/index.ts';
import { applySuggestion, applyMultipleSuggestions } from '../src/engine/diff/index.ts';

describe('AI Editorial Pass & Suggestions Engine', () => {
  it('correctly creates and validates an AI suggestion object', () => {
    const text = 'She was shivering in the bitter wind outside the chapel.';
    const originalText = 'was shivering';
    const startIndex = text.indexOf(originalText);
    const endIndex = startIndex + originalText.length;

    const aiSuggestion: Suggestion = {
      id: 'ai-test-1',
      type: 'ai-rewrite',
      title: 'Show, Don\'t Tell',
      description: 'Replace generic shivering with sensory detail',
      originalText,
      replacementText: 'pulled her threadbare coat tight against her chest',
      startIndex,
      endIndex,
      ruleCategory: 'ai',
      severity: 'suggestion',
    };

    expect(aiSuggestion.ruleCategory).toBe('ai');
    expect(aiSuggestion.type).toBe('ai-rewrite');
    expect(text.slice(aiSuggestion.startIndex, aiSuggestion.endIndex)).toBe('was shivering');

    const result = applySuggestion(
      text,
      aiSuggestion.startIndex,
      aiSuggestion.endIndex,
      aiSuggestion.replacementText
    );
    expect(result).toBe('She pulled her threadbare coat tight against her chest in the bitter wind outside the chapel.');
  });

  it('accurately applies multiple AI passes sequentially without character corruption', () => {
    const scene = 'The old door was loud. Julian walked into the library and saw the tome.';
    // Pass 1: "was loud" -> "groaned on rusted hinges"
    // Pass 2: "saw the tome" -> "found the leather-bound grimoire waiting"
    const sug1: Suggestion = {
      id: 'ai-1',
      type: 'ai-rewrite',
      title: 'Sensory Detail',
      description: 'Make door sound visceral',
      originalText: 'was loud',
      replacementText: 'groaned on rusted hinges',
      startIndex: scene.indexOf('was loud'),
      endIndex: scene.indexOf('was loud') + 'was loud'.length,
      ruleCategory: 'ai',
      severity: 'suggestion',
    };

    const sug2: Suggestion = {
      id: 'ai-2',
      type: 'ai-rewrite',
      title: 'Show, Don\'t Tell',
      description: 'Strengthen verb and object',
      originalText: 'saw the tome',
      replacementText: 'found the leather-bound grimoire waiting',
      startIndex: scene.indexOf('saw the tome'),
      endIndex: scene.indexOf('saw the tome') + 'saw the tome'.length,
      ruleCategory: 'ai',
      severity: 'suggestion',
    };

    const updated = applyMultipleSuggestions(scene, [sug1, sug2]);
    expect(updated).toBe(
      'The old door groaned on rusted hinges. Julian walked into the library and found the leather-bound grimoire waiting.'
    );
  });

  it('filters suggestions properly under the AI tab filter', () => {
    const mixedSuggestions: Suggestion[] = [
      {
        id: 'rule-rep-1',
        type: 'repeated-word',
        title: 'Repeated Word',
        description: 'Repeated word',
        originalText: 'the the',
        replacementText: 'the',
        startIndex: 0,
        endIndex: 7,
        ruleCategory: 'grammar',
        severity: 'warning',
      },
      {
        id: 'ai-1',
        type: 'ai-rewrite',
        title: 'Dialogue Polish',
        description: 'Cut filler',
        originalText: 'Well, you know',
        replacementText: 'Listen',
        startIndex: 20,
        endIndex: 34,
        ruleCategory: 'ai',
        severity: 'suggestion',
      },
      {
        id: 'rule-typo-1',
        type: 'typography',
        title: 'Straight Quotes',
        description: 'Smart quotes',
        originalText: '"Hello"',
        replacementText: '“Hello”',
        startIndex: 50,
        endIndex: 57,
        ruleCategory: 'typography',
        severity: 'info',
      },
    ];

    const aiFiltered = mixedSuggestions.filter(s => s.ruleCategory === 'ai');
    expect(aiFiltered.length).toBe(1);
    expect(aiFiltered[0].title).toBe('Dialogue Polish');
  });
});
