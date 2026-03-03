const { Role } = require('../auth/roles');
const { assertCanInvite, assertCanRemove, assertInstitutionScopedUser } = require('../auth/policies');
const { loadComplianceProfile } = require('../compliance/engine');
const { AuditEventType } = require('../audit/events');
const { assertCountryCode, assertInstitutionId, assertUserIsolation, withInstitutionScope } = require('../tenant/scope');

class InstitutionService {
  constructor({ auditLog }) {
    this.auditLog = auditLog;
    this.institutions = [];
    this.users = [];
  }

  onboardInstitution({ actor, institution_id, institution_name, country_code }) {
    if (!actor || actor.role !== Role.PLATFORM_ADMIN) {
      throw new Error('Only platform_admin can onboard institutions');
    }
    assertInstitutionId(institution_id);
    assertCountryCode(country_code);
    const compliance_profile = loadComplianceProfile(country_code);

    const institution = withInstitutionScope({
      institution_name,
      country_code,
      compliance_profile,
      channels_enabled: { email: true, whatsapp: false, facebook: false, x: false },
    }, institution_id, country_code);

    this.institutions.push(institution);
    return institution;
  }

  inviteUser({ actor, target_user_id, role, institution_id }) {
    assertInstitutionScopedUser(actor);
    assertCanInvite(actor, role);
    assertUserIsolation(actor, institution_id);

    const row = withInstitutionScope({ user_id: target_user_id, role }, institution_id);
    this.users.push(row);

    this.auditLog.record({
      type: AuditEventType.USER_INVITED,
      institution_id,
      actor_user_id: actor.user_id,
      target_user_id,
      target_role: role,
    });
    return row;
  }

  removeUser({ actor, target_user_id, institution_id }) {
    assertCanRemove(actor);
    assertUserIsolation(actor, institution_id);
    const target = this.users.find((u) => u.user_id === target_user_id && u.institution_id === institution_id);
    if (!target) throw new Error('User not found in institution');

    target.removed_at = new Date().toISOString();
    this.auditLog.record({
      type: AuditEventType.USER_REMOVED,
      institution_id,
      actor_user_id: actor.user_id,
      target_user_id,
    });
    return target;
  }
}

module.exports = { InstitutionService };
