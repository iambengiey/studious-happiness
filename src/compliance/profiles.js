const ComplianceProfiles = Object.freeze({
  ZA: {
    country_code: 'ZA',
    retention_days: 365,
    disclaimer: 'Comms sent under South Africa school communication policy.',
    consent_wording: 'By receiving these updates, you consent to institution communication policy.',
    opt_out: 'Reply STOP or update your preferences in your parent portal.',
    template_pack: 'za-default',
  },
  KE: {
    country_code: 'KE',
    retention_days: 365,
    disclaimer: 'Comms sent under Kenya institution communication policy.',
    consent_wording: 'Communication consent is managed by your institution registration agreement.',
    opt_out: 'Use your institution portal to manage notifications.',
    template_pack: 'ke-default',
  },
  NG: {
    country_code: 'NG',
    retention_days: 180,
    disclaimer: 'Comms sent under Nigeria institution communication policy.',
    consent_wording: 'You consent to official institution notices for enrolled learners/students.',
    opt_out: 'Contact your institution administrator to opt out where legally permitted.',
    template_pack: 'ng-default',
  },
});

module.exports = { ComplianceProfiles };
