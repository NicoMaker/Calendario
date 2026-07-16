// ==================== VISTA: SETTIMANA ====================
// File: js/views/week.js
// Scopo: griglia settimanale con fasce orarie.
// Dipendenze (caricare PRIMA): config.js, utils.js, ui/modals.js

// ──────────────── WEEK VIEW ────────────────
function renderWeek() {
  const d = new Date(state.current);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  const weekStart = new Date(d);
  const weekEnd = new Date(d);
  weekEnd.setDate(weekEnd.getDate() + 6);

  document.getElementById("currentPeriod").textContent =
    `${weekStart.getDate()} — ${weekEnd.getDate()} ${MONTHS_IT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const body = document.getElementById("weekBody");
  body.innerHTML = "";
  const todayStr = toDateStr(state.today);

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dateStr = toDateStr(day);
    const dayEvents = getEventsForDay(dateStr);
    const isT = dateStr === todayStr;

    const row = document.createElement("div");
    row.className = "week-day-row";

    const evHtml = dayEvents.length
      ? dayEvents
          .map((e) => {
            const color = getEventColor(e);
            const time = e.start_time
              ? `${e.start_time}${e.end_time ? " – " + e.end_time : ""}`
              : "";
            const cat = e.category_name
              ? `<span class="week-ev-detail">${e.category_icon || "📌"} ${e.category_name}</span>`
              : "";
            const loc = e.location
              ? `<span class="week-ev-detail">📍 ${e.location}</span>`
              : "";
            const timeTag = time
              ? `<span class="week-ev-detail">🕐 ${time}</span>`
              : "";
            const desc = e.description
              ? `<div class="week-ev-desc">${e.description}</div>`
              : "";
            const allDay = e.all_day
              ? `<span class="week-ev-detail">Tutto il giorno</span>`
              : "";
            const detailsRow = [cat, loc, timeTag, allDay]
              .filter(Boolean)
              .join("");
            return `<div class="week-event-item" style="background:${color}" data-id="${e.id}">
              <div class="week-event-top">
                <strong class="week-ev-title">${e.title}</strong>
              </div>
              ${detailsRow ? `<div class="week-ev-details">${detailsRow}</div>` : ""}
              ${desc}
              <div class="week-event-actions">
                <button class="btn-week-edit" data-id="${e.id}">✏ Modifica</button>
                <button class="btn-week-delete" data-id="${e.id}">🗑 Elimina</button>
              </div>
            </div>`;
          })
          .join("")
      : '<div class="week-empty">Nessun evento</div>';

    const evCount = dayEvents.length;
    const evCountLabel =
      evCount === 1 ? "1 evento" : evCount > 1 ? `${evCount} eventi` : "";

    row.innerHTML = `
      <div class="week-day-header" data-date="${dateStr}" style="cursor:pointer">
        <span class="week-day-name">${DAYS_SHORT[i]}</span>
        <span class="week-day-num ${isT ? "today" : ""}">${day.getDate()}</span>
        <span style="font-size:11px;color:var(--text-light);margin-left:auto">${evCountLabel}</span>
      </div>
      <div class="week-day-events">${evHtml}</div>
    `;

    row.querySelector(".week-day-header").addEventListener("click", () => {
      state.current = parseDate(dateStr);
      setView("day");
    });

    row.querySelectorAll(".btn-week-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const event = (state.searchResults || state.events).find(
          (ev) => ev.id == btn.dataset.id,
        );
        if (event) openEditEventModal(event);
      });
    });
    row.querySelectorAll(".btn-week-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Eliminare questo evento?")) deleteEvent(btn.dataset.id);
      });
    });
    body.appendChild(row);
  }
}
