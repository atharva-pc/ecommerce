import app from "../backend/server.js";
import connectDB from "../backend/config/db.js";

let dbReadyPromise;

const ensureDb = async () => {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((error) => {
      // Allow retry on next invocation if initial cold-start connect fails.
      dbReadyPromise = null;
      throw error;
    });
  }

  await dbReadyPromise;
};

export default async function handler(req, res) {
  await ensureDb();
  return app(req, res);
}

