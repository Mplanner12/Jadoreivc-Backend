const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  updateProfile,
  deleteUser,
  getCurrentUser,
} = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.get("/auth/logout", logoutUser);
router.put("/auth/profile", protect, updateProfile);
router.delete("/delete", protect, (req, res) => {
  deleteUser(req, res); // Call the deleteUser function
});
router.get("/auth/currentUser", protect, getCurrentUser);

module.exports = router;
