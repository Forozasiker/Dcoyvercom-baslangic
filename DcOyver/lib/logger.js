const chalk = require("chalk");

module.exports = class Logger {
  static log(content, type = "info") {
    const timestamp = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    
    switch (type) {
      case "api": {
        return console.log(`[${timestamp}] [API] ${content}`); 
      }
      case "info": {
        return console.log(`[${timestamp}] [INFO] ${content}`);
      }
      case "warn": {
        return console.log(`[${timestamp}] [WARN] ${content}`);
      }
      case "error": {
        return console.log(`[${timestamp}] [ERROR] ${content}`);
      }
      case "success": {
        return console.log(`[${timestamp}] [SUCCESS] ${content}`);
      }
      case "database": {
        return console.log(`[${timestamp}] [DATABASE] ${content}`);
      }
      default: {
        return console.log(`[${timestamp}] [LOG] ${content}`)
      }
    }
  }
};
