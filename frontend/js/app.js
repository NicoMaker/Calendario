/**
 * Calendario App — Frontend JS
 * Viste: mese, settimana, giorno, lista
 * Funzionalità: ricerca, stampa, validazione orari, auto-completamento ore
 */

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

// ──────────────── MOBILE DRAWER HELPER (globale) ────────────────
function closeMobileDrawer() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("mobileOverlay");
  const menuBtn = document.getElementById("btnMobileMenu");
  const mobileCloseBtn = document.getElementById("btnMobileClose");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.add("hidden");
  if (menuBtn) menuBtn.classList.remove("open");
  if (mobileCloseBtn) mobileCloseBtn.classList.add("hidden");
}

// ──────────────── API HELPERS ────────────────
async function api(method, path, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch("/api" + path, opts);
  return res.json();
}

async function loadEvents() {
  const { year, month } = getYearMonth();
  const url = `/events?year=${year}&month=${month + 1}`;
  const resp = await api("GET", url);
  if (resp.success) state.events = resp.data;
}

async function loadAllEvents() {
  const resp = await api("GET", "/events");
  if (resp.success) state.events = resp.data;
}

async function loadCategories() {
  const resp = await api("GET", "/categories");
  if (resp.success) {
    state.categories = resp.data;
    // Aggiorna subito il badge con il numero reale di categorie
    const usedBadge = document.getElementById("catUsedBadge");
    if (usedBadge) usedBadge.textContent = state.categories.length;
    renderCategoryList();
  }
}

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
  if (event.color) return event.color;
  if (event.category_color) return event.category_color;
  return "#6366f1";
}

// Applica filtro categorie agli eventi
// null = tutte, Set vuoto = nessuna, Set con id = solo quelle selezionate
function filterEvents(events) {
  const f = state.selectedCategories;
  if (f === null) return events; // tutte
  if (f.size === 0) return []; // nessuna
  return events.filter((e) => f.has(String(e.category_id ?? "")));
}

