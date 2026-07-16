// Entry point: inizializza DB e Socket.IO, avvia il server HTTP
const http = require("http");
const creaApp = require("./src/app");
const { initDatabase } = require("./src/config/schema");
const { db } = require("./src/config/database");
const realtime = require("./src/realtime/socket");
const { getLocalIP, getPublicIP } = require("./src/utils/network");

const PORT = process.env.PORT || 3000;

// ── Database ──────────────────────────────────
console.log("🗄️  Inizializzazione database...");
initDatabase();

// ── App + HTTP server + Socket.IO ─────────────
const app = creaApp({ port: PORT });
const server = http.createServer(app);
realtime.init(server);

// ── Avvio server ──────────────────────────────
server.listen(PORT, "0.0.0.0", async () => {
  const localIP = getLocalIP();
  const publicIP = await getPublicIP();

  console.log(`\n🗓️  Calendario avviato`);
  console.log(`   Localhost  : http://localhost:${PORT}`);
  console.log(`   Rete locale: http://${localIP}:${PORT}`);
  if (publicIP) console.log(`   IP Pubblico: http://${publicIP}:${PORT}`);
  console.log(`   Health     : http://localhost:${PORT}/api/health`);
  console.log(`   Socket.IO  : abilitato`);
  console.log("\nPremi Ctrl+C per fermare.\n");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Porta ${PORT} già in uso!`);
    console.error(`   > netstat -ano | findstr :${PORT}`);
    console.error(`   > taskkill /PID <numero_pid> /F\n`);
  } else {
    console.error("❌ Errore server:", err);
  }
  process.exit(1);
});

// ── Graceful shutdown ─────────────────────────
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 ${signal} — chiusura in corso...`);

  // Forza uscita dopo 5 secondi
  const forceExit = setTimeout(() => {
    console.error("⚠️  Timeout — chiusura forzata.");
    process.exit(1);
  }, 5000);
  forceExit.unref(); // non blocca il process loop

  server.close(() => {
    console.log("✅ Server HTTP chiuso.");
    realtime.close(() => {
      console.log("✅ Socket.IO chiuso.");
      try {
        db.close();
        console.log("✅ Database chiuso.");
      } catch (_) {}
      console.log("👋 Arrivederci!\n");
      clearTimeout(forceExit);
      process.exit(0);
    });
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT (Ctrl+C)"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Fix Windows: nodemon manda SIGUSR2 per riavviare
process.once("SIGUSR2", () => {
  gracefulShutdown("SIGUSR2 (nodemon restart)");
});

// Gestione errori globali
process.on("uncaughtException", (err) =>
  console.error("❌ UncaughtException:", err),
);
process.on("unhandledRejection", (reason) =>
  console.error("❌ UnhandledRejection:", reason),
);

module.exports = { app, server };
