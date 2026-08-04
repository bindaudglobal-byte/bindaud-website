const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");
const sessionMiddleware = require("./middleware/session");
const {
  getClientUrl,
  getRateLimitMax,
  getRateLimitWindowMs,
} = require("./config/env");

const app = express();

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const API_BASE = process.env.API_BASE || (isVercel ? "" : "/api");

const mountRoute = (route, handler) => {
  app.use(route, handler);
  if (!isVercel) return;
  if (route.startsWith("/api")) {
    const altRoute = route.slice(4) || "/";
    app.use(altRoute, handler);
  } else {
    app.use(`/api${route === "/" ? "" : route}`, handler);
  }
};

const mountGetRoute = (route, handler) => {
  app.get(route, handler);
  if (!isVercel) return;
  if (route.startsWith("/api")) {
    const altRoute = route.slice(4) || "/";
    app.get(altRoute, handler);
  } else {
    app.get(`/api${route}`, handler);
  }
};

app.set("trust proxy", 1);
app.use(helmet());
const allowedOrigins = [
  getClientUrl(),
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
  "http://localhost:8080",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      );

      if (isLocalOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const limiter = rateLimit({
  windowMs: getRateLimitWindowMs(),
  max: getRateLimitMax(),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use(API_BASE || "/", limiter);
app.use(sessionMiddleware);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mountGetRoute(`${API_BASE}/health`, (_req, res) => {
  res.json({ success: true, message: "BIN DAUD backend is online" });
});

// Simple file-based admin API (for Vercel deployment)
mountRoute(`${API_BASE}/admin`, require("./routes/simpleAdminRoutes"));

mountRoute(`${API_BASE}/admin`, require("./routes/adminRoutes"));
mountRoute(`${API_BASE}/auth`, require("./routes/authRoutes"));
mountRoute(`${API_BASE}/products`, require("./routes/productRoutes"));
mountRoute(`${API_BASE}/categories`, require("./routes/categoryRoutes"));
mountRoute(`${API_BASE}/orders`, require("./routes/orderRoutes"));
mountRoute(`${API_BASE}/customers`, require("./routes/customerRoutes"));
mountRoute(`${API_BASE}/reviews`, require("./routes/reviewRoutes"));
mountRoute(`${API_BASE}/coupons`, require("./routes/couponRoutes"));
mountRoute(`${API_BASE}/cart`, require("./routes/cartRoutes"));
mountRoute(`${API_BASE}/wishlist`, require("./routes/wishlistRoutes"));
mountRoute(`${API_BASE}/payments`, require("./routes/paymentRoutes"));
mountRoute(`${API_BASE}/settings`, require("./routes/settingsRoutes"));

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
