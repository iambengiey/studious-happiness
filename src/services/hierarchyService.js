const { assertCanCreateGroups } = require('../auth/policies');
const { assertInstitutionId, assertCountryCode, assertUserIsolation, withInstitutionScope } = require('../tenant/scope');

class HierarchyService {
  constructor() {
    this.divisions = [];
    this.units = [];
    this.groups = [];
  }

  createDivision({ actor, institution_id, country_code, type, name }) {
    assertCanCreateGroups(actor);
    assertInstitutionId(institution_id);
    assertCountryCode(country_code);
    assertUserIsolation(actor, institution_id);

    const row = withInstitutionScope({ id: `div-${this.divisions.length + 1}`, type, name }, institution_id, country_code);
    this.divisions.push(row);
    return row;
  }

  createUnit({ actor, institution_id, division_id, name }) {
    assertCanCreateGroups(actor);
    assertUserIsolation(actor, institution_id);
    const row = withInstitutionScope({ id: `unit-${this.units.length + 1}`, division_id, name }, institution_id);
    this.units.push(row);
    return row;
  }

  createGroup({ actor, institution_id, unit_id, name }) {
    assertCanCreateGroups(actor);
    assertUserIsolation(actor, institution_id);
    const row = withInstitutionScope({ id: `grp-${this.groups.length + 1}`, unit_id, name }, institution_id);
    this.groups.push(row);
    return row;
  }
}

module.exports = { HierarchyService };
