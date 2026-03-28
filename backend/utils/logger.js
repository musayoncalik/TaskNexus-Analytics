const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tasknexus-api' },
  transports: [
    // Kritik hataları error.log dosyasına yazar
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Tüm API hareketlerini combined.log dosyasına yazar
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Geliştirme (Dev) ortamındaysak terminale de renkli bir şekilde yazdırsın
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
