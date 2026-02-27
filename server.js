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

// ── Crea server HTTP + Socket.IO ──────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Rendi io disponibile nelle route
app.set("io", io);

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Log richieste API
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// ── Database ──────────────────────────────────────────────
console.log("🗄️  Inizializzazione database...");
const db = initDB();

if (process.env.SEED === "true") {
  console.log("🌱 Modalità DEV_DATI — inserimento dati fittizi...");
  seedFakeData(db);
} else {
  console.log("⚪ Modalità DEV — database vuoto (usa npm run dev_dati per i dati fittizi)");
}

app.locals.db = db;

// ── Routes ────────────────────────────────────────────────
app.use("/",                pageRoutes);
app.use("/api/events",      eventsApi);
app.use("/api/categories",  categoriesApi);

// ── Health check ──────────────────────────────────────────
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

// ── SPA fallback ──────────────────────────────────────────
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Endpoint API non trovato" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Gestione errori middleware ─────────────────────────────
app.use((err, req, res, next) => {
  console.error("Errore server:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Errore interno del server",
    timestamp: new Date().toISOString(),
  });
});

// ── Socket.IO ─────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 Client connesso: ${socket.id} da ${socket.handshake.address}`);

  socket.emit("connected", {
    message: "Connesso al calendario",
    timestamp: new Date().toISOString(),
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Client disconnesso: ${socket.id} — ${reason}`);
  });

  socket.on("error", (error) => {
    console.error(`Errore Socket.IO (${socket.id}):`, error);
  });

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() });
  });
});

// ── Utility IP ────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

async function getPublicIP() {
  try {
    const https = require("https");
    return new Promise((resolve, reject) => {
      https.get("https://api.ipify.org?format=json", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(data).ip); }
          catch (e) { reject(e); }
        });
      }).on("error", reject);
    });
  } catch {
    return null;
  }
}

// ── Avvio server ──────────────────────────────────────────
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
    console.error(`   > taskkill /PID <numero_pid> /F`);
    console.error(`   Oppure: set PORT=3001 && npm run dev\n`);
  } else {
    console.error("❌ Errore server:", err);
  }
  process.exit(1);
});

// ── Gestione errori globali ───────────────────────────────
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// ── Graceful shutdown (Ctrl+C) ────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} ricevuto — chiusura in corso...`);

  server.close(() => {
    console.log("✅ Server HTTP chiuso.");
    io.close(() => {
      console.log("✅ Socket.IO chiuso.");
      try { db.close(); console.log("✅ Database chiuso."); } catch (_) {}
      console.log("👋 Arrivederci!\n");
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error("⚠️  Timeout chiusura — forzatura uscita.");
    process.exit(1);
  }, 5000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT (Ctrl+C)"));

module.exports = { app, server, io };
