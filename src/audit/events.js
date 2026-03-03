const AuditEventType = Object.freeze({
  USER_INVITED: 'user_invited',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_ACCESS_REVOKED: 'user_access_revoked',
  OWNERSHIP_TRANSFERRED: 'ownership_transferred',
  DATA_IMPORTED: 'data_imported',
  DATA_EDITED: 'data_edited',
  MESSAGE_SENT: 'message_sent',
});

class AuditLog {
  constructor() {
    this.entries = [];
  }

  record(entry) {
    const payload = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.entries.push(payload);
    return payload;
  }

  listBySchool(schoolId) {
    return this.entries.filter((entry) => entry.school_id === schoolId);
  }
}

module.exports = { AuditEventType, AuditLog };
