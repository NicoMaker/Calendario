const express = require('express');
const path    = require('path');
const cors    = require('cors');

const { initDB }       = require('./db/database');
const { seedFakeData } = require('./db/seed');
const pageRoutes       = require('./routes/pages');
const eventsApi        = require('./api/events');
const categoriesApi    = require('./api/categories');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', pageRoutes);
app.use('/api/events', eventsApi);
app.use('/api/categories', categoriesApi);

function startServer() {
  try {
    console.log('🗄️  Inizializzazione database...');
    const db = initDB();

    console.log('🌱 Verifica dati iniziali...');
    seedFakeData(db);

    app.locals.db = db;

    app.listen(PORT, () => {
      console.log(`\n🗓️  Calendario avviato su http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api/events`);
      console.log('\nPremi Ctrl+C per fermare.\n');
    });
  } catch (err) {
    console.error('❌ Errore avvio server:', err);
    process.exit(1);
  }
}

startServer();
