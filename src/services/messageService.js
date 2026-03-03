const { assertCanSendMessage } = require('../auth/policies');
const { assertSameSchool, assertSchoolId } = require('../tenant/scope');
const { AuditEventType } = require('../audit/events');

class MessageService {
  constructor({ auditLog }) {
    this.auditLog = auditLog;
    this.messages = [];
  }

  sendMessage({ actor, school_id, channel, subject, body }) {
    assertSchoolId(school_id);
    assertSameSchool(actor.school_id, school_id);
    assertCanSendMessage(actor.role);

    const message = {
      id: `${school_id}-${this.messages.length + 1}`,
      school_id,
      channel,
      subject,
      body,
      sender_user_id: actor.user_id,
    };

    this.messages.push(message);

    this.auditLog.record({
      type: AuditEventType.MESSAGE_SENT,
      school_id,
      actor_user_id: actor.user_id,
      channel,
      subject,
      message_id: message.id,
    });

    return message;
  }
}

module.exports = { MessageService };
