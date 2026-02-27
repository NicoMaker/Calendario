const express = require('express');
const router  = express.Router();
const plain = rows => JSON.parse(JSON.stringify(rows));

// GET /api/categories
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  try {
    const cats = plain(db.prepare(`
      SELECT c.*, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON e.category_id = c.id
      GROUP BY c.id ORDER BY c.name ASC
    `).all());
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/categories/:id
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const cat = plain(db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(req.params.id)));
  if (!cat) return res.status(404).json({ success: false, error: 'Categoria non trovata' });
  res.json({ success: true, data: cat });
});

// POST /api/categories
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Nome obbligatorio' });
  try {
    const result = db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)').run(name, color||'#6366f1', icon||'📌');
    const cat = plain(db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid));
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'Categoria già esistente' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { name, color, icon } = req.body;
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(Number(req.params.id));
  if (!existing) return res.status(404).json({ success: false, error: 'Categoria non trovata' });
  try {
    db.prepare('UPDATE categories SET name=?, color=?, icon=? WHERE id=?').run(name, color, icon, Number(req.params.id));
    const updated = plain(db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(req.params.id)));
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ success: false, error: 'Categoria non trovata' });
  res.json({ success: true, message: 'Categoria eliminata' });
});

module.exports = router;
