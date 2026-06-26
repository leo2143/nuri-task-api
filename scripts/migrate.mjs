import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nuri-task-api";
const DATA_DIR = join(__dirname, "..", "resources", "moongo-scripts");

const FILES = [
  { file: "achievements-data.json", collection: "achievements" },
  { file: "goals-data.json", collection: "goals" },
  { file: "metrics-data.json", collection: "metrics" },
  { file: "moodboards-data.json", collection: "moodboards" },
  { file: "todos-data.json", collection: "todos" },
  { file: "users-data.json", collection: "users" },
];

async function migrate() {
  try {
    console.log("Conectando a MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const { EJSON } = await import("bson");

    for (const { file, collection } of FILES) {
      const filePath = join(DATA_DIR, file);
      const raw = readFileSync(filePath, "utf-8");
      const docs = EJSON.deserialize(JSON.parse(raw));
      const col = db.collection(collection);

      await col.deleteMany({});
      if (docs.length > 0) {
        await col.insertMany(docs, { ordered: false });
      }
      console.log(`  ✅ ${collection}: ${docs.length} documentos`);
    }

    console.log("\n🎉 Migración completada exitosamente");
  } catch (err) {
    console.error("❌ Error durante la migración:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
