// Controller categorie: traduce richieste HTTP in chiamate al service
const categorieService = require("../services/categorieService");

module.exports = {
  async lista(req, res) {
    res.json(categorieService.lista());
  },
  async dettaglio(req, res) {
    res.json(categorieService.dettaglio(req.params.id));
  },
  async crea(req, res) {
    res.status(201).json(categorieService.crea(req.body));
  },
  async aggiorna(req, res) {
    res.json(categorieService.aggiorna(req.params.id, req.body));
  },
  async elimina(req, res) {
    res.json(categorieService.elimina(req.params.id));
  },
};
