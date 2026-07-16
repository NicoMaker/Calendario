// ==================== RICERCA EVENTI ====================
// File: js/search.js
// Scopo: ricerca full-text con debounce sul campo di ricerca in header.
// Dipendenze (caricare PRIMA): config.js (state); usa refresh() definita in navigation.js (chiamata a runtime)

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
