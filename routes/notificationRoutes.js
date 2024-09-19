const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationAsRead,
  createNotification,
} = require("../controllers/notificationController");
const protect = require("../middlewares/authMiddleware"); // Your authentication middleware

router.post("/", protect, createNotification);
router.get("/", protect, (req, res) => getNotifications(req, res));
router.put("/:id/read", protect, markNotificationAsRead);

module.exports = router;
