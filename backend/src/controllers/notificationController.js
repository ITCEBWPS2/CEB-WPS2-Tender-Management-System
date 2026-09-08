const supabase = require('../config/supabase');
const { runDeadlineReminderCheck } = require('../jobs/deadlineReminders');

exports.getNotificationLogs = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notification_log')
      .select(`
        *,
        records:record_id (
          tender_number,
          category,
          description,
          bid_closing_date
        )
      `)
      .order('sent_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const mapped = (data || []).map(item => ({
      id: item.id,
      recordId: item.record_id,
      notificationType: item.notification_type,
      recipientEmail: item.recipient_email,
      recipientRole: item.recipient_role,
      status: item.status,
      errorMessage: item.error_message,
      sentAt: item.sent_at,
      tenderNumber: item.records?.tender_number || 'N/A',
      category: item.records?.category || '-',
      bidClosingDate: item.records?.bid_closing_date || null
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
};

exports.runTestCheck = async (req, res, next) => {
  try {
    const summary = await runDeadlineReminderCheck(process.env);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};
