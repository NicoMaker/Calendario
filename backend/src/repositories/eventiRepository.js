// Repository eventi: solo accesso ai dati, nessuna logica di business
const { dbGet, dbAll, dbRun } = require("../config/database");

const SELECT_CON_CATEGORIA = `
  SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
  FROM events e
  LEFT JOIN categories c ON e.category_id = c.id
`;

const eventiRepository = {
  // Lista con filtri opzionali: mese/anno, categoria, ricerca testuale
  lista({ month, year, category_id, search } = {}) {
    let query = SELECT_CON_CATEGORIA + " WHERE 1=1";
    const params = [];

    if (month && year) {
      query += ` AND strftime('%m', e.start_date) = ? AND strftime('%Y', e.start_date) = ?`;
      params.push(String(month).padStart(2, "0"), String(year));
    } else if (year) {
      query += ` AND strftime('%Y', e.start_date) = ?`;
      params.push(String(year));
    }

    if (category_id) {
      query += ` AND e.category_id = ?`;
      params.push(Number(category_id));
    }

    if (search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
      const t = `%${search}%`;
      params.push(t, t, t);
    }

    query += ` ORDER BY e.start_date ASC, COALESCE(e.start_time,'99:99') ASC`;
    return dbAll(query, params);
  },

  trovaPerId(id) {
    return dbGet(SELECT_CON_CATEGORIA + " WHERE e.id = ?", [Number(id)]);
  },

  trovaBase(id) {
    return dbGet("SELECT * FROM events WHERE id = ?", [Number(id)]);
  },

  esiste(id) {
    return !!dbGet("SELECT id FROM events WHERE id = ?", [Number(id)]);
  },

  crea(e) {
    return dbRun(
      `INSERT INTO events (title, description, start_date, end_date, start_time, end_time, location, category_id, all_day, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.title,
        e.description || null,
        e.start_date,
        e.end_date || null,
        e.start_time || null,
        e.end_time || null,
        e.location || null,
        e.category_id || null,
        e.all_day ? 1 : 0,
        e.color || null,
      ],
    );
  },

  aggiorna(id, e) {
    return dbRun(
      `UPDATE events SET title=?, description=?, start_date=?, end_date=?,
         start_time=?, end_time=?, location=?, category_id=?,
         all_day=?, color=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        e.title,
        e.description || null,
        e.start_date,
        e.end_date || null,
        e.start_time || null,
        e.end_time || null,
        e.location || null,
        e.category_id || null,
        e.all_day ? 1 : 0,
        e.color || null,
        Number(id),
      ],
    );
  },

  elimina(id) {
    return dbRun("DELETE FROM events WHERE id = ?", [Number(id)]);
  },
};

module.exports = eventiRepository;
