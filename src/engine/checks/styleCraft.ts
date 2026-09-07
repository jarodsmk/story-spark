import { Suggestion } from '../../types/index.ts';
import { getNlpDoc, CompromiseDoc, getMatchOffsets } from './compromise.ts';

// 1. Weak & Crutch Words
interface WeakWordRule {
  query: string;
  title: string;
  description: string;
}

const WEAK_WORD_RULES: WeakWordRule[] = [
  {
    query: '(all of a sudden|suddenly)',
    title: 'Pacing: "Suddenly"',
    description:
      '"Suddenly" warns the reader before the surprise happens, diminishing tension. Let the action break in unannounced.',
  },
  {
    query: '(very|really|quite|somewhat|extremely) (#Adjective|#Adverb)',
    title: 'Crutch intensifier',
    description:
      'Intensifiers like "very" or "really" weaken prose. Consider substituting a more vivid, specific adjective or verb.',
  },
  {
    query: '(began|started) to #Verb',
    title: 'Inceptive crutch: "started/began to"',
    description:
      'Unless the action was interrupted, replacing "began to [verb]" with the direct past verb usually strengthens narrative tempo.',
  },
];

export function checkWeakWords(
  input: string | CompromiseDoc,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];
  const seenSpans = new Set<string>();

  for (const rule of WEAK_WORD_RULES) {
    const matches = doc.match(rule.query).json({ offset: true }) as any[];

    for (const m of matches) {
      if (!m.terms || m.terms.length === 0) continue;

      const offsets = getMatchOffsets(m, text);
      if (!offsets) continue;

      const { startIndex, endIndex, matchedText } = offsets;
      const spanKey = `${startIndex}-${endIndex}`;

      if (seenSpans.has(spanKey)) continue;
      seenSpans.add(spanKey);

      suggestions.push({
        id: `weak-${startIndex}-${endIndex}`,
        type: 'weak-word',
        title: `${rule.title}: "${matchedText}"`,
        description: rule.description,
        originalText: matchedText,
        replacementText: matchedText,
        startIndex,
        endIndex,
        ruleCategory: 'style',
        severity: 'suggestion',
      });
    }
  }

  return suggestions;
}

// 2. Redundant Adverbs & Physical Tautologies
interface RedundancyRule {
  query: string;
  replacement: (matchedText: string, terms: any[]) => string;
  reason: string;
}

const REDUNDANCY_RULES: RedundancyRule[] = [
  {
    query: '(whispered|murmured) (quietly|softly)',
    replacement: (_m, terms) => terms[0].text,
    reason: 'Whispering is inherently quiet; the adverb is redundant.',
  },
  {
    query: '(shouted|screamed|yelled|bellowed) loudly',
    replacement: (_m, terms) => terms[0].text,
    reason: 'Shouting is inherently loud; the adverb adds clutter.',
  },
  {
    query: 'nodded #Possessive? head',
    replacement: () => 'nodded',
    reason: 'One can only nod one\'s head; "nodded" alone is cleaner.',
  },
  {
    query: 'shrugged #Possessive? shoulders',
    replacement: () => 'shrugged',
    reason: 'One can only shrug one\'s shoulders; "shrugged" alone is punchier.',
  },
  {
    query: 'blinked #Possessive? eyes',
    replacement: () => 'blinked',
    reason: 'Blinking is always done with eyes; "blinked" alone is standard fiction craft.',
  },
  {
    query: '(smiled|grinned) (happily|cheerfully)',
    replacement: (_m, terms) => terms[0].text,
    reason: 'The emotion is already implied by the verb.',
  },
  {
    query: 'frowned sadly',
    replacement: () => 'frowned',
    reason: 'A frown already communicates displeasure or sorrow.',
  },
  {
    query: '(cried|wept) tears',
    replacement: (_m, terms) => terms[0].text,
    reason: 'Crying or weeping already involves tears.',
  },
  {
    query: 'clenched #Possessive? fists tightly',
    replacement: (full) => full.replace(/\s+tightly/i, ''),
    reason: 'Clenching fists already denotes tightness.',
  },
];

