const { RolePermissions } = require('./roles');

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

function permissionsFor(role) {
  const permissions = RolePermissions[role];
  if (!permissions) {
    throw new AuthorizationError(`Unsupported role: ${role}`);
  }
  return permissions;
}

function canAssignRole(actorRole, targetRole) {
  return permissionsFor(actorRole).assignRoles.includes(targetRole);
}

function assertCanInvite(actorRole, targetRole) {
  const permissions = permissionsFor(actorRole);
  if (!permissions.inviteUsers || !canAssignRole(actorRole, targetRole)) {
    throw new AuthorizationError(`${actorRole} cannot invite user with role ${targetRole}`);
  }
}

function assertCanRevoke(actorRole) {
  if (!permissionsFor(actorRole).revokeAccess) {
    throw new AuthorizationError(`${actorRole} cannot revoke school access`);
  }
}

function assertCanTransferOwnership(actorRole) {
  if (!permissionsFor(actorRole).transferOwnership) {
    throw new AuthorizationError(`${actorRole} cannot transfer school ownership`);
  }
}

function assertCanManageSchoolData(actorRole) {
  if (!permissionsFor(actorRole).manageSchoolData) {
    throw new AuthorizationError(`${actorRole} cannot modify school data`);
  }
}

function assertCanSendMessage(actorRole) {
  if (!permissionsFor(actorRole).sendMessages) {
    throw new AuthorizationError(`${actorRole} cannot send messages`);
  }
}

function assertCanReadDashboards(actorRole) {
  if (!permissionsFor(actorRole).readDashboards) {
    throw new AuthorizationError(`${actorRole} cannot read dashboards/logs`);
  }
}

function assertCanExportReports(actorRole) {
  if (!permissionsFor(actorRole).exportReports) {
    throw new AuthorizationError(`${actorRole} cannot export reports`);
  }
}

module.exports = {
  AuthorizationError,
  assertCanInvite,
  assertCanRevoke,
  assertCanTransferOwnership,
  assertCanManageSchoolData,
  assertCanSendMessage,
  assertCanReadDashboards,
  assertCanExportReports,
  canAssignRole,
};