// ──────────────── TIME AUTO-COMPLETE ────────────────
// Formatta input grezzo in "HH:MM"
// "8" → "08:00", "830" → "08:30", "1430" → "14:30", "9:00" → "09:00"
function normalizeTime(raw) {
  if (!raw) return "";
  raw = raw.trim().replace(/[^0-9:]/g, "");
  if (!raw) return "";

  if (raw.includes(":")) {
    const [h, m] = raw.split(":").map((s) => parseInt(s, 10) || 0);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null; // errore
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  if (raw.length <= 2) {
    // "8" → 08:00, "14" → 14:00
    const h = parseInt(raw, 10);
    if (h < 0 || h > 23) return null;
    return `${String(h).padStart(2, "0")}:00`;
  }

  if (raw.length === 3) {
    // "830" → 08:30, "900" → 09:00
    const h = parseInt(raw.substring(0, 1), 10);
    const m = parseInt(raw.substring(1), 10);
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  if (raw.length === 4) {
    // "1430" → 14:30
    const h = parseInt(raw.substring(0, 2), 10);
    const m = parseInt(raw.substring(2), 10);
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return null;
}

// Aggiunge 1 ora a "HH:MM"
function addOneHour(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const newH = (h + 1) % 24;
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function setupTimeInputs() {
  const startInput = document.getElementById("fStartTime");
  const endInput = document.getElementById("fEndTime");
  // startHint no longer needed with native time picker
  // const startHint  = document.getElementById('startTimeHint');
  const endHint = document.getElementById("endTimeHint");

  // Auto-compila ora fine (+1h) quando l'utente imposta l'ora di inizio
  startInput.addEventListener("change", () => {
    const val = startInput.value;
    if (val && !endInput.value) {
      endInput.value = addOneHour(val);
    }
  });

  // Segnala se l'ora di fine è prima di quella di inizio
  endInput.addEventListener("change", () => {
    const s = startInput.value;
    const e = endInput.value;
    if (s && e && timeToMinutes(e) <= timeToMinutes(s)) {
      endHint.textContent = "⚠ Deve essere dopo le " + s;
    } else {
      endHint.textContent = "";
    }
  });
}

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

// ──────────────── CATEGORY LIST ────────────────
function renderCategoryList() {
  const list = document.getElementById("categoryList");
  const f = state.selectedCategories;
  const isAll = f === null;
  const isNone = f instanceof Set && f.size === 0;

  // Conta eventi visibili dopo filtro
  const allEvSrc =
    state.searchResults !== null ? state.searchResults : state.events;
  const visibleEvents = filterEvents(allEvSrc);

  // Aggiorna badge: numero totale di categorie create
  const usedBadge = document.getElementById("catUsedBadge");
  if (usedBadge) usedBadge.textContent = state.categories.length;

  // Aggiorna badge filtro attivo
  const badge = document.getElementById("catFilterBadge");
  if (f === null) {
    badge.classList.add("hidden");
  } else if (f.size === 0) {
    badge.textContent = "0";
    badge.classList.remove("hidden");
  } else {
    badge.textContent = f.size;
    badge.classList.remove("hidden");
  }

  // Filter categories by sidebar search
  const sbSearch = document.getElementById("catSidebarSearch");
  const sbQ = sbSearch ? sbSearch.value.toLowerCase() : "";
  const filteredCats = sbQ
    ? state.categories.filter(
        (c) =>
          c.name.toLowerCase().includes(sbQ) ||
          (c.icon && c.icon.includes(sbQ)),
      )
    : state.categories;

  list.innerHTML = `
    <!-- TUTTE -->
    <li class="category-item cat-special ${isAll ? "active" : ""}" data-action="all">
      <span class="cat-dot" style="background:linear-gradient(135deg,#6b6560,#9c9590)"></span>
      <span class="cat-name">Tutte</span>
      <span class="cat-count"></span>
    </li>

    <!-- NESSUNA -->
    <li class="category-item cat-special ${isNone ? "active active-none" : ""}" data-action="none">
      <span class="cat-dot" style="background:#d1d5db;border:1px dashed #9ca3af"></span>
      <span class="cat-name">Nessuna</span>
      <span class="cat-count">0</span>
    </li>

    <li class="cat-separator"></li>

    ${filteredCats
      .map((c) => {
        const isSelected = isAll
          ? true
          : f instanceof Set
            ? f.has(String(c.id))
            : false;
        return `
        <li class="category-item ${isSelected && !isNone ? "active" : "inactive"}" data-id="${c.id}">
          <span class="cat-check">${isSelected && !isNone ? "✓" : ""}</span>
          <span class="cat-dot" style="background:${c.color}"></span>
          <span class="cat-name">${c.icon} ${c.name}</span>
          <span class="cat-count">${c.event_count}</span>
          <button class="cat-edit-btn" data-cat-id="${c.id}" title="Modifica">✏</button>
          <button class="cat-delete-btn" data-cat-id="${c.id}" title="Elimina">🗑</button>
        </li>
      `;
      })
      .join("")}
  `;

  // Click su "Tutte"
  list.querySelector('[data-action="all"]').addEventListener("click", () => {
    state.selectedCategories = null;
    renderCategoryList();
    renderCurrentView();
  });

  // Click su "Nessuna"
  list.querySelector('[data-action="none"]').addEventListener("click", () => {
    state.selectedCategories = new Set();
    renderCategoryList();
    renderCurrentView();
  });

  // Click su singola categoria
  list.querySelectorAll(".category-item[data-id]").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".cat-edit-btn")) return;
      if (e.target.closest(".cat-delete-btn")) return;

      const id = String(item.dataset.id);

      if (isAll) {
        // Da "tutte" → deseleziona quella cliccata (le altre restano attive)
        const newSet = new Set(state.categories.map((c) => String(c.id)));
        newSet.delete(id);
        state.selectedCategories = newSet;
      } else if (f instanceof Set) {
        const newSet = new Set(f);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        // Se tutte selezionate → torna a null (Tutte)
        const allIds = state.categories.map((c) => String(c.id));
        if (
          newSet.size === allIds.length &&
          allIds.every((i) => newSet.has(i))
        ) {
          state.selectedCategories = null;
        } else {
          state.selectedCategories = newSet;
        }
      }

      renderCategoryList();
      renderCurrentView();
    });
  });

  // Click edit categoria
  list.querySelectorAll(".cat-edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cat = state.categories.find((c) => c.id == btn.dataset.catId);
      if (!cat) return;
      closeMobileDrawer();
      setTimeout(() => openCatModal(cat), 350);
    });
  });

  // Click delete categoria direttamente dalla lista
  list.querySelectorAll(".cat-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const cat = state.categories.find((c) => c.id == btn.dataset.catId);
      if (!cat) return;
      if (cat.event_count > 0) {
        showToast(
          `⚠️ Impossibile eliminare "${cat.name}": ha ${cat.event_count} event${cat.event_count === 1 ? "o" : "i"} collegat${cat.event_count === 1 ? "o" : "i"}.`,
        );
        return;
      }
      if (
        !confirm(
          `Eliminare la categoria "${cat.name}"?`,
        )
      )
        return;
      const resp = await api("DELETE", `/categories/${cat.id}`);
      if (resp.success) {
        showToast("🗑 Categoria eliminata");
        // Se l'evento aperto nel modal usava questa categoria → reset widget
        if (document.getElementById("fCategory").value == cat.id) {
          setCategorySearchValue(null);
        }
        await refresh();
      } else {
        showToast("❌ " + resp.error);
      }
    });
  });

  // Aggiorna widget ricerca categoria nel modal evento
  updateCatSearchWidget();
}

