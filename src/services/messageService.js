const { assertCanSend } = require('../auth/policies');
const { assertUserIsolation, assertInstitutionId } = require('../tenant/scope');
const { applyComplianceToMessage } = require('../compliance/engine');
const { renderTemplate } = require('../messaging/templateEngine');
const { AuditEventType, hashPayload } = require('../audit/events');

class MessagingService {
  constructor({ auditLog, queue, connectors }) {
    this.auditLog = auditLog;
    this.queue = queue;
    this.connectors = connectors;
    this.messages = [];
    this.templates = [];
  }

  addTemplate(template) {
    this.templates.push(template);
    return template;
  }

  createMessage({ actor, institution, templateId, variables, target_scope, channels, link }) {
    assertCanSend(actor);
    assertInstitutionId(institution.institution_id);
    assertUserIsolation(actor, institution.institution_id);

    const template = this.templates.find((row) => row.id === templateId);
    if (!template) throw new Error('Template not found');

    const rendered = {
      subject: renderTemplate(template.subject || '', variables),
      email_html: renderTemplate(template.email_html || '', { ...variables, link }),
      whatsapp_text: renderTemplate(template.whatsapp_text || '', { ...variables, link }),
      social_post_text: renderTemplate(template.social_post_text || '', { ...variables, link }),
    };

    const compliant = applyComplianceToMessage(rendered, institution.compliance_profile);
    const message = {
      id: `msg-${this.messages.length + 1}`,
      institution_id: institution.institution_id,
      country_code: institution.country_code,
      actor_user_id: actor.user_id,
      target_scope,
      channels,
      link,
      content: compliant,
      payload_hash: hashPayload(compliant),
    };

    this.messages.push(message);

    this.auditLog.record({
      type: AuditEventType.MESSAGE_QUEUED,
      institution_id: message.institution_id,
      actor_user_id: message.actor_user_id,
      target_scope,
      channel: channels.join(','),
      payload_hash: message.payload_hash,
    });

    return message;
  }

  queueMessageSend({ message, recipientsByChannel }) {
    for (const channel of message.channels) {
      this.queue.add({ type: 'send_message', message, channel, recipients: recipientsByChannel[channel] || [] });
    }
  }

  async processQueue() {
    return this.queue.drain(async (job) => {
      const connector = this.connectors.get(job.channel);
      const result = await connector.send(job.message.content, job.recipients, {
        institution_id: job.message.institution_id,
        country_code: job.message.country_code,
      });

      this.auditLog.record({
        type: AuditEventType.MESSAGE_SENT,
        institution_id: job.message.institution_id,
        actor_user_id: job.message.actor_user_id,
        target_scope: JSON.stringify(job.message.target_scope),
        channel: job.channel,
        payload_hash: job.message.payload_hash,
        delivery_status: 'sent',
        delivered_count: result.delivered,
      });
    });
  }
}

module.exports = { MessagingService };
