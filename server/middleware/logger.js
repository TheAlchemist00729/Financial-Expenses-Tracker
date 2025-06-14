const fs = require('fs');
const path = require('path');

function logErrorToFile(err, req = {}) {
  const logPath = path.join(__dirname, '..', 'error.log');
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] ${req.method || ''} ${req.originalUrl || ''}\n${err.stack || err}\n\n`;

  console.log('[logger] Writing to error.log');

  fs.appendFile(logPath, msg, (fsErr) => {
    if (fsErr) console.error('Logging failed:', fsErr);
  });
}


module.exports = logErrorToFile;
