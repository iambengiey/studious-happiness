const { assertCanManageSchoolData } = require('../auth/policies');
const { assertSameSchool, assertSchoolId } = require('../tenant/scope');
const { AuditEventType } = require('../audit/events');

class SchoolDataService {
  constructor({ auditLog }) {
    this.auditLog = auditLog;
    this.records = [];
  }

  importData({ actor, school_id, datasetName, rowCount }) {
    assertSchoolId(school_id);
    assertSameSchool(actor.school_id, school_id);
    assertCanManageSchoolData(actor.role);

    const importRecord = {
      school_id,
      datasetName,
      rowCount,
      importedBy: actor.user_id,
    };

    this.records.push(importRecord);

    this.auditLog.record({
      type: AuditEventType.DATA_IMPORTED,
      school_id,
      actor_user_id: actor.user_id,
      dataset_name: datasetName,
      row_count: rowCount,
    });

    return importRecord;
  }

  editData({ actor, school_id, entityType, entityId, changes }) {
    assertSchoolId(school_id);
    assertSameSchool(actor.school_id, school_id);
    assertCanManageSchoolData(actor.role);

    const editRecord = {
      school_id,
      entityType,
      entityId,
      changes,
      editedBy: actor.user_id,
    };

    this.auditLog.record({
      type: AuditEventType.DATA_EDITED,
      school_id,
      actor_user_id: actor.user_id,
      entity_type: entityType,
      entity_id: entityId,
      change_keys: Object.keys(changes || {}),
    });

    return editRecord;
  }
}

module.exports = { SchoolDataService };
