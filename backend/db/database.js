const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "..", "data", "calendario.db");

function initDB() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("📁 Cartella data creata.");
  }

  const isNewDB = !fs.existsSync(DB_PATH);
  const db = new DatabaseSync(DB_PATH);

  db.exec(`PRAGMA foreign_keys = ON;`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      color      TEXT    NOT NULL DEFAULT '#4f46e5',
      icon       TEXT    NOT NULL DEFAULT '📌',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT,
      start_date  TEXT    NOT NULL,
      end_date    TEXT,
      start_time  TEXT,
      end_time    TEXT,
      location    TEXT,
      category_id INTEGER,
      all_day     INTEGER DEFAULT 0,
      color       TEXT,
      recurring   TEXT    DEFAULT 'none',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  if (isNewDB) {
    console.log("✅ Database creato con successo:", DB_PATH);
  } else {
    console.log("✅ Database esistente caricato:", DB_PATH);
  }

  return db;
}

module.exports = { initDB };
