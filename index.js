const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("./utils/cookieParser");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const tourPlan = require("./routes/tourPlanRoutes");
const tourGuideRoutes = require("./routes/tourGuideRoutes");
const planTourRoutes = require("./routes/planTourRoutes");

const { errorHandler } = require("./middlewares/errorMiddleware");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      // "http://localhost:3000",
      // "https://jadoreivc-backend.vercel.app",
      // "https://jadoreivc-frontend.vercel.app",
      // "*/*",
    ], // Add your Vercel app's origin
    methods: "GET, POST, PUT, DELETE",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/plans", tourPlan);
app.use("/api/tourGuides", tourGuideRoutes);
app.use("/api/planTours", planTourRoutes);

app.use(errorHandler); // Use the error handling middleware

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
