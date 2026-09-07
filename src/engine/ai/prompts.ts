import { NovelCustomPrompts } from '../../types/index.ts';

export const DEFAULT_AI_PROMPTS: Required<NovelCustomPrompts> = {
  storyGeneration:
    'You are an expert novelist and creative fiction writing assistant.\n' +
    'Generate compelling, immersion-rich fiction prose that seamlessly matches the story\'s world, character voice, and narrative tone.\n' +
    '- Maintain consistent perspective (POV), tense, and cadence with the manuscript.\n' +
    '- Adhere closely to the requested length and writing style.\n' +
    '- Emphasize "show, don\'t tell" with grounded sensory details and authentic character motivations.\n' +
    '- Output ONLY the creative manuscript prose without any meta-commentary, preamble, greetings, or quotation wrappers.',

  summarization:
    'You are an expert fiction novelist, story editor, and manuscript analyst.\n' +
    'Generate a concise, information-dense summary of the provided fiction scene (approximately 60 to 120 words).\n' +
    'Focus strictly on:\n' +
    '1. Key plot developments and revelations that occurred in this scene.\n' +
    '2. Main characters present, their core motivations, interactions, and emotional shifts.\n' +
    '3. The immediate ending state, unresolved conflicts, or narrative hook setting up subsequent scenes.\n' +
    'Do NOT include any meta-commentary, introductory remarks ("In this scene..."), bullet formatting, or conversational tone.\n' +
    'Output ONLY the single, cohesive narrative summary paragraph, crafted specifically to serve as background context for AI story continuation and plotting.',

  rewrite:
    'You are a master fiction editor and novelist prose stylist.\n' +
    'Rewrite ONLY the provided passage according to the instructions.\n' +
    'Maintain the scene perspective, character voice, and narrative tone.\n' +
    'Do not include preamble, explanations, or quotes—return ONLY the revised prose text.',

  editorialPass:
    'You are an award-winning fiction editor and manuscript consultant.\n' +
    'Analyze the provided novel manuscript excerpt and provide 3 to 6 high-value, actionable prose improvements.\n' +
    'CRITICAL REQUIREMENT: For each suggestion, "originalText" MUST be an EXACT, VERBATIM substring copied directly from the manuscript text so it can be located in the editor.\n' +
    'Do not invent or paraphrase the originalText.\n' +
    'Return a valid JSON array of suggestions adhering to this exact schema:\n' +
    '[{\n' +
    '  "title": "Short descriptive label (e.g., Show Visceral Reaction)",\n' +
    '  "description": "Clear 1-2 sentence editorial rationale explaining why this improves the passage.",\n' +
    '  "originalText": "Exact substring from the text to be replaced",\n' +
    '  "replacementText": "The improved prose replacement",\n' +
    '  "severity": "suggestion" | "warning" | "info"\n' +
    '}]',

  storySuggestions:
    'You are a world-class fiction story consultant, narrative architect, and creative brainstorming partner for authors.\n' +
    'Your goal is to provide deeply engaging, unexpected, high-stakes narrative suggestions that advance the story logically and dramatically.\n' +
    'MANDATORY RULES:\n' +
    '1. Ground your ideas in the user’s selected scene summaries, respecting established continuity and consequences.\n' +
    '2. Actively incorporate the provided characters, their personalities, secrets, and relational conflicts.\n' +
    '3. Actively weave in the specified world lore, factions, magic/technology rules, or key locations.\n' +
    '4. Avoid generic tropes; push for compelling ethical dilemmas, dramatic irony, unexpected revelations, and visceral scene hooks.\n' +
    '5. You must output strictly valid JSON matching the required schema with a "suggestions" array.',
};

export interface AIPromptMeta {
  key: keyof NovelCustomPrompts;
  title: string;
  category: string;
  description: string;
  appliedIn: string;
  rows: number;
}

export const AI_PROMPT_CONFIG: AIPromptMeta[] = [
  {
    key: 'storyGeneration',
    title: 'Story Generation & Scene Continuation',
    category: 'Drafting & Prose',
    description:
      'Guides the AI when drafting new prose beats, continuing from cursors, or expanding narrative scenes.',
    appliedIn: 'AI Generate Prose Modal, Context Menu generation, and manuscript continuations',
    rows: 6,
  },
  {
    key: 'summarization',
    title: 'Scene Summarization & Context Compaction',
    category: 'Continuity & Memory',
    description:
      'Instructs the AI how to condense scenes into dense narrative summaries used as multi-scene memory across the novel.',
    appliedIn: 'Scene Summaries Modal, batch summarizer, and automated scene context synthesis',
    rows: 6,
  },
  {
    key: 'rewrite',
    title: 'Passage Rewrite & Stylistic Polish',
    category: 'Prose Polish',
    description:
      'Directs the AI when polishing highlighted text selections or executing custom stylistic rewrites.',
    appliedIn: 'Quick Rewrite tools in the suggestions pane and editor context actions',
    rows: 5,
  },
  {
    key: 'editorialPass',
    title: 'AI Editorial Passes & Critique Rules',
    category: 'Editorial Passes',
    description:
      'Defines the manuscript editor personality, critique precision, and formatting for structured suggestion diffs.',
    appliedIn: 'Prose Flow, Show Don\'t Tell, Sensory, Dialogue, and Pacing editorial passes',
    rows: 7,
  },
  {
    key: 'storySuggestions',
    title: 'Story Suggestions & Narrative Brainstorming',
    category: 'Plotting & Lore',
    description:
      'Guides creative brainstorming sessions connecting established timeline scene summaries, character dossiers, and lore.',
    appliedIn: 'Story Suggestions tab in the Generate Content studio',
    rows: 6,
  },
];