// Renderizza la vista corrente senza ricaricare dal server
function renderCurrentView() {
  if (state.view === "month") renderMonth();
  else if (state.view === "week") renderWeek();
  else if (state.view === "day") renderDay();
  else renderList();
  renderMiniCal();
}

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
            return `<div class="week-event-item" style="background:${color}" data-id="${e.id}">
            <div class="week-event-top">
              <span>${e.category_icon || "📌"}</span>
              <strong style="flex:1">${e.title}</strong>
              ${time ? `<span style="opacity:.7;font-size:10px">${time}</span>` : ""}
            </div>
            ${e.description ? `<div style="font-size:10px;opacity:.8;font-style:italic;margin-top:3px">${e.description}</div>` : ""}
            <div class="week-event-actions">
              <button class="btn-week-edit" data-id="${e.id}">✏ Modifica</button>
              <button class="btn-week-delete" data-id="${e.id}">🗑 Elimina</button>
            </div>
          </div>`;
          })
          .join("")
      : '<div class="week-empty">Nessun evento</div>';

    row.innerHTML = `
      <div class="week-day-header" data-date="${dateStr}" style="cursor:pointer">
        <span class="week-day-name">${DAYS_SHORT[i]}</span>
        <span class="week-day-num ${isT ? "today" : ""}">${day.getDate()}</span>
        <span style="font-size:11px;color:var(--text-light);margin-left:auto">${dayEvents.length ? dayEvents.length + " eventi" : ""}</span>
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
      const timeLabel = e.all_day
        ? "Tutto il giorno"
        : e.start_time
          ? `${e.start_time}${e.end_time ? " – " + e.end_time : ""}`
          : "Orario non specificato";
      html += `
        <div class="timeline-slot">
          <div class="timeline-hour">${e.all_day ? "—" : e.start_time || "—"}</div>
          <div class="timeline-line">
            <div class="timeline-dot" style="border-color:${color};background:${color}20"></div>
            <div class="timeline-track"></div>
          </div>
          <div class="day-event-card" style="border-left-color:${color}" data-id="${e.id}">
            <span class="day-event-icon">${e.category_icon || "📌"}</span>
            <div class="day-event-body">
              <div class="day-event-title">${e.title}</div>
              <div class="day-event-meta">
                <span>🕐 ${timeLabel}</span>
                ${e.location ? `<span>📍 ${e.location}</span>` : ""}
                ${e.category_name ? `<span style="color:${color}">${e.category_name}</span>` : ""}
              </div>
              ${e.description ? `<div class="event-description-inline">${e.description}</div>` : ""}
              <div class="event-actions">
                <button class="btn-event-edit" data-id="${e.id}">✏ Modifica</button>
                <button class="btn-event-delete" data-id="${e.id}">🗑 Elimina</button>
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

// ──────────────── POPUP EVENTO ────────────────
function showEventPopup(event, anchor) {
  const popup = document.getElementById("eventPopup");
  document.getElementById("popupIcon").textContent =
    event.category_icon || "📌";
  document.getElementById("popupTitle").textContent = event.title;
  document.getElementById("popupCategory").textContent =
    event.category_name || "";

  document.getElementById("popupDate").textContent =
    event.end_date && event.end_date !== event.start_date
      ? `📅 ${formatDate(event.start_date)} → ${formatDateShort(event.end_date)}`
      : `📅 ${formatDate(event.start_date)}`;

  const timeEl = document.getElementById("popupTime");
  if (event.start_time) {
    timeEl.textContent = `🕐 ${event.start_time}${event.end_time ? " – " + event.end_time : ""}`;
    timeEl.classList.remove("hidden");
  } else {
    timeEl.classList.add("hidden");
  }

  const locEl = document.getElementById("popupLocation");
  if (event.location) {
    locEl.textContent = `📍 ${event.location}`;
    locEl.classList.remove("hidden");
  } else locEl.classList.add("hidden");

  const descEl = document.getElementById("popupDesc");
  if (event.description) {
    descEl.textContent = event.description;
    descEl.classList.remove("hidden");
  } else descEl.classList.add("hidden");

  popup.classList.remove("hidden");
  const rect = anchor.getBoundingClientRect();
  const pw = 300;
  let left = rect.right + 8;
  let top = rect.top;
  if (left + pw > window.innerWidth - 16) left = rect.left - pw - 8;
  if (top + 260 > window.innerHeight) top = window.innerHeight - 270;
  popup.style.left = `${Math.max(8, left)}px`;
  popup.style.top = `${Math.max(8, top)}px`;

  document.getElementById("btnEditEvent").onclick = () => {
    closePopup();
    openEditEventModal(event);
  };

  document.getElementById("btnDeletePopup").onclick = async () => {
    if (!confirm(`Eliminare "${event.title}"?`)) return;
    const resp = await api("DELETE", `/events/${event.id}`);
    if (resp.success) {
      closePopup();
      showToast("🗑 Evento eliminato");
      await refresh();
    } else {
      showToast("❌ " + resp.error);
    }
  };
}

