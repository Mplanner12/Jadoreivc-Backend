const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// const protect = async (req, res, next) => {
//   const token = req.session.user;

//   if (!token) {
//     return res.status(401).json({ message: "Not authorized, no token" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = await prisma.user.findUnique({
//       where: { id: decoded.id },
//     });

//     if (!req.user) {
//       return res
//         .status(402)
//         .json({ message: "Not authorized, user not found" });
//     }

//     next();
//   } catch (error) {
//     console.error("Token verification failed:", error);
//     res.status(401).json({ message: "Not authorized, token failed" });
//   }
// };

const protect = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "You need to be logged in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded token (user id) to the request object
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
module.exports = protect;
