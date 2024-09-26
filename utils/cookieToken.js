const getJwtToken = require("../helpers/getJwtToken");
const { randomBytes } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const prisma = new PrismaClient();

const cookieToken = (res, user) => {
  const token = getJwtToken(user.id); // Generate JWT token

  const options = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Send secure cookie in production
    sameSite: "None",
  };

  // Set the JWT token as a cookie in the response
  res.cookie("token", token, options);
};

module.exports = cookieToken;
