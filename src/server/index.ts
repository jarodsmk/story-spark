import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { geminiRouter } from './gemini.ts';

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'storyspark';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api/ai', geminiRouter);

// In-memory fallback collection for AI Studio preview / offline MongoDB
class InMemoryCollection {
  private docs: any[] = [];

  constructor(initialDocs: any[] = []) {
    this.docs = [...initialDocs];
  }

  async countDocuments(): Promise<number> {
    return this.docs.length;
  }

  async insertMany(newDocs: any[]): Promise<void> {
    this.docs.push(...newDocs);
  }

  find(query: any = {}) {
    let result = [...this.docs];
    if (query.path && query.path.$regex) {
      const reg = new RegExp(query.path.$regex);
      result = result.filter(d => reg.test(d.path));
    }
    return {
      toArray: async () => result,
    };
  }

  async findOne(query: any): Promise<any | null> {
    if (query.path) {
      return this.docs.find(d => d.path === query.path) || null;
    }
    if (query.key) {
      return this.docs.find(d => d.key === query.key) || null;
    }
    return null;
  }

  async updateOne(filter: any, update: any, options?: { upsert?: boolean }) {
    let doc = await this.findOne(filter);
    if (!doc) {
      if (options?.upsert) {
        doc = { ...filter, ...(update.$set || {}) };
        this.docs.push(doc);
        return { upsertedCount: 1, modifiedCount: 0 };
      }
      return { upsertedCount: 0, modifiedCount: 0 };
    }
    Object.assign(doc, update.$set || {});
    return { upsertedCount: 0, modifiedCount: 1 };
  }

  async deleteOne(filter: any) {
    const idx = this.docs.findIndex(d => (filter.path ? d.path === filter.path : false));
    if (idx !== -1) {
      this.docs.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
}

class InMemoryDb {
  private filesCol = new InMemoryCollection();
  private settingsCol = new InMemoryCollection();

  collection(name: string) {
    if (name === 'files') return this.filesCol;
    if (name === 'settings') return this.settingsCol;
    return new InMemoryCollection();
  }

  async command(cmd: any) {
    if (cmd.ping) return { ok: 1 };
    return { ok: 1 };
  }
}

const inMemoryFallbackDb = new InMemoryDb();
let isUsingInMemory = false;
let client: MongoClient | null = null;
let db: any = null;

async function getDb() {
  if (isUsingInMemory) {
    return inMemoryFallbackDb;
  }
  if (!db) {
    if (!mongoUri) {
      console.warn('[AI Studio] No MONGODB_URI configured — using in-memory database fallback');
      isUsingInMemory = true;
      return inMemoryFallbackDb;
    }
    try {
      client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });
      await client.connect();
      db = client.db(dbName);
    } catch (err: any) {
      console.warn('[AI Studio] MongoDB connection failed, falling back to in-memory store:', err.message);
      isUsingInMemory = true;
      return inMemoryFallbackDb;
    }
  }
  return db;
}

