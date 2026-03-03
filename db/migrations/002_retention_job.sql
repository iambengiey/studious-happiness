-- Retention cleanup job example (PostgreSQL syntax)
-- Run daily in scheduler/background worker.
DELETE FROM message_dispatches
WHERE message_id IN (
  SELECT id FROM messages WHERE retention_until < NOW()
);

DELETE FROM messages
WHERE retention_until < NOW();
