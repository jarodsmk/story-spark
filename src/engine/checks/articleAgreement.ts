import { Suggestion } from '../../types/index.ts';

// Words requiring "an" because they start with a vowel sound (including silent 'h')
const VOWEL_SOUND_WORDS = new Set([
  'apple', 'arrow', 'axe', 'arc', 'archer', 'answer', 'armor', 'anchor',
  'empty', 'elephant', 'echo', 'elevator', 'ember', 'elder', 'entrance', 'enigma',
  'island', 'inn', 'innocent', 'iron', 'incident', 'illusion', 'omen', 'old',
  'orange', 'orc', 'outcast', 'ogre', 'order', 'officer', 'omen', 'orphan',
  'urgent', 'unusual', 'ugly', 'umbrella', 'unknown', 'unexpected', 'uneasy',
  'hour', 'hours', 'hourly', 'honest', 'honorable', 'honor', 'heir', 'heiress',
]);

// Words requiring "a" because they start with a consonant sound (including 'u' as 'yu')
const CONSONANT_SOUND_WORDS = new Set([
  'sword', 'shield', 'horse', 'dragon', 'man', 'woman', 'tavern', 'ship',
  'castle', 'knife', 'shadow', 'light', 'dark', 'sudden', 'quiet', 'cold',
  'warm', 'spear', 'bow', 'blade', 'king', 'queen', 'soldier', 'stranger',
  'friend', 'whisper', 'torch', 'tower', 'door', 'room', 'path', 'forest',
  'hero', 'house', 'human', 'heart', 'hand', 'heavy', 'high', 'hole', 'hill',
  // 'u' sounding like 'yu'
  'unique', 'university', 'uniform', 'unison', 'universal', 'user', 'euphemism', 'european',
]);

export function checkArticleAgreement(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Pattern: "a" or "an" followed by space and a word
  const regex = /\b(a|an)\s+([a-zA-Z]+)\b/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const article = match[1];
    const nextWord = match[2];
    const nextWordLower = nextWord.toLowerCase();
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;

    const isCapital = article[0] === article[0].toUpperCase();

    // Check "a" before vowel sound
    if (article.toLowerCase() === 'a' && VOWEL_SOUND_WORDS.has(nextWordLower)) {
      const correctArticle = isCapital ? 'An' : 'an';
      suggestions.push({
        id: `art-${startIndex}-${endIndex}`,
        type: 'grammar',
        title: `Article agreement: "${correctArticle} ${nextWord}"`,
        description: `Use "${correctArticle}" before vowel sounds like "${nextWord}".`,
        originalText: fullMatch,
        replacementText: `${correctArticle} ${nextWord}`,
        startIndex,
        endIndex,
        ruleCategory: 'grammar',
        severity: 'warning',
      });
      continue;
    }

    // Check "an" before consonant sound
    if (article.toLowerCase() === 'an' && CONSONANT_SOUND_WORDS.has(nextWordLower)) {
      const correctArticle = isCapital ? 'A' : 'a';
      suggestions.push({
        id: `art-${startIndex}-${endIndex}`,
        type: 'grammar',
        title: `Article agreement: "${correctArticle} ${nextWord}"`,
        description: `Use "${correctArticle}" before consonant sounds like "${nextWord}".`,
        originalText: fullMatch,
        replacementText: `${correctArticle} ${nextWord}`,
        startIndex,
        endIndex,
        ruleCategory: 'grammar',
        severity: 'warning',
      });
    }
  }

  return suggestions;
}
