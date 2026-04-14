import mongoose from "mongoose";

const MONGO_DB_URL = process.env.MONGO_DB_URL;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? "resume_screening";

if (!MONGO_DB_URL) {
  throw new Error("Missing MONGO_DB_URL in environment variables");
}

declare global {
  var mongooseConnection:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseConnection ?? { conn: null, promise: null };
global.mongooseConnection = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_DB_URL, {
      dbName: MONGO_DB_NAME,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
