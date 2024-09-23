const express = require("express");
const {
  getAllTourGuides,
  getTourGuideById,
  getTourGuideByName,
} = require("../controllers/tourGuideController");
// const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/tourGuides", getAllTourGuides);
router.get("/tourGuides/:id", getTourGuideById);
router.get("/tourGuidesBy/:name", getTourGuideByName);

module.exports = router;
