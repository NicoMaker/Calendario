// ==================== GESTIONE EVENTI (CRUD) ====================
// File: js/crud/eventi.js
// Scopo: caricamento, salvataggio (crea/modifica) ed eliminazione eventi via API.
// Dipendenze (caricare PRIMA): config.js, utils.js, ui/modals.js, ui/notifications.js

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
