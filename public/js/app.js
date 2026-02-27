/**
 * Calendario App — Frontend JS
 * Viste: mese, settimana, giorno, lista
 * Funzionalità: ricerca, stampa, validazione orari, auto-completamento ore
 */

// ──────────────── STATO GLOBALE ────────────────
const state = {
  today: new Date(),
  current: new Date(),
  view: 'month',
  events: [],
  categories: [],
  selectedCategoryFilter: null,
  searchQuery: '',
  searchResults: null, // null = non in ricerca, array = risultati
};

const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                   'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const DAYS_IT   = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const DAYS_SHORT = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];

// ──────────────── API HELPERS ────────────────
async function api(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  return res.json();
}

async function loadEvents() {
  const { year, month } = getYearMonth();
  let url = `/events?year=${year}&month=${month+1}`;
  if (state.selectedCategoryFilter) url += `&category_id=${state.selectedCategoryFilter}`;
  const resp = await api('GET', url);
  if (resp.success) state.events = resp.data;
}

async function loadAllEvents() {
  let url = '/events';
  if (state.selectedCategoryFilter) url += `?category_id=${state.selectedCategoryFilter}`;
  const resp = await api('GET', url);
  if (resp.success) state.events = resp.data;
}

async function loadCategories() {
  const resp = await api('GET', '/categories');
  if (resp.success) {
    state.categories = resp.data;
    renderCategoryList();
  }
}

// ──────────────── UTILITIES ────────────────
function getYearMonth() {
  return { year: state.current.getFullYear(), month: state.current.getMonth() };
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  return `${DAYS_IT[(d.getDay()+6)%7]}, ${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()].substring(0,3)} ${d.getFullYear()}`;
}

function getEventsForDay(dateStr) {
  const src = state.searchResults !== null ? state.searchResults : state.events;
  return src.filter(e => {
    if (e.start_date === dateStr) return true;
    if (e.end_date && e.start_date <= dateStr && e.end_date >= dateStr) return true;
    return false;
  });
}

function getEventColor(event) {
  if (event.color) return event.color;
  if (event.category_color) return event.category_color;
  return '#6366f1';
}

