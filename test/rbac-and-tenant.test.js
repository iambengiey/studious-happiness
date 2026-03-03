const test = require('node:test');
const assert = require('node:assert/strict');

const { Role } = require('../src/auth/roles');
const { AuditLog, AuditEventType } = require('../src/audit/events');
const { InstitutionService } = require('../src/services/institutionService');
const { InstitutionDataService } = require('../src/services/schoolDataService');
const { HierarchyService } = require('../src/services/hierarchyService');
const { loadComplianceProfile } = require('../src/compliance/engine');
const { MessagingService } = require('../src/services/messageService');
const { RetryQueue } = require('../src/jobs/queue');
const { ConnectorRegistry } = require('../src/messaging/connectors');
const { createServer, parseAuth } = require('../src/server');

test('onboarding loads country compliance profile and enforces institution scoping', () => {
  const auditLog = new AuditLog();
  const service = new InstitutionService({ auditLog });
  const platform = { user_id: 'u-p', role: Role.PLATFORM_ADMIN };

  const institution = service.onboardInstitution({
    actor: platform,
    institution_id: 'inst-1',
    institution_name: 'Campus A',
    country_code: 'ZA',
  });

  assert.equal(institution.compliance_profile.country_code, 'ZA');

  const owner = { user_id: 'u-o', role: Role.INSTITUTION_OWNER, institution_id: 'inst-1' };
  assert.doesNotThrow(() => service.inviteUser({ actor: owner, target_user_id: 'u-a', role: Role.INSTITUTION_ADMIN, institution_id: 'inst-1' }));
  assert.throws(
    () => service.inviteUser({ actor: owner, target_user_id: 'u-b', role: Role.INSTITUTION_ADMIN, institution_id: 'inst-2' }),
    /Cross-institution access blocked/,
  );
});

test('hierarchy supports Country -> Institution -> Division -> Unit -> Group', () => {
  const actor = { user_id: 'u-a', role: Role.INSTITUTION_ADMIN, institution_id: 'inst-1' };
  const hierarchy = new HierarchyService();

  const division = hierarchy.createDivision({ actor, institution_id: 'inst-1', country_code: 'ZA', type: 'grade', name: 'Grade 9' });
  const unit = hierarchy.createUnit({ actor, institution_id: 'inst-1', division_id: division.id, name: 'Class 9A' });
  const group = hierarchy.createGroup({ actor, institution_id: 'inst-1', unit_id: unit.id, name: 'Mathematics' });

  assert.equal(division.institution_id, 'inst-1');
  assert.equal(unit.division_id, division.id);
  assert.equal(group.unit_id, unit.id);
});

test('message compose once, apply compliance, queue by channel, and audit sends', async () => {
  const auditLog = new AuditLog();
  const queue = new RetryQueue({ maxRetries: 2 });
  const connectors = new ConnectorRegistry();
  const service = new MessagingService({ auditLog, queue, connectors });

  service.addTemplate({
    id: 'tmpl-1',
    subject: 'Update for {institution_name}',
    email_html: '<p>Hello {institution_name}</p><p>{link}</p>',
    whatsapp_text: 'Hi from {institution_name} {link}',
    social_post_text: '{institution_name} says hello {link}',
  });

  const actor = { user_id: 'u-admin', role: Role.INSTITUTION_ADMIN, institution_id: 'inst-1' };
  const institution = { institution_id: 'inst-1', country_code: 'ZA', compliance_profile: loadComplianceProfile('ZA') };

  const message = service.createMessage({
    actor,
    institution,
    templateId: 'tmpl-1',
    variables: { institution_name: 'Campus A' },
    target_scope: { division: 'Grade 9', unit: 'Class 9A', group: 'Math' },
    channels: ['email', 'whatsapp'],
    link: 'https://example.org/notice',
  });

  assert.match(message.content.email_html, /South Africa school communication policy/);

  service.queueMessageSend({
    message,
    recipientsByChannel: {
      email: ['a@x.org', 'b@x.org'],
      whatsapp: ['+27820000000'],
    },
  });

  const jobs = await service.processQueue();
  assert.equal(jobs.filter((j) => j.status === 'done').length, 2);

  const sends = auditLog.list({ type: AuditEventType.MESSAGE_SENT, institution_id: 'inst-1' });
  assert.equal(sends.length, 2);
  assert.ok(sends[0].payload_hash);
});

test('data import allowed for admin and blocked for viewer', () => {
  const auditLog = new AuditLog();
  const svc = new InstitutionDataService({ auditLog });
  const admin = { user_id: 'u-admin', role: Role.INSTITUTION_ADMIN, institution_id: 'inst-1' };
  const viewer = { user_id: 'u-viewer', role: Role.INSTITUTION_VIEWER, institution_id: 'inst-1' };

  const imported = svc.importContactsCsv({ actor: admin, institution_id: 'inst-1', country_code: 'ZA', file_name: 'contacts.csv', row_count: 30 });
  assert.equal(imported.file_name, 'contacts.csv');

  assert.throws(
    () => svc.importContactsCsv({ actor: viewer, institution_id: 'inst-1', country_code: 'ZA', file_name: 'contacts.csv', row_count: 30 }),
    /cannot import data/,
  );
});

test('all routes require auth in admin console server', async () => {
  assert.equal(parseAuth({ headers: {} }), null);

  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  const unauthorized = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(unauthorized.status, 401);

  const authorized = await fetch(`http://127.0.0.1:${port}/admin`, {
    headers: { Authorization: 'Bearer user-1:institution_admin:inst-1' },
  });
  assert.equal(authorized.status, 200);

  await new Promise((resolve) => server.close(resolve));
});
