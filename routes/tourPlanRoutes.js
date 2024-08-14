const express = require("express");
const {
  createTourPlan,
  getTourPlans,
  getTourPlanById,
} = require("../controllers/tourPlanController");
// const { isAuthenticated } = require("../middlewares/auth/isAuthenticated");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/tourPlans", protect, createTourPlan);
router.get("/tourPlans", protect, getTourPlans);
router.get("/tourPlanById/:id", protect, getTourPlanById);

module.exports = router;
