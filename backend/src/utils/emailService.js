const { generateTenderPdf, formatDate } = require('./pdfGenerator');

/**
 * Helper to execute Resend email send via HTTP fetch.
 */
async function callResendApi({ resendApiKey, toEmail, subject, html, attachments = [] }) {
  if (!resendApiKey) {
    return {
      success: false,
      resendId: null,
      error: 'RESEND_API_KEY is not configured'
    };
  }

  const payload = {
    from: 'CEB Tender Management <onboarding@resend.dev>',
    to: [toEmail],
    subject,
    html
  };

  if (Array.isArray(attachments) && attachments.length > 0) {
    payload.attachments = attachments;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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

/**
 * Reusable HTML template wrapper with CEB branding.
 */
function renderCebEmailLayout({ title, badgeText, badgeBgColor, leadText, detailsRows, recordLink, ctaText = 'View Tender Details' }) {
  const tableRowsHtml = detailsRows.map(([label, val, bold]) => `
    <tr>
      <td style="padding: 7px 0; color: #64748b; font-weight: 600; width: 140px; vertical-align: top;">${label}:</td>
      <td style="padding: 7px 0; color: #0f172a; font-weight: ${bold ? '700' : '500'};">${val || '-'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #fbbf24;">CEB Tender Management System</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Ceylon Electricity Board — Transmission & Generation</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 24px;">
          
          <!-- Badge -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: ${badgeBgColor}; color: #ffffff; padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              ${badgeText}
            </span>
          </div>

          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; color: #334155;">
            ${leadText}
          </p>

          <!-- Details Card -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 28px; border-left: 4px solid ${badgeBgColor};">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              ${tableRowsHtml}
            </table>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${recordLink}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${ctaText} &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
            Or navigate to the tender record directly:<br>
            <a href="${recordLink}" style="color: #2563eb;">${recordLink}</a>
          </p>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Ceylon Electricity Board — Automated Notification Service
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * 1. Pre-deadline reminder email (existing, kept intact).
 */
async function sendDeadlineReminderEmail({ resendApiKey, frontendUrl, toEmail, record, daysRemaining }) {
  const tenderNumber = record.tenderNumber || record.tender_number || 'N/A';
  const description = record.description || 'No description provided';
  const category = record.category || 'General';
  const closingDateStr = formatDate(record.bidClosingDate || record.bid_closing_date);
  const baseUrl = (frontendUrl || 'https://ceb-tms-frontend.skpthiran.workers.dev').replace(/\/$/, '');
  const recordLink = `${baseUrl}/admin/records/${record.id || record._id}`;

  const subject = `Tender Deadline Reminder: ${daysRemaining} day(s) remaining - ${tenderNumber}`;
  const badgeBgColor = daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 5 ? '#ea580c' : '#d97706';

  const html = renderCebEmailLayout({
    title: subject,
    badgeText: `⚠️ ${daysRemaining} DAY${daysRemaining === 1 ? '' : 'S'} REMAINING`,
    badgeBgColor,
    leadText: `This is an automated deadline reminder for tender <strong>${tenderNumber}</strong>. The bid closing date is approaching.`,
    detailsRows: [
      ['Tender Number', tenderNumber, true],
      ['Category', category, false],
      ['Bid Closing Date', closingDateStr, true],
      ['Description', description, false]
    ],
    recordLink
  });

  return callResendApi({ resendApiKey, toEmail, subject, html });
}

/**
 * 2. Award Notification email with PDF attachment.
 */
async function sendAwardNotificationEmail({ resendApiKey, frontendUrl, toEmail, record }) {
  const tenderNumber = record.tenderNumber || record.tender_number || 'N/A';
  const category = record.category || 'General';
  const awardedTo = record.awardedTo || record.awarded_to || 'Not Specified';
  const agreementStart = formatDate(record.serviceAgreementStartDate || record.service_agreement_start_date);
  const agreementEnd = formatDate(record.serviceAgreementEndDate || record.service_agreement_end_date);
  const baseUrl = (frontendUrl || 'https://ceb-tms-frontend.skpthiran.workers.dev').replace(/\/$/, '');
  const recordLink = `${baseUrl}/admin/records/${record.id || record._id}`;

  const subject = `Tender Award Notification: ${tenderNumber} - Awarded to ${awardedTo}`;

  // Generate PDF attachment
  let attachments = [];
  try {
    const pdfBuffer = await generateTenderPdf(record, 'Award');
    attachments = [{
      filename: `CEB_Award_Report_${tenderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      content: pdfBuffer.toString('base64')
    }];
  } catch (pdfErr) {
    console.warn('Warning generating award PDF report:', pdfErr);
  }

  const html = renderCebEmailLayout({
    title: subject,
    badgeText: '✓ TENDER AWARDED',
    badgeBgColor: '#16a34a',
    leadText: `Tender <strong>${tenderNumber}</strong> has been officially awarded. Attached to this email is the complete official Tender Award Summary report (PDF).`,
    detailsRows: [
      ['Tender Number', tenderNumber, true],
      ['Category', category, false],
      ['Awarded Supplier', awardedTo, true],
      ['Agreement Start Date', agreementStart, false],
      ['Agreement End Date', agreementEnd, false],
      ['Description', record.description || '-', false]
    ],
    recordLink,
    ctaText: 'View Awarded Tender'
  });

  return callResendApi({ resendApiKey, toEmail, subject, html, attachments });
}

/**
 * 3. TEC Appointment Notification email.
 */
async function sendTecAppointmentNotificationEmail({ resendApiKey, frontendUrl, toEmail, record }) {
  const tenderNumber = record.tenderNumber || record.tender_number || 'N/A';
  const category = record.category || 'General';
  const committeeNumber = record.tecCommitteeNumber || record.tec_committee_number || 'N/A';
  const chairman = record.tecChairman || record.tec_chairman || 'Not Assigned';
  const member1 = record.tecMember1 || record.tec_member1 || 'Not Assigned';
  const member2 = record.tecMember2 || record.tec_member2 || 'Not Assigned';
  const closingDateStr = formatDate(record.bidClosingDate || record.bid_closing_date);
  const baseUrl = (frontendUrl || 'https://ceb-tms-frontend.skpthiran.workers.dev').replace(/\/$/, '');
  const recordLink = `${baseUrl}/admin/records/${record.id || record._id}`;

  const subject = `TEC Appointment: Committee ${committeeNumber} Assigned - ${tenderNumber}`;

  const html = renderCebEmailLayout({
    title: subject,
    badgeText: '👥 TEC COMMITTEE APPOINTED',
    badgeBgColor: '#7c3aed',
    leadText: `Technical Evaluation Committee (TEC) <strong>${committeeNumber}</strong> has been appointed for tender <strong>${tenderNumber}</strong>.`,
    detailsRows: [
      ['Tender Number', tenderNumber, true],
      ['Committee Number', committeeNumber, true],
      ['TEC Chairman', chairman, true],
      ['TEC Member 1', member1, false],
      ['TEC Member 2', member2, false],
      ['Bid Closing Date', closingDateStr, false],
      ['Category', category, false]
    ],
    recordLink,
    ctaText: 'View TEC Assignment'
  });

  return callResendApi({ resendApiKey, toEmail, subject, html });
}

/**
 * 4. Tender Completion Alert email with PDF attachment.
 */
async function sendCompletionAlertEmail({ resendApiKey, frontendUrl, toEmail, record }) {
  const tenderNumber = record.tenderNumber || record.tender_number || 'N/A';
  const category = record.category || 'General';
  const awardedTo = record.awardedTo || record.awarded_to || 'N/A';
  const baseUrl = (frontendUrl || 'https://ceb-tms-frontend.skpthiran.workers.dev').replace(/\/$/, '');
  const recordLink = `${baseUrl}/admin/records/${record.id || record._id}`;

  const subject = `Tender Completed & Closed: ${tenderNumber}`;

  // Generate PDF attachment
  let attachments = [];
  try {
    const pdfBuffer = await generateTenderPdf(record, 'Completion');
    attachments = [{
      filename: `CEB_Completion_Report_${tenderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      content: pdfBuffer.toString('base64')
    }];
  } catch (pdfErr) {
    console.warn('Warning generating completion PDF report:', pdfErr);
  }

  const html = renderCebEmailLayout({
    title: subject,
    badgeText: '🔒 TENDER PROCESS COMPLETED',
    badgeBgColor: '#2563eb',
    leadText: `The complete procurement and agreement process for tender <strong>${tenderNumber}</strong> has been officially closed and completed. Attached is the final PDF completion report.`,
    detailsRows: [
      ['Tender Number', tenderNumber, true],
      ['Category', category, false],
      ['Awarded Supplier', awardedTo, false],
      ['Status', 'Close / Completed', true],
      ['Performance Bond No', record.performanceBondNumber || record.performance_bond_number || 'N/A', false],
      ['Description', record.description || '-', false]
    ],
    recordLink,
    ctaText: 'View Closed Tender'
  });

  return callResendApi({ resendApiKey, toEmail, subject, html, attachments });
}

/**
 * 5. Overdue Delay Reminder email.
 */
async function sendDelayReminderEmail({ resendApiKey, frontendUrl, toEmail, record, daysOverdue }) {
  const tenderNumber = record.tenderNumber || record.tender_number || 'N/A';
  const category = record.category || 'General';
  const closingDateStr = formatDate(record.bidClosingDate || record.bid_closing_date);
  const baseUrl = (frontendUrl || 'https://ceb-tms-frontend.skpthiran.workers.dev').replace(/\/$/, '');
  const recordLink = `${baseUrl}/admin/records/${record.id || record._id}`;

  const subject = `OVERDUE Tender Reminder: ${daysOverdue} day(s) overdue - ${tenderNumber}`;
  const badgeBgColor = daysOverdue >= 10 ? '#991b1b' : daysOverdue >= 5 ? '#dc2626' : '#ea580c';

  const html = renderCebEmailLayout({
    title: subject,
    badgeText: `🚨 ${daysOverdue} DAYS OVERDUE`,
    badgeBgColor,
    leadText: `Attention required: Tender <strong>${tenderNumber}</strong> has exceeded its expected bid closing date by <strong>${daysOverdue} days</strong> and remains pending evaluation/closure.`,
    detailsRows: [
      ['Tender Number', tenderNumber, true],
      ['Category', category, false],
      ['Current Status', record.status || 'Under Evaluation', true],
      ['Bid Closing Date', closingDateStr, true],
      ['Days Past Deadline', `${daysOverdue} day(s)`, true],
      ['TEC Committee', record.tec_committee_number || record.tecCommitteeNumber || 'Not Assigned', false]
    ],
    recordLink,
    ctaText: 'Review Overdue Tender'
  });

  return callResendApi({ resendApiKey, toEmail, subject, html });
}

module.exports = {
  sendDeadlineReminderEmail,
  sendAwardNotificationEmail,
  sendTecAppointmentNotificationEmail,
  sendCompletionAlertEmail,
  sendDelayReminderEmail
};
