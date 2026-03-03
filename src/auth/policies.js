const { Role, RolePermissions } = require('./roles');

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

function assertAuthenticated(user) {
  if (!user || !user.user_id || !user.role) {
    throw new AuthorizationError('Authentication required');
  }
}

function assertCanInvite(actor, targetRole) {
  assertAuthenticated(actor);
  const permissions = permissionsFor(actor.role);
  if (!permissions.inviteUsers || !permissions.assignRoles.includes(targetRole)) {
    throw new AuthorizationError(`${actor.role} cannot invite role ${targetRole}`);
  }
}

function assertCanRemove(actor) {
  assertAuthenticated(actor);
  if (!permissionsFor(actor.role).removeUsers) {
    throw new AuthorizationError(`${actor.role} cannot remove institution users`);
  }
}

function assertCanImport(actor) {
  assertAuthenticated(actor);
  if (!permissionsFor(actor.role).importData) {
    throw new AuthorizationError(`${actor.role} cannot import data`);
  }
}

function assertCanCreateGroups(actor) {
  assertAuthenticated(actor);
  if (!permissionsFor(actor.role).createGroups) {
    throw new AuthorizationError(`${actor.role} cannot create groups`);
  }
}

function assertCanSend(actor) {
  assertAuthenticated(actor);
  if (!permissionsFor(actor.role).sendMessages) {
    throw new AuthorizationError(`${actor.role} cannot send messages`);
  }
}

function assertInstitutionScopedUser(user) {
  assertAuthenticated(user);
  if (user.role !== Role.PLATFORM_ADMIN && !user.institution_id) {
    throw new AuthorizationError('Non-platform users must belong to exactly one institution_id');
  }
}

module.exports = {
  AuthorizationError,
  assertAuthenticated,
  assertCanInvite,
  assertCanRemove,
  assertCanImport,
  assertCanCreateGroups,
  assertCanSend,
  assertInstitutionScopedUser,
};
