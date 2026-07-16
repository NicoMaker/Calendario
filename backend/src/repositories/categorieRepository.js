// Repository categorie: solo accesso ai dati, nessuna logica di business
const { dbGet, dbAll, dbRun } = require("../config/database");

const categorieRepository = {
  listaConConteggio() {
    return dbAll(`
      SELECT c.*, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON e.category_id = c.id
      GROUP BY c.id ORDER BY c.name ASC
    `);
  },

  trovaPerId(id) {
    return dbGet("SELECT * FROM categories WHERE id = ?", [Number(id)]);
  },

  esiste(id) {
    return !!dbGet("SELECT id FROM categories WHERE id = ?", [Number(id)]);
  },

  crea({ name, color, icon }) {
    return dbRun(
      "INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)",
      [name, color || "#6366f1", icon || "📌"],
    );
  },

  aggiorna(id, { name, color, icon }) {
    return dbRun(
      "UPDATE categories SET name=?, color=?, icon=? WHERE id=?",
      [name, color, icon, Number(id)],
    );
  },

  elimina(id) {
    return dbRun("DELETE FROM categories WHERE id = ?", [Number(id)]);
  },

  contaEventi(id) {
    const row = dbGet(
      "SELECT COUNT(*) as count FROM events WHERE category_id = ?",
      [Number(id)],
    );
    return (row && row.count) || 0;
  },
};

module.exports = categorieRepository;
