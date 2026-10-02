import dotenv from "dotenv";

dotenv.config();

// Single source of truth for environment-driven values.
// Services and helpers import from here — never process.env directly.
const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,

  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pos",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  jwt: Object.freeze({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  }),
});

export default config;
