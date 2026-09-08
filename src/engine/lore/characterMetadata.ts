import { sanitizeFilename } from '../markdown/index.ts';

export interface CustomAttribute {
  key: string;
  value: string;
}

export interface CharacterMetadata {
  id: string; // File path e.g. 'bible/characters/kaelen.md'
  filePath: string;
  filename: string;
  name: string;
  role: string;
  archetype: string;
  status: string; // e.g. 'Active' | 'Major' | 'Supporting' | 'Antagonist' | 'Deceased' | 'Missing'
  age: string;
  aliases: string;
  appearance: string;
  goal: string;
  conflict: string;
  stakes: string;
  mannerisms: string;
  affiliation: string;
  relationships: string;
  tags: string;
  summary: string;
  customAttributes: CustomAttribute[];
  notes: string;
  updatedAt?: number;
}

/**
 * Creates an empty/default CharacterMetadata object.
 */
export function createDefaultCharacterMetadata(
  name: string = 'New Character',
  filePath: string = ''
): CharacterMetadata {
  const cleanName = name.trim() || 'New Character';
  const filename = filePath ? (filePath.split('/').pop() || '') : `${sanitizeFilename(cleanName.toLowerCase())}.md`;
  return {
    id: filePath || filename,
    filePath,
    filename,
    name: cleanName,
    role: 'Supporting Character',
    archetype: '',
    status: 'Active',
    age: '',
    aliases: '',
    appearance: '',
    goal: '',
    conflict: '',
    stakes: '',
    mannerisms: '',
    affiliation: '',
    relationships: '',
    tags: '',
    summary: '',
    customAttributes: [],
    notes: '',
    updatedAt: Date.now(),
  };
}

/**
 * Parses markdown into structured CharacterMetadata.
 */
