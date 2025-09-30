const { logger } = require('../utils/logger');

/**
 * HIPAA-compliant audit logging middleware
 * Logs all access to protected health information (PHI)
 */

const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const auditData = {
    requestId: req.headers['x-request-id'] || generateRequestId(),
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ipAddress: getClientIP(req),
    userId: req.user?.id || 'anonymous',
    sessionToken: req.headers.authorization ? '[REDACTED]' : null
  };

  // Log request
  logger.audit('API_REQUEST', auditData.userId, null, auditData);

  // Intercept response to log outcome
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const responseAuditData = {
      ...auditData,
      statusCode: res.statusCode,
      duration,
      responseSize: data ? data.length : 0
    };

    // Log response
    if (res.statusCode >= 400) {
      logger.audit('API_ERROR', auditData.userId, null, responseAuditData);
    } else {
      logger.audit('API_SUCCESS', auditData.userId, null, responseAuditData);
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Patient data access audit middleware
 */
const patientAuditMiddleware = (req, res, next) => {
  const patientId = req.params.id || req.body.patientId;
  const action = determineAction(req.method, req.route?.path);

  const auditData = {
    timestamp: new Date().toISOString(),
    action: `PATIENT_${action}`,
    resourceId: patientId,
    userId: req.user?.id || 'anonymous',
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'],
    details: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers)
    }
  };

  logger.audit('PATIENT_ACCESS', auditData.userId, patientId, auditData);
  next();
};

/**
 * Medical record access audit middleware
 */
const medicalRecordAuditMiddleware = (req, res, next) => {
  const patientId = req.params.patientId;
  const recordId = req.params.recordId;
  const action = determineAction(req.method, req.route?.path);

  const auditData = {
    timestamp: new Date().toISOString(),
    action: `MEDICAL_RECORD_${action}`,
    resourceId: recordId,
    parentResourceId: patientId,
    userId: req.user?.id || 'anonymous',
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'],
    details: {
      method: req.method,
      url: req.url,
      patientId,
      recordId
    }
  };

  logger.audit('MEDICAL_RECORD_ACCESS', auditData.userId, recordId, auditData);
  next();
};

/**
 * Authentication audit middleware
 */
const authAuditMiddleware = (req, res, next) => {
  const action = req.path.includes('/login') ? 'LOGIN_ATTEMPT' :
                 req.path.includes('/logout') ? 'LOGOUT' : 'AUTH_OTHER';

  const auditData = {
    timestamp: new Date().toISOString(),
    action,
    userId: req.body.username || req.user?.id || 'anonymous',
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'],
    details: {
      method: req.method,
      url: req.url,
      success: res.statusCode < 400
    }
  };

  logger.audit('AUTHENTICATION', auditData.userId, null, auditData);
  next();
};

// Helper functions
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

function determineAction(method, route) {
  switch (method) {
    case 'GET':
      return route?.includes('/search') ? 'SEARCH' : 'READ';
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'UNKNOWN';
  }
}

function sanitizeHeaders(headers) {
  const sanitized = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get audit log entries
 */
async function getAuditLog(filters = {}) {
  // This would typically query a database
  // For now, return a placeholder
  return {
    logs: [],
    total: 0,
    filters
  };
}

module.exports = {
  auditMiddleware,
  patientAuditMiddleware,
  medicalRecordAuditMiddleware,
  authAuditMiddleware,
  getAuditLog
};