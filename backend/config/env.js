const path = require("path");
const dotenv = require("dotenv");

const envPaths = [
  path.resolve(__dirname, "..", "..", ".env.local"),
  path.resolve(__dirname, "..", "..", ".env"),
  path.resolve(__dirname, "..", ".env.local"),
  path.resolve(__dirname, "..", ".env"),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

const getEnv = (key, fallback = undefined) => {
  const value = process.env[key];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value;
};

const getNumber = (key, fallback) => {
  const value = Number(getEnv(key, fallback));
  return Number.isFinite(value) ? value : fallback;
};

const getBoolean = (key, fallback = false) => {
  const value = getEnv(key, fallback);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }
  return Boolean(value);
};

const getSessionSecret = () =>
  getEnv("SESSION_SECRET") ||
  getEnv("COOKIE_SECRET") ||
  "change-me-session-secret";
const getRateLimitMax = () => getNumber("RATE_LIMIT_MAX", 200);
const getRateLimitWindowMs = () =>
  getNumber("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000);
const getJwtSecret = () => getEnv("JWT_SECRET") || "super-secret";
const getClientUrl = () => getEnv("CLIENT_URL") || "http://localhost:3000";
const getClientUrls = () => {
  const raw = getEnv("CLIENT_URLS");
  if (raw) {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [getClientUrl()];
};
const getMongoUri = () =>
  getEnv("MONGODB_URI") || "mongodb://127.0.0.1:27017/bindaud";
const getSupabaseUrl = () =>
  getEnv("SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL") || "";
const getSupabaseServiceRoleKey = () =>
  getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_SERVICE_ROLE") || "";
const getPort = () => getNumber("PORT", 5000);

const getSmtpHost = () => getEnv("SMTP_HOST") || "";
const getSmtpPort = () => getNumber("SMTP_PORT", 0);
const getSmtpUser = () => getEnv("SMTP_USER") || "";
const getSmtpPass = () => getEnv("SMTP_PASS") || "";
const getSmtpSecure = () => getBoolean("SMTP_SECURE", false);

module.exports = {
  getEnv,
  getNumber,
  getBoolean,
  getSessionSecret,
  getRateLimitMax,
  getRateLimitWindowMs,
  getJwtSecret,
  getClientUrl,
  getClientUrls,
  getMongoUri,
  getSupabaseUrl,
  getSupabaseServiceRoleKey,
  getPort,
  getSmtpHost,
  getSmtpPort,
  getSmtpUser,
  getSmtpPass,
  getSmtpSecure,
};
