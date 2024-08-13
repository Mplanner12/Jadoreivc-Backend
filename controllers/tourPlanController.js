const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getTourPlans = async (req, res) => {
  try {
    const tourPlans = await prisma.tourPlan.findMany({
      include: {
        tourist: true,
      },
    });
    res.json({ success: true, tourPlans });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createTourPlan = async (req, res) => {
  const {
    touristId,
    location,
    startDate,
    endDate,
    time,
    numberOfPeople,
    guidePreference,
  } = req.body;

  try {
    const tourPlan = await prisma.tourPlan.create({
      data: {
        touristId,
        location,
        startDate,
        endDate,
        time,
        numberOfPeople,
        guidePreference,
      },
    });

    res.status(201).json({ success: true, tourPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
