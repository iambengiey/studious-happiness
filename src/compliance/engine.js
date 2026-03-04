const { ComplianceProfiles } = require('./profiles');

class ComplianceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ComplianceError';
  }
}

function loadComplianceProfile(countryCode) {
  const profile = ComplianceProfiles[countryCode];
  if (!profile) {
    throw new ComplianceError(`No compliance_profile configured for ${countryCode}`);
  }
  return profile;
}

function applyComplianceToMessage(draft, profile) {
  const footer = `${profile.disclaimer} ${profile.opt_out}`;
  return {
    ...draft,
    compliance_profile: profile,
    email_html: `${draft.email_html || ''}<hr/><p>${footer}</p>`,
    whatsapp_text: `${draft.whatsapp_text || ''}\n\n${footer}`.trim(),
    social_post_text: `${draft.social_post_text || ''}\n\n${profile.disclaimer}`.trim(),
    retention_days: profile.retention_days,
  };
}

module.exports = { ComplianceError, loadComplianceProfile, applyComplianceToMessage };
