const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const connectDB = require("../config/database");

test("connectDB falls back gracefully when MongoDB is unavailable", async () => {
  await mongoose.disconnect().catch(() => {});
  process.env.MONGODB_URI = "mongodb://127.0.0.1:1/bindaud";

  const result = await connectDB();

  assert.equal(result, null);
});
