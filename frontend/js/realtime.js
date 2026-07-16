// ==================== SOCKET.IO — AGGIORNAMENTI REAL-TIME ====================
// File: js/realtime.js
// Scopo: connessione Socket.IO e refresh automatico su eventi remoti
//        (event:created/updated/deleted, category:created/updated/deleted).

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