function closePopup() {
  document.getElementById("eventPopup").classList.add("hidden");
}

// ──────────────── MODAL ────────────────
function openNewEventModal(dateStr = null) {
  const today = dateStr || toDateStr(state.today);
  resetForm();
  document.getElementById("modalTitle").textContent = "Nuovo Evento";
  document.getElementById("btnDeleteEvent").classList.add("hidden");
  document.getElementById("fStartDate").value = today;
  document.getElementById("modalOverlay").classList.remove("hidden");
  document.getElementById("fTitle").focus();
}

function syncColorFromCategory(catId) {
  if (!catId) {
    document.getElementById("fColor").value = "#ffffff";
    return;
  }
  const cat = state.categories.find((c) => String(c.id) === String(catId));
  document.getElementById("fColor").value =
    cat && cat.color ? cat.color : "#ffffff";
}

function openEditEventModal(event) {
  resetForm();
  document.getElementById("modalTitle").textContent = "Modifica Evento";
  document.getElementById("btnDeleteEvent").classList.remove("hidden");
  document.getElementById("eventId").value = event.id;
  document.getElementById("fTitle").value = event.title || "";
  document.getElementById("fStartDate").value = event.start_date || "";
  document.getElementById("fEndDate").value = event.end_date || "";
  document.getElementById("fStartTime").value = event.start_time || "";
  document.getElementById("fEndTime").value = event.end_time || "";
  document.getElementById("fLocation").value = event.location || "";
  setCategorySearchValue(event.category_id || null);
  // Usa il colore specifico dell'evento se esiste, altrimenti prende quello della categoria
  syncColorFromCategory(event.category_id);
  document.getElementById("fDescription").value = event.description || "";
  document.getElementById("fAllDay").checked = !!event.all_day;
  toggleTimeRow();
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
  resetForm();
}

function resetForm() {
  document.getElementById("eventForm").reset();
  document.getElementById("eventId").value = "";
  document.getElementById("fColor").value = "#ffffff";
  document.getElementById("timeRow").style.display = "";
  document.getElementById("endTimeHint").textContent = "";
  // Reset category search widget
  const catSearch = document.getElementById("fCategorySearch");
  if (catSearch) catSearch.value = "";
  const catHidden = document.getElementById("fCategory");
  if (catHidden) catHidden.value = "";
  const catClear = document.getElementById("catSearchClear");
  if (catClear) catClear.classList.add("hidden");
}

function toggleTimeRow() {
  const allDay = document.getElementById("fAllDay").checked;
  document.getElementById("timeRow").style.display = allDay ? "none" : "";
}

async function saveEvent() {
  const id = document.getElementById("eventId").value;

  const startTime = document.getElementById("fStartTime").value || null;
  const endTime = document.getElementById("fEndTime").value || null;
  const allDay = document.getElementById("fAllDay").checked;

  // Validazione orari
  if (
    !allDay &&
    startTime &&
    endTime &&
    timeToMinutes(endTime) <= timeToMinutes(startTime)
  ) {
    showToast("⚠️ L'ora di fine deve essere dopo l'ora di inizio!");
    return;
  }

  const body = {
    title: document.getElementById("fTitle").value,
    start_date: document.getElementById("fStartDate").value,
    end_date: document.getElementById("fEndDate").value || null,
    start_time: startTime,
    end_time: endTime,
    location: document.getElementById("fLocation").value || null,
    category_id: document.getElementById("fCategory").value || null,
    all_day: allDay ? 1 : 0,
    color: document.getElementById("fColor").value,
    description: document.getElementById("fDescription").value || null,
  };

  if (!body.title || !body.start_date) {
    showToast("⚠️ Compila titolo e data!");
    return;
  }

  const resp = id
    ? await api("PUT", `/events/${id}`, body)
    : await api("POST", "/events", body);

  if (resp.success) {
    showToast(id ? "✅ Evento aggiornato!" : "✅ Evento creato!");
    closeModal();
    await refresh();
  } else {
    showToast("❌ Errore: " + resp.error);
  }
}

async function deleteEvent(directId) {
  const id = directId || document.getElementById("eventId").value;
  if (!id) return;
  if (!directId && !confirm("Eliminare questo evento?")) return;
  const resp = await api("DELETE", `/events/${id}`);
  if (resp.success) {
    showToast("🗑 Evento eliminato");
    if (!directId) closeModal();
    await refresh();
  }
}

