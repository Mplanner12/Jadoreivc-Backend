const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  const session = req.session;
  const token = req.user;

  console.log("Token retrived:", req.session.user);

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!req.user) {
      return res
        .status(403)
        .json({ message: "Not authorized, user not found" });
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(405).json({ message: "Not authorized, token failed" });
  }
};

module.exports = protect;
