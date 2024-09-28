const getJwtToken = require("../helpers/getJwtToken");
const { randomBytes } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const prisma = new PrismaClient();

const cookieToken = (res, user) => {
  const token = getJwtToken(user.id);

  const options = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  };

  res.cookie("token", token, options);
};

module.exports = cookieToken;
