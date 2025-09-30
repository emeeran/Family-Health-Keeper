const winston = require('winston');
const path = require('path');

// Custom format for HIPAA-compliant logging
const hipaaLogFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Remove sensitive data from logs
    const sanitizedMeta = sanitizeSensitiveData(meta);
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedMeta
    });
  })
);

// Sanitize sensitive data for logging
function sanitizeSensitiveData(data) {
  const sensitiveFields = [
    'password', 'ssn', 'socialSecurityNumber', 'medicalRecordNumber',
    'insuranceNumber', 'creditCard', 'phoneNumber', 'email'
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: hipaaLogFormat,
  defaultMeta: {
    service: 'family-health-keeper',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Audit trail (separate file for compliance)
    new winston.transports.File({
      filename: path.join('logs', 'audit.log'),
      level: 'audit',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Special audit logging for HIPAA compliance
logger.audit = (action, userId, resourceId, details = {}) => {
  logger.log('audit', {
    action,
    userId,
    resourceId,
    details: sanitizeSensitiveData(details),
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown'
  });
};

// Security event logging
logger.security = (event, details = {}) => {
  logger.warn({
    event: `SECURITY_${event}`,
    ...sanitizeSensitiveData(details)
  });
};

// Performance monitoring
logger.performance = (operation, duration, metadata = {}) => {
  logger.info({
    operation,
    duration,
    type: 'performance',
    ...sanitizeSensitiveData(metadata)
  });
};

module.exports = { logger, sanitizeSensitiveData };