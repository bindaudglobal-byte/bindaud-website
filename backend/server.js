require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

connectDB()
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      logger.info(`BIN DAUD backend listening on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });
