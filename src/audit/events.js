const crypto = require('crypto');

const AuditEventType = Object.freeze({
  USER_INVITED: 'user_invited',
  USER_REMOVED: 'user_removed',
  ROLE_CHANGED: 'role_changed',
  DATA_IMPORTED: 'data_imported',
  GROUP_CREATED: 'group_created',
  MESSAGE_QUEUED: 'message_queued',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_STATUS_UPDATED: 'message_status_updated',
});

class AuditLog {
  constructor() {
    this.entries = [];
  }

  record(entry) {
    const payload = { id: this.entries.length + 1, timestamp: new Date().toISOString(), ...entry };
    this.entries.push(payload);
    return payload;
  }

  list(filters = {}) {
    return this.entries.filter((entry) => Object.entries(filters).every(([k, v]) => entry[k] === v));
  }
}

function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

module.exports = { AuditEventType, AuditLog, hashPayload };
