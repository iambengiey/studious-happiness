const { assertCanImport } = require('../auth/policies');
const { assertUserIsolation, withInstitutionScope } = require('../tenant/scope');
const { AuditEventType } = require('../audit/events');

class InstitutionDataService {
  constructor({ auditLog }) {
    this.auditLog = auditLog;
    this.imports = [];
  }

  importContactsCsv({ actor, institution_id, country_code, file_name, row_count }) {
    assertCanImport(actor);
    assertUserIsolation(actor, institution_id);

    const row = withInstitutionScope({ id: `imp-${this.imports.length + 1}`, file_name, row_count }, institution_id, country_code);
    this.imports.push(row);

    this.auditLog.record({
      type: AuditEventType.DATA_IMPORTED,
      institution_id,
      actor_user_id: actor.user_id,
      file_name,
      row_count,
    });

    return row;
  }
}

module.exports = { InstitutionDataService };
