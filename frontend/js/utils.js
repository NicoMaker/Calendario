// ==================== FUNZIONI DI UTILITÀ ====================
// File: js/utils.js
// Scopo: date helpers, formattazione date, eventi per giorno, colori e filtri.
// Dipendenze (caricare PRIMA): config.js

// ──────────────── UTILITIES ────────────────
function getYearMonth() {
  return { year: state.current.getFullYear(), month: state.current.getMonth() };
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return "";
  return `${DAYS_IT[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`;
}

function getEventsForDay(dateStr) {
  const src = filterEvents(
    state.searchResults !== null ? state.searchResults : state.events,
  );
  return src.filter((e) => {
    if (e.start_date === dateStr) return true;
    if (e.end_date && e.start_date <= dateStr && e.end_date >= dateStr)
      return true;
    return false;
  });
}

function getEventColor(event) {
  const isBlank = (c) =>
    !c || c === "#ffffff" || c === "#FFFFFF" || c === "white";
  if (!isBlank(event.color)) return event.color;
  if (!isBlank(event.category_color)) return event.category_color;
  return "#6b6560";
}

// Applica filtro categorie agli eventi
// null = tutte, Set vuoto = nessuna, Set con id = solo quelle selezionate
function filterEvents(events) {
  const f = state.selectedCategories;
  if (f === null) return events; // tutte
  if (f.size === 0) return []; // nessuna
  return events.filter((e) => f.has(String(e.category_id ?? "")));
}
