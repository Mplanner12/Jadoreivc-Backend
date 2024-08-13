// controllers/planTourController.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getPlannedTours = async (req, res) => {
  try {
    const plannedTours = await prisma.planTour.findMany({
      include: {
        user: true,
      },
    });

    res.json({ success: true, plannedTours });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