// Initial seed data if collection is missing default files
async function seedDefaultDataIfEmpty(database: any) {
  const filesCol = database.collection('files');
  const defaultFiles = [
    {
      path: 'scenes/01-prologue.md',
      content: `# Prologue: The Whisper of Ash\n\nThe sky above the port was the color of television, tuned to a dead channel. It had been raining for three days straight, and the the old stone piers were slick as oiled slate.\n\nKaelen pulled his wool coat tighter around his shivering shoulders. He had had enough of cold harbors and whispered promises from men who never kept their word. The letter was was crumpled in his damp pocket, its wax seal cracked and broken.\n\n"Are you waiting for the midnight cutter?" a voice rasped from the fog behind him.\n\nHe turned slowly. A woman with silver hair stood stood beneath the broken streetlamp.\n\n"I was told the courier would be alone," Kaelen whispered.\n\nShe laughed quietly. "In this city, boy, no one is ever truly alone."`,
      updatedAt: new Date(),
    },
    {
      path: 'scenes/02-the-lower-docks.md',
      content: `# Chapter 1: The Lower Docks\n\nThe tavern smelled of sour ale, wet dog, and burnt tallow candles. Kaelen slipped into the booth farthest from the guttering hearth, keeping his back firmly pressed against the timber wall.\n\nAcross the room, sailors from the southern archipelago were drinking heavily and arguing over the price of salt.`,
      updatedAt: new Date(),
    },
    {
      path: 'bible/characters/kaelen.md',
      content: `# Character: Kaelen Vance\n\n- **Role**: Protagonist / Reluctant Scout\n- **Age**: 24\n- **Appearance**: Tall, lean, weathered hands, dark hair cropped short.\n- **Goal**: Deliver the encrypted atlas before the Grand Inquisitor seals the gates.`,
      updatedAt: new Date(),
    },
    {
      path: 'novels/neon-horizon/scenes/01-signal-in-the-rain.md',
      content: `# Chapter 1: Signal in the Rain\n\nThe neon glyphs of District 9 bled across the cracked acrylic pavement. Mara adjusted her ocular filter, cutting through the chromatic glare of the orbital transport billboards.\n\nThe package in her trench coat buzzed with a low harmonic frequency—unregistered biocoding from the offshore labs.\n\n"Mara, you're being pinged on the secondary band," Jax warned through her auditory implant, his synthesized cadence ragged with interference.\n\n"I see them," she whispered, stepping beneath the dripping overhang of an abandoned ramen cart.`,
      updatedAt: new Date(),
    },
    {
      path: 'novels/neon-horizon/scenes/02-orbital-transfer.md',
      content: `# Chapter 2: Orbital Transfer\n\nThe mag-lev terminal vibrated beneath her boots. Across the departure concourse, corporate peacekeepers in matte-black armor were scanning retinal IDs.\n\nMara kept her chin down, her synthetic left iris calibrated to mimic standard civilian reflectance.`,
      updatedAt: new Date(),
    },
    {
      path: 'novels/neon-horizon/bible/characters/mara.md',
      content: `# Character: Mara Lin\n\n- **Role**: Data courier & rogue cybernetics technician\n- **Age**: 28\n- **Appearance**: Synthetic iris on the left eye, frayed trench coat, neural shunt port behind ear.\n- **Goal**: Deliver the unregistered biocoding package before the corporate bounty hunters triangulate her signal.`,
      updatedAt: new Date(),
    },
    {
      path: 'novels/neon-horizon/bible/world/district-9.md',
      content: `# World: District 9 (The Lower Sump)\n\n- **Atmosphere**: Drenched in perpetual acidic drizzle and holographic neon reflections.\n- **Key Locations**: The Orbital Transfer Spire, Old Acrylic Market, Sub-level 4 coolant tunnels.`,
      updatedAt: new Date(),
    },
  ];

  for (const item of defaultFiles) {
    try {
      await filesCol.updateOne(
        { path: item.path },
        { $setOnInsert: { path: item.path, content: item.content, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch {
      // ignore
    }
  }
}

function getRelativePath(req: express.Request): string {
  const p = (req.params as any).path;
  if (Array.isArray(p)) return p.join('/');
  if (typeof p === 'string') return p;
  return (req.params as any)[0] || '';
}

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const database = await getDb();
    await database.command({ ping: 1 });
    res.json({
      status: 'ok',
      database: isUsingInMemory ? 'in-memory-mock' : 'connected',
      mongodb: isUsingInMemory ? 'mock' : mongoUri,
    });
  } catch (err: any) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Files endpoints
app.get('/api/files', async (req, res) => {
  try {
    const database = await getDb();
    await seedDefaultDataIfEmpty(database);
    const prefix = typeof req.query.prefix === 'string' ? req.query.prefix : '';
    const query = prefix ? { path: { $regex: `^${prefix}` } } : {};
    const files = await database.collection('files').find(query).toArray();
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/{*path}', async (req, res) => {
  try {
    const relativePath = getRelativePath(req);
    const database = await getDb();
    await seedDefaultDataIfEmpty(database);
    const file = await database.collection('files').findOne({ path: relativePath });
    if (!file) {
      return res.status(404).json({ error: `File not found: ${relativePath}` });
    }
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/files/{*path}', async (req, res) => {
  try {
    const relativePath = getRelativePath(req);
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid content in body' });
    }
    const database = await getDb();
    await database.collection('files').updateOne(
      { path: relativePath },
      { $set: { path: relativePath, content, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, path: relativePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/files/{*path}', async (req, res) => {
  try {
    const relativePath = getRelativePath(req);
    const database = await getDb();
    const result = await database.collection('files').deleteOne({ path: relativePath });
    res.json({ success: result.deletedCount > 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User settings endpoints (rules, ignored terms, recent docs, LLM settings)
app.get('/api/settings/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const database = await getDb();
    const doc = await database.collection('settings').findOne({ key });
    if (!doc) {
      return res.status(404).json({ error: `Settings key not found: ${key}` });
    }
    res.json(doc.value);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const { value } = req.body;
    const database = await getDb();
    await database.collection('settings').updateOne(
      { key },
      { $set: { key, value, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { app, getDb, seedDefaultDataIfEmpty };

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST && process.env.RUN_STANDALONE_SERVER) {
  app.listen(port, () => {
    console.log(`StorySpark MongoDB backend listening on port ${port}`);
  });
}

