// Modulo Socket.IO isolato: init + emissione eventi calendario.
// I service chiamano emit() senza conoscere i dettagli del trasporto.
// Eventi emessi: event:created/updated/deleted, category:created/updated/deleted
const { Server } = require("socket.io");

let io = null;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connesso: ${socket.id}`);
    socket.emit("connected", {
      message: "Connesso al calendario",
      timestamp: new Date().toISOString(),
    });
    socket.on("disconnect", (reason) =>
      console.log(`🔌 Client disconnesso: ${socket.id} — ${reason}`),
    );
    socket.on("error", (error) =>
      console.error(`⚠️ Errore Socket.IO (${socket.id}):`, error),
    );
    socket.on("ping", () =>
      socket.emit("pong", { timestamp: new Date().toISOString() }),
    );
  });

  return io;
}

function emit(event, data) {
  if (io) io.emit(event, data);
}

function clientsCount() {
  return io ? io.engine.clientsCount : 0;
}

function close(callback) {
  if (io) io.close(callback);
  else if (callback) callback();
}

module.exports = { init, emit, clientsCount, close };
