// Aggregatore delle route API
const express = require("express");
const router = express.Router();

router.use("/events", require("./eventiRoutes"));
router.use("/categories", require("./categorieRoutes"));

module.exports = router;
