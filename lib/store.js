// MongoDB-backed store. Mimics the Map API the routes were written against,
// but everything is async — callers must `await` get/set/has/values/delete.
//
// generationJobs stays in-memory: the values change every ~600ms while a job
// runs, and they're throwaway progress state — no point persisting.
//
// The MongoClient is cached on globalThis so Next.js dev-mode HMR doesn't
// open a new connection on every module re-evaluation.

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'designforge';

if (!URI) {
  throw new Error(
    'MONGODB_URI is missing. Add it to next-app/.env.local and restart the dev server.',
  );
}

const g = globalThis;

const getClient = async () => {
  if (g.__df_mongo_client) return g.__df_mongo_client;
  if (g.__df_mongo_connecting) return g.__df_mongo_connecting;

  const client = new MongoClient(URI, {
    serverSelectionTimeoutMS: 8000,
  });
  g.__df_mongo_connecting = client
    .connect()
    .then(() => {
      g.__df_mongo_client = client;
      g.__df_mongo_connecting = null;
      return client;
    })
    .catch((err) => {
      g.__df_mongo_connecting = null;
      throw err;
    });
  return g.__df_mongo_connecting;
};

const collection = async (name) => {
  const client = await getClient();
  return client.db(DB_NAME).collection(name);
};

// Map-like wrapper around a MongoDB collection.
// `idField` is the document property used as the primary key — we also store
// it as `_id` so MongoDB indexes/upserts behave naturally.
class MongoMap {
  constructor(collectionName, idField) {
    this.collectionName = collectionName;
    this.idField = idField;
  }

  async _col() {
    return collection(this.collectionName);
  }

  // Strip Mongo's internal `_id` (which we set equal to our key) on read.
  _clean(doc) {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return rest;
  }

  async get(key) {
    const col = await this._col();
    return this._clean(await col.findOne({ _id: key }));
  }

  async set(key, value) {
    const col = await this._col();
    const doc = { ...value, [this.idField]: key, _id: key };
    await col.replaceOne({ _id: key }, doc, { upsert: true });
    return this;
  }

  async has(key) {
    const col = await this._col();
    return !!(await col.findOne({ _id: key }, { projection: { _id: 1 } }));
  }

  async delete(key) {
    const col = await this._col();
    await col.deleteOne({ _id: key });
  }

  // Returns an array of all values (cleaned). Used by listProjects.
  async values(filter = {}) {
    const col = await this._col();
    const docs = await col.find(filter).toArray();
    return docs.map((d) => this._clean(d));
  }
}

export const users = new MongoMap('users', 'email');
export const projects = new MongoMap('projects', 'id');

// generationJobs stays in-memory — short-lived progress state.
const inMemoryJobs = (g.__df_jobs ||= new Map());
export const generationJobs = inMemoryJobs;

// Idempotent demo user seed — runs once per process boot. We do this on
// import so the very first login attempt finds the user. Wrapped in a
// promise we expose so tests can await it; routes don't need to.
const seedDemoUser = async () => {
  try {
    const existing = await users.get('demo@designforge.ai');
    if (existing) return;
    await users.set('demo@designforge.ai', {
      id: 'usr_demo000000',
      email: 'demo@designforge.ai',
      name: 'Demo User',
      passwordHash: bcrypt.hashSync('password123', 10),
      plan: 'free',
      createdAt: new Date().toISOString(),
    });
    console.log('[store] Demo user seeded');
  } catch (err) {
    console.error('[store] Demo user seed failed:', err.message);
  }
};

if (!g.__df_seeded) {
  g.__df_seeded = seedDemoUser();
}
export const ready = g.__df_seeded;
