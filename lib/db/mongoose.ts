import mongoose from "mongoose";

function getMongoDbUrl(): string {
  const mongoDbUrl = process.env.MONGO_DB_URL;
  if (!mongoDbUrl) {
    throw new Error("Missing MONGO_DB_URL in environment variables");
  }
  return mongoDbUrl;
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

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoDbUrl(), {
      dbName: process.env.MONGO_DB_NAME ?? "resume_screening",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
