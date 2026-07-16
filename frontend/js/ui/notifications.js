// ==================== UI: NOTIFICHE TOAST ====================
// File: js/ui/notifications.js
// Scopo: toast informativi non bloccanti (showToast).

// ──────────────── TOAST ────────────────
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}
