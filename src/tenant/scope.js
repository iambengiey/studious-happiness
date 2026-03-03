const { Role } = require('../auth/roles');

class TenantIsolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

function assertInstitutionId(value) {
  if (!value) {
    throw new TenantIsolationError('institution_id is required on every row');
  }
}

function assertCountryCode(value) {
  if (!value || !/^[A-Z]{2}$/.test(value)) {
    throw new TenantIsolationError('country_code must be an ISO-2 uppercase code');
  }
}

function assertUserIsolation(actor, institutionId) {
  if (actor.role === Role.PLATFORM_ADMIN) return;
  assertInstitutionId(actor.institution_id);
  assertInstitutionId(institutionId);
  if (actor.institution_id !== institutionId) {
    throw new TenantIsolationError('Cross-institution access blocked');
  }
}

function withInstitutionScope(row, institutionId, countryCode) {
  assertInstitutionId(institutionId);
  const scoped = { ...row, institution_id: institutionId };
  if (countryCode) {
    assertCountryCode(countryCode);
    scoped.country_code = countryCode;
  }
  return scoped;
}

module.exports = {
  TenantIsolationError,
  assertInstitutionId,
  assertCountryCode,
  assertUserIsolation,
  withInstitutionScope,
};
