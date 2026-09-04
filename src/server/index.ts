import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'storyspark';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let client: MongoClient | null = null;
let db: any = null;

async function getDb() {
  if (!db) {
    client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

// Initial seed data if collection is empty
async function seedDefaultDataIfEmpty(database: any) {
  const filesCol = database.collection('files');
  const count = await filesCol.countDocuments();
  if (count === 0) {
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
    ];
    await filesCol.insertMany(defaultFiles);
  }
}

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const database = await getDb();
    await database.command({ ping: 1 });
    res.json({ status: 'ok', database: 'connected', mongodb: mongoUri });
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

app.get('/api/files/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
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

app.put('/api/files/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
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

app.delete('/api/files/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
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

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  app.listen(port, () => {
    console.log(`StorySpark MongoDB backend listening on port ${port}`);
  });
}
