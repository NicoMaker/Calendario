// ==================== STAMPE ====================
// File: js/crud/stampe.js
// Scopo: generazione HTML di stampa, stampa giorno/intervallo/risultati ricerca
//        e relativi listener dei pulsanti.
// Dipendenze (caricare PRIMA): config.js, utils.js, ui/notifications.js

// ──────────────── STAMPA ────────────────
function buildPrintHTML(events, title, subtitle, rangeFrom, rangeTo) {
  const now = new Date();
  const printedOn = now.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!events.length && !rangeFrom) {
    return `
      <div class="print-header">
        <div class="print-brand">◈ Planner</div>
        <div class="print-title">${title}</div>
        <div class="print-subtitle">${subtitle}</div>
      </div>
      <div class="print-empty">Nessun evento da stampare.</div>
      <div class="print-footer"><span>◈ Planner — Calendario Personale</span><span>Stampato il ${printedOn}</span></div>
    `;
  }

  const sorted = [...events].sort((a, b) => {
    if (a.start_date !== b.start_date)
      return a.start_date.localeCompare(b.start_date);
    const ta = a.start_time || "99:99";
    const tb = b.start_time || "99:99";
    return ta.localeCompare(tb);
  });

  // Raggruppa per start_date
  const byDay = {};
  sorted.forEach((e) => {
    const key = e.start_date;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(e);
  });

  // Se è un intervallo, genera tutti i giorni (anche quelli senza eventi)
  let dayKeys;
  if (rangeFrom && rangeTo) {
    dayKeys = [];
    const cur = parseDate(rangeFrom);
    const end = parseDate(rangeTo);
    while (cur <= end) {
      const k = toDateStr(cur);
      if (!byDay[k]) byDay[k] = [];
      dayKeys.push(k);
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    dayKeys = Object.keys(byDay).sort();
  }

  const totalEvents = sorted.length;
  const evLabel = totalEvents === 1 ? "1 evento" : `${totalEvents} eventi`;
  const multiDay = dayKeys.length > 1;

  const rows = dayKeys
    .map((day) => {
      const dayEvents = byDay[day];
      const cnt = dayEvents.length;
      const cntLabel =
        cnt === 0 ? "nessun evento" : cnt === 1 ? "1 evento" : `${cnt} eventi`;
      const dayHeader = multiDay
        ? `<div class="print-day-header"><span class="print-day-name">${formatDate(day)}</span><span class="print-day-count">${cntLabel}</span></div>`
        : "";
      const evRows =
        cnt === 0
          ? `<div class="print-day-empty">Nessun evento</div>`
          : dayEvents
              .map((e) => {
                const color = getEventColor(e);
                const timeLabel = e.all_day
                  ? "Tutto il giorno"
                  : e.start_time || "—";
                const timeEndLabel = !e.all_day && e.end_time ? e.end_time : "";
                const timeHTML = `<div class="print-event-time">
          <span class="print-time-start">${timeLabel}</span>
          ${timeEndLabel ? `<span class="print-time-end">${timeEndLabel}</span>` : ""}
        </div>`;
                const details = [
                  e.category_name
                    ? `${e.category_icon} ${e.category_name}`
                    : "",
                  e.location ? `📍 ${e.location}` : "",
                  e.end_date && e.end_date !== e.start_date
                    ? `fino al ${formatDateShort(e.end_date)}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("  ·  ");

                return `
        <div class="print-event-row">
          ${timeHTML}
          <div class="print-event-bar" style="background:${color}"></div>
          <div class="print-event-body">
            <div class="print-event-title">${e.title}</div>
            ${details ? `<div class="print-event-details">${details}</div>` : ""}
            ${e.description ? `<div class="print-event-desc">${e.description}</div>` : ""}
          </div>
        </div>`;
              })
              .join("");
      return `<div class="print-day-group">${dayHeader}${evRows}</div>`;
    })
    .join("");

  return `
    <div class="print-header">
      <div class="print-brand">◈ Planner</div>
      <div class="print-title">${title}</div>
      <div class="print-subtitle">${subtitle} · ${evLabel}</div>
    </div>
    ${rows}
    <div class="print-footer"><span>◈ Planner — Calendario Personale</span><span>Stampato il ${printedOn}</span></div>
  `;
}

function printEvents(events, title, subtitle, rangeFrom, rangeTo) {
  const frame = document.getElementById("printFrame");
  frame.innerHTML = buildPrintHTML(events, title, subtitle, rangeFrom, rangeTo);
  frame.classList.remove("hidden");

  // Aggiungi font per stampa
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif !important; }
    #printFrame .print-title { font-family: 'DM Serif Display', serif !important; }
  `;
  frame.appendChild(style);

  setTimeout(() => {
    window.print();
    frame.classList.add("hidden");
    frame.innerHTML = "";
  }, 300);
}

function printDay(dateStr) {
  const events = getEventsForDay(dateStr);
  printEvents(events, formatDate(dateStr), "Agenda del giorno");
}

function printSearchResults() {
  if (!state.searchResults) return;
  printEvents(
    state.searchResults,
    `Ricerca: "${state.searchQuery}"`,
    "Risultati di ricerca",
  );
}
// Print buttons
document.getElementById("btnPrintDay").addEventListener("click", () => {
  printDay(toDateStr(state.current));
});

document.getElementById("btnPrintSearch").addEventListener("click", () => {
  printSearchResults();
});

document.getElementById("btnPrintCustomDay").addEventListener("click", () => {
  const d = document.getElementById("printDatePicker").value;
  if (!d) {
    showToast("⚠️ Scegli una data!");
    return;
  }
  printDay(d);
});

// Pre-imposta data picker al giorno corrente
document.getElementById("printDatePicker").value = toDateStr(new Date());

// Pre-imposta intervallo stampa (oggi → oggi+6)
(function initPrintRange() {
  const today = new Date();
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 6);
  document.getElementById("printRangeFrom").value = toDateStr(today);
  document.getElementById("printRangeTo").value = toDateStr(weekLater);
})();

// Stampa intervallo giorni
document.getElementById("btnPrintRange").addEventListener("click", () => {
  const from = document.getElementById("printRangeFrom").value;
  const to = document.getElementById("printRangeTo").value;
  if (!from || !to) {
    showToast("⚠️ Scegli data inizio e fine!");
    return;
  }
  if (from > to) {
    showToast("⚠️ La data di inizio deve essere prima della fine!");
    return;
  }

  // Carica tutti gli eventi se necessario, poi filtra
  const allEvt = state.events;
  const filtered = allEvt.filter((e) => {
    const eEnd = e.end_date || e.start_date;
    return e.start_date <= to && eEnd >= from;
  });

  const title = `${formatDateShort(from)} → ${formatDateShort(to)}`;
  printEvents(filtered, title, "Agenda intervallo", from, to);
});