// ──────────────── STAMPA ────────────────
function buildPrintHTML(events, title, subtitle, rangeFrom, rangeTo) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!events.length && !rangeFrom) {
    return `
      <div class="print-header">
        <div><div class="print-title">${title}</div><div class="print-subtitle">${subtitle}</div></div>
        <div class="print-meta">Stampato il ${dateStr}</div>
      </div>
      <div class="print-empty">Nessun evento da stampare.</div>
      <div class="print-footer">◈ Planner — Calendario Personale</div>
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
      const cntLabel = cnt === 0 ? "nessun evento" : cnt === 1 ? "1 evento" : `${cnt} eventi`;
      const dayHeader = multiDay
        ? `<div class="print-day-header">${formatDate(day)}<span class="print-day-count">${cntLabel}</span></div>`
        : "";
      const evRows = cnt === 0
        ? `<div class="print-day-empty">Nessun evento</div>`
        : dayEvents.map((e) => {
        const color = getEventColor(e);
        const timeLabel = e.all_day
          ? "Tutto il giorno"
          : e.start_time
            ? `${e.start_time}${e.end_time ? " – " + e.end_time : ""}`
            : "—";
        const details = [
          e.category_name ? `${e.category_icon} ${e.category_name}` : "",
          e.location ? `📍 ${e.location}` : "",
          e.end_date && e.end_date !== e.start_date
            ? `fino al ${formatDateShort(e.end_date)}`
            : "",
        ]
          .filter(Boolean)
          .join("  ·  ");

        return `
        <div class="print-event-row">
          <div class="print-event-time">${timeLabel}</div>
          <div class="print-event-dot" style="background:${color}"></div>
          <div class="print-event-body">
            <div class="print-event-title">${e.title}</div>
            ${details ? `<div class="print-event-details">${details}</div>` : ""}
            ${e.description ? `<div class="print-event-desc">${e.description}</div>` : ""}
          </div>
        </div>`;
      }).join("");
      return `<div class="print-day-group">${dayHeader}${evRows}</div>`;
    })
    .join("");

  return `
    <div class="print-header">
      <div>
        <div class="print-title">◈ ${title}</div>
        <div class="print-subtitle">${subtitle} · ${evLabel}</div>
      </div>
      <div class="print-meta">Stampato il<br>${dateStr}</div>
    </div>
    ${rows}
    <div class="print-footer">◈ Planner — Calendario Personale</div>
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

// ──────────────── TOAST ────────────────
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ──────────────── RICERCA ────────────────
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();
  state.searchQuery = q;

  const badge = document.getElementById("searchBadge");
  const btnPS = document.getElementById("btnPrintSearch");

  searchTimeout = setTimeout(async () => {
    if (q.length > 1) {
      const resp = await api("GET", `/events?search=${encodeURIComponent(q)}`);
      if (resp.success) {
        state.searchResults = resp.data;
        badge.textContent = `${resp.data.length} risultati`;
        badge.classList.remove("hidden");
        btnPS.classList.remove("hidden");
        await loadCategories();
        setView("list");
      }
    } else {
      state.searchResults = null;
      badge.classList.add("hidden");
      btnPS.classList.add("hidden");
      await refresh();
    }
  }, 280);
});

// ──────────────── NAVIGAZIONE ────────────────
function navigate(dir) {
  const { year, month } = getYearMonth();
  if (state.view === "month") {
    state.current = new Date(year, month + dir, 1);
  } else if (state.view === "week") {
    state.current = new Date(state.current.getTime() + dir * 7 * 86400000);
  } else if (state.view === "day") {
    state.current = new Date(state.current.getTime() + dir * 86400000);
  } else {
    state.current = new Date(year, month + dir, 1);
  }
  refresh();
}

function setView(view) {
  state.view = view;
  document
    .querySelectorAll(".view-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  document
    .getElementById("calendarMonth")
    .classList.toggle("hidden", view !== "month");
  document
    .getElementById("calendarWeek")
    .classList.toggle("hidden", view !== "week");
  document
    .getElementById("calendarDay")
    .classList.toggle("hidden", view !== "day");
  document
    .getElementById("calendarList")
    .classList.toggle("hidden", view !== "list");
  refresh();
}

async function refresh() {
  if (state.searchResults !== null) {
    await loadCategories();
  } else if (state.view === "list") {
    await loadAllEvents();
    await loadCategories();
  } else {
    await loadEvents();
    await loadCategories();
  }

  renderCurrentView();
}

// ──────────────── EVENT LISTENERS ────────────────
document
  .getElementById("btnPrev")
  .addEventListener("click", () => navigate(-1));
document.getElementById("btnNext").addEventListener("click", () => navigate(1));
document.getElementById("btnToday").addEventListener("click", () => {
  state.current = new Date(state.today);
  if (state.view === "list") setView("day");
  else refresh();
});
document.getElementById("btnNewEvent").addEventListener("click", (e) => {
  e.stopPropagation();
  closeMobileDrawer();
  setTimeout(() => openNewEventModal(), 350);
});
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("btnCancel").addEventListener("click", closeModal);
document.getElementById("btnSaveEvent").addEventListener("click", saveEvent);
document
  .getElementById("btnDeleteEvent")
  .addEventListener("click", deleteEvent);
document.getElementById("popupClose").addEventListener("click", closePopup);
document.getElementById("fAllDay").addEventListener("change", toggleTimeRow);

// Sincronizza colore evento con colore categoria selezionata
// fCategory change handled by cat search widget

document.querySelectorAll(".view-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.addEventListener("click", (e) => {
  const popup = document.getElementById("eventPopup");
  if (
    !popup.classList.contains("hidden") &&
    !popup.contains(e.target) &&
    !e.target.closest(
      ".event-chip,.week-event-item,.list-event,.day-event-card,.btn-edit",
    )
  ) {
    closePopup();
  }
});

