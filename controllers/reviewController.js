const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Add a review
exports.addReview = async (req, res) => {
  try {
    const { tourGuideId, rating, remark } = req.body;
    const review = await prisma.review.create({
      data: {
        touristId: req.user.id,
        tourGuideId,
        rating,
        remark,
      },
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get reviews for a tour guide
exports.getReviewsForTourGuide = async (req, res) => {
  try {
    const { tourGuideId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { tourGuideId },
      include: { tourist: true },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
