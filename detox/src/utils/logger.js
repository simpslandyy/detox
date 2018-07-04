const winston = require('winston');
const argparse = require('./argparse');

const logger = winston.createLogger({
  level: argparse.getArgValue('loglevel') || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: 'detox-last.log',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ]
});

module.exports = logger;
