const test = require('node:test');
const assert = require('node:assert/strict');

const { Role } = require('../src/auth/roles');
const { AuditLog, AuditEventType } = require('../src/audit/events');
const { SchoolMembershipService } = require('../src/services/schoolMembershipService');
const { SchoolDataService } = require('../src/services/schoolDataService');
const { MessageService } = require('../src/services/messageService');
const { withSchoolScope, assertTenantScopedQuery } = require('../src/tenant/scope');

test('school_owner can invite admin/viewer but not owner', () => {
  const auditLog = new AuditLog();
  const service = new SchoolMembershipService({ auditLog });
  const owner = { user_id: 'u-owner', role: Role.SCHOOL_OWNER, school_id: 's1' };

  const admin = service.inviteUser({
    actor: owner,
    targetUserId: 'u-admin',
    targetRole: Role.SCHOOL_ADMIN,
    school_id: 's1',
  });

  const viewer = service.inviteUser({
    actor: owner,
    targetUserId: 'u-viewer',
    targetRole: Role.SCHOOL_VIEWER,
    school_id: 's1',
  });

  assert.equal(admin.role, Role.SCHOOL_ADMIN);
  assert.equal(viewer.role, Role.SCHOOL_VIEWER);

  assert.throws(
    () =>
      service.inviteUser({
        actor: owner,
        targetUserId: 'u-owner2',
        targetRole: Role.SCHOOL_OWNER,
        school_id: 's1',
      }),
    /cannot invite user with role school_owner/,
  );
});

test('school_admin can manage school data and send messages but cannot transfer ownership', () => {
  const auditLog = new AuditLog();
  const dataService = new SchoolDataService({ auditLog });
  const messageService = new MessageService({ auditLog });
  const membershipService = new SchoolMembershipService({ auditLog });

  const admin = { user_id: 'u-admin', role: Role.SCHOOL_ADMIN, school_id: 's1' };

  const imported = dataService.importData({
    actor: admin,
    school_id: 's1',
    datasetName: 'students.csv',
    rowCount: 42,
  });

  const msg = messageService.sendMessage({
    actor: admin,
    school_id: 's1',
    channel: 'email',
    subject: 'Notice',
    body: 'Welcome',
  });

  assert.equal(imported.school_id, 's1');
  assert.equal(msg.school_id, 's1');

  assert.throws(
    () =>
      membershipService.transferOwnership({
        actor: admin,
        newOwnerUserId: 'u-x',
        school_id: 's1',
      }),
    /cannot transfer school ownership/,
  );
});

test('school_viewer can only read/export and cannot send/edit', () => {
  const auditLog = new AuditLog();
  const dataService = new SchoolDataService({ auditLog });
  const messageService = new MessageService({ auditLog });
  const viewer = { user_id: 'u-viewer', role: Role.SCHOOL_VIEWER, school_id: 's1' };

  assert.throws(
    () =>
      dataService.editData({
        actor: viewer,
        school_id: 's1',
        entityType: 'student',
        entityId: 'st1',
        changes: { grade: 'A' },
      }),
    /cannot modify school data/,
  );

  assert.throws(
    () =>
      messageService.sendMessage({
        actor: viewer,
        school_id: 's1',
        channel: 'sms',
        subject: 'test',
        body: 'test',
      }),
    /cannot send messages/,
  );
});

test('tenant isolation blocks cross-school access and requires school_id in queries', () => {
  const scoped = withSchoolScope({ entity: 'grades' }, 's99');
  assert.equal(scoped.school_id, 's99');
  assert.doesNotThrow(() => assertTenantScopedQuery(scoped));
  assert.throws(() => assertTenantScopedQuery({ entity: 'grades' }), /must include school_id/);

  const auditLog = new AuditLog();
  const messageService = new MessageService({ auditLog });
  const actor = { user_id: 'u-admin', role: Role.SCHOOL_ADMIN, school_id: 's1' };

  assert.throws(
    () =>
      messageService.sendMessage({
        actor,
        school_id: 's2',
        channel: 'email',
        subject: 'bad',
        body: 'cross tenant',
      }),
    /school_id mismatch/,
  );
});

test('audit logs include invites, role changes, imports, edits, and message sends', () => {
  const auditLog = new AuditLog();
  const membershipService = new SchoolMembershipService({ auditLog });
  const dataService = new SchoolDataService({ auditLog });
  const messageService = new MessageService({ auditLog });
  const owner = { user_id: 'u-owner', role: Role.SCHOOL_OWNER, school_id: 's1' };

  membershipService.inviteUser({ actor: owner, targetUserId: 'u-a', targetRole: Role.SCHOOL_ADMIN, school_id: 's1' });
  membershipService.changeRole({ actor: owner, targetUserId: 'u-a', newRole: Role.SCHOOL_VIEWER, school_id: 's1' });
  dataService.importData({ actor: owner, school_id: 's1', datasetName: 'courses.csv', rowCount: 10 });
  dataService.editData({ actor: owner, school_id: 's1', entityType: 'course', entityId: 'c-1', changes: { title: 'Math' } });
  messageService.sendMessage({ actor: owner, school_id: 's1', channel: 'in-app', subject: 'hello', body: 'world' });

  const eventTypes = auditLog.listBySchool('s1').map((entry) => entry.type);
  assert.deepEqual(eventTypes, [
    AuditEventType.USER_INVITED,
    AuditEventType.USER_ROLE_CHANGED,
    AuditEventType.DATA_IMPORTED,
    AuditEventType.DATA_EDITED,
    AuditEventType.MESSAGE_SENT,
  ]);
});
