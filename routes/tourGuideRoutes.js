const express = require("express");
const {
  getAllTourGuides,
  getTourGuideById,
} = require("../controllers/tourGuideController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/tourGuides", getAllTourGuides);
router.get("/tourGuides/:id", protect, getTourGuideById);

module.exports = router;
