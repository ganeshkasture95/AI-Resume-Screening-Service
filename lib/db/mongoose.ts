import mongoose from "mongoose";

const MONGO_DB_URL = process.env.MONGO_DB_URL;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? "resume_screening";

if (!MONGO_DB_URL) {
  throw new Error("Missing MONGO_DB_URL in environment variables");
}

const mongoDbUrl: string = MONGO_DB_URL;

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

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoDbUrl, {
      dbName: MONGO_DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
