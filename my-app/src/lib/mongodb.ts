import mongoose from "mongoose";

/**
 * Hardened MongoDB connection for Next.js serverless functions.
 *
 * - Uses a global cache to survive hot-reloads in dev and share across
 *   serverless invocations in production.
 * - Resets the cached promise on connection failure so the next request
 *   retries instead of hanging forever.
 * - Fails fast with a clear error instead of silently waiting.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

// Log connection lifecycle events (once)
let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
    // Reset cache so next request retries
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
    // Reset cache so next request retries
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
  });
}

async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined. Add it to your .env.local file. " +
      "See .env.example for all required environment variables."
    );
  }

  // Return existing connection if available
  if (cached!.conn) {
    return cached!.conn;
  }

  // Attach lifecycle listeners before first connect attempt
  attachConnectionListeners();

  if (!cached!.promise) {
    cached!.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((m) => {
        return m;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    // Critical: reset promise so the next request retries
    // instead of hanging on the same failed promise forever
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
