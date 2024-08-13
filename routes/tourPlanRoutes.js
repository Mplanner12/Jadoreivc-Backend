const express = require("express");
const {
  createTourPlan,
  getTourPlans,
} = require("../controllers/tourPlanController");
// const { isAuthenticated } = require("../middlewares/auth/isAuthenticated");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/tourPlans", protect, createTourPlan);
router.get("/tourPlans", protect, getTourPlans);

module.exports = router;
