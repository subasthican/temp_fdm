import app from "./app.js";
import config from "./config/env.js";
import connectDB from "./config/db.js";

const start = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(
        `API running on http://localhost:${config.port} (${config.nodeEnv})`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
