const express = require('express');
const path = require('path');
const router = express.Router();

// Pagina principale del calendario
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Pagina statistiche
router.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = router;