// Tasto ESC chiude modal/popup
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closePopup();
  }
});

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
  const to   = document.getElementById("printRangeTo").value;
  if (!from || !to) { showToast("⚠️ Scegli data inizio e fine!"); return; }
  if (from > to)    { showToast("⚠️ La data di inizio deve essere prima della fine!"); return; }

  // Carica tutti gli eventi se necessario, poi filtra
  const allEvt = state.events;
  const filtered = allEvt.filter((e) => {
    const eEnd = e.end_date || e.start_date;
    return e.start_date <= to && eEnd >= from;
  });

  const title = `${formatDateShort(from)} → ${formatDateShort(to)}`;
  printEvents(filtered, title, "Agenda intervallo", from, to);
});

// Setup smart time inputs
setupTimeInputs();

// ──────────────── MOBILE DRAWER ────────────────
(function setupMobileMenu() {
  const btn = document.getElementById("btnMobileMenu");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("mobileOverlay");
  const mobileCloseBtn = document.getElementById("btnMobileClose");

  if (!btn) return;

  function openDrawer() {
    sidebar.classList.add("open");
    overlay.classList.remove("hidden");
    btn.classList.add("open");
    if (mobileCloseBtn) mobileCloseBtn.classList.remove("hidden");
  }

  function closeDrawer() {
    sidebar.classList.remove("open");
    overlay.classList.add("hidden");
    btn.classList.remove("open");
    if (mobileCloseBtn) mobileCloseBtn.classList.add("hidden");
  }

  btn.addEventListener("click", () => {
    sidebar.classList.contains("open") ? closeDrawer() : openDrawer();
  });

  overlay.addEventListener("click", closeDrawer);
  const closeBtn = document.getElementById("btnSidebarClose");
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener("click", closeDrawer);

  sidebar.addEventListener("click", (e) => {
    if (window.innerWidth > 768) return;
    const isMiniDay = e.target.closest(".mini-day[data-date]");
    const isViewBtn = e.target.closest(".view-btn");
    if (isMiniDay || isViewBtn) {
      setTimeout(closeDrawer, 120);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("open");
      overlay.classList.add("hidden");
      btn.classList.remove("open");
    }
  });
})();

// ──────────────── INIT ────────────────
(async () => {
  await refresh();
  console.log("🗓️ Calendario caricato!");
})();

// ══════════════════════════════════════════════
//  GESTIONE CATEGORIE — modal crea/modifica/elimina
// ══════════════════════════════════════════════

const EMOJI_LIST = [
  "📌",
  "💼",
  "🌿",
  "👨‍👩‍👧",
  "🏥",
  "⚽",
  "✈️",
  "🎂",
  "📚",
  "🎵",
  "🏠",
  "🍕",
  "💪",
  "🧘",
  "🎨",
  "💡",
  "📝",
  "🚗",
  "🛒",
  "🎬",
  "📅",
  "🔔",
  "💊",
  "🌙",
  "☀️",
  "🎯",
  "🏆",
  "💰",
  "🌱",
  "🤝",
  "🎉",
  "🐶",
  "🏋️",
  "🎸",
  "📷",
  "🧹",
  "💻",
  "🛫",
  "⚽",
  "🎂",
];

function openCatModal(cat = null) {
  document.getElementById("catModalTitle").textContent = cat
    ? "Modifica Categoria"
    : "Nuova Categoria";
  document.getElementById("catId").value = cat ? cat.id : "";
  document.getElementById("cName").value = cat ? cat.name : "";
  document.getElementById("cColor").value = cat ? cat.color : "#6366f1";
  document.getElementById("cIcon").value = cat ? cat.icon : "📌";
  document.getElementById("btnDeleteCat").classList.toggle("hidden", !cat);

  updateCatPreview();
  buildEmojiGrid(cat ? cat.icon : "📌");

  document.getElementById("catModalOverlay").classList.remove("hidden");
  document.getElementById("cName").focus();
}

