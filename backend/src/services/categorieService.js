// Service categorie: validazione, gestione duplicati (UNIQUE),
// blocco eliminazione con eventi collegati, notifiche real-time
const repo = require("../repositories/categorieRepository");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

const categorieService = {
  lista() {
    return { success: true, data: repo.listaConConteggio() };
  },

  dettaglio(id) {
    const cat = repo.trovaPerId(id);
    if (!cat) throw new HttpError(404, "Categoria non trovata");
    return { success: true, data: cat };
  },

  crea({ name, color, icon }) {
    if (!name) throw new HttpError(400, "Nome obbligatorio");

    let result;
    try {
      result = repo.crea({ name, color, icon });
    } catch (err) {
      if (String(err.message).includes("UNIQUE"))
        throw new HttpError(409, "Categoria già esistente");
      throw err;
    }

    const cat = repo.trovaPerId(result.lastID);
    realtime.emit("category:created", cat);

    return { success: true, data: cat };
  },

  aggiorna(id, { name, color, icon }) {
    if (!repo.esiste(id)) throw new HttpError(404, "Categoria non trovata");

    repo.aggiorna(id, { name, color, icon });
    const updated = repo.trovaPerId(id);

    realtime.emit("category:updated", updated);

    return { success: true, data: updated };
  },

  elimina(id) {
    // Controlla se la categoria ha eventi collegati
    const eventCount = repo.contaEventi(id);
    if (eventCount > 0) {
      throw new HttpError(
        409,
        `Impossibile eliminare: ${eventCount} event${eventCount === 1 ? "o" : "i"} collegat${eventCount === 1 ? "o" : "i"} a questa categoria.`,
      );
    }

    const result = repo.elimina(id);
    if (result.changes === 0)
      throw new HttpError(404, "Categoria non trovata");

    realtime.emit("category:deleted", { id: Number(id) });

    return { success: true, message: "Categoria eliminata" };
  },
};

module.exports = categorieService;
