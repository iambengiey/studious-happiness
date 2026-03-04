class BaseConnector {
  constructor(name) {
    this.name = name;
  }

  async send() {
    throw new Error(`Connector ${this.name} must implement send(message, recipients, metadata)`);
  }
}

class EmailConnector extends BaseConnector {
  constructor() { super('email'); }
  async send(message, recipients) {
    return { delivered: recipients.length, external_id: `email-${Date.now()}`, preview: message.email_html?.slice(0, 80) };
  }
}

class WhatsAppConnector extends BaseConnector {
  constructor() { super('whatsapp'); }
  async send(message, recipients) {
    return { delivered: recipients.length, external_id: `wa-${Date.now()}`, preview: message.whatsapp_text?.slice(0, 80) };
  }
}

class FacebookConnector extends BaseConnector {
  constructor() { super('facebook'); }
  async send(message) {
    return { delivered: 1, external_id: `fb-${Date.now()}`, preview: message.social_post_text?.slice(0, 80) };
  }
}

class XConnector extends BaseConnector {
  constructor() { super('x'); }
  async send(message) {
    return { delivered: 1, external_id: `x-${Date.now()}`, preview: message.social_post_text?.slice(0, 80) };
  }
}

class ConnectorRegistry {
  constructor() {
    this.map = new Map([
      ['email', new EmailConnector()],
      ['whatsapp', new WhatsAppConnector()],
      ['facebook', new FacebookConnector()],
      ['x', new XConnector()],
    ]);
  }

  get(channel) {
    const connector = this.map.get(channel);
    if (!connector) throw new Error(`Channel ${channel} is not enabled`);
    return connector;
  }
}

module.exports = { BaseConnector, EmailConnector, WhatsAppConnector, FacebookConnector, XConnector, ConnectorRegistry };