// ──────────────── TIME AUTO-COMPLETE ────────────────
// Formatta input grezzo in "HH:MM"
// "8" → "08:00", "830" → "08:30", "1430" → "14:30", "9:00" → "09:00"
function normalizeTime(raw) {
  if (!raw) return '';
  raw = raw.trim().replace(/[^0-9:]/g, '');
  if (!raw) return '';

  if (raw.includes(':')) {
    const [h, m] = raw.split(':').map(s => parseInt(s, 10) || 0);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null; // errore
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  if (raw.length <= 2) {
    // "8" → 08:00, "14" → 14:00
    const h = parseInt(raw, 10);
    if (h < 0 || h > 23) return null;
    return `${String(h).padStart(2,'0')}:00`;
  }

  if (raw.length === 3) {
    // "830" → 08:30, "900" → 09:00
    const h = parseInt(raw.substring(0, 1), 10);
    const m = parseInt(raw.substring(1), 10);
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  if (raw.length === 4) {
    // "1430" → 14:30
    const h = parseInt(raw.substring(0, 2), 10);
    const m = parseInt(raw.substring(2), 10);
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  return null;
}

// Aggiunge 1 ora a "HH:MM"
function addOneHour(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const newH = (h + 1) % 24;
  return `${String(newH).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function setupTimeInputs() {
  const startInput = document.getElementById('fStartTime');
  const endInput   = document.getElementById('fEndTime');
  const startHint  = document.getElementById('startTimeHint');
  const endHint    = document.getElementById('endTimeHint');

  function handleStartBlur() {
    const norm = normalizeTime(startInput.value);
    if (norm === null) {
      startHint.textContent = '⚠ Orario non valido';
      return;
    }
    if (norm) {
      startInput.value = norm;
      startHint.textContent = '✓ ' + norm;
      // Auto-compila ora fine se vuota
      if (!endInput.value.trim()) {
        const autoEnd = addOneHour(norm);
        endInput.value = autoEnd;
        endHint.textContent = '✓ ' + autoEnd + ' (auto)';
      }
    } else {
      startHint.textContent = '';
    }
  }

  function handleEndBlur() {
    const norm = normalizeTime(endInput.value);
    if (norm === null) {
      endHint.textContent = '⚠ Orario non valido';
      return;
    }
    if (norm) {
      endInput.value = norm;
      const startNorm = normalizeTime(startInput.value);
      if (startNorm && timeToMinutes(norm) <= timeToMinutes(startNorm)) {
        endHint.textContent = '⚠ Deve essere dopo le ' + startNorm;
      } else {
        endHint.textContent = '✓ ' + norm;
      }
    } else {
      endHint.textContent = '';
    }
  }

  startInput.addEventListener('blur', handleStartBlur);
  endInput.addEventListener('blur', handleEndBlur);

  // Reset hint on focus
  startInput.addEventListener('focus', () => startHint.textContent = '');
  endInput.addEventListener('focus', () => endHint.textContent = '');
}

// ──────────────── MINI CALENDAR ────────────────
function renderMiniCal() {
  const { year, month } = getYearMonth();
  const container = document.getElementById('miniCal');
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const todayStr = toDateStr(state.today);
  const currentStr = toDateStr(state.current);

  let html = `
    <div class="mini-cal-header">
      <button class="mini-nav" id="miniPrev">‹</button>
      <span class="mini-cal-title">${MONTHS_IT[month].substring(0,3)} ${year}</span>
      <button class="mini-nav" id="miniNext">›</button>
    </div>
    <div class="mini-cal-grid">
      ${DAYS_SHORT.map(d => `<span class="mini-day-label">${d[0]}</span>`).join('')}
  `;

  for (let i = 0; i < startDow; i++) {
    html += `<span class="mini-day other-month"></span>`;
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = state.searchResults !== null
      ? state.searchResults.filter(e => e.start_date === dateStr)
      : state.events.filter(e => e.start_date === dateStr);
    const hasEvents = dayEvents.length > 0;
    const isSelected = (state.view === 'day' && dateStr === currentStr);
    const cls = ['mini-day',
      dateStr === todayStr ? 'today' : '',
      hasEvents ? 'has-events' : '',
      isSelected ? 'selected' : '',
    ].filter(Boolean).join(' ');
    html += `<span class="${cls}" data-date="${dateStr}">${d}</span>`;
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.mini-day[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      state.current = parseDate(el.dataset.date);
      if (state.view !== 'day') setView('day');
      else refresh();
    });
  });

  document.getElementById('miniPrev').addEventListener('click', e => {
    e.stopPropagation();
    state.current = new Date(year, month - 1, 1);
    refresh();
  });
  document.getElementById('miniNext').addEventListener('click', e => {
    e.stopPropagation();
    state.current = new Date(year, month + 1, 1);
    refresh();
  });
}

// ──────────────── CATEGORY LIST ────────────────
function renderCategoryList() {
  const list = document.getElementById('categoryList');
  const evSrc = state.searchResults !== null ? state.searchResults : state.events;
  list.innerHTML = `
    <li class="category-item ${!state.selectedCategoryFilter ? 'active' : ''}" data-id="">
      <span class="cat-dot" style="background:#6b6560"></span>
      <span class="cat-name">Tutte</span>
      <span class="cat-count">${evSrc.length}</span>
    </li>
    ${state.categories.map(c => `
      <li class="category-item ${state.selectedCategoryFilter == c.id ? 'active' : ''}" data-id="${c.id}">
        <span class="cat-dot" style="background:${c.color}"></span>
        <span class="cat-name">${c.icon} ${c.name}</span>
        <span class="cat-count">${c.event_count}</span>
        <button class="cat-edit-btn" data-cat-id="${c.id}" title="Modifica">✏</button>
      </li>
    `).join('')}
  `;

  // Click su item → filtra
  list.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('.cat-edit-btn')) return; // gestito sotto
      state.selectedCategoryFilter = item.dataset.id || null;
      refresh();
    });
  });

  // Click su bottone edit → apri modal categoria
  list.querySelectorAll('.cat-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cat = state.categories.find(c => c.id == btn.dataset.catId);
      if (cat) openCatModal(cat);
    });
  });

  // Popola select nel modal evento
  const select = document.getElementById('fCategory');
  const prevVal = select.value;
  select.innerHTML = `<option value="">Nessuna</option>` +
    state.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  if (prevVal) select.value = prevVal; // mantieni selezione
}

// ──────────────── MONTH VIEW ────────────────
function renderMonth() {
  const { year, month } = getYearMonth();
  document.getElementById('currentPeriod').textContent = `${MONTHS_IT[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const grid = document.getElementById('daysGrid');
  grid.innerHTML = '';

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    grid.appendChild(createDayCell(d.getDate(), toDateStr(d), true));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
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
  const cell = document.createElement('div');
  const todayStr = toDateStr(state.today);
  cell.className = `day-cell ${dateStr === todayStr ? 'today' : ''} ${isOther ? 'other-month' : ''}`;
  cell.dataset.date = dateStr;

  const dayEvents = getEventsForDay(dateStr);
  const maxVisible = 3;
  const visibleEvents = dayEvents.slice(0, maxVisible);
  const extra = dayEvents.length - maxVisible;

  let evHtml = visibleEvents.map(e => {
    const color = getEventColor(e);
    return `<div class="event-chip" style="background:${color}" data-id="${e.id}" title="${e.title}">
      <span class="event-chip-dot"></span>${e.title}
    </div>`;
  }).join('');
  if (extra > 0) evHtml += `<span class="more-events">+${extra} altri</span>`;

  cell.innerHTML = `<span class="day-num">${dayNum}</span>${evHtml}`;

  cell.addEventListener('click', e => {
    if (!e.target.closest('.event-chip')) {
      if (state.searchQuery) {
        openNewEventModal(dateStr);
      } else {
        state.current = parseDate(dateStr);
        setView('day');
      }
    }
  });
  cell.querySelectorAll('.event-chip').forEach(chip => {
    chip.addEventListener('click', e => {
      e.stopPropagation();
      const event = (state.searchResults || state.events).find(ev => ev.id == chip.dataset.id);
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
  const weekEnd = new Date(d); weekEnd.setDate(weekEnd.getDate() + 6);

  document.getElementById('currentPeriod').textContent =
    `${weekStart.getDate()} — ${weekEnd.getDate()} ${MONTHS_IT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const body = document.getElementById('weekBody');
  body.innerHTML = '';
  const todayStr = toDateStr(state.today);

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dateStr = toDateStr(day);
    const dayEvents = getEventsForDay(dateStr);
    const isT = dateStr === todayStr;

    const row = document.createElement('div');
    row.className = 'week-day-row';

    const evHtml = dayEvents.length
      ? dayEvents.map(e => {
          const color = getEventColor(e);
          const time = e.start_time ? `${e.start_time}` : '';
          return `<div class="week-event-item" style="background:${color}" data-id="${e.id}">
            ${e.category_icon || '📌'} <strong>${e.title}</strong>
            ${time ? `<span style="opacity:.7;margin-left:6px">${time}</span>` : ''}
          </div>`;
        }).join('')
      : '<div class="week-empty">Nessun evento</div>';

    row.innerHTML = `
      <div class="week-day-header" data-date="${dateStr}" style="cursor:pointer">
        <span class="week-day-name">${DAYS_SHORT[i]}</span>
        <span class="week-day-num ${isT ? 'today' : ''}">${day.getDate()}</span>
        <span style="font-size:11px;color:var(--text-light);margin-left:auto">${dayEvents.length ? dayEvents.length+' eventi' : ''}</span>
      </div>
      <div class="week-day-events">${evHtml}</div>
    `;

    row.querySelector('.week-day-header').addEventListener('click', () => {
      state.current = parseDate(dateStr);
      setView('day');
    });

    row.querySelectorAll('.week-event-item').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        const event = (state.searchResults || state.events).find(ev => ev.id == item.dataset.id);
        if (event) showEventPopup(event, item);
      });
    });
    body.appendChild(row);
  }
}

// ──────────────── DAY VIEW ────────────────
function renderDay() {
  const dateStr = toDateStr(state.current);
  const d = state.current;
  const dayName = DAYS_IT[(d.getDay()+6)%7];
  const isT = dateStr === toDateStr(state.today);

  document.getElementById('currentPeriod').textContent =
    `${dayName} ${d.getDate()} ${MONTHS_IT[d.getMonth()]}`;

  const dayEvents = getEventsForDay(dateStr);
  const timeline = document.getElementById('dayTimeline');

  // Ordina per ora inizio (senza orario → in fondo)
  const sorted = [...dayEvents].sort((a, b) => {
    const ta = a.start_time || '99:99';
    const tb = b.start_time || '99:99';
    return ta.localeCompare(tb);
  });

  let html = `
    <div class="day-header-big">
      <h2>${isT ? '📍 Oggi — ' : ''}${dayName} ${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}</h2>
      <p>${sorted.length} ${sorted.length === 1 ? 'impegno' : 'impegni'} in agenda</p>
    </div>
  `;

  if (!sorted.length) {
    html += `<div class="day-empty">
      <span class="day-empty-icon">🗓</span>
      Nessun impegno per questo giorno.<br>
      <button onclick="openNewEventModal('${dateStr}')" style="margin-top:16px;padding:8px 20px;background:var(--accent);border:none;border-radius:6px;color:#fff;cursor:pointer;font-family:inherit;font-size:13px">+ Aggiungi evento</button>
    </div>`;
  } else {
    sorted.forEach(e => {
      const color = getEventColor(e);
      const timeLabel = e.all_day ? 'Tutto il giorno' :
        (e.start_time ? `${e.start_time}${e.end_time ? ' – ' + e.end_time : ''}` : 'Orario non specificato');
      html += `
        <div class="timeline-slot">
          <div class="timeline-hour">${e.all_day ? '—' : (e.start_time || '—')}</div>
          <div class="timeline-line">
            <div class="timeline-dot" style="border-color:${color};background:${color}20"></div>
            <div class="timeline-track"></div>
          </div>
          <div class="day-event-card" style="border-left-color:${color}" data-id="${e.id}">
            <span class="day-event-icon">${e.category_icon || '📌'}</span>
            <div class="day-event-body">
              <div class="day-event-title">${e.title}</div>
              <div class="day-event-meta">
                <span>🕐 ${timeLabel}</span>
                ${e.location ? `<span>📍 ${e.location}</span>` : ''}
                ${e.category_name ? `<span style="color:${color}">${e.category_name}</span>` : ''}
              </div>
              ${e.description ? `<div style="font-size:12px;color:var(--text-light);margin-top:6px;font-style:italic">${e.description}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    });
  }

  timeline.innerHTML = html;

  timeline.querySelectorAll('.day-event-card').forEach(card => {
    card.addEventListener('click', () => {
      const event = (state.searchResults || state.events).find(ev => ev.id == card.dataset.id);
      if (event) showEventPopup(event, card);
    });
  });
}

// ──────────────── LIST VIEW ────────────────
function renderList() {
  const isSearch = state.searchResults !== null;
  if (isSearch) {
    document.getElementById('currentPeriod').textContent = `Risultati: "${state.searchQuery}"`;
  } else {
    document.getElementById('currentPeriod').textContent = 'Tutti gli eventi';
  }

  const src = isSearch ? state.searchResults : state.events;
  const container = document.getElementById('listContainer');

  if (!src.length) {
    container.innerHTML = `<p style="color:var(--text-light);text-align:center;padding:60px;font-style:italic">
      ${isSearch ? `Nessun risultato per "${state.searchQuery}"` : 'Nessun evento trovato.'}
    </p>`;
    return;
  }

  const groups = {};
  src.forEach(e => {
    const d = parseDate(e.start_date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!groups[key]) groups[key] = { label: `${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`, events: [] };
    groups[key].events.push(e);
  });

  container.innerHTML = Object.values(groups).map(g => `
    <div class="list-month-group">
      <h3 class="list-month-title">${g.label}</h3>
      ${g.events.map(e => {
        const color = getEventColor(e);
        const d = parseDate(e.start_date);
        const dow = DAYS_SHORT[(d.getDay()+6)%7];
        return `
          <div class="list-event" data-id="${e.id}">
            <div class="list-event-date">
              <span class="list-day-num">${d.getDate()}</span>
              <span class="list-day-name">${dow}</span>
            </div>
            <div class="list-event-bar" style="background:${color}"></div>
            <div class="list-event-content">
              <div class="list-event-title">${e.title}</div>
              <div class="list-event-meta">
                ${e.start_time ? `<span>🕐 ${e.start_time}${e.end_time?'–'+e.end_time:''}</span>` : ''}
                ${e.category_name ? `<span>${e.category_icon} ${e.category_name}</span>` : ''}
                ${e.location ? `<span>📍 ${e.location}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  container.querySelectorAll('.list-event').forEach(item => {
    item.addEventListener('click', () => {
      const event = src.find(e => e.id == item.dataset.id);
      if (event) showEventPopup(event, item);
    });
  });
}

// ──────────────── POPUP EVENTO ────────────────
function showEventPopup(event, anchor) {
  const popup = document.getElementById('eventPopup');
  document.getElementById('popupIcon').textContent = event.category_icon || '📌';
  document.getElementById('popupTitle').textContent = event.title;
  document.getElementById('popupCategory').textContent = event.category_name || '';

  document.getElementById('popupDate').textContent =
    event.end_date && event.end_date !== event.start_date
      ? `📅 ${formatDate(event.start_date)} → ${formatDateShort(event.end_date)}`
      : `📅 ${formatDate(event.start_date)}`;

  const timeEl = document.getElementById('popupTime');
  if (event.start_time) {
    timeEl.textContent = `🕐 ${event.start_time}${event.end_time ? ' – ' + event.end_time : ''}`;
    timeEl.classList.remove('hidden');
  } else { timeEl.classList.add('hidden'); }

  const locEl = document.getElementById('popupLocation');
  if (event.location) { locEl.textContent = `📍 ${event.location}`; locEl.classList.remove('hidden'); }
  else locEl.classList.add('hidden');

  const descEl = document.getElementById('popupDesc');
  if (event.description) { descEl.textContent = event.description; descEl.classList.remove('hidden'); }
  else descEl.classList.add('hidden');

  popup.classList.remove('hidden');
  const rect = anchor.getBoundingClientRect();
  const pw = 300;
  let left = rect.right + 8;
  let top = rect.top;
  if (left + pw > window.innerWidth - 16) left = rect.left - pw - 8;
  if (top + 260 > window.innerHeight) top = window.innerHeight - 270;
  popup.style.left = `${Math.max(8, left)}px`;
  popup.style.top  = `${Math.max(8, top)}px`;

  document.getElementById('btnEditEvent').onclick = () => { closePopup(); openEditEventModal(event); };
}

function closePopup() {
  document.getElementById('eventPopup').classList.add('hidden');
}

// ──────────────── MODAL ────────────────
function openNewEventModal(dateStr = null) {
  const today = dateStr || toDateStr(state.today);
  resetForm();
  document.getElementById('modalTitle').textContent = 'Nuovo Evento';
  document.getElementById('btnDeleteEvent').classList.add('hidden');
  document.getElementById('fStartDate').value = today;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('fTitle').focus();
}

function openEditEventModal(event) {
  resetForm();
  document.getElementById('modalTitle').textContent = 'Modifica Evento';
  document.getElementById('btnDeleteEvent').classList.remove('hidden');
  document.getElementById('eventId').value = event.id;
  document.getElementById('fTitle').value = event.title || '';
  document.getElementById('fStartDate').value = event.start_date || '';
  document.getElementById('fEndDate').value = event.end_date || '';
  document.getElementById('fStartTime').value = event.start_time || '';
  document.getElementById('fEndTime').value = event.end_time || '';
  document.getElementById('fLocation').value = event.location || '';
  document.getElementById('fCategory').value = event.category_id || '';
  document.getElementById('fColor').value = event.color || getEventColor(event);
  document.getElementById('fDescription').value = event.description || '';
  document.getElementById('fAllDay').checked = !!event.all_day;
  toggleTimeRow();
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  resetForm();
}

function resetForm() {
  document.getElementById('eventForm').reset();
  document.getElementById('eventId').value = '';
  document.getElementById('fColor').value = '#4f46e5';
  document.getElementById('timeRow').style.display = '';
  document.getElementById('startTimeHint').textContent = '';
  document.getElementById('endTimeHint').textContent = '';
}

function toggleTimeRow() {
  const allDay = document.getElementById('fAllDay').checked;
  document.getElementById('timeRow').style.display = allDay ? 'none' : '';
}

async function saveEvent() {
  const id = document.getElementById('eventId').value;

  const rawStart = document.getElementById('fStartTime').value.trim();
  const rawEnd   = document.getElementById('fEndTime').value.trim();
  const startTime = rawStart ? normalizeTime(rawStart) : null;
  const endTime   = rawEnd   ? normalizeTime(rawEnd)   : null;
  const allDay = document.getElementById('fAllDay').checked;

  // Validazione orari
  if (!allDay) {
    if (rawStart && startTime === null) {
      showToast('⚠️ Ora di inizio non valida!'); return;
    }
    if (rawEnd && endTime === null) {
      showToast('⚠️ Ora di fine non valida!'); return;
    }
    if (startTime && endTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      showToast('⚠️ L\'ora di fine deve essere dopo l\'ora di inizio!'); return;
    }
  }

  const body = {
    title:       document.getElementById('fTitle').value,
    start_date:  document.getElementById('fStartDate').value,
    end_date:    document.getElementById('fEndDate').value || null,
    start_time:  startTime,
    end_time:    endTime,
    location:    document.getElementById('fLocation').value || null,
    category_id: document.getElementById('fCategory').value || null,
    all_day:     allDay ? 1 : 0,
    color:       document.getElementById('fColor').value,
    description: document.getElementById('fDescription').value || null,
  };

  if (!body.title || !body.start_date) {
    showToast('⚠️ Compila titolo e data!'); return;
  }

  const resp = id
    ? await api('PUT', `/events/${id}`, body)
    : await api('POST', '/events', body);

  if (resp.success) {
    showToast(id ? '✅ Evento aggiornato!' : '✅ Evento creato!');
    closeModal();
    await refresh();
  } else {
    showToast('❌ Errore: ' + resp.error);
  }
}

async function deleteEvent() {
  const id = document.getElementById('eventId').value;
  if (!id || !confirm('Eliminare questo evento?')) return;
  const resp = await api('DELETE', `/events/${id}`);
  if (resp.success) {
    showToast('🗑 Evento eliminato');
    closeModal();
    await refresh();
  }
}

// ──────────────── STAMPA ────────────────
function buildPrintHTML(events, title, subtitle) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  if (!events.length) {
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
    if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
    const ta = a.start_time || '99:99';
    const tb = b.start_time || '99:99';
    return ta.localeCompare(tb);
  });

  const rows = sorted.map(e => {
    const color = getEventColor(e);
    const timeLabel = e.all_day ? 'Tutto il giorno' :
      (e.start_time ? `${e.start_time}${e.end_time ? ' – ' + e.end_time : ''}` : '—');
    const details = [
      e.category_name ? `${e.category_icon} ${e.category_name}` : '',
      e.location ? `📍 ${e.location}` : '',
      formatDate(e.start_date) + (e.end_date && e.end_date !== e.start_date ? ` → ${formatDateShort(e.end_date)}` : ''),
    ].filter(Boolean).join('  ·  ');

    return `
      <div class="print-event-row">
        <div class="print-event-time">${timeLabel}</div>
        <div class="print-event-dot" style="background:${color}"></div>
        <div class="print-event-body">
          <div class="print-event-title">${e.title}</div>
          <div class="print-event-details">${details}</div>
          ${e.description ? `<div class="print-event-desc">${e.description}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="print-header">
      <div>
        <div class="print-title">◈ ${title}</div>
        <div class="print-subtitle">${subtitle} · ${sorted.length} eventi</div>
      </div>
      <div class="print-meta">Stampato il<br>${dateStr}</div>
    </div>
    ${rows}
    <div class="print-footer">◈ Planner — Calendario Personale</div>
  `;
}

function printEvents(events, title, subtitle) {
  const frame = document.getElementById('printFrame');
  frame.innerHTML = buildPrintHTML(events, title, subtitle);
  frame.classList.remove('hidden');

  // Aggiungi font per stampa
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif !important; }
    #printFrame .print-title { font-family: 'DM Serif Display', serif !important; }
  `;
  frame.appendChild(style);

  setTimeout(() => {
    window.print();
    frame.classList.add('hidden');
    frame.innerHTML = '';
  }, 300);
}

function printDay(dateStr) {
  const events = getEventsForDay(dateStr);
  printEvents(events, formatDate(dateStr), 'Agenda del giorno');
}

function printSearchResults() {
  if (!state.searchResults) return;
  printEvents(state.searchResults, `Ricerca: "${state.searchQuery}"`, 'Risultati di ricerca');
}

// ──────────────── TOAST ────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ──────────────── RICERCA ────────────────
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();
  state.searchQuery = q;

  const badge  = document.getElementById('searchBadge');
  const btnPS  = document.getElementById('btnPrintSearch');

  searchTimeout = setTimeout(async () => {
    if (q.length > 1) {
      const resp = await api('GET', `/events?search=${encodeURIComponent(q)}`);
      if (resp.success) {
        state.searchResults = resp.data;
        badge.textContent = `${resp.data.length} risultati`;
        badge.classList.remove('hidden');
        btnPS.classList.remove('hidden');
        await loadCategories();
        setView('list');
      }
    } else {
      state.searchResults = null;
      badge.classList.add('hidden');
      btnPS.classList.add('hidden');
      await refresh();
    }
  }, 280);
});

// ──────────────── NAVIGAZIONE ────────────────
function navigate(dir) {
  const { year, month } = getYearMonth();
  if (state.view === 'month') {
    state.current = new Date(year, month + dir, 1);
  } else if (state.view === 'week') {
    state.current = new Date(state.current.getTime() + dir * 7 * 86400000);
  } else if (state.view === 'day') {
    state.current = new Date(state.current.getTime() + dir * 86400000);
  } else {
    state.current = new Date(year, month + dir, 1);
  }
  refresh();
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('calendarMonth').classList.toggle('hidden', view !== 'month');
  document.getElementById('calendarWeek').classList.toggle('hidden',  view !== 'week');
  document.getElementById('calendarDay').classList.toggle('hidden',   view !== 'day');
  document.getElementById('calendarList').classList.toggle('hidden',  view !== 'list');
  refresh();
}

async function refresh() {
  if (state.searchResults !== null) {
    // In modalità ricerca, non ricaricare eventi (usiamo searchResults)
    await loadCategories();
  } else if (state.view === 'list') {
    await loadAllEvents();
    await loadCategories();
  } else {
    await loadEvents();
    await loadCategories();
  }

  if (state.view === 'month')     renderMonth();
  else if (state.view === 'week') renderWeek();
  else if (state.view === 'day')  renderDay();
  else                            renderList();

  renderMiniCal();
}

// ──────────────── EVENT LISTENERS ────────────────
document.getElementById('btnPrev').addEventListener('click', () => navigate(-1));
document.getElementById('btnNext').addEventListener('click', () => navigate(1));
document.getElementById('btnToday').addEventListener('click', () => {
  state.current = new Date(state.today);
  if (state.view === 'list') setView('day'); else refresh();
});
document.getElementById('btnNewEvent').addEventListener('click', () => openNewEventModal());
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('btnSaveEvent').addEventListener('click', saveEvent);
document.getElementById('btnDeleteEvent').addEventListener('click', deleteEvent);
document.getElementById('popupClose').addEventListener('click', closePopup);
document.getElementById('fAllDay').addEventListener('change', toggleTimeRow);

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.addEventListener('click', e => {
  const popup = document.getElementById('eventPopup');
  if (!popup.classList.contains('hidden') &&
      !popup.contains(e.target) &&
      !e.target.closest('.event-chip,.week-event-item,.list-event,.day-event-card,.btn-edit')) {
    closePopup();
  }
});

// Tasto ESC chiude modal/popup
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closePopup(); }
});

// Print buttons
document.getElementById('btnPrintDay').addEventListener('click', () => {
  printDay(toDateStr(state.current));
});

document.getElementById('btnPrintSearch').addEventListener('click', () => {
  printSearchResults();
});

document.getElementById('btnPrintCustomDay').addEventListener('click', () => {
  const d = document.getElementById('printDatePicker').value;
  if (!d) { showToast('⚠️ Scegli una data!'); return; }
  printDay(d);
});

// Pre-imposta data picker al giorno corrente
document.getElementById('printDatePicker').value = toDateStr(new Date());

// Setup smart time inputs
setupTimeInputs();

// ──────────────── INIT ────────────────
(async () => {
  await refresh();
  console.log('🗓️ Calendario caricato!');
})();

// ══════════════════════════════════════════════
//  GESTIONE CATEGORIE — modal crea/modifica/elimina
// ══════════════════════════════════════════════

const EMOJI_LIST = [
  '📌','💼','🌿','👨‍👩‍👧','🏥','⚽','✈️','🎂','📚','🎵',
  '🏠','🍕','💪','🧘','🎨','💡','📝','🚗','🛒','🎬',
  '📅','🔔','💊','🌙','☀️','🎯','🏆','💰','🌱','🤝',
  '🎉','🐶','🏋️','🎸','📷','🧹','💻','🛫','⚽','🎂',
];

function openCatModal(cat = null) {
  document.getElementById('catModalTitle').textContent = cat ? 'Modifica Categoria' : 'Nuova Categoria';
  document.getElementById('catId').value   = cat ? cat.id : '';
  document.getElementById('cName').value  = cat ? cat.name  : '';
  document.getElementById('cColor').value = cat ? cat.color : '#6366f1';
  document.getElementById('cIcon').value  = cat ? cat.icon  : '📌';
  document.getElementById('btnDeleteCat').classList.toggle('hidden', !cat);

  updateCatPreview();
  buildEmojiGrid(cat ? cat.icon : '📌');

  document.getElementById('catModalOverlay').classList.remove('hidden');
  document.getElementById('cName').focus();
}

function closeCatModal() {
  document.getElementById('catModalOverlay').classList.add('hidden');
}

function buildEmojiGrid(selected = '📌') {
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = EMOJI_LIST.map(e => `
    <button type="button" class="emoji-btn ${e === selected ? 'selected' : ''}" data-emoji="${e}">${e}</button>
  `).join('');

  grid.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('cIcon').value = btn.dataset.emoji;
      grid.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateCatPreview();
    });
  });
}

function updateCatPreview() {
  const name  = document.getElementById('cName').value  || 'Anteprima';
  const color = document.getElementById('cColor').value || '#6366f1';
  const icon  = document.getElementById('cIcon').value  || '📌';
  document.getElementById('catPreviewDot').style.background = color;
  document.getElementById('catPreviewIcon').textContent = icon;
  document.getElementById('catPreviewName').textContent = name;
}

async function saveCat() {
  const id    = document.getElementById('catId').value;
  const name  = document.getElementById('cName').value.trim();
  const color = document.getElementById('cColor').value;
  const icon  = document.getElementById('cIcon').value.trim() || '📌';

  if (!name) { showToast('⚠️ Inserisci un nome per la categoria!'); return; }

  const body = { name, color, icon };
  const resp = id
    ? await api('PUT',  `/categories/${id}`, body)
    : await api('POST', '/categories',        body);

  if (resp.success) {
    showToast(id ? '✅ Categoria aggiornata!' : '✅ Categoria creata!');
    closeCatModal();
    await refresh();

    // Se eravamo nel modal evento, aggiorna la select e preseleziona la nuova cat
    if (!document.getElementById('modalOverlay').classList.contains('hidden')) {
      await loadCategories();
      if (!id) {
        // preseleziona la nuova categoria appena creata
        document.getElementById('fCategory').value = resp.data.id;
      }
    }
  } else {
    showToast('❌ ' + resp.error);
  }
}

async function deleteCat() {
  const id   = document.getElementById('catId').value;
  const name = document.getElementById('cName').value;
  if (!id) return;
  if (!confirm(`Eliminare la categoria "${name}"?\nGli eventi associati rimarranno senza categoria.`)) return;

  const resp = await api('DELETE', `/categories/${id}`);
  if (resp.success) {
    showToast('🗑 Categoria eliminata');
    closeCatModal();
    await refresh();
  } else {
    showToast('❌ ' + resp.error);
  }
}

// Event listeners categorie
document.getElementById('btnAddCategory').addEventListener('click', () => openCatModal());
document.getElementById('catModalClose').addEventListener('click', closeCatModal);
document.getElementById('btnCatCancel').addEventListener('click', closeCatModal);
document.getElementById('btnSaveCat').addEventListener('click', saveCat);
document.getElementById('btnDeleteCat').addEventListener('click', deleteCat);

// Preview live su input
document.getElementById('cName').addEventListener('input',  updateCatPreview);
document.getElementById('cColor').addEventListener('input', updateCatPreview);
document.getElementById('cIcon').addEventListener('input',  updateCatPreview);

// Chiudi modal cat cliccando fuori
document.getElementById('catModalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCatModal();
});

// Pulsante "+ nuova" dentro modal evento → apri modal categoria senza chiudere l'evento
document.getElementById('btnQuickAddCat').addEventListener('click', () => openCatModal());

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
    socket.on("event:created",  () => refresh());
    socket.on("event:updated",  () => refresh());
    socket.on("event:deleted",  () => refresh());
    socket.on("category:created", () => { refresh(); loadCategories(); });
    socket.on("category:updated", () => { refresh(); loadCategories(); });
    socket.on("category:deleted", () => { refresh(); loadCategories(); });
  };
  document.head.appendChild(script);
})();
