const { Role } = require('../auth/roles');
const {
  assertCanInvite,
  assertCanRevoke,
  assertCanTransferOwnership,
} = require('../auth/policies');
const {
  assertSameSchool,
  assertSchoolId,
  withSchoolScope,
  assertTenantScopedQuery,
} = require('../tenant/scope');
const { AuditEventType } = require('../audit/events');

class SchoolMembershipService {
  constructor({ auditLog }) {
    this.auditLog = auditLog;
    this.memberships = [];
  }

  inviteUser({ actor, targetUserId, targetRole, school_id }) {
    assertSchoolId(school_id);
    assertSameSchool(actor.school_id, school_id);
    assertCanInvite(actor.role, targetRole);

    const scopedQuery = withSchoolScope({ user_id: targetUserId }, school_id);
    assertTenantScopedQuery(scopedQuery);

    const membership = {
      school_id,
      user_id: targetUserId,
      role: targetRole,
      status: 'active',
    };
    this.memberships.push(membership);

    this.auditLog.record({
      type: AuditEventType.USER_INVITED,
      school_id,
      actor_user_id: actor.user_id,
      target_user_id: targetUserId,
      target_role: targetRole,
    });

    return membership;
  }

  changeRole({ actor, targetUserId, newRole, school_id }) {
    assertSchoolId(school_id);
    assertSameSchool(actor.school_id, school_id);

    if (actor.role !== Role.PLATFORM_ADMIN && actor.role !== Role.SCHOOL_OWNER) {
      throw new Error(`${actor.role} cannot change roles`);
    }

    if (newRole === Role.SCHOOL_OWNER) {
      throw new Error('Use transferOwnership to assign school_owner');
    }

    assertCanInvite(actor.role, newRole);

    const membership = this.memberships.find(
      (row) => row.school_id === school_id && row.user_id === targetUserId,
    );
    if (!membership) {
      throw new Error('Membership not found in tenant');
    }

    const oldRole = membership.role;
    membership.role = newRole;

    this.auditLog.record({
      type: AuditEventType.USER_ROLE_CHANGED,
      school_id,
      actor_user_id: actor.user_id,
      target_user_id: targetUserId,
      old_role: oldRole,
      new_role: newRole,
    });

    return membership;
  }

  revokeAccess({ actor, targetUserId, school_id }) {
    assertSchoolId(school_id);
    assertSameSchool(actor.school_id, school_id);
    assertCanRevoke(actor.role);

    const membership = this.memberships.find(
      (row) => row.school_id === school_id && row.user_id === targetUserId,
    );

    if (!membership) {
      throw new Error('Membership not found in tenant');
    }

    membership.status = 'revoked';

    this.auditLog.record({
      type: AuditEventType.USER_ACCESS_REVOKED,
      school_id,
      actor_user_id: actor.user_id,
      target_user_id: targetUserId,
    });

    return membership;
  }

  transferOwnership({ actor, newOwnerUserId, school_id }) {
    assertSchoolId(school_id);
    assertSameSchool(actor.school_id, school_id);
    assertCanTransferOwnership(actor.role);

    const currentOwner = this.memberships.find(
      (row) => row.school_id === school_id && row.role === Role.SCHOOL_OWNER && row.status === 'active',
    );
    const newOwner = this.memberships.find(
      (row) => row.school_id === school_id && row.user_id === newOwnerUserId && row.status === 'active',
    );

    if (!newOwner) {
      throw new Error('New owner must already be an active school member');
    }

    if (currentOwner) {
      currentOwner.role = Role.SCHOOL_ADMIN;
    }

    newOwner.role = Role.SCHOOL_OWNER;

    this.auditLog.record({
      type: AuditEventType.OWNERSHIP_TRANSFERRED,
      school_id,
      actor_user_id: actor.user_id,
      from_user_id: currentOwner ? currentOwner.user_id : null,
      to_user_id: newOwnerUserId,
    });

    return { previousOwner: currentOwner, newOwner };
  }
}

module.exports = { SchoolMembershipService };
