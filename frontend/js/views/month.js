// ==================== VISTA: MESE ====================
// File: js/views/month.js
// Scopo: griglia mensile con celle giorno ed eventi.
// Dipendenze (caricare PRIMA): config.js, utils.js, ui/modals.js

// ──────────────── MONTH VIEW ────────────────
function renderMonth() {
  const { year, month } = getYearMonth();
  document.getElementById("currentPeriod").textContent =
    `${MONTHS_IT[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const grid = document.getElementById("daysGrid");
  grid.innerHTML = "";

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    grid.appendChild(createDayCell(d.getDate(), toDateStr(d), true));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    grid.appendChild(createDayCell(d, dateStr, false));
  }
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;
  let nextDay = 1;
  for (let i = startDow + lastDay.getDate(); i < totalCells; i++) {
    const d = new Date(year, month + 1, nextDay++);
    grid.appendChild(createDayCell(d.getDate(), toDateStr(d), true));
  }
}

function createDayCell(dayNum, dateStr, isOther) {
  const cell = document.createElement("div");
  const todayStr = toDateStr(state.today);
  cell.className = `day-cell ${dateStr === todayStr ? "today" : ""} ${isOther ? "other-month" : ""}`;
  cell.dataset.date = dateStr;

  const dayEvents = getEventsForDay(dateStr);
  const maxVisible = 3;
  const visibleEvents = dayEvents.slice(0, maxVisible);
  const extra = dayEvents.length - maxVisible;

  let evHtml = visibleEvents
    .map((e) => {
      const color = getEventColor(e);
      return `<div class="event-chip" style="background:${color}" data-id="${e.id}" title="${e.title}">
      <span class="event-chip-dot"></span>${e.title}
    </div>`;
    })
    .join("");
  if (extra > 0) evHtml += `<span class="more-events">+${extra} altri</span>`;

  cell.innerHTML = `<span class="day-num">${dayNum}</span>${evHtml}`;

  cell.addEventListener("click", (e) => {
    if (!e.target.closest(".event-chip")) {
      if (state.searchQuery) {
        openNewEventModal(dateStr);
      } else {
        state.current = parseDate(dateStr);
        setView("day");
      }
    }
  });
  cell.querySelectorAll(".event-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const event = (state.searchResults || state.events).find(
        (ev) => ev.id == chip.dataset.id,
      );
      if (event) showEventPopup(event, chip);
    });
  });
  return cell;
}