export function parseCharacterMetadata(filePath: string, content: string): CharacterMetadata {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const filename = normalizedPath.split('/').pop() || filePath;

  // Initial name derived from filename
  let name = filename
    .replace(/\.(md|markdown|txt)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const lines = content.split('\n');
  const attributes: Record<string, string> = {};
  const descriptionLines: string[] = [];
  let inNotesSection = false;
  const notesLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check for Markdown H1: # Character: Name or # Name
    if (i === 0 || (line.startsWith('#') && !line.startsWith('##'))) {
      const headingMatch = line.replace(/^#+\s*/, '');
      const cleanHeading = headingMatch.replace(/^character:\s*/i, '').trim();
      if (cleanHeading) {
        name = cleanHeading;
      }
      continue;
    }

    // Check for Section headers e.g. ## Notes or ## Backstory
    if (line.startsWith('##')) {
      inNotesSection = true;
      continue;
    }

    // Check for bullet attributes: - **Key**: Value or * Key: Value
    const attrMatch = line.match(/^[-*]\s*(?:\*\*)?([A-Za-z0-9_\s-]+)(?:\*\*)?:\s*(.*)$/);
    if (attrMatch && !inNotesSection) {
      const key = attrMatch[1].trim();
      const val = attrMatch[2].trim();
      attributes[key] = val;
      continue;
    }

    if (inNotesSection) {
      notesLines.push(rawLine);
    } else if (line.length > 0) {
      descriptionLines.push(rawLine);
    }
  }

  // Map known standard attributes (case-insensitive lookup)
  const getAttr = (keys: string[]): string => {
    for (const k of keys) {
      for (const [attrKey, attrVal] of Object.entries(attributes)) {
        if (attrKey.toLowerCase() === k.toLowerCase() && attrVal !== undefined) {
          return attrVal;
        }
      }
    }
    return '';
  };

  const role = getAttr(['Role', 'Occupation', 'Profession']);
  const archetype = getAttr(['Archetype', 'Type', 'Category']);
  const status = getAttr(['Status', 'State']) || 'Active';
  const age = getAttr(['Age', 'Birth', 'Birthday']);
  const aliases = getAttr(['Aliases', 'Alias', 'Nicknames', 'Nickname', 'Also Known As']);
  const appearance = getAttr(['Appearance', 'Physical Description', 'Looks', 'Physique']);
  const goal = getAttr(['Goal', 'Motivation', 'Objective', 'Desire']);
  const conflict = getAttr(['Conflict', 'Internal Conflict', 'Flaw', 'Fear', 'Weakness']);
  const stakes = getAttr(['Stakes', 'What\'s at Stake', 'Consequence']);
  const mannerisms = getAttr(['Mannerisms', 'Habits', 'Voice', 'Speech']);
  const affiliation = getAttr(['Affiliation', 'Faction', 'Group', 'Organization', 'Allegiance']);
  const relationships = getAttr(['Relationships', 'Ties', 'Allies', 'Family']);
  const tags = getAttr(['Tags', 'Keywords']);
  const summary = getAttr(['Summary', 'Brief', 'Logline']);

  // Extract remaining non-standard attributes as customAttributes
  const standardKeySet = new Set([
    'role', 'occupation', 'profession',
    'archetype', 'type', 'category',
    'status', 'state',
    'age', 'birth', 'birthday',
    'aliases', 'alias', 'nicknames', 'nickname', 'also known as',
    'appearance', 'physical description', 'looks', 'physique',
    'goal', 'motivation', 'objective', 'desire',
    'conflict', 'internal conflict', 'flaw', 'fear', 'weakness',
    'stakes', "what's at stake", 'consequence',
    'mannerisms', 'habits', 'voice', 'speech',
    'affiliation', 'faction', 'group', 'organization', 'allegiance',
    'relationships', 'ties', 'allies', 'family',
    'tags', 'keywords',
    'summary', 'brief', 'logline',
  ]);

  const customAttributes: CustomAttribute[] = [];
  for (const [k, v] of Object.entries(attributes)) {
    if (!standardKeySet.has(k.toLowerCase())) {
      customAttributes.push({ key: k, value: v });
    }
  }

  // Compose notes from collected lines
  let notes = notesLines.join('\n').trim();
  if (!notes && descriptionLines.length > 0) {
    notes = descriptionLines.join('\n').trim();
  }

  return {
    id: normalizedPath,
    filePath: normalizedPath,
    filename,
    name,
    role,
    archetype,
    status,
    age,
    aliases,
    appearance,
    goal,
    conflict,
    stakes,
    mannerisms,
    affiliation,
    relationships,
    tags,
    summary,
    customAttributes,
    notes,
    updatedAt: Date.now(),
  };
}

/**
 * Serializes CharacterMetadata into clean, standardized markdown format.
 */
export function serializeCharacterMetadata(meta: CharacterMetadata): string {
  const cleanName = meta.name.trim() || 'Unnamed Character';
  const chunks: string[] = [];

  chunks.push(`# Character: ${cleanName}\n`);

  const addAttr = (key: string, val?: string) => {
    if (val && val.trim()) {
      chunks.push(`- **${key}**: ${val.trim()}`);
    }
  };

  addAttr('Role', meta.role);
  addAttr('Archetype', meta.archetype);
  addAttr('Status', meta.status);
  addAttr('Age', meta.age);
  addAttr('Aliases', meta.aliases);
  addAttr('Appearance', meta.appearance);
  addAttr('Goal', meta.goal);
  addAttr('Conflict', meta.conflict);
  addAttr('Stakes', meta.stakes);
  addAttr('Mannerisms', meta.mannerisms);
  addAttr('Affiliation', meta.affiliation);
  addAttr('Relationships', meta.relationships);
  addAttr('Tags', meta.tags);
  addAttr('Summary', meta.summary);

  // Custom attributes
  if (meta.customAttributes && meta.customAttributes.length > 0) {
    for (const custom of meta.customAttributes) {
      if (custom.key && custom.key.trim() && custom.value && custom.value.trim()) {
        addAttr(custom.key.trim(), custom.value.trim());
      }
    }
  }

  // Notes and backstory section
  if (meta.notes && meta.notes.trim()) {
    chunks.push(`\n## Notes & Backstory\n\n${meta.notes.trim()}\n`);
  } else {
    chunks.push('');
  }

  return chunks.join('\n');
}
