// ==================== UI: HELPER FORM ORARI ====================
// File: js/ui/formHelpers.js
// Scopo: normalizzazione orari ("830" → "08:30"), auto-completamento e
//        validazione live degli input ora del modal evento.
// Dipendenze (caricare PRIMA): ui/notifications.js (showToast)

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