function closeCatModal() {
  document.getElementById("catModalOverlay").classList.add("hidden");
}

function buildEmojiGrid(selected = "📌") {
  const grid = document.getElementById("emojiGrid");
  grid.innerHTML = EMOJI_LIST.map(
    (e) => `
    <button type="button" class="emoji-btn ${e === selected ? "selected" : ""}" data-emoji="${e}">${e}</button>
  `,
  ).join("");

  grid.querySelectorAll(".emoji-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("cIcon").value = btn.dataset.emoji;
      grid
        .querySelectorAll(".emoji-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateCatPreview();
    });
  });
}

function updateCatPreview() {
  const name = document.getElementById("cName").value || "Anteprima";
  const color = document.getElementById("cColor").value || "#6366f1";
  const icon = document.getElementById("cIcon").value || "📌";
  document.getElementById("catPreviewDot").style.background = color;
  document.getElementById("catPreviewIcon").textContent = icon;
  document.getElementById("catPreviewName").textContent = name;
}

async function saveCat() {
  const id = document.getElementById("catId").value;
  const name = document.getElementById("cName").value.trim();
  const color = document.getElementById("cColor").value;
  const icon = document.getElementById("cIcon").value.trim() || "📌";

  if (!name) {
    showToast("⚠️ Inserisci un nome per la categoria!");
    return;
  }

  const body = { name, color, icon };
  const resp = id
    ? await api("PUT", `/categories/${id}`, body)
    : await api("POST", "/categories", body);

  if (resp.success) {
    showToast(id ? "✅ Categoria aggiornata!" : "✅ Categoria creata!");
    closeCatModal();
    await refresh();

    // Se eravamo nel modal evento, aggiorna la select e preseleziona la nuova cat
    if (!document.getElementById("modalOverlay").classList.contains("hidden")) {
      await loadCategories();
      if (!id) {
        // preseleziona la nuova categoria appena creata
        setCategorySearchValue(resp.data.id);
      }
    }
  } else {
    showToast("❌ " + resp.error);
  }
}

async function deleteCat() {
  const id = document.getElementById("catId").value;
  const name = document.getElementById("cName").value;
  if (!id) return;

  // Controlla se la categoria ha eventi
  const cat = state.categories.find((c) => String(c.id) === String(id));
  if (cat && cat.event_count > 0) {
    showToast(
      `⚠️ Impossibile eliminare "${name}": ha ${cat.event_count} event${cat.event_count === 1 ? "o" : "i"} collegat${cat.event_count === 1 ? "o" : "i"}.`,
    );
    return;
  }

  if (
    !confirm(
      `Eliminare la categoria "${name}"?`,
    )
  )
    return;

  const resp = await api("DELETE", `/categories/${id}`);
  if (resp.success) {
    showToast("🗑 Categoria eliminata");
    closeCatModal();
    // Se l'evento aperto nel modal usava questa categoria → reset widget
    if (document.getElementById("fCategory").value == id) {
      setCategorySearchValue(null);
    }
    await refresh();
  } else {
    showToast("❌ " + resp.error);
  }
}

// Event listeners categorie
document.getElementById("btnAddCategory").addEventListener("click", (e) => {
  e.stopPropagation();
  closeMobileDrawer();
  setTimeout(() => openCatModal(), 350);
});
document
  .getElementById("catModalClose")
  .addEventListener("click", closeCatModal);
document
  .getElementById("btnCatCancel")
  .addEventListener("click", closeCatModal);
document.getElementById("btnSaveCat").addEventListener("click", saveCat);
document.getElementById("btnDeleteCat").addEventListener("click", deleteCat);

// Preview live su input
document.getElementById("cName").addEventListener("input", updateCatPreview);
document.getElementById("cColor").addEventListener("input", updateCatPreview);
document.getElementById("cIcon").addEventListener("input", updateCatPreview);

// Chiudi modal cat cliccando fuori
document.getElementById("catModalOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeCatModal();
});

// Pulsante "+ nuova" dentro modal evento → apri modal categoria senza chiudere l'evento
document
  .getElementById("btnQuickAddCat")
  .addEventListener("click", () => openCatModal());

// ══════════════════════════════════════════════
//  SOCKET.IO — aggiornamenti real-time
// ══════════════════════════════════════════════
(function initSocket() {
  // socket.io-client viene servito automaticamente da socket.io su /socket.io/socket.io.js
  const script = document.createElement("script");
  script.src = "/socket.io/socket.io.js";
  script.onload = () => {
    const socket = io();

    socket.on("connect", () => {
      console.log("🔌 Socket.IO connesso:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔌 Socket.IO disconnesso:", reason);
    });

    // Aggiorna calendario quando un altro client crea/modifica/elimina
    socket.on("event:created", () => refresh());
    socket.on("event:updated", () => refresh());
    socket.on("event:deleted", () => refresh());
    socket.on("category:created", () => {
      refresh();
      loadCategories();
    });
    socket.on("category:updated", () => {
      refresh();
      loadCategories();
    });
    socket.on("category:deleted", () => {
      refresh();
      loadCategories();
    });
  };
  document.head.appendChild(script);
})();

