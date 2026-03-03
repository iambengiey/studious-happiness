const Role = Object.freeze({
  PLATFORM_ADMIN: 'platform_admin',
  INSTITUTION_OWNER: 'institution_owner',
  INSTITUTION_ADMIN: 'institution_admin',
  INSTITUTION_VIEWER: 'institution_viewer',
});

const RolePermissions = Object.freeze({
  [Role.PLATFORM_ADMIN]: {
    inviteUsers: true,
    removeUsers: true,
    assignRoles: [Role.INSTITUTION_OWNER, Role.INSTITUTION_ADMIN, Role.INSTITUTION_VIEWER],
    importData: true,
    createGroups: true,
    sendMessages: true,
    readOnly: false,
  },
  [Role.INSTITUTION_OWNER]: {
    inviteUsers: true,
    removeUsers: true,
    assignRoles: [Role.INSTITUTION_ADMIN, Role.INSTITUTION_VIEWER],
    importData: true,
    createGroups: true,
    sendMessages: true,
    readOnly: false,
  },
  [Role.INSTITUTION_ADMIN]: {
    inviteUsers: false,
    removeUsers: false,
    assignRoles: [],
    importData: true,
    createGroups: true,
    sendMessages: true,
    readOnly: false,
  },
  [Role.INSTITUTION_VIEWER]: {
    inviteUsers: false,
    removeUsers: false,
    assignRoles: [],
    importData: false,
    createGroups: false,
    sendMessages: false,
    readOnly: true,
  },
});

module.exports = { Role, RolePermissions };
