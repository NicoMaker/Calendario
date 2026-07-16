// Connessione SQLite nativa (node:sqlite) + helper usati da tutti i repository.
// Il resto del backend non chiama mai db.prepare direttamente.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("📁 Cartella data creata.");
}

const dbPath = path.join(dataDir, "calendario.db");
const isNewDB = !fs.existsSync(dbPath);
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

// Converte le righe di node:sqlite in oggetti JSON semplici
const plain = (rows) =>
  rows === undefined ? undefined : JSON.parse(JSON.stringify(rows));

function dbGet(sql, params = []) {
  return plain(db.prepare(sql).get(...params));
}

function dbAll(sql, params = []) {
  return plain(db.prepare(sql).all(...params));
}

// Restituisce { lastID, changes } come lo storico dbRun
function dbRun(sql, params = []) {
  const result = db.prepare(sql).run(...params);
  return { lastID: Number(result.lastInsertRowid), changes: result.changes };
}

module.exports = { db, dbGet, dbAll, dbRun, isNewDB, dbPath };
