// ==================== VISTA: LISTA / RISULTATI RICERCA ====================
// File: js/views/list.js
// Scopo: elenco eventi del mese o risultati di ricerca.
// Dipendenze (caricare PRIMA): config.js, utils.js, ui/modals.js

// ──────────────── LIST VIEW ────────────────
function renderList() {
  const isSearch = state.searchResults !== null;
  if (isSearch) {
    document.getElementById("currentPeriod").textContent =
      `Risultati: "${state.searchQuery}"`;
  } else {
    document.getElementById("currentPeriod").textContent = "Tutti gli eventi";
  }

  const src = filterEvents(isSearch ? state.searchResults : state.events);
  const container = document.getElementById("listContainer");

  if (!src.length) {
    container.innerHTML = `<p style="color:var(--text-light);text-align:center;padding:60px;font-style:italic">
      ${isSearch ? `Nessun risultato per "${state.searchQuery}"` : "Nessun evento trovato."}
    </p>`;
    return;
  }

  const groups = {};
  src.forEach((e) => {
    const d = parseDate(e.start_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key])
      groups[key] = {
        label: `${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`,
        events: [],
      };
    groups[key].events.push(e);
  });

  container.innerHTML = Object.values(groups)
    .map(
      (g) => `
    <div class="list-month-group">
      <h3 class="list-month-title">${g.label}</h3>
      ${g.events
        .map((e) => {
          const color = getEventColor(e);
          const d = parseDate(e.start_date);
          const dow = DAYS_SHORT[(d.getDay() + 6) % 7];
          return `
          <div class="list-event" data-id="${e.id}">
            <div class="list-event-top">
              <div class="list-event-date">
                <span class="list-day-num">${d.getDate()}</span>
                <span class="list-day-name">${dow}</span>
              </div>
              <div class="list-event-bar" style="background:${color}"></div>
              <div class="list-event-content">
                <div class="list-event-title">${e.title}</div>
                <div class="list-event-meta">
                  ${e.start_time ? `<span>🕐 ${e.start_time}${e.end_time ? " – " + e.end_time : ""}</span>` : ""}
                  ${e.category_name ? `<span>${e.category_icon} ${e.category_name}</span>` : ""}
                  ${e.location ? `<span>📍 ${e.location}</span>` : ""}
                </div>
                ${e.description ? `<div class="event-description-inline">${e.description}</div>` : ""}
              </div>
            </div>
            <div class="list-event-actions">
              <button class="btn-event-edit" data-id="${e.id}">✏ Modifica</button>
              <button class="btn-event-delete" data-id="${e.id}">🗑 Elimina</button>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `,
    )
    .join("");

  container.querySelectorAll(".btn-event-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const event = src.find((ev) => ev.id == btn.dataset.id);
      if (event) openEditEventModal(event);
    });
  });
  container.querySelectorAll(".btn-event-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Eliminare questo evento?")) deleteEvent(btn.dataset.id);
    });
  });
}
