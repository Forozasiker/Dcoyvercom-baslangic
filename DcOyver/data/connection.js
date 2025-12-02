const mongoose = require('mongoose');

class Database {
  constructor(uri) {
    this.uri = uri;
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mongoose.connect(this.uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.log(`Connected to database successfully`, "database")
    } catch (error) {
      logger.log(`Database connection failed: ${error.message}`, "error")
      logger.log(`Make sure MongoDB is running on ${this.uri}`, "error")
      process.exit(1);
    }
  }

  disconnect() {
    if (this.connection) {
      mongoose.disconnect();
      logger.log(`Disconnected from database`, "database")
    }
  }
}

module.exports = Database;
