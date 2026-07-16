// Service eventi: validazione, notifiche real-time e formato risposta
// { success, data } identico a quello atteso dal frontend
const repo = require("../repositories/eventiRepository");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

const eventiService = {
  lista(filtri) {
    const events = repo.lista(filtri);
    return { success: true, data: events, count: events.length };
  },

  dettaglio(id) {
    const event = repo.trovaPerId(id);
    if (!event) throw new HttpError(404, "Evento non trovato");
    return { success: true, data: event };
  },

  crea(body) {
    if (!body.title || !body.start_date)
      throw new HttpError(400, "Titolo e data obbligatori");

    const result = repo.crea(body);
    const newEvent = repo.trovaBase(result.lastID);

    // Notifica real-time tutti i client connessi
    realtime.emit("event:created", newEvent);

    return { success: true, data: newEvent };
  },

  aggiorna(id, body) {
    if (!repo.esiste(id)) throw new HttpError(404, "Evento non trovato");

    repo.aggiorna(id, body);
    const updated = repo.trovaBase(id);

    realtime.emit("event:updated", updated);

    return { success: true, data: updated };
  },

  elimina(id) {
    const result = repo.elimina(id);
    if (result.changes === 0) throw new HttpError(404, "Evento non trovato");

    realtime.emit("event:deleted", { id: Number(id) });

    return { success: true, message: "Evento eliminato" };
  },
};

module.exports = eventiService;