export function checkRedundantAdverbs(
  input: string | CompromiseDoc,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];
  const seenSpans = new Set<string>();

  for (const rule of REDUNDANCY_RULES) {
    const matches = doc.match(rule.query).json({ offset: true }) as any[];

    for (const m of matches) {
      if (!m.terms || m.terms.length === 0) continue;

      const offsets = getMatchOffsets(m, text);
      if (!offsets) continue;

      const { startIndex, endIndex, matchedText } = offsets;
      const spanKey = `${startIndex}-${endIndex}`;

      if (seenSpans.has(spanKey)) continue;
      seenSpans.add(spanKey);

      const replacementText = rule.replacement(matchedText, m.terms);

      suggestions.push({
        id: `red-${startIndex}-${endIndex}`,
        type: 'redundant-adverb',
        title: `Redundant modifier: "${matchedText}"`,
        description: rule.reason,
        originalText: matchedText,
        replacementText,
        startIndex,
        endIndex,
        ruleCategory: 'style',
        severity: 'suggestion',
      });
    }
  }

  return suggestions;
}

// 3. Fiction Clichés & Worn Idioms
interface ClichePattern {
  query: string;
  title: string;
  advice: string;
}

const CLICHES: ClichePattern[] = [
  { query: 'cold as ice', title: 'cold as ice', advice: 'Classic cliché. Try describing a unique tactile sensation.' },
  { query: 'dark and stormy', title: 'dark and stormy', advice: 'Iconic opening cliché. Paint a fresh meteorological portrait.' },
  { query: 'heart skipped a beat', title: 'heart skipped a beat', advice: 'Overused physiological reaction. Describe a visceral involuntary response.' },
  { query: 'heart was in #Possessive? throat', title: 'heart in throat', advice: 'Overused idiom for dread or panic.' },
  { query: 'breath caught in #Possessive? throat', title: 'breath caught in throat', advice: 'Frequent stock phrase in dramatic scenes.' },
  { query: 'white as a (sheet|ghost)', title: 'white as a sheet/ghost', advice: 'Conventional fiction simile. Ground the pallor in the scene lighting.' },
  { query: 'dead as a doornail', title: 'dead as a doornail', advice: 'Stale idiom. Describe the physical stillness or finality directly.' },
  { query: 'time stood still', title: 'time stood still', advice: 'Well-worn description for high-stress temporal distortion.' },
  { query: 'like a moth to a flame', title: 'like a moth to a flame', advice: 'Overfamiliar idiom for fatal attraction.' },
  { query: 'in the blink of an eye', title: 'in the blink of an eye', advice: 'Common stock phrase. Let the swiftness emerge from the syntax.' },
  { query: 'nerves of steel', title: 'nerves of steel', advice: 'Trite characterization cliché.' },
  { query: 'chilled to the bone', title: 'chilled to the bone', advice: 'Overused sensory idiom.' },
  { query: '(deafening|piercing) silence', title: 'deafening silence', advice: 'Oxymoronic cliché. Specify what sounds were conspicuously absent.' },
  { query: 'blood ran cold', title: 'blood ran cold', advice: 'Worn-out horror and suspense trope.' },
  { query: 'butterflies in #Possessive? stomach', title: 'butterflies in stomach', advice: 'Universal stock idiom for nervousness.' },
];

export function checkCliches(
  input: string | CompromiseDoc,
  rawText?: string
): Suggestion[] {
  const doc = getNlpDoc(input);
  const text = typeof input === 'string' ? input : (rawText ?? doc.text());
  const suggestions: Suggestion[] = [];
  const seenSpans = new Set<string>();

  for (const item of CLICHES) {
    const matches = doc.match(item.query).json({ offset: true }) as any[];

    for (const m of matches) {
      if (!m.terms || m.terms.length === 0) continue;

      const offsets = getMatchOffsets(m, text);
      if (!offsets) continue;

      const { startIndex, endIndex, matchedText } = offsets;
      const spanKey = `${startIndex}-${endIndex}`;

      if (seenSpans.has(spanKey)) continue;
      seenSpans.add(spanKey);

      suggestions.push({
        id: `cliche-${startIndex}-${endIndex}`,
        type: 'cliche',
        title: `Cliché phrase: "${matchedText}"`,
        description: item.advice,
        originalText: matchedText,
        replacementText: matchedText,
        startIndex,
        endIndex,
        ruleCategory: 'style',
        severity: 'info',
      });
    }
  }

  return suggestions;
}
