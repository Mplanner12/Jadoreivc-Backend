const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const prisma = new PrismaClient();

exports.createTourPlan = async (req, res) => {
  const {
    touristId,
    location,
    startDate,
    endDate,
    // time,
    adults,
    children,
    infants,
    pets,
    guidePreference,
  } = req.body;

  try {
    const tourPlan = await prisma.tourPlan.create({
      data: {
        touristId,
        location,
        startDate,
        endDate,
        // time,
        adults,
        children,
        infants,
        pets,
        guidePreference,
      },
    });

    res.status(201).json({ success: true, tourPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTourPlans = async (req, res) => {
  try {
    const tourPlans = await prisma.tourPlan.findMany({
      include: {
        tourist: {
          select: {
            id: true,
            fullName: true,
            email: true,
            image: true,
            userType: true,
          },
        },
      },
    });
    res.json({ success: true, tourPlans });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTourPlanById = async (req, res) => {
  const { id } = req.params;

  try {
    const tourPlan = await prisma.tourPlan.findUnique({
      where: {
        id: id,
      },
      include: {
        tourist: true,
      },
    });

    if (!tourPlan) {
      return res.status(404).json({ message: "Tour not found" });
    }

    res.json({ success: true, tourPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function sendEmail(to, subject, text) {
  // Create a transporter object
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "musanplanner127@gmail.com",
      pass: process.env.MAILP,
    },
  });

  // Set up email options
  let mailOptions = {
    from: "musanplanner127@gmail.com",
    to,
    subject,
    text,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
}

exports.sendEmail = sendEmail;
