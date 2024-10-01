const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const cookieToken = require("../utils/cookieToken");
const multer = require("multer");
const path = require("path");

const prisma = new PrismaClient();

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, userType } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword, userType },
    });

    // Create TourGuide record if userType is "TOUR_GUIDE"
    if (userType === "TOUR_GUIDE") {
      await prisma.tourGuide.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Store token in the cookie
    cookieToken(res, user);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.userType === "TOUR_GUIDE" && userType === "TOURIST") {
      return res.status(403).json({
        message:
          "You are registered as a Tour Guide. Please login as a Tour Guide.",
      });
    }

    if (
      userType === "TOUR_GUIDE" &&
      !(await prisma.tourGuide.findUnique({ where: { userId: user.id } }))
    ) {
      return res.status(401).json({
        message:
          "You haven't yet updated your profile to login as a tour guide",
      });
    }

    cookieToken(res, user);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // Assuming you have middleware to extract the user ID from the token
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tourGuide: true, reviews: true, tourPlans: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
};

exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// update image logic
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/userImages/"); // Specifying the directory to store images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

exports.updateProfile = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "Image upload failed", error: err.message });
    }

    try {
      const { fullName, address, languages, userType, tourGuideData } =
        req.body;

      console.log("Received userType:", userType); // Check the value of userType

      if (!userType) {
        return res.status(400).json({ message: "userType is required" });
      }

      const updateData = {};

      if (fullName) updateData.fullName = fullName;
      if (address) updateData.address = address;
      if (languages) updateData.languages = languages;
      if (userType) updateData.userType = userType;
      if (req.file) {
        updateData.image = `../../client/public/uploads/userImages/${req.file.filename}`;
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
      });

      if (userType === "TOUR_GUIDE" && tourGuideData) {
        tourGuideData.offerRange = parseInt(tourGuideData.offerRange);

        const tourGuideUpdateData = {
          location: tourGuideData.location,
          offerRange: tourGuideData.offerRange,
          aboutMe: tourGuideData.aboutMe,
          motto: tourGuideData.motto,
          thingsToDo: tourGuideData.thingsToDo,
        };

        await prisma.tourGuide.upsert({
          where: { userId: user.id },
          update: tourGuideUpdateData,
          create: {
            userId: user.id,
            ...tourGuideUpdateData,
          },
        });
      }

      res.json({ user, message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user authentication in place

    // Delete the associated TourGuide record if it exists
    await prisma.tourGuide.deleteMany({
      where: { userId },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
