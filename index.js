const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("./utils/cookieParser");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const tourPlan = require("./routes/tourPlanRoutes");
const tourGuideRoutes = require("./routes/tourGuideRoutes");
const { PrismaClient } = require("@prisma/client");
const notificationRoutes = require("./routes/notificationRoutes");
const redis = require("ioredis");
const RedisStore = require("connect-redis").default;
const session = require("express-session");
const { createClient } = require("redis");

const prisma = new PrismaClient();
const { errorHandler } = require("./middlewares/errorMiddleware");
const cors = require("cors");
const cookieToken = require("./utils/cookieToken");

dotenv.config();

const app = express();
// const redisClient = new redis({
//   host: process.env.REDIS_HOST,
//   port: process.env.REDIS_PORT,
//   password: process.env.REDIS_PASSWORD,
//   maxRetriesPerRequest: 2, // Limit retries
//   reconnectOnError: (err) => true, // Auto reconnect
//   // tls: {
//   //   // Try explicitly setting the minimum TLS version
//   //   minVersion: "TLSv1.2",
//   // }, // Secure connection if needed
// });

// const redisClient = redis.createClient({
//   url: process.env.REDIS_URL, // Your Redis Labs/ElastiCache URL
//   legacyMode: true, // Enable this for compatibility with connect-redis
// });

const client = createClient({
  password: "Owxv05L6O6EJTCCITng9XIK13lpX8JfZ",
  socket: {
    host: "redis-18121.c270.us-east-1-3.ec2.redns.redis-cloud.com",
    port: 18121,
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      // "https://jadoreivc-backend.vercel.app",
      "https://jadoreivc-frontend.vercel.app",
      // "*/*",
    ], // Add your Vercel app's origin
    methods: "GET, POST, PUT, DELETE",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    store: new RedisStore({ client: client }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      sameSite: "None",
    },
  })
);

app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/plans", tourPlan);
app.use("/api/tourGuides", tourGuideRoutes);
app.use("/api/notifications", notificationRoutes);

// app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Welcome to the server");
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Paypal Integration
const environment = process.env.ENVIRONMENT || "sandbox";
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const base = "https://api-m.sandbox.paypal.com";

// parse post params sent in body in json format
// app.use(express.json());

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
    ).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (data) => {
  // use the tourism information passed from the front-end to calculate the purchase unit details
  console.log(
    "shopping tourism information passed from the frontend createOrder() callback:",
    data
  );

  const totalCost = data.tourism.reduce((sum, item) => sum + item.cost, 0);
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: totalCost,
        },
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });

  return handleResponse(response);
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

app.post("/api/orders", async (req, res) => {
  console.log(req.body.tourism.id);
  try {
    // use the tourism information passed from the front-end to calculate the order amount detals
    const { tourism } = req.body;
    const { jsonResponse, httpStatusCode } = await createOrder({ tourism });
    res.status(httpStatusCode).json({
      ...jsonResponse,
      tourPlanId: tourism[0].id, // Assuming you only have one tourism item per order
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const { tourPlanId } = req.body; // Access tourPlanId directly
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    const transaction = jsonResponse.purchase_units[0].payments.captures[0];
    if (transaction.status === "COMPLETED") {
      await prisma.tourPlan.update({
        where: { id: tourPlanId },
        data: { paymentStatus: "COMPLETED" },
      });
      res.status(200).json({
        status: "success",
        transaction: {
          id: transaction.id,
          // ... other details you want to send
        },
      });
    } else {
      await prisma.tourPlan.update({
        where: { id: tourPlanId },
        data: { paymentStatus: "FAILED" },
      });
      res.status(httpStatusCode).json(jsonResponse);
    }
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({
      error: "Failed to capture order.",
      status: "Failed to capture order.",
    });
  }
});

// render checkout page with client id & unique client token
app.get("/", async (req, res) => {
  try {
    res.render("checkout", {
      clientId: PAYPAL_CLIENT_ID,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
