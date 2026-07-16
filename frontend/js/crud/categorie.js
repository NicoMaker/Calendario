// ==================== GESTIONE CATEGORIE (CRUD + UI) ====================
// File: js/crud/categorie.js
// Scopo: caricamento e lista categorie in sidebar, modal crea/modifica/elimina,
//        griglia emoji, widget di ricerca categoria nel modal evento.
// Dipendenze (caricare PRIMA): config.js, utils.js, ui/notifications.js

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
      if (!confirm(`Eliminare la categoria "${cat.name}"?`)) return;
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

  if (!confirm(`Eliminare la categoria "${name}"?`)) return;

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
