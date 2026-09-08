const supabaseDefault = require('../config/supabase');
const { getNotificationRecipients } = require('../utils/notificationRecipients');
const { sendDeadlineReminderEmail } = require('../utils/emailService');

/**
 * Runs the daily check for tender deadline reminders.
 *
 * @param {Object} env - Environment object (containing secrets/vars in Workers or process.env fallback)
 * @param {Object} [supabaseOverride] - Optional Supabase client instance override (e.g. for testing)
 * @returns {Promise<Object>} Summary of execution result
 */
async function runDeadlineReminderCheck(env = {}, supabaseOverride = null) {
  const supabase = supabaseOverride || supabaseDefault;
  const resendApiKey = env?.RESEND_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.RESEND_API_KEY : undefined);
  const frontendUrl = env?.FRONTEND_URL || (typeof process !== 'undefined' && process.env ? process.env.FRONTEND_URL : 'https://ceb-tms-frontend.skpthiran.workers.dev');

  const today = new Date();
  
  const intervals = [
    { days: 15, type: 'deadline_15' },
    { days: 10, type: 'deadline_10' },
    { days: 5, type: 'deadline_5' },
    { days: 1, type: 'deadline_1' }
  ];

  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const targetDatesMap = new Map();
  intervals.forEach(item => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + item.days);
    const dateStr = formatDateStr(targetDate);
    targetDatesMap.set(dateStr, item);
  });

  const targetDateStrings = Array.from(targetDatesMap.keys());

  console.log(`[DeadlineReminderJob] Target dates checked: ${targetDateStrings.join(', ')}`);

  let recordsChecked = 0;
  let emailsSent = 0;
  let emailsFailed = 0;
  let skippedAlreadySent = 0;
  const details = [];

  try {
    const { data: matchingRecords, error: fetchError } = await supabase
      .from('records')
      .select('*')
      .in('bid_closing_date', targetDateStrings);

    if (fetchError) {
      console.error('[DeadlineReminderJob] Error fetching records for deadline check:', fetchError);
      throw fetchError;
    }

    recordsChecked = Array.isArray(matchingRecords) ? matchingRecords.length : 0;

    for (const record of (matchingRecords || [])) {
      const closingDateRaw = record.bid_closing_date || record.bidClosingDate;
      if (!closingDateRaw) continue;

      const closingDateStr = String(closingDateRaw).slice(0, 10);
      const intervalInfo = targetDatesMap.get(closingDateStr);

      if (!intervalInfo) continue;

      const { days: daysRemaining, type: notificationType } = intervalInfo;
      const recordId = record.id || record._id;

      // 1. Check if a 'sent' log entry already exists for (record_id, notification_type)
      const { data: existingLog, error: logCheckError } = await supabase
        .from('notification_log')
        .select('id')
        .eq('record_id', recordId)
        .eq('notification_type', notificationType)
        .eq('status', 'sent')
        .maybeSingle();

      if (logCheckError) {
        console.warn(`[DeadlineReminderJob] Warning checking notification_log for record ${recordId}:`, logCheckError);
      }

      if (existingLog) {
        console.log(`[DeadlineReminderJob] Skipping record ${record.tender_number || recordId} (${notificationType}) - already sent.`);
        skippedAlreadySent++;
        details.push({
          recordId,
          tenderNumber: record.tender_number || record.tenderNumber,
          notificationType,
          status: 'skipped',
          reason: 'already_sent'
        });
        continue;
      }

      // 2. Fetch recipients
      const recipients = await getNotificationRecipients(supabase, record);

      if (recipients.length === 0) {
        console.warn(`[DeadlineReminderJob] No recipients found for record ${record.tender_number || recordId}`);
        continue;
      }

      // 3. Send email to each recipient & write row into notification_log
      for (const recipient of recipients) {
        const sendResult = await sendDeadlineReminderEmail({
          resendApiKey,
          frontendUrl,
          toEmail: recipient.email,
          record,
          daysRemaining
        });

        const status = sendResult.success ? 'sent' : 'failed';
        const errorMessage = sendResult.error || null;

        if (sendResult.success) {
          emailsSent++;
        } else {
          emailsFailed++;
        }

        // Insert row into notification_log
        const { error: insertError } = await supabase
          .from('notification_log')
          .insert([{
            record_id: recordId,
            notification_type: notificationType,
            recipient_email: recipient.email,
            recipient_role: recipient.role,
            status,
            error_message: errorMessage,
            sent_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error(`[DeadlineReminderJob] Failed to insert notification_log for ${recipient.email}:`, insertError);
        }

        details.push({
          recordId,
          tenderNumber: record.tender_number || record.tenderNumber,
          notificationType,
          recipientEmail: recipient.email,
          status,
          resendId: sendResult.resendId,
          error: errorMessage
        });
      }
    }
  } catch (err) {
    console.error('[DeadlineReminderJob] Critical error running deadline reminder check:', err);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    recordsChecked,
    skippedAlreadySent,
    emailsSent,
    emailsFailed,
    details
  };

  console.log('[DeadlineReminderJob] Completed check summary:', summary);
  return summary;
}

module.exports = {
  runDeadlineReminderCheck
};
