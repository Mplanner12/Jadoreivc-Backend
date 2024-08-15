const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const cookieToken = require("../utils/cookieToken");

const prisma = new PrismaClient();

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, userType } = req.body;

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        fullName,
        // address,
        email,
        password: hashedPassword,
        userType,
      },
    });

    // If userType is TOUR_GUIDE, create an empty TourGuide record
    if (userType === "TOUR_GUIDE") {
      await prisma.tourGuide.create({
        data: {
          userId: user.id,
        },
      });
    }

    cookieToken(user, res);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the userType matches and if the user has updated their profile to be a tour guide
    if (
      userType === "TOUR_GUIDE" &&
      !(await prisma.tourGuide.findUnique({ where: { userId: user.id } }))
    ) {
      return res.status(401).json({
        message:
          "You haven't updated your profile to login as a tour guide. Note that every user is a Tourist, but not all tourists are tour Guides.",
      });
    }

    cookieToken(user, res);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tourGuide: true, reviews: true, tourPlans: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    // Clear the cookie by setting it with an expired date
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      path: "/",
    });

    res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, address, languages, image, userType, tourGuideData } =
      req.body;

    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (address) updateData.address = address;
    if (languages) updateData.languages = languages;
    if (image) updateData.image = image;

    // Update user profile
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        address,
        languages,
        image,
      },
    });

    if (userType === "TOUR_GUIDE" && tourGuideData) {
      // Use upsert to ensure a single instance of TourGuide
      tourGuideData.offerRange = parseInt(tourGuideData.offerRange);

      const tourGuideUpdateData = {};

      // Add fields to tourGuideUpdateData only if they are provided
      if (tourGuideData.location)
        tourGuideUpdateData.location = tourGuideData.location;
      if (tourGuideData.offerRange)
        tourGuideUpdateData.offerRange = parseInt(tourGuideData.offerRange);
      if (tourGuideData.aboutMe)
        tourGuideUpdateData.aboutMe = tourGuideData.aboutMe;
      if (tourGuideData.motto) tourGuideUpdateData.motto = tourGuideData.motto;
      if (tourGuideData.thingsToDo)
        tourGuideUpdateData.thingsToDo = tourGuideData.thingsToDo;

      // Use upsert to ensure a single instance of TourGuide
      await prisma.tourGuide.upsert({
        where: { userId: user.id },
        update: tourGuideUpdateData, // Use the tourGuideUpdateData object
        create: {
          userId: user.id,
          // Only include fields if they are provided in tourGuideData
          ...(tourGuideData.location && { location: tourGuideData.location }),
          ...(tourGuideData.offerRange && {
            offerRange: parseInt(tourGuideData.offerRange),
          }),
          ...(tourGuideData.aboutMe && { aboutMe: tourGuideData.aboutMe }),
          ...(tourGuideData.motto && { motto: tourGuideData.motto }),
          ...(tourGuideData.thingsToDo && {
            thingsToDo: tourGuideData.thingsToDo,
          }),
        },
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }

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
};
