import express from "express";
import cors from "cors";
import helmet from "helmet";

import config from "./config/env.js";
import apiRateLimiter from "./middlewares/apiRateLimiter.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// The single global rate limiter (style guide §3).
app.use("/api", apiRateLimiter);

// GET /api/health
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
    data: { uptime: process.uptime() },
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
