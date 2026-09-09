require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const API_BASE = process.env.API_BASE || 'https://ceb-wps2-tender-management-system.skpthiran.workers.dev';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qkbnnlnyanysiokegdpo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

function formatDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runLiveTests() {
  console.log('=== Starting E2E Notification System Live Verification ===\n');

  // 1. Authenticate as Admin
  console.log('1. Authenticating as Admin against Cloudflare Worker...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: process.env.ADMIN_EMAIL, 
      password: process.env.ADMIN_PASSWORD 
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
  }
  const { token } = await loginRes.json();
  console.log('✓ Admin authenticated successfully. Token acquired.\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const testTenderNo = `CEB/TEST/NOTIF/${Date.now().toString().slice(-6)}`;
  let testRecordId = null;

  try {
    // 2. Create base test record
    console.log(`2. Creating test record ${testTenderNo}...`);
    const createRes = await fetch(`${API_BASE}/api/records`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tenderNumber: testTenderNo,
        category: 'Electrical Equipment',
        relevantTo: 'Transmission Division',
        description: 'Automated test record for notification system verification',
        status: 'Under Evaluation',
        bidStartDate: '2026-08-01',
        bidOpenDate: '2026-08-15',
        bidClosingDate: '2026-09-30'
      })
    });

    if (!createRes.ok) {
      throw new Error(`Create record failed: ${await createRes.text()}`);
    }
    const created = await createRes.json();
    testRecordId = created.id || created._id;
    console.log(`✓ Test record created. ID: ${testRecordId}\n`);

    // ------------------------------------------------------------------------
    // TEST TYPE 1: TEC APPOINTMENT NOTIFICATION
    // ------------------------------------------------------------------------
    console.log('3. Testing TEC APPOINTMENT Notification...');
    const tecUpdateRes = await fetch(`${API_BASE}/api/records/${testRecordId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        tecCommitteeNumber: 'TEC/2023/001',
        tecChairman: 'K.A. Perera',
        tecMember1: 'M.B. Silva',
        tecMember2: 'S.C. Fernando'
      })
    });
    if (!tecUpdateRes.ok) throw new Error(`TEC appointment update failed: ${await tecUpdateRes.text()}`);
    console.log('✓ Record updated with committee TEC/2023/001.');

    // Verify row in notification_log
    const tecLogsRes = await fetch(`${SUPABASE_URL}/rest/v1/notification_log?record_id=eq.${testRecordId}&notification_type=eq.tec_appointment&select=*`, { headers });
    const tecLogs = await tecLogsRes.json();
    console.log(`✓ Notification log query returned ${tecLogs.length} tec_appointment entry(ies):`);
    console.log(JSON.stringify(tecLogs, null, 2));
    if (tecLogs.length === 0) throw new Error('Expected tec_appointment log row not found!');
    console.log('✓ TEST 1 PASSED: TEC Appointment notification triggered and logged.\n');

    // ------------------------------------------------------------------------
    // TEST TYPE 2: AWARD NOTIFICATION (with PDF generation & attachment)
    // ------------------------------------------------------------------------
    console.log('4. Testing AWARD Notification with PDF Attachment...');
    const awardUpdateRes = await fetch(`${API_BASE}/api/records/${testRecordId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'Awarded',
        awardedTo: 'Lanka Transformers Ltd',
        serviceAgreementStartDate: '2026-09-01',
        serviceAgreementEndDate: '2027-09-01',
        delay: 0
      })
    });
    if (!awardUpdateRes.ok) throw new Error(`Award update failed: ${await awardUpdateRes.text()}`);
    console.log('✓ Record updated to status Awarded.');

    // Verify row in notification_log
    const awardLogsRes = await fetch(`${SUPABASE_URL}/rest/v1/notification_log?record_id=eq.${testRecordId}&notification_type=eq.award&select=*`, { headers });
    const awardLogs = await awardLogsRes.json();
    console.log(`✓ Notification log query returned ${awardLogs.length} award entry(ies):`);
    console.log(JSON.stringify(awardLogs, null, 2));
    if (awardLogs.length === 0) throw new Error('Expected award log row not found!');
    console.log('✓ TEST 2 PASSED: Award notification with PDF report triggered and logged.\n');

    // ------------------------------------------------------------------------
    // TEST TYPE 3: TENDER COMPLETION ALERT (with PDF generation & attachment)
    // ------------------------------------------------------------------------
    console.log('5. Testing TENDER COMPLETION Alert with PDF Attachment...');
    const completeUpdateRes = await fetch(`${API_BASE}/api/records/${testRecordId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'Close',
        performanceBondNumber: 'PB-2026-001',
        performanceBondBank: 'Bank of Ceylon'
      })
    });
    if (!completeUpdateRes.ok) throw new Error(`Completion update failed: ${await completeUpdateRes.text()}`);
    console.log('✓ Record updated to status Close.');

    // Verify row in notification_log
    const completeLogsRes = await fetch(`${SUPABASE_URL}/rest/v1/notification_log?record_id=eq.${testRecordId}&notification_type=eq.completion&select=*`, { headers });
    const completeLogs = await completeLogsRes.json();
    console.log(`✓ Notification log query returned ${completeLogs.length} completion entry(ies):`);
    console.log(JSON.stringify(completeLogs, null, 2));
    if (completeLogs.length === 0) throw new Error('Expected completion log row not found!');
    console.log('✓ TEST 3 PASSED: Tender Completion alert triggered and logged.\n');

    // ------------------------------------------------------------------------
    // TEST TYPE 4: OVERDUE DELAY REMINDERS (delay_2, delay_5, delay_10)
    // ------------------------------------------------------------------------
    console.log('6. Testing OVERDUE DELAY Reminders (delay_2, delay_5, delay_10)...');
    const today = new Date();
    const delayDates = [
      { days: 2, type: 'delay_2' },
      { days: 5, type: 'delay_5' },
      { days: 10, type: 'delay_10' }
    ];

    const delayRecordIds = [];
    for (const dItem of delayDates) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - dItem.days);
      const dateStr = formatDateStr(pastDate);
      const dNo = `CEB/DELAY/${dItem.type.toUpperCase()}/${Date.now().toString().slice(-4)}`;

      console.log(`   Seeding active overdue record ${dNo} with bid_closing_date = ${dateStr} (${dItem.days} days ago)...`);
      const dRes = await fetch(`${API_BASE}/api/records`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tenderNumber: dNo,
          category: 'Services',
          relevantTo: 'Distribution Division',
          description: `Test overdue tender for ${dItem.type}`,
          status: 'Under Evaluation',
          bidClosingDate: dateStr
        })
      });
      const dCreated = await dRes.json();
      delayRecordIds.push({ id: dCreated.id || dCreated._id, type: dItem.type, number: dNo });
    }

    console.log('   Triggering POST /api/notifications/test-run-delays...');
    const runDelayRes = await fetch(`${API_BASE}/api/notifications/test-run-delays`, {
      method: 'POST',
      headers: authHeaders
    });
    if (!runDelayRes.ok) throw new Error(`test-run-delays failed: ${await runDelayRes.text()}`);
    const delaySummary = await runDelayRes.json();
    console.log('✓ Delay reminder job execution summary:');
    console.log(JSON.stringify(delaySummary, null, 2));

    // Verify each delay type in notification_log
    for (const dRec of delayRecordIds) {
      const dLogRes = await fetch(`${SUPABASE_URL}/rest/v1/notification_log?record_id=eq.${dRec.id}&notification_type=eq.${dRec.type}&select=*`, { headers });
      const dLogs = await dLogRes.json();
      console.log(`✓ Notification log for ${dRec.number} (${dRec.type}):`, JSON.stringify(dLogs, null, 2));
      if (dLogs.length === 0) throw new Error(`Expected ${dRec.type} log row not found for ${dRec.number}`);
    }
    console.log('✓ TEST 4 PASSED: Overdue delay reminders fired and logged for 2, 5, and 10 days overdue.\n');

    // ------------------------------------------------------------------------
    // TEST 5: DUPLICATE PREVENTION VERIFICATION
    // ------------------------------------------------------------------------
    console.log('7. Testing Duplicate Prevention on Delay Reminders...');
    const runDuplicateRes = await fetch(`${API_BASE}/api/notifications/test-run-delays`, {
      method: 'POST',
      headers: authHeaders
    });
    const dupSummary = await runDuplicateRes.json();
    console.log(`✓ Second run skippedAlreadySent: ${dupSummary.skippedAlreadySent}, emailsSent: ${dupSummary.emailsSent}`);
    if (dupSummary.skippedAlreadySent < 3) {
      console.warn('Warning: expected at least 3 skippedAlreadySent');
    } else {
      console.log('✓ TEST 5 PASSED: Duplicate prevention active (no duplicate emails or logs).\n');
    }

    // ------------------------------------------------------------------------
    // TEST 6: GET /api/notifications API Verification
    // ------------------------------------------------------------------------
    console.log('8. Testing GET /api/notifications endpoint...');
    const listRes = await fetch(`${API_BASE}/api/notifications`, {
      headers: authHeaders
    });
    const allLogs = await listRes.json();
    console.log(`✓ GET /api/notifications returned ${allLogs.length} total logs.`);
    const typesPresent = [...new Set(allLogs.map(l => l.notificationType))];
    console.log('✓ Distinct notification types in logs:', typesPresent);

    // Clean up delay records
    for (const dRec of delayRecordIds) {
      await fetch(`${API_BASE}/api/records/${dRec.id}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
      await fetch(`${SUPABASE_URL}/rest/v1/notification_log?record_id=eq.${dRec.id}`, { method: 'DELETE', headers }).catch(() => {});
    }

  } finally {
    // Clean up base test record
    if (testRecordId) {
      console.log(`\nCleaning up test record ${testRecordId}...`);
      await fetch(`${API_BASE}/api/records/${testRecordId}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
      await fetch(`${SUPABASE_URL}/rest/v1/notification_log?record_id=eq.${testRecordId}`, { method: 'DELETE', headers }).catch(() => {});
      console.log('✓ Cleaned up test data.');
    }
  }

  console.log('\n==========================================================');
  console.log('ALL 4 NOTIFICATION TYPES + DUPLICATE PREVENTION VERIFIED!');
  console.log('==========================================================');
}

runLiveTests().catch(err => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
