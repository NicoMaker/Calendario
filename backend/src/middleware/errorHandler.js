// Errori HTTP e gestione centralizzata.
// Le risposte di errore mantengono il formato { success: false, error }
// atteso dal frontend del calendario.

class HttpError extends Error {
  constructor(status, messaggio) {
    super(messaggio);
    this.status = status;
  }
}

function catchErrors(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }
  console.error("Errore non gestito:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Errore interno del server",
    timestamp: new Date().toISOString(),
  });
}

module.exports = { HttpError, catchErrors, errorHandler };
