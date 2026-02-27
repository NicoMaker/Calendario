const express = require('express');
const router  = express.Router();

// node:sqlite restituisce oggetti null-prototype → convertiamo in plain object
const plain = rows => JSON.parse(JSON.stringify(rows));

// GET /api/events
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { month, year, category_id, search } = req.query;

  let query = `
    SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (month && year) {
    query += ` AND strftime('%m', e.start_date) = ? AND strftime('%Y', e.start_date) = ?`;
    params.push(String(month).padStart(2, '0'), String(year));
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

  try {
    const stmt = db.prepare(query);
    const events = plain(params.length ? stmt.all(...params) : stmt.all());
    res.json({ success: true, data: events, count: events.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  try {
    const event = plain(db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM events e LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(Number(req.params.id)));
    if (!event) return res.status(404).json({ success: false, error: 'Evento non trovato' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/events
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { title, description, start_date, end_date, start_time, end_time, location, category_id, all_day, color } = req.body;
  if (!title || !start_date) return res.status(400).json({ success: false, error: 'Titolo e data obbligatori' });
  try {
    const result = db.prepare(`
      INSERT INTO events (title, description, start_date, end_date, start_time, end_time, location, category_id, all_day, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description||null, start_date, end_date||null, start_time||null, end_time||null, location||null, category_id||null, all_day?1:0, color||null);
    const newEvent = plain(db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid));
    res.status(201).json({ success: true, data: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/events/:id
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { title, description, start_date, end_date, start_time, end_time, location, category_id, all_day, color } = req.body;
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(Number(req.params.id));
  if (!existing) return res.status(404).json({ success: false, error: 'Evento non trovato' });
  try {
    db.prepare(`
      UPDATE events SET title=?, description=?, start_date=?, end_date=?,
        start_time=?, end_time=?, location=?, category_id=?,
        all_day=?, color=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(title, description||null, start_date, end_date||null, start_time||null, end_time||null, location||null, category_id||null, all_day?1:0, color||null, Number(req.params.id));
    const updated = plain(db.prepare('SELECT * FROM events WHERE id = ?').get(Number(req.params.id)));
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ success: false, error: 'Evento non trovato' });
  res.json({ success: true, message: 'Evento eliminato' });
});

// GET /api/events/range/:start/:end
router.get('/range/:start/:end', (req, res) => {
  const db = req.app.locals.db;
  try {
    const events = plain(db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM events e LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.start_date BETWEEN ? AND ?
      ORDER BY e.start_date ASC, COALESCE(e.start_time,'99:99') ASC
    `).all(req.params.start, req.params.end));
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
