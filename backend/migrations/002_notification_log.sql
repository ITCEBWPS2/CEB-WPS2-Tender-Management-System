-- CEB Tender Management System — Notification Log Schema
-- Migration File: 002_notification_log.sql

CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES records(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('deadline_15', 'deadline_10', 'deadline_5', 'deadline_1')),
    recipient_email TEXT NOT NULL,
    recipient_role TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast duplicate-check lookups
CREATE INDEX IF NOT EXISTS idx_notification_log_record_type_status
ON notification_log(record_id, notification_type, status);
