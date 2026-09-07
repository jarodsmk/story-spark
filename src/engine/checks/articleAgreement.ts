import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc, getMatchOffsets } from './compromise.ts';

// Words requiring "an" because they start with a vowel sound (including silent 'h')
const VOWEL_SOUND_WORDS = new Set([
  'apple', 'arrow', 'axe', 'arc', 'archer', 'answer', 'armor', 'anchor',
  'empty', 'elephant', 'echo', 'elevator', 'ember', 'elder', 'entrance', 'enigma',
  'island', 'inn', 'innocent', 'iron', 'incident', 'illusion', 'omen', 'old',
  'orange', 'orc', 'outcast', 'ogre', 'order', 'officer', 'orphan',
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

/**
 * Checks for indefinite article agreement ("a" vs "an") powered by spencermountain/compromise
 * determiner and token parsing.
 */
export function checkArticleAgreement(
  input: string | CompromiseDoc,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];

  const matches = doc.match('(a|an) .').json({ offset: true }) as any[];

  for (const m of matches) {
    if (!m.terms || m.terms.length < 2) continue;
    const t0 = m.terms[0];
    const t1 = m.terms[1];

    const article = t0.text;
    const articleLower = article.toLowerCase();
    const nextWord = t1.text;
    const nextWordLower = (t1.normal || nextWord).toLowerCase();

    const offsets = getMatchOffsets(m, text);
    if (!offsets) continue;

    const { startIndex, endIndex, matchedText } = offsets;
    const isCapital = article[0] === article[0].toUpperCase();

    // Check "a" before vowel sound
    if (articleLower === 'a' && VOWEL_SOUND_WORDS.has(nextWordLower)) {
      const correctArticle = isCapital ? 'An' : 'an';
      suggestions.push({
        id: `art-${startIndex}-${endIndex}`,
        type: 'grammar',
        title: `Article agreement: "${correctArticle} ${nextWord}"`,
        description: `Use "${correctArticle}" before vowel sounds like "${nextWord}".`,
        originalText: matchedText,
        replacementText: `${correctArticle} ${nextWord}`,
        startIndex,
        endIndex,
        severity: 'warning',
      });
      continue;
    }

    // Check "an" before consonant sound
    if (articleLower === 'an' && CONSONANT_SOUND_WORDS.has(nextWordLower)) {
      const correctArticle = isCapital ? 'A' : 'a';
      suggestions.push({
        id: `art-${startIndex}-${endIndex}`,
        type: 'grammar',
        title: `Article agreement: "${correctArticle} ${nextWord}"`,
        description: `Use "${correctArticle}" before consonant sounds like "${nextWord}".`,
        originalText: matchedText,
        replacementText: `${correctArticle} ${nextWord}`,
        startIndex,
        endIndex,
        severity: 'warning',
      });
    }
  }

  return suggestions;
}
