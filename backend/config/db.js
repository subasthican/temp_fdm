import mongoose from "mongoose";

import config from "./env.js";

const connectDB = async () => {
  const conn = await mongoose.connect(config.mongodbUri);

  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
