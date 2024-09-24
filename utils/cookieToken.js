const getJwtToken = require("../helpers/getJwtToken");
const { randomBytes } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const prisma = new PrismaClient();

// const cookieToken = async (user, res, userType) => {
//   const token = getJwtToken(user.id); // Using 'id' for JWT

//   user.password = undefined;

//   const refreshToken = randomBytes(64).toString("hex");

//   try {
//     await prisma.refreshToken.create({
//       data: {
//         userId: user.id,
//         token: refreshToken,
//         expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
//       },
//     });
//   } catch (error) {
//     console.error("Error storing refresh token:", error);
//     // Handle the error appropriately (e.g., send an error response)
//   } finally {
//     await prisma.$disconnect(); // Disconnect PrismaClient
//   }

//   res.status(200).cookie("token", token, options).json({
//     success: true,
//     token,
//     user,
//     userType,
//   });
// };
const cookieToken = async (user, req, res, userType) => {
  const options = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite: "None",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  };
  const refreshToken = randomBytes(64).toString("hex");

  try {
    // Store refresh token in the database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Store user details in session
    req.session.user = {
      user: user,
      userType: userType,
      refreshToken, // You can include refresh token here if needed
    };

    res.status(200).session.cookie(options).json({
      success: true,
      user: req.session.user, // Return the session data
      message: "User logged in and session started",
    });
  } catch (error) {
    console.error("Error storing session or refresh token:", error);
    res.status(500).json({ message: "Server error", error });
  } finally {
    await prisma.$disconnect(); // Disconnect PrismaClient
  }
};

module.exports = cookieToken;
