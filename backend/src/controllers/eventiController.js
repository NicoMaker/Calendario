// Controller eventi: traduce richieste HTTP in chiamate al service
const eventiService = require("../services/eventiService");

module.exports = {
  async lista(req, res) {
    res.json(eventiService.lista(req.query));
  },
  async dettaglio(req, res) {
    res.json(eventiService.dettaglio(req.params.id));
  },
  async crea(req, res) {
    res.status(201).json(eventiService.crea(req.body));
  },
  async aggiorna(req, res) {
    res.json(eventiService.aggiorna(req.params.id, req.body));
  },
  async elimina(req, res) {
    res.json(eventiService.elimina(req.params.id));
  },
};
