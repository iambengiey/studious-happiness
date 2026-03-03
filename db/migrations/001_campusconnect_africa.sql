-- CampusConnect Africa core schema (multi-tenant, multi-country, admin-only)

CREATE TABLE countries (
  country_code CHAR(2) PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE compliance_profiles (
  country_code CHAR(2) PRIMARY KEY REFERENCES countries(country_code),
  retention_days INTEGER NOT NULL,
  disclaimer TEXT NOT NULL,
  consent_wording TEXT NOT NULL,
  opt_out_rules TEXT NOT NULL,
  template_pack TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institutions (
  institution_id UUID PRIMARY KEY,
  country_code CHAR(2) NOT NULL REFERENCES countries(country_code),
  institution_name TEXT NOT NULL,
  hierarchy_type TEXT NOT NULL CHECK (hierarchy_type IN ('school','varsity','mixed')),
  compliance_profile_country_code CHAR(2) NOT NULL REFERENCES compliance_profiles(country_code),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_admin','institution_owner','institution_admin','institution_viewer')),
  institution_id UUID NULL REFERENCES institutions(institution_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (role = 'platform_admin' AND institution_id IS NULL)
    OR
    (role <> 'platform_admin' AND institution_id IS NOT NULL)
  )
);

CREATE TABLE hierarchy_divisions (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  country_code CHAR(2) NOT NULL,
  division_type TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hierarchy_units (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  division_id UUID NOT NULL REFERENCES hierarchy_divisions(id),
  unit_type TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hierarchy_groups (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  unit_id UUID NOT NULL REFERENCES hierarchy_units(id),
  group_type TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  country_code CHAR(2) NOT NULL,
  division_id UUID NULL REFERENCES hierarchy_divisions(id),
  unit_id UUID NULL REFERENCES hierarchy_units(id),
  group_id UUID NULL REFERENCES hierarchy_groups(id),
  full_name TEXT NOT NULL,
  channel_email TEXT,
  channel_whatsapp TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE templates (
  id UUID PRIMARY KEY,
  institution_id UUID NULL REFERENCES institutions(institution_id),
  country_code CHAR(2) NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global','country','institution')),
  template_name TEXT NOT NULL,
  email_subject TEXT,
  email_html TEXT,
  whatsapp_text TEXT,
  social_text TEXT,
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  country_code CHAR(2) NOT NULL,
  authored_by UUID NOT NULL REFERENCES users(user_id),
  template_id UUID NULL REFERENCES templates(id),
  target_scope JSONB NOT NULL,
  email_subject TEXT,
  email_html TEXT,
  whatsapp_text TEXT,
  social_text TEXT,
  payload_hash TEXT NOT NULL,
  retention_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE message_dispatches (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  message_id UUID NOT NULL REFERENCES messages(id),
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','facebook','x')),
  status TEXT NOT NULL CHECK (status IN ('queued','retrying','sent','failed')),
  provider_reference TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution_channels (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','facebook','x')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_secret_ref TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institution_id, channel)
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  actor_user_id UUID NOT NULL REFERENCES users(user_id),
  target_scope JSONB,
  channel TEXT,
  payload_hash TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_institution_created_at ON audit_logs(institution_id, created_at DESC);
CREATE INDEX idx_messages_institution_created_at ON messages(institution_id, created_at DESC);
CREATE INDEX idx_dispatches_message_channel ON message_dispatches(message_id, channel);
