// ==================== VISTA: MINI CALENDARIO ====================
// File: js/views/miniCal.js
// Scopo: mini calendario mensile in sidebar con navigazione rapida.
// Dipendenze (caricare PRIMA): config.js, utils.js

// ──────────────── MINI CALENDAR ────────────────
function renderMiniCal() {
  const { year, month } = getYearMonth();
  const container = document.getElementById("miniCal");
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const todayStr = toDateStr(state.today);
  const currentStr = toDateStr(state.current);

  let html = `
    <div class="mini-cal-header">
      <button class="mini-nav" id="miniPrev">‹</button>
      <span class="mini-cal-title">${MONTHS_IT[month].substring(0, 3)} ${year}</span>
      <button class="mini-nav" id="miniNext">›</button>
    </div>
    <div class="mini-cal-grid">
      ${DAYS_SHORT.map((d) => `<span class="mini-day-label">${d[0]}</span>`).join("")}
  `;

  for (let i = 0; i < startDow; i++) {
    html += `<span class="mini-day other-month"></span>`;
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents =
      state.searchResults !== null
        ? state.searchResults.filter((e) => e.start_date === dateStr)
        : state.events.filter((e) => e.start_date === dateStr);
    const hasEvents = dayEvents.length > 0;
    const isSelected = state.view === "day" && dateStr === currentStr;
    const cls = [
      "mini-day",
      dateStr === todayStr ? "today" : "",
      hasEvents ? "has-events" : "",
      isSelected ? "selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
    html += `<span class="${cls}" data-date="${dateStr}">${d}</span>`;
  }

  html += "</div>";
  container.innerHTML = html;

  container.querySelectorAll(".mini-day[data-date]").forEach((el) => {
    el.addEventListener("click", () => {
      state.current = parseDate(el.dataset.date);
      if (state.view !== "day") setView("day");
      else refresh();
    });
  });

  document.getElementById("miniPrev").addEventListener("click", (e) => {
    e.stopPropagation();
    state.current = new Date(year, month - 1, 1);
    refresh();
  });
  document.getElementById("miniNext").addEventListener("click", (e) => {
    e.stopPropagation();
    state.current = new Date(year, month + 1, 1);
    refresh();
  });
}
