const { getNotificationRecipients, getTecAppointmentRecipients } = require('./notificationRecipients');
const {
  sendAwardNotificationEmail,
  sendTecAppointmentNotificationEmail,
  sendCompletionAlertEmail
} = require('./emailService');

/**
 * Dispatches Award Notifications to active admins with an attached PDF report.
 *
 * @param {Object} params
 * @param {Object} params.env - Worker env or process.env
 * @param {Object} params.supabase - Supabase client instance
 * @param {Object} params.record - The updated tender record
 * @returns {Promise<Array<Object>>} - Array of delivery log results
 */
async function triggerAwardNotification({ env = {}, supabase, record }) {
  const recordId = record.id || record._id;
  const resendApiKey = env?.RESEND_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.RESEND_API_KEY : undefined);
  const frontendUrl = env?.FRONTEND_URL || (typeof process !== 'undefined' && process.env ? process.env.FRONTEND_URL : 'https://ceb-tms-frontend.skpthiran.workers.dev');

  console.log(`[NotificationTriggers] Triggering award notification for record ${record.tender_number || recordId}`);

  // 1. Check duplicate prevention
  const { data: existingLog } = await supabase
    .from('notification_log')
    .select('id')
    .eq('record_id', recordId)
    .eq('notification_type', 'award')
    .eq('status', 'sent')
    .maybeSingle();

  if (existingLog) {
    console.log(`[NotificationTriggers] Award notification already sent for record ${recordId}, skipping.`);
    return [];
  }

  // 2. Fetch recipients
  const recipients = await getNotificationRecipients(supabase, record);
  const results = [];

  for (const recipient of recipients) {
    if (!recipient || !recipient.email || !recipient.email.trim()) continue;

    const sendResult = await sendAwardNotificationEmail({
      resendApiKey,
      frontendUrl,
      toEmail: recipient.email,
      record
    });

    const status = sendResult.success ? 'sent' : 'failed';
    const errorMessage = sendResult.error || null;

    await supabase.from('notification_log').insert([{
      record_id: recordId,
      notification_type: 'award',
      recipient_email: recipient.email,
      recipient_role: recipient.role,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    }]).then(({ error }) => {
      if (error) console.error('[NotificationTriggers] Failed to insert award log:', error);
    });

    results.push({
      recipientEmail: recipient.email,
      status,
      resendId: sendResult.resendId,
      error: errorMessage
    });
  }

  return results;
}

/**
 * Dispatches TEC Appointment Notifications to admins and appointed committee members.
 *
 * @param {Object} params
 * @param {Object} params.env
 * @param {Object} params.supabase
 * @param {Object} params.record
 * @returns {Promise<Array<Object>>}
 */
async function triggerTecAppointmentNotification({ env = {}, supabase, record }) {
  const recordId = record.id || record._id;
  const resendApiKey = env?.RESEND_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.RESEND_API_KEY : undefined);
  const frontendUrl = env?.FRONTEND_URL || (typeof process !== 'undefined' && process.env ? process.env.FRONTEND_URL : 'https://ceb-tms-frontend.skpthiran.workers.dev');

  console.log(`[NotificationTriggers] Triggering TEC appointment notification for record ${record.tender_number || recordId}`);

  // Check duplicate prevention
  const { data: existingLog } = await supabase
    .from('notification_log')
    .select('id')
    .eq('record_id', recordId)
    .eq('notification_type', 'tec_appointment')
    .eq('status', 'sent')
    .maybeSingle();

  if (existingLog) {
    console.log(`[NotificationTriggers] TEC appointment notification already sent for record ${recordId}, skipping.`);
    return [];
  }

  const recipients = await getTecAppointmentRecipients(supabase, record);
  const results = [];

  for (const recipient of recipients) {
    if (!recipient || !recipient.email || !recipient.email.trim()) continue;

    const sendResult = await sendTecAppointmentNotificationEmail({
      resendApiKey,
      frontendUrl,
      toEmail: recipient.email,
      record
    });

    const status = sendResult.success ? 'sent' : 'failed';
    const errorMessage = sendResult.error || null;

    await supabase.from('notification_log').insert([{
      record_id: recordId,
      notification_type: 'tec_appointment',
      recipient_email: recipient.email,
      recipient_role: recipient.role,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    }]).then(({ error }) => {
      if (error) console.error('[NotificationTriggers] Failed to insert tec_appointment log:', error);
    });

    results.push({
      recipientEmail: recipient.email,
      status,
      resendId: sendResult.resendId,
      error: errorMessage
    });
  }

  return results;
}

