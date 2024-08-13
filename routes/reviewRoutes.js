const express = require("express");
const {
  addReview,
  getReviewsForTourGuide,
} = require("../controllers/reviewController");
const { isAuthenticated } = require("../middlewares/auth/isAuthenticated");

const router = express.Router();

router.post("/reviews", isAuthenticated, addReview);
router.get("/reviews/:tourGuideId", getReviewsForTourGuide);

module.exports = router;
