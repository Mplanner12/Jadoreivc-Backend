const getJwtToken = require("../helpers/getJwtToken");
const { randomBytes } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const prisma = new PrismaClient();

const cookieToken = async (user, req, res, userType) => {
  const options = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  };
  const refreshToken = getJwtToken(user.id);

  try {
    req.session.user = {
      user: user,
      userType: userType,
      refreshToken,
    };

    if (req.session) {
      res.status(200).json({
        success: true,
        user: req.session.user,
        message: "User logged in and session started",
      });
    }
  } catch (error) {
    console.error("Error storing session or refresh token:", error);
    res.status(500).json({ message: "Server error", error });
  } finally {
    await prisma.$disconnect(); // Disconnect PrismaClient
  }
};

module.exports = cookieToken;
