const mongoose = require("mongoose");
const logger = require("../utils/logger");
const { getMongoUri } = require("./env");

const connectDB = async () => {
  const uri = getMongoUri();

  if (!uri) {
    logger.warn("MongoDB URI not configured. Continuing without MongoDB.");
    return null;
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 2000,
    });

    try {
      const host = new URL(
        uri.includes("mongodb+srv") ? `http://${uri.split("@")[1]}` : uri,
      ).host;
      logger.info(`MongoDB connected successfully to ${host}`);
    } catch (e) {
      logger.info("MongoDB connected successfully");
    }

    try {
      const Setting = require("../models/Setting");
      const existing = await Setting.findOne();
      if (!existing) {
        await Setting.create({});
        logger.info("Default settings document created");
      }
    } catch (seedErr) {
      logger.warn("Failed to seed default settings:", seedErr.message);
    }

    return mongoose.connection;
  } catch (error) {
    logger.warn(
      `MongoDB unavailable: ${error.message}. Continuing without MongoDB.`,
    );
    return null;
  }
};

module.exports = connectDB;
