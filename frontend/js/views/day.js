// ==================== VISTA: GIORNO ====================
// File: js/views/day.js
// Scopo: agenda del singolo giorno.
// Dipendenze (caricare PRIMA): config.js, utils.js, ui/modals.js

// ──────────────── DAY VIEW ────────────────
function renderDay() {
  const dateStr = toDateStr(state.current);
  const d = state.current;
  const dayName = DAYS_IT[(d.getDay() + 6) % 7];
  const isT = dateStr === toDateStr(state.today);

  document.getElementById("currentPeriod").textContent =
    `${dayName} ${d.getDate()} ${MONTHS_IT[d.getMonth()]}`;

  const dayEvents = getEventsForDay(dateStr);
  const timeline = document.getElementById("dayTimeline");

  // Ordina per ora inizio (senza orario → in fondo)
  const sorted = [...dayEvents].sort((a, b) => {
    const ta = a.start_time || "99:99";
    const tb = b.start_time || "99:99";
    return ta.localeCompare(tb);
  });

  let html = `
    <div class="day-header-big">
      <h2>${isT ? "📍 Oggi — " : ""}${dayName} ${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}</h2>
      <p>${sorted.length} ${sorted.length === 1 ? "impegno" : "impegni"} in agenda</p>
    </div>
  `;

  if (!sorted.length) {
    html += `<div class="day-empty">
      <span class="day-empty-icon">🗓</span>
      Nessun impegno per questo giorno.<br>
      <button onclick="openNewEventModal('${dateStr}')" style="margin-top:16px;padding:8px 20px;background:var(--accent);border:none;border-radius:6px;color:#fff;cursor:pointer;font-family:inherit;font-size:13px">+ Aggiungi evento</button>
    </div>`;
  } else {
    sorted.forEach((e) => {
      const color = getEventColor(e);
      const startLabel = e.all_day ? "—" : e.start_time || "—";
      const endLabel = e.all_day ? "" : e.end_time || "";
      html += `
        <div class="timeline-slot">
          <div class="timeline-hour">
            <span class="tl-start">${startLabel}</span>
            ${endLabel ? `<span class="tl-end">${endLabel}</span>` : ""}
          </div>
          <div class="timeline-line">
            <div class="timeline-dot" style="border-color:${color};background:${color}20"></div>
            <div class="timeline-track"></div>
          </div>
          <div class="day-event-card" style="border-left-color:${color}" data-id="${e.id}">
            <span class="day-event-icon">${e.category_icon || "📌"}</span>
            <div class="day-event-body">
              <div class="day-event-title">${e.title}</div>
              <div class="day-event-meta">
                ${e.location ? `<span>📍 ${e.location}</span>` : ""}
                ${e.category_name ? `<span style="color:${color}">${e.category_name}</span>` : ""}
                ${e.all_day ? `<span>Tutto il giorno</span>` : ""}
              </div>
              ${e.description ? `<div class="event-description-inline">${e.description}</div>` : ""}
              <div class="event-actions">
                <button class="btn-event-edit" data-id="${e.id}" style="--ev-color:${color}">✏ Modifica</button>
                <button class="btn-event-delete" data-id="${e.id}" style="--ev-color:${color}">🗑 Elimina</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  timeline.innerHTML = html;

  timeline.querySelectorAll(".btn-event-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const event = (state.searchResults || state.events).find(
        (ev) => ev.id == btn.dataset.id,
      );
      if (event) openEditEventModal(event);
    });
  });
  timeline.querySelectorAll(".btn-event-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Eliminare questo evento?")) deleteEvent(btn.dataset.id);
    });
  });
  timeline.querySelectorAll(".day-event-card").forEach((card) => {
    card.addEventListener("click", () => {
      const event = (state.searchResults || state.events).find(
        (ev) => ev.id == card.dataset.id,
      );
      if (event) showEventPopup(event, card);
    });
  });
}
