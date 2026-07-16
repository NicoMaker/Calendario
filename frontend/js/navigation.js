// ==================== NAVIGAZIONE, EVENT LISTENERS E INIT ====================
// File: js/navigation.js
// Scopo: cambio vista/periodo, refresh dati, drawer mobile, listener globali
//        e bootstrap dell'app. DEVE essere caricato per ultimo.
// Dipendenze (caricare PRIMA): tutti gli altri moduli js

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
// Renderizza la vista corrente senza ricaricare dal server
function renderCurrentView() {
  if (state.view === "month") renderMonth();
  else if (state.view === "week") renderWeek();
  else if (state.view === "day") renderDay();
  else renderList();
  renderMiniCal();
}
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
