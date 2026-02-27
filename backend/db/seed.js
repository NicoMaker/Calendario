/**
 * Dati fittizi — chiamato solo con SEED=true (npm run dev_dati)
 * Svuota e ripopola il DB ad ogni avvio in modalità dev_dati.
 */

const CATEGORIE = [
  { name: "Lavoro", color: "#3b82f6", icon: "💼" },
  { name: "Personale", color: "#10b981", icon: "🌿" },
  { name: "Famiglia", color: "#f59e0b", icon: "👨‍👩‍👧" },
  { name: "Salute", color: "#ef4444", icon: "🏥" },
  { name: "Sport", color: "#8b5cf6", icon: "⚽" },
  { name: "Viaggi", color: "#06b6d4", icon: "✈️" },
  { name: "Compleanno", color: "#ec4899", icon: "🎂" },
];

function d(offset) {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split("T")[0];
}

const EVENTI = [
  {
    title: "Riunione team settimanale",
    description: "Aggiornamento stato progetti e pianificazione sprint.",
    start_date: d(1),
    start_time: "09:00",
    end_time: "10:30",
    location: "Sala Conferenze B",
    category: "Lavoro",
    all_day: 0,
    color: "#3b82f6",
  },
  {
    title: "Compleanno di Marco",
    description: "Non dimenticare di comprare un regalo! 🎁",
    start_date: d(3),
    start_time: null,
    end_time: null,
    location: null,
    category: "Compleanno",
    all_day: 1,
    color: "#ec4899",
  },
  {
    title: "Visita medica annuale",
    description: "Visita di controllo. Portare tessera sanitaria.",
    start_date: d(5),
    start_time: "14:30",
    end_time: "15:30",
    location: "Studio Dr. Rossi, Via Roma 12",
    category: "Salute",
    all_day: 0,
    color: "#ef4444",
  },
  {
    title: "Allenamento palestra",
    description: "Leg day 🦵",
    start_date: d(2),
    start_time: "07:00",
    end_time: "08:30",
    location: "PaleFit Center",
    category: "Sport",
    all_day: 0,
    color: "#8b5cf6",
  },
  {
    title: "Cena di famiglia",
    description: "Cena mensile da mamma. Portare il vino!",
    start_date: d(7),
    start_time: "20:00",
    end_time: "23:00",
    location: "Casa di mamma, Via Garibaldi",
    category: "Famiglia",
    all_day: 0,
    color: "#f59e0b",
  },
  {
    title: "Deadline progetto Alpha",
    description: "Consegna documentazione finale al cliente.",
    start_date: d(10),
    start_time: "17:00",
    end_time: "17:30",
    location: "Remoto",
    category: "Lavoro",
    all_day: 0,
    color: "#3b82f6",
  },
  {
    title: "Gita a Firenze",
    description: "Weekend romantico con la famiglia.",
    start_date: d(14),
    end_date: d(16),
    start_time: null,
    end_time: null,
    location: "Firenze, Toscana",
    category: "Viaggi",
    all_day: 1,
    color: "#06b6d4",
  },
  {
    title: "Corso di fotografia",
    description: "Lezione 3/8 - Composizione e luce naturale.",
    start_date: d(6),
    start_time: "18:30",
    end_time: "21:00",
    location: "Studio Fotografico Luce",
    category: "Personale",
    all_day: 0,
    color: "#10b981",
  },
  {
    title: "Partita di calcetto",
    description: "Torneo amatoriale con colleghi.",
    start_date: d(9),
    start_time: "20:00",
    end_time: "22:00",
    location: "Campo Sportivo Comunale",
    category: "Sport",
    all_day: 0,
    color: "#8b5cf6",
  },
  {
    title: "Conferenza Tech Milano",
    description: "Workshop su AI e Machine Learning.",
    start_date: d(20),
    start_time: "09:00",
    end_time: "18:00",
    location: "MiCo - Milano Congressi",
    category: "Lavoro",
    all_day: 0,
    color: "#3b82f6",
  },
  {
    title: "Manutenzione auto",
    description: "Tagliando e cambio gomme estive.",
    start_date: d(12),
    start_time: "10:00",
    end_time: "12:00",
    location: "Officina Ferrari, Via Industria",
    category: "Personale",
    all_day: 0,
    color: "#10b981",
  },
  {
    title: "Compleanno di Sofia",
    description: "La piccola compie 8 anni! Festa in casa.",
    start_date: d(-2),
    start_time: "16:00",
    end_time: "20:00",
    location: "Casa nostra",
    category: "Compleanno",
    all_day: 0,
    color: "#ec4899",
  },
  {
    title: "Call con cliente USA",
    description: "Review trimestrale con John Smith.",
    start_date: d(-1),
    start_time: "16:00",
    end_time: "17:00",
    location: "Google Meet",
    category: "Lavoro",
    all_day: 0,
    color: "#3b82f6",
  },
  {
    title: "Yoga mattutino",
    description: "Sessione di yoga e meditazione.",
    start_date: d(4),
    start_time: "06:30",
    end_time: "07:30",
    location: "Parco Villa Reale",
    category: "Sport",
    all_day: 0,
    color: "#8b5cf6",
  },
  {
    title: "Spesa settimanale",
    description: "Lista: verdure, frutta, pane, pasta, detersivi.",
    start_date: d(8),
    start_time: "10:00",
    end_time: "11:30",
    location: "Esselunga - Via Torino",
    category: "Personale",
    all_day: 0,
    color: "#10b981",
  },
  {
    title: "Concerto Ludovico Einaudi",
    description: "Biglietti fila 12 posto C4-C5. Arrivo 20 min prima!",
    start_date: d(25),
    start_time: "21:00",
    end_time: "23:30",
    location: "Teatro Arcimboldi, Milano",
    category: "Personale",
    all_day: 0,
    color: "#10b981",
  },
  {
    title: "Pagamento bollette",
    description: "Luce, gas, internet. Scadenza fine mese.",
    start_date: d(22),
    start_time: null,
    end_time: null,
    location: null,
    category: "Personale",
    all_day: 1,
    color: "#10b981",
  },
  {
    title: "Sprint Planning Q2",
    description: "Pianificazione obiettivi secondo trimestre.",
    start_date: d(18),
    start_time: "10:00",
    end_time: "13:00",
    location: "Sala Riunioni A",
    category: "Lavoro",
    all_day: 0,
    color: "#3b82f6",
  },
  {
    title: "Appuntamento dentista",
    description: "Pulizia denti + controllo. A digiuno!",
    start_date: d(-5),
    start_time: "08:30",
    end_time: "09:30",
    location: "Studio Dentistico Bianchi",
    category: "Salute",
    all_day: 0,
    color: "#ef4444",
  },
  {
    title: "Vacanze estive Sardegna",
    description: "Casa al mare a Villasimius. Volo ore 7:40 da MXP.",
    start_date: d(45),
    end_date: d(55),
    start_time: null,
    end_time: null,
    location: "Villasimius, Sardegna",
    category: "Viaggi",
    all_day: 1,
    color: "#06b6d4",
  },
];

function seedFakeData(db) {
  // Svuota e ricrea i dati ogni volta
  db.exec("DELETE FROM events");
  db.exec("DELETE FROM categories");
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('events','categories')");

  const insCat = db.prepare(
    "INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)",
  );
  for (const c of CATEGORIE) insCat.run(c.name, c.color, c.icon);

  const insEv = db.prepare(`
    INSERT INTO events (title, description, start_date, end_date, start_time, end_time, location, category_id, all_day, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT id FROM categories WHERE name = ?), ?, ?)
  `);

  db.exec("BEGIN");
  for (const e of EVENTI) {
    insEv.run(
      e.title,
      e.description || null,
      e.start_date,
      e.end_date || null,
      e.start_time || null,
      e.end_time || null,
      e.location || null,
      e.category,
      e.all_day,
      e.color || null,
    );
  }
  db.exec("COMMIT");

  console.log(
    `✅ Seed completato: ${EVENTI.length} eventi, ${CATEGORIE.length} categorie.`,
  );
}

module.exports = { seedFakeData };