// ══════════════════════════════════════════════
//  CATEGORIA SEARCH WIDGET — sostituisce <select>
// ══════════════════════════════════════════════

(function initCatSearchWidget() {
  const searchInput = document.getElementById("fCategorySearch");
  const hiddenInput = document.getElementById("fCategory");
  const dropdown = document.getElementById("catDropdown");
  const clearBtn = document.getElementById("catSearchClear");

  function renderDropdown(filter) {
    const q = (filter || "").toLowerCase();
    let items = state.categories.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.icon && c.icon.includes(q)),
    );

    dropdown.innerHTML = "";

    // Opzione "Nessuna" sempre in cima
    const nessuna = document.createElement("div");
    nessuna.className = "cat-option" + (!hiddenInput.value ? " selected" : "");
    nessuna.innerHTML =
      '<span class="cat-opt-dot" style="background:#d1d5db;border:1px dashed #9ca3af"></span><span class="cat-opt-name">Nessuna categoria</span>';
    nessuna.addEventListener("mousedown", (e) => {
      e.preventDefault();
      selectCat(null, "");
    });
    dropdown.appendChild(nessuna);

    if (!items.length && q) {
      const empty = document.createElement("div");
      empty.className = "cat-option cat-option-empty";
      empty.textContent = "Nessun risultato";
      dropdown.appendChild(empty);
    }

    items.forEach((c) => {
      const el = document.createElement("div");
      el.className =
        "cat-option" +
        (String(hiddenInput.value) === String(c.id) ? " selected" : "");
      el.innerHTML = `<span class="cat-opt-dot" style="background:${c.color}"></span><span class="cat-opt-icon">${c.icon}</span><span class="cat-opt-name">${c.name}</span>`;
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectCat(c.id, c.icon + " " + c.name);
      });
      dropdown.appendChild(el);
    });

    dropdown.classList.remove("hidden");
  }

  function selectCat(id, label) {
    hiddenInput.value = id || "";
    searchInput.value = label || "";
    syncColorFromCategory(id);
    dropdown.classList.add("hidden");
    clearBtn.classList.toggle("hidden", !id);
  }

  searchInput.addEventListener("focus", () =>
    renderDropdown(searchInput.value),
  );
  searchInput.addEventListener("input", () =>
    renderDropdown(searchInput.value),
  );
  searchInput.addEventListener("blur", () => {
    // piccolo delay per permettere i mousedown
    setTimeout(() => dropdown.classList.add("hidden"), 150);
    // Se il testo non corrisponde a nessuna categoria, resetta
    const match = state.categories.find(
      (c) => searchInput.value === c.icon + " " + c.name,
    );
    if (
      !match &&
      searchInput.value !== "" &&
      searchInput.value !== "Nessuna categoria"
    ) {
      const current = state.categories.find(
        (c) => String(c.id) === String(hiddenInput.value),
      );
      searchInput.value = current ? current.icon + " " + current.name : "";
    }
    if (searchInput.value === "Nessuna categoria") searchInput.value = "";
  });

  clearBtn.addEventListener("click", () => selectCat(null, ""));
})();

// Chiamata da renderCategoryList e openEditEventModal per aggiornare il widget
function updateCatSearchWidget() {
  const hiddenInput = document.getElementById("fCategory");
  const searchInput = document.getElementById("fCategorySearch");
  if (!searchInput) return;
  const current = state.categories.find(
    (c) => String(c.id) === String(hiddenInput.value),
  );
  if (current) {
    searchInput.value = current.icon + " " + current.name;
    document.getElementById("catSearchClear").classList.remove("hidden");
  } else {
    searchInput.value = "";
    document.getElementById("catSearchClear").classList.add("hidden");
  }
}

// Imposta categoria nel widget (usato da openEditEventModal e saveCat)
function setCategorySearchValue(id) {
  const hiddenInput = document.getElementById("fCategory");
  const searchInput = document.getElementById("fCategorySearch");
  const clearBtn = document.getElementById("catSearchClear");
  hiddenInput.value = id || "";
  const cat = id
    ? state.categories.find((c) => String(c.id) === String(id))
    : null;
  searchInput.value = cat ? cat.icon + " " + cat.name : "";
  clearBtn.classList.toggle("hidden", !id);
  syncColorFromCategory(id);
}

// ── SIDEBAR CATEGORY SEARCH ──────────────────
(function initCatSidebarSearch() {
  const input = document.getElementById("catSidebarSearch");
  if (!input) return;
  input.addEventListener("input", () => {
    renderCategoryList();
  });
})();