-- CEB Tender Management System — Expand Notification Types Schema
-- Migration File: 003_expand_notification_types.sql

-- Drop existing CHECK constraint on notification_type
ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_notification_type_check;

-- Re-create CHECK constraint allowing all 10 notification types:
-- 1. Pre-deadline reminders: 'deadline_15', 'deadline_10', 'deadline_5', 'deadline_1'
-- 2. Award notifications: 'award'
-- 3. TEC appointment notifications: 'tec_appointment'
-- 4. Tender completion alerts: 'completion'
-- 5. Overdue delay reminders: 'delay_2', 'delay_5', 'delay_10'
ALTER TABLE notification_log ADD CONSTRAINT notification_log_notification_type_check
CHECK (notification_type IN (
  'deadline_15',
  'deadline_10',
  'deadline_5',
  'deadline_1',
  'award',
  'tec_appointment',
  'completion',
  'delay_2',
  'delay_5',
  'delay_10'
));
