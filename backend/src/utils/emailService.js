/**
 * Sends a tender deadline reminder email via Resend API.
 *
 * @param {Object} params
 * @param {string} params.resendApiKey - The Resend API key
 * @param {string} params.frontendUrl - Base URL for the frontend application
 * @param {string} params.toEmail - Recipient email address
 * @param {Object} params.record - Tender record object
 * @param {number} params.daysRemaining - Number of days remaining until bid closing
 * @returns {Promise<{success: boolean, resendId: string|null, error: string|null}>}
 */
async function sendDeadlineReminderEmail({ resendApiKey, frontendUrl, toEmail, record, daysRemaining }) {
  if (!resendApiKey) {
    return {
      success: false,
      resendId: null,
      error: 'RESEND_API_KEY is not configured'
    };
  }

  const tenderNumber = record.tenderNumber || record.tender_number || 'N/A';
  const description = record.description || 'No description provided';
  const category = record.category || 'General';
  const rawClosingDate = record.bidClosingDate || record.bid_closing_date;
  const closingDateStr = rawClosingDate ? new Date(rawClosingDate).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Not Set';

  const baseUrl = (frontendUrl || 'https://ceb-tms-frontend.skpthiran.workers.dev').replace(/\/$/, '');
  const recordLink = `${baseUrl}/admin/records/${record.id}`;

  const subject = `Tender Deadline Reminder: ${daysRemaining} day(s) remaining - ${tenderNumber}`;

  const badgeBgColor = daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 5 ? '#ea580c' : '#d97706';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background-color: #b45309; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">CEB Tender Management System</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Ceylon Electricity Board</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 24px;">
          
          <!-- Urgency Badge -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: ${badgeBgColor}; color: #ffffff; padding: 8px 18px; border-radius: 9999px; font-size: 14px; font-weight: 700;">
              ⚠️ ${daysRemaining} DAY${daysRemaining === 1 ? '' : 'S'} REMAINING
            </span>
          </div>

          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            This is an automated deadline reminder for tender <strong>${tenderNumber}</strong>. The bid closing date is approaching.
          </p>

          <!-- Details Card -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 28px; border-left: 4px solid #b45309;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Tender Number:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${tenderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Category:</td>
                <td style="padding: 6px 0; color: #0f172a;">${category}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Bid Closing Date:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${closingDateStr}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600; vertical-align: top;">Description:</td>
                <td style="padding: 6px 0; color: #0f172a; vertical-align: top;">${description}</td>
              </tr>
            </table>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${recordLink}" target="_blank" style="display: inline-block; background-color: #b45309; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              View Tender Details &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
            Or copy and paste this link into your browser:<br>
            <a href="${recordLink}" style="color: #0284c7;">${recordLink}</a>
          </p>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Ceylon Electricity Board — Automated Notification System
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'CEB Tender Management <onboarding@resend.dev>',
        to: [toEmail],
        subject,
        html: htmlBody
      })
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = responseData.message || responseData.name || `Resend API returned ${res.status}`;
      console.error(`Failed to send email to ${toEmail}:`, responseData);
      return {
        success: false,
        resendId: null,
        error: errMsg
      };
    }

    return {
      success: true,
      resendId: responseData.id || null,
      error: null
    };
  } catch (err) {
    console.error(`Network error sending email to ${toEmail}:`, err);
    return {
      success: false,
      resendId: null,
      error: err.message || 'Network error while calling Resend API'
    };
  }
}

module.exports = {
  sendDeadlineReminderEmail
};
