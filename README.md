# Calendario — architettura a componenti

Progetto ristrutturato seguendo lo stile di **Gestione_Magazzino**:
backend a livelli (routes → controllers → services → repositories) e
frontend suddiviso in moduli per responsabilità.

## Avvio

```bash
cd backend
npm install
npm start        # oppure: npm run dev (nodemon)
```

Apri poi `http://localhost:3000`.

## Struttura

```
Calendario/
├── backend/
│   ├── server.js                  # Entry point: DB, Socket.IO, avvio, shutdown
│   ├── data/calendario.db         # Database SQLite (creato al primo avvio)
│   └── src/
│       ├── app.js                 # Composizione Express (middleware, static, API)
│       ├── config/
│       │   ├── database.js        # Connessione node:sqlite + helper dbGet/dbAll/dbRun
│       │   └── schema.js          # Creazione tabelle
│       ├── middleware/
│       │   └── errorHandler.js    # HttpError, catchErrors, errorHandler
│       ├── realtime/
│       │   └── socket.js          # Socket.IO isolato (init/emit)
│       ├── utils/
│       │   └── network.js         # IP locale/pubblico
│       ├── repositories/          # Solo SQL
│       │   ├── eventiRepository.js
│       │   └── categorieRepository.js
│       ├── services/              # Validazione, business logic, eventi realtime
│       │   ├── eventiService.js
│       │   └── categorieService.js
│       ├── controllers/           # HTTP → service
│       │   ├── eventiController.js
│       │   └── categorieController.js
│       └── routes/                # Definizione endpoint
│           ├── index.js           # Aggregatore (/api/events, /api/categories)
│           ├── eventiRoutes.js
│           └── categorieRoutes.js
└── frontend/
    ├── index.html                 # Include gli script in ordine di dipendenza
    ├── css/style.css
    └── js/
        ├── config.js              # Stato globale, costanti, helper api()
        ├── utils.js               # Date, formattazioni, filtri
        ├── search.js              # Ricerca eventi con debounce
        ├── realtime.js            # Socket.IO client (refresh automatico)
        ├── navigation.js          # Navigazione, listener globali, INIT (ultimo!)
        ├── ui/
        │   ├── notifications.js   # Toast
        │   ├── formHelpers.js     # Auto-completamento orari
        │   └── modals.js          # Modal evento + popup dettaglio
        ├── views/
        │   ├── miniCal.js         # Mini calendario sidebar
        │   ├── month.js           # Vista mese
        │   ├── week.js            # Vista settimana
        │   ├── day.js             # Vista giorno
        │   └── list.js            # Vista lista / risultati ricerca
        └── crud/
            ├── eventi.js          # Load/save/delete eventi
            ├── categorie.js       # CRUD categorie, modal, widget ricerca
            └── stampe.js          # Stampa giorno/intervallo/ricerca
```

## Note

- API e formati di risposta (`{ success, data }`) ed eventi Socket.IO
  (`event:*`, `category:*`) sono **invariati**: nessuna migrazione necessaria.
- L'ordine dei tag `<script>` in `index.html` è importante:
  `navigation.js` va caricato per ultimo perché registra i listener ed esegue l'init.
