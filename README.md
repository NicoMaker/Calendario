# 🗓️ Calendario — Planner Personale v2

Applicazione calendario con **Node.js 22 + Express + SQLite nativo**.

> ✅ **NESSUNA dipendenza nativa** — niente `better-sqlite3`, niente compilatori C++.  
> Usa il modulo `node:sqlite` integrato in Node.js 22 (zero problemi su Windows!).

---

## 🚀 Installazione rapida

```bash
# 1. Installa le dipendenze (solo express e cors — puro JS)
npm install

# 2. Avvia il server
npm start

# 3. Apri nel browser
http://localhost:3000
```

> **Richiede Node.js 22.5+** — verifica con `node --version`

---

## 📁 Struttura del progetto

```
calendario/
├── server.js              # 🚀 Entry point Express
├── package.json           # Solo 2 dipendenze: express + cors
│
├── db/
│   ├── database.js        # 🗄️ Usa node:sqlite (built-in Node 22)
│   └── seed.js            # 🌱 20 eventi + 7 categorie fittizi
│
├── routes/
│   └── pages.js           # Serve index.html
│
├── api/
│   ├── events.js          # REST: GET/POST/PUT/DELETE eventi
│   └── categories.js      # REST: GET/POST/PUT/DELETE categorie
│
└── public/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

---

## ✨ Funzionalità

| Feature | Descrizione |
|---------|-------------|
| 📅 Vista Mese | Griglia con chip eventi colorati, click su giorno → vista giorno |
| 📅 Vista Settimana | 7 giorni con eventi, click intestazione → vista giorno |
| 📅 Vista Giorno | Timeline verticale di tutti gli impegni del giorno |
| 📋 Vista Lista | Tutti gli eventi raggruppati per mese |
| 🔍 Ricerca | Cerca in titolo, luogo, descrizione — risultati live |
| 🖨 Stampa giorno | Stampa il giorno corrente o scegli una data |
| 🖨 Stampa ricerca | Stampa i risultati della ricerca attiva |
| ⏰ Smart orari | Scrivi `8` → `08:00`, ora fine auto +1h, validazione fine > inizio |
| 🗂 Categorie | Filtro sidebar, contatore eventi per categoria |

---

## 📡 API

```
GET    /api/events              Lista (filtri: ?month=&year=&search=&category_id=)
GET    /api/events/:id          Dettaglio evento
POST   /api/events              Crea evento
PUT    /api/events/:id          Modifica evento
DELETE /api/events/:id          Elimina evento

GET    /api/categories          Lista categorie
POST   /api/categories          Crea categoria
PUT    /api/categories/:id      Modifica categoria
DELETE /api/categories/:id      Elimina categoria
```

---

## ⚠️ Problema su Windows con `better-sqlite3`?

Questo progetto **NON usa** `better-sqlite3` — usa `node:sqlite` nativo.  
Se hai una versione precedente con quel problema, usa questo zip aggiornato.
