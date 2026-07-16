// ==================== UI: POPUP E MODAL EVENTO ====================
// File: js/ui/modals.js
// Scopo: popup dettaglio evento + apertura/chiusura/reset del modal evento.
// Dipendenze (caricare PRIMA): config.js, utils.js

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
