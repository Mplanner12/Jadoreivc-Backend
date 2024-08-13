// controllers/tourGuideController.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getAllTourGuides = async (req, res) => {
  try {
    const tourGuides = await prisma.tourGuide.findMany({
      include: { user: true, reviews: true },
    });
    res.json({ success: true, tourGuides });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTourGuideById = async (req, res) => {
  try {
    const { id } = req.params;
    const tourGuide = await prisma.tourGuide.findUnique({
      where: { id },
      include: { user: true, reviews: true },
    });

    if (!tourGuide) {
      return res.status(404).json({ message: "Tour guide not found" });
    }

    res.json({ success: true, tourGuide });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
