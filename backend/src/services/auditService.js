const AuditLog = require('../models/AuditLog');

function normalizeDetails(details) {
  try {
    return JSON.parse(JSON.stringify(details || {}));
  } catch (_error) {
    return { note: 'details serialization failed' };
  }
}

async function logAuditSafe({ actorId, actorRole, action, entityType, entityId, details }) {
  try {
    return await AuditLog.create({
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      details: normalizeDetails(details)
    });
  } catch (error) {
    console.error('[audit] failed to write log:', error.message);
    return null;
  }
}

module.exports = {
  logAuditSafe
};
