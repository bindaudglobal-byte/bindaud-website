const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const app = require('../backend/app');
const connectDB = require('../backend/config/database');

let dbPromise;

const ensureDb = async () => {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  return dbPromise;
};

module.exports = async function handler(req, res) {
  try {
    await ensureDb();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }

  return app(req, res);
};
