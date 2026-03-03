class TenantIsolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

function assertSchoolId(value, label = 'school_id') {
  if (!value) {
    throw new TenantIsolationError(`${label} is required for tenant isolation`);
  }
}

function assertSameSchool(actorSchoolId, resourceSchoolId) {
  assertSchoolId(actorSchoolId, 'actor.school_id');
  assertSchoolId(resourceSchoolId, 'resource.school_id');
  if (actorSchoolId !== resourceSchoolId) {
    throw new TenantIsolationError('Cross-tenant access blocked: school_id mismatch');
  }
}

function withSchoolScope(query = {}, schoolId) {
  assertSchoolId(schoolId);
  return { ...query, school_id: schoolId };
}

function assertTenantScopedQuery(query = {}) {
  if (!Object.prototype.hasOwnProperty.call(query, 'school_id')) {
    throw new TenantIsolationError('All school entity queries must include school_id');
  }
}

module.exports = {
  TenantIsolationError,
  assertSchoolId,
  assertSameSchool,
  withSchoolScope,
  assertTenantScopedQuery,
};