/**
 * Dispatches Tender Completion Alerts to active admins with an attached final summary PDF.
 *
 * @param {Object} params
 * @param {Object} params.env
 * @param {Object} params.supabase
 * @param {Object} params.record
 * @returns {Promise<Array<Object>>}
 */
async function triggerCompletionNotification({ env = {}, supabase, record }) {
  const recordId = record.id || record._id;
  const resendApiKey = env?.RESEND_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.RESEND_API_KEY : undefined);
  const frontendUrl = env?.FRONTEND_URL || (typeof process !== 'undefined' && process.env ? process.env.FRONTEND_URL : 'https://ceb-tms-frontend.skpthiran.workers.dev');

  console.log(`[NotificationTriggers] Triggering completion notification for record ${record.tender_number || recordId}`);

  // Check duplicate prevention
  const { data: existingLog } = await supabase
    .from('notification_log')
    .select('id')
    .eq('record_id', recordId)
    .eq('notification_type', 'completion')
    .eq('status', 'sent')
    .maybeSingle();

  if (existingLog) {
    console.log(`[NotificationTriggers] Completion notification already sent for record ${recordId}, skipping.`);
    return [];
  }

  const recipients = await getNotificationRecipients(supabase, record);
  const results = [];

  for (const recipient of recipients) {
    if (!recipient || !recipient.email || !recipient.email.trim()) continue;

    const sendResult = await sendCompletionAlertEmail({
      resendApiKey,
      frontendUrl,
      toEmail: recipient.email,
      record
    });

    const status = sendResult.success ? 'sent' : 'failed';
    const errorMessage = sendResult.error || null;

    await supabase.from('notification_log').insert([{
      record_id: recordId,
      notification_type: 'completion',
      recipient_email: recipient.email,
      recipient_role: recipient.role,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    }]).then(({ error }) => {
      if (error) console.error('[NotificationTriggers] Failed to insert completion log:', error);
    });

    results.push({
      recipientEmail: recipient.email,
      status,
      resendId: sendResult.resendId,
      error: errorMessage
    });
  }

  return results;
}

/**
 * Evaluates record field transitions and executes all matching notification triggers.
 *
 * @param {Object} params
 * @param {Object} params.env
 * @param {Object} params.supabase
 * @param {Object} params.previousRecord
 * @param {Object} params.updatedRecord
 */
async function handleRecordTransitions({ env, supabase, previousRecord, updatedRecord }) {
  if (!updatedRecord) return;

  const prevStatus = (previousRecord?.status || '').trim();
  const newStatus = (updatedRecord.status || '').trim();

  const prevCommittee = (previousRecord?.tec_committee_number || '').trim();
  const newCommittee = (updatedRecord.tec_committee_number || '').trim();

  // 1. Award Notification: Status changed to 'Awarded'
  if (newStatus.toLowerCase() === 'awarded' && prevStatus.toLowerCase() !== 'awarded') {
    await triggerAwardNotification({ env, supabase, record: updatedRecord }).catch(err => {
      console.error('[NotificationTriggers] Error in triggerAwardNotification:', err);
    });
  }

  // 2. TEC Appointment: Committee assigned or changed
  if (newCommittee && (!prevCommittee || prevCommittee !== newCommittee)) {
    await triggerTecAppointmentNotification({ env, supabase, record: updatedRecord }).catch(err => {
      console.error('[NotificationTriggers] Error in triggerTecAppointmentNotification:', err);
    });
  }

  // 3. Tender Completion: Status changed to 'Close', 'Closed', or 'Completed'
  const isCloseStatus = (s) => ['close', 'closed', 'completed'].includes((s || '').toLowerCase());
  if (isCloseStatus(newStatus) && !isCloseStatus(prevStatus)) {
    await triggerCompletionNotification({ env, supabase, record: updatedRecord }).catch(err => {
      console.error('[NotificationTriggers] Error in triggerCompletionNotification:', err);
    });
  }
}

module.exports = {
  triggerAwardNotification,
  triggerTecAppointmentNotification,
  triggerCompletionNotification,
  handleRecordTransitions
};
