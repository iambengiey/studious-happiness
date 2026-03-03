const Role = Object.freeze({
  PLATFORM_ADMIN: 'platform_admin',
  SCHOOL_OWNER: 'school_owner',
  SCHOOL_ADMIN: 'school_admin',
  SCHOOL_VIEWER: 'school_viewer',
});

const RolePermissions = Object.freeze({
  [Role.PLATFORM_ADMIN]: {
    inviteUsers: true,
    assignRoles: [Role.SCHOOL_ADMIN, Role.SCHOOL_VIEWER, Role.SCHOOL_OWNER],
    revokeAccess: true,
    transferOwnership: true,
    manageSchoolData: true,
    sendMessages: true,
    readDashboards: true,
    exportReports: true,
    deleteSchool: true,
  },
  [Role.SCHOOL_OWNER]: {
    inviteUsers: true,
    assignRoles: [Role.SCHOOL_ADMIN, Role.SCHOOL_VIEWER],
    revokeAccess: true,
    transferOwnership: true,
    manageSchoolData: true,
    sendMessages: true,
    readDashboards: true,
    exportReports: true,
    deleteSchool: false,
  },
  [Role.SCHOOL_ADMIN]: {
    inviteUsers: false,
    assignRoles: [],
    revokeAccess: false,
    transferOwnership: false,
    manageSchoolData: true,
    sendMessages: true,
    readDashboards: true,
    exportReports: true,
    deleteSchool: false,
  },
  [Role.SCHOOL_VIEWER]: {
    inviteUsers: false,
    assignRoles: [],
    revokeAccess: false,
    transferOwnership: false,
    manageSchoolData: false,
    sendMessages: false,
    readDashboards: true,
    exportReports: true,
    deleteSchool: false,
  },
});

module.exports = { Role, RolePermissions };
