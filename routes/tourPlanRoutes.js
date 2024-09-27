const express = require("express");
const {
  createTourPlan,
  getTourPlans,
  getTourPlanById,
  sendEmail,
} = require("../controllers/tourPlanController");
// const sendEmail = require("../controllers/tourPlanController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/tourPlans", protect, createTourPlan);
router.get("/tourPlans", getTourPlans);
router.get("/tourPlanById/:id", protect, getTourPlanById);
router.post("/sendEM", protect, sendEmail);

module.exports = router;
