// const { PrismaClient } = require("@prisma/client");
// const bcrypt = require("bcryptjs");
// const cookieToken = require("../utils/cookieToken");
// const getJwtToken = require("../helpers/getJwtToken");

// const prisma = new PrismaClient();

// exports.registerUser = async (req, res) => {
//   try {
//     const { fullName, email, password, userType } = req.body;

//     const existingUser = await prisma.user.findUnique({ where: { email } });

//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await prisma.user.create({
//       data: { fullName, email, password: hashedPassword, userType },
//     });

//     // Store user details in session
//     cookieToken(user, req, res, userType);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password, userType } = req.body;

//     const user = await prisma.user.findUnique({ where: { email } });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }
//     if (
//       userType === "TOUR_GUIDE" &&
//       !(await prisma.tourGuide.findUnique({ where: { userId: user.id } }))
//     ) {
//       return res.status(401).json({
//         message:
//           "You haven't yet updated your profile to login as a tour guide",
//       });
//     }
//     const token = getJwtToken(user.id);
//     cookieToken(res, user);
//     // req.session.user = token;
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// exports.getCurrentUser = async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       include: { tourGuide: true, reviews: true, tourPlans: true },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json({ success: true, user });
//   } catch (error) {
//     if (!res.headersSent) {
//       res.status(500).json({ message: "Server error", error: error.message });
//     }
//   }
// };

// exports.logoutUser = async (req, res) => {
//   try {
//     req.session.destroy((err) => {
//       if (err) {
//         return res.status(500).json({ message: "Failed to log out" });
//       }

//       res.clearCookie("connect.sid"); // clear the session cookie
//       res.status(200).json({ message: "Successfully logged out" });
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
// No longer needed since we are using sessions
// const cookieToken = require("../utils/cookieToken");
const getJwtToken = require("../helpers/getJwtToken");
const cookieToken = require("../utils/cookieToken");

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

    // Generate JWT token
    const token = getJwtToken(user.id);

    // Store token in the session
    req.session.user = token;

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
  console.log(req.session, "login");
  try {
    const { email, password, userType } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
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

    // Generate JWT token
    const token = getJwtToken(user.id);

    req.user = token;

    console.log("Token stored in session:", req.user);

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
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }

      // No need to clear cookies manually, session middleware handles it
      res.status(200).json({ message: "Successfully logged out" });
    });
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
