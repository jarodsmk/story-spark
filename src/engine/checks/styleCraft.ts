import { Suggestion } from '../../types/index.ts';

// 1. Weak & Crutch Words
interface WeakWordRule {
  pattern: RegExp;
  title: string;
  description: string;
  suggestedReplacement?: (m: RegExpExecArray) => string;
}

const WEAK_WORD_RULES: WeakWordRule[] = [
  {
    pattern: /\b(all\s+of\s+a\s+sudden|suddenly)\b/gi,
    title: 'Pacing: "Suddenly"',
    description: '"Suddenly" warns the reader before the surprise happens, diminishing tension. Let the action break in unannounced.',
  },
  {
    pattern: /\b(very|really|quite|somewhat|extremely)\s+([a-zA-Z]+)\b/gi,
    title: 'Crutch intensifier',
    description: 'Intensifiers like "very" or "really" weaken prose. Consider substituting a more vivid, specific adjective or verb.',
  },
  {
    pattern: /\b(began|started)\s+to\s+([a-zA-Z]+)\b/gi,
    title: 'Inceptive crutch: "started/began to"',
    description: 'Unless the action was interrupted, replacing "began to [verb]" with the direct past verb usually strengthens narrative tempo.',
  },
];

export function checkWeakWords(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const rule of WEAK_WORD_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      suggestions.push({
        id: `weak-${startIndex}-${endIndex}`,
        type: 'weak-word',
        title: `${rule.title}: "${fullMatch}"`,
        description: rule.description,
        originalText: fullMatch,
        replacementText: fullMatch,
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
  pattern: RegExp;
  replacement: (m: RegExpExecArray) => string;
  reason: string;
}

const REDUNDANCY_RULES: RedundancyRule[] = [
  {
    pattern: /\b(whispered|murmured)\s+(quietly|softly)\b/gi,
    replacement: (m) => m[1],
    reason: 'Whispering is inherently quiet; the adverb is redundant.',
  },
  {
    pattern: /\b(shouted|screamed|yelled|bellowed)\s+loudly\b/gi,
    replacement: (m) => m[1],
    reason: 'Shouting is inherently loud; the adverb adds clutter.',
  },
  {
    pattern: /\bnodded\s+(his|her|their|my|our)\s+head\b/gi,
    replacement: () => 'nodded',
    reason: 'One can only nod one\'s head; "nodded" alone is cleaner.',
  },
  {
    pattern: /\bshrugged\s+(his|her|their|my|our)\s+shoulders\b/gi,
    replacement: () => 'shrugged',
    reason: 'One can only shrug one\'s shoulders; "shrugged" alone is punchier.',
  },
  {
    pattern: /\bblinked\s+(his|her|their|my|our)\s+eyes\b/gi,
    replacement: () => 'blinked',
    reason: 'Blinking is always done with eyes; "blinked" alone is standard fiction craft.',
  },
  {
    pattern: /\b(smiled|grinned)\s+(happily|cheerfully)\b/gi,
    replacement: (m) => m[1],
    reason: 'The emotion is already implied by the verb.',
  },
  {
    pattern: /\bfrowned\s+sadly\b/gi,
    replacement: () => 'frowned',
    reason: 'A frown already communicates displeasure or sorrow.',
  },
  {
    pattern: /\b(cried|wept)\s+tears\b/gi,
    replacement: (m) => m[1],
    reason: 'Crying or weeping already involves tears.',
  },
  {
    pattern: /\bclenched\s+(his|her|their)\s+fists\s+tightly\b/gi,
    replacement: (m) => `clenched ${m[1]} fists`,
    reason: 'Clenching fists already denotes tightness.',
  },
];

export function checkRedundantAdverbs(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const rule of REDUNDANCY_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;
      const replacementText = rule.replacement(match);

      suggestions.push({
        id: `red-${startIndex}-${endIndex}`,
        type: 'redundant-adverb',
        title: `Redundant modifier: "${fullMatch}"`,
        description: rule.reason,
        originalText: fullMatch,
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
const CLICHES: { pattern: RegExp; title: string; advice: string }[] = [
  { pattern: /\bcold\s+as\s+ice\b/gi, title: 'cold as ice', advice: 'Classic cliché. Try describing a unique tactile sensation.' },
  { pattern: /\bdark\s+and\s+stormy\b/gi, title: 'dark and stormy', advice: 'Iconic opening cliché. Paint a fresh meteorological portrait.' },
  { pattern: /\bheart\s+skipped\s+a\s+beat\b/gi, title: 'heart skipped a beat', advice: 'Overused physiological reaction. Describe a visceral involuntary response.' },
  { pattern: /\bheart\s+was\s+in\s+(his|her|their|my)\s+throat\b/gi, title: 'heart in throat', advice: 'Overused idiom for dread or panic.' },
  { pattern: /\bbreath\s+caught\s+in\s+(his|her|their|my)\s+throat\b/gi, title: 'breath caught in throat', advice: 'Frequent stock phrase in dramatic scenes.' },
  { pattern: /\bwhite\s+as\s+a\s+(sheet|ghost)\b/gi, title: 'white as a sheet/ghost', advice: 'Conventional fiction simile. Ground the pallor in the scene lighting.' },
  { pattern: /\bdead\s+as\s+a\s+doornail\b/gi, title: 'dead as a doornail', advice: 'Stale idiom. Describe the physical stillness or finality directly.' },
  { pattern: /\btime\s+stood\s+still\b/gi, title: 'time stood still', advice: 'Well-worn description for high-stress temporal distortion.' },
  { pattern: /\blike\s+a\s+moth\s+to\s+a\s+flame\b/gi, title: 'like a moth to a flame', advice: 'Overfamiliar idiom for fatal attraction.' },
  { pattern: /\bin\s+the\s+blink\s+of\s+an\s+eye\b/gi, title: 'in the blink of an eye', advice: 'Common stock phrase. Let the swiftness emerge from the syntax.' },
  { pattern: /\bnerves\s+of\s+steel\b/gi, title: 'nerves of steel', advice: 'Trite characterization cliché.' },
  { pattern: /\bchilled\s+to\s+the\s+bone\b/gi, title: 'chilled to the bone', advice: 'Overused sensory idiom.' },
  { pattern: /\b(deafening|piercing)\s+silence\b/gi, title: 'deafening silence', advice: 'Oxymoronic cliché. Specify what sounds were conspicuously absent.' },
  { pattern: /\bblood\s+ran\s+cold\b/gi, title: 'blood ran cold', advice: 'Worn-out horror and suspense trope.' },
  { pattern: /\bbutterflies\s+in\s+(his|her|their|my)\s+stomach\b/gi, title: 'butterflies in stomach', advice: 'Universal stock idiom for nervousness.' },
];

export function checkCliches(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const item of CLICHES) {
    const regex = new RegExp(item.pattern.source, item.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      suggestions.push({
        id: `cliche-${startIndex}-${endIndex}`,
        type: 'cliche',
        title: `Cliché phrase: "${fullMatch}"`,
        description: item.advice,
        originalText: fullMatch,
        replacementText: fullMatch,
        startIndex,
        endIndex,
        ruleCategory: 'style',
        severity: 'info',
      });
    }
  }

  return suggestions;
}
