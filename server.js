const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const http     = require("http");
const { Server } = require("socket.io");
const os       = require("os");

const { initDB }       = require("./db/database");
const { seedFakeData } = require("./db/seed");
const pageRoutes       = require("./routes/pages");
const eventsApi        = require("./api/events");
const categoriesApi    = require("./api/categories");

const PORT = process.env.PORT || 3000;
const app  = express();

// ── HTTP server + Socket.IO ───────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// ── Database ──────────────────────────────────
console.log("🗄️  Inizializzazione database...");
const db = initDB();

if (process.env.SEED === "true") {
  console.log("🌱 Modalità DEV_DATI — inserimento dati fittizi...");
  seedFakeData(db);
} else {
  console.log("⚪ Modalità DEV — database vuoto (usa npm run dev_dati per i dati fittizi)");
}

app.locals.db = db;

// ── Routes ────────────────────────────────────
app.use("/",               pageRoutes);
app.use("/api/events",     eventsApi);
app.use("/api/categories", categoriesApi);

// ── Health check ──────────────────────────────
app.get("/api/health", async (req, res) => {
  const publicIP = await getPublicIP();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    socketConnections: io.engine.clientsCount,
    publicIP,
    port: PORT,
  });
});

// ── SPA fallback ──────────────────────────────
app.get("*", (req, res) => {
  if (req.path.startsWith("/api"))
    return res.status(404).json({ error: "Endpoint non trovato" });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Error middleware ──────────────────────────
app.use((err, req, res, next) => {
  console.error("Errore server:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Errore interno del server",
    timestamp: new Date().toISOString(),
  });
});

// ── Socket.IO events ──────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 Client connesso: ${socket.id}`);
  socket.emit("connected", { message: "Connesso al calendario", timestamp: new Date().toISOString() });
  socket.on("disconnect", (reason) => console.log(`🔌 Client disconnesso: ${socket.id} — ${reason}`));
  socket.on("ping", () => socket.emit("pong", { timestamp: new Date().toISOString() }));
});

// ── IP utilities ──────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces))
    for (const iface of interfaces[name])
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
  return "localhost";
}

async function getPublicIP() {
  try {
    const https = require("https");
    return new Promise((resolve) => {
      https.get("https://api.ipify.org?format=json", (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data).ip); } catch { resolve(null); } });
      }).on("error", () => resolve(null));
    });
  } catch { return null; }
}

// ── Avvio server ──────────────────────────────
server.listen(PORT, "0.0.0.0", async () => {
  const localIP  = getLocalIP();
  const publicIP = await getPublicIP();
  const mode     = process.env.SEED === "true" ? "🌱 con dati fittizi" : "⚪ vuoto";

  console.log(`\n🗓️  Calendario avviato  [${mode}]`);
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
    io.close(() => {
      console.log("✅ Socket.IO chiuso.");
      try { db.close(); console.log("✅ Database chiuso."); } catch (_) {}
      console.log("👋 Arrivederci!\n");
      clearTimeout(forceExit);
      process.exit(0);
    });
  });
}

process.on("SIGINT",  () => gracefulShutdown("SIGINT (Ctrl+C)"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Fix Windows: nodemon manda SIGUSR2 per riavviare
process.once("SIGUSR2", () => {
  gracefulShutdown("SIGUSR2 (nodemon restart)");
});

// Gestione errori globali
process.on("uncaughtException",  (err)    => console.error("❌ UncaughtException:", err));
process.on("unhandledRejection", (reason) => console.error("❌ UnhandledRejection:", reason));

module.exports = { app, server, io };
