// ==================== CONFIGURAZIONE E STORE GLOBALE ====================
// File: js/config.js
// Scopo: stato applicativo condiviso (state), costanti calendario (mesi/giorni)
//        e helper generico api() per le chiamate REST. Le variabili restano
//        globali perché i moduli sono caricati come script classici.

// ──────────────── STATO GLOBALE ────────────────
const state = {
  today: new Date(),
  current: new Date(),
  view: "month",
  events: [],
  categories: [],
  // null = tutte, Set vuoto = nessuna, Set con id = quelle selezionate
  selectedCategories: null,
  searchQuery: "",
  searchResults: null,
};

const MONTHS_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
const DAYS_IT = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
// ──────────────── API HELPERS ────────────────
async function api(method, path, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch("/api" + path, opts);
  return res.json();
}
