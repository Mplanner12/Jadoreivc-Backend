const express = require("express");
const { getPlannedTours } = require("../controllers/planTourController");

const router = express.Router();

router.get("/plannedTours", getPlannedTours);

module.exports = router;
