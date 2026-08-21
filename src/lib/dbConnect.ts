import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export default async function dbConnect() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
      // Tuned for serverless (Vercel): each cold-started function only ever needs
      // a handful of connections at once, so a small pool avoids paying for
      // connections that will just sit idle. A short server-selection timeout
      // means a genuinely unreachable Atlas cluster fails fast instead of
      // hanging the loader for the driver's 30s default. `family: 4` skips the
      // IPv6-then-fallback-to-IPv4 "happy eyeballs" probing that otherwise adds
      // a noticeable delay to the very first connection on some cloud networks.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      family: 4,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Don't cache a failed connection attempt — otherwise every future
    // request replays the same rejected promise even after the DB recovers.
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
