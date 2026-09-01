const http = require('http');
const fs = require('fs');
const path = require('path');

function request(method, pathUrl, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5010,
      path: pathUrl,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(rawBody.toString());
        } catch {
          parsed = rawBody;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function buildMultipartFormData(boundary, files) {
  const buffers = [];
  files.forEach(({ fieldname, filename, mimeType, content }) => {
    let header = `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\n`;
    header += `Content-Type: ${mimeType}\r\n\r\n`;
    buffers.push(Buffer.from(header, 'utf8'));
    buffers.push(Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'));
    buffers.push(Buffer.from('\r\n', 'utf8'));
  });
  buffers.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
  return Buffer.concat(buffers);
}

async function runE2E() {
  console.log('=====================================================');
  console.log('  STARTING DOCUMENT UPLOAD & PERMISSION E2E TEST     ');
  console.log('=====================================================');

  // 1. Setup / Register Clerk & Admin accounts
  console.log('\n1. Registering/Ensuring demo accounts...');
  
  const clerkEmail = `clerk_${Date.now()}@ceb.lk`;
  const adminEmail = `admin_${Date.now()}@gmail.com`;

  const clerkUser = {
    name: 'Clerk Demo User',
    email: clerkEmail,
    epfNumber: `EPF${Date.now().toString().slice(-4)}1`,
    password: 'Clerk@123',
    role: 'Clerk'
  };

  const adminUser = {
    name: 'System Admin',
    email: adminEmail,
    epfNumber: `EPF${Date.now().toString().slice(-4)}2`,
    password: 'Admin@123',
    role: 'Admin'
  };

  const clerkReg = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, clerkUser);
  console.log('Clerk Register Status:', clerkReg.status);

  const adminReg = await request('POST', '/api/auth/register', { 'Content-Type': 'application/json' }, adminUser);
  console.log('Admin Register Status:', adminReg.status);

  // 2. Login as Clerk
  console.log('\n2. Logging in as Clerk...');
  const clerkLogin = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, {
    email: clerkUser.email,
    password: clerkUser.password
  });
  console.log('Clerk Login Status:', clerkLogin.status, '| Role in token payload:', clerkLogin.body?.user?.role);
  const clerkToken = clerkLogin.body?.token;

  // 3. Login as Admin
  console.log('\n3. Logging in as Admin...');
  const adminLogin = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, {
    email: adminUser.email,
    password: adminUser.password
  });
  console.log('Admin Login Status:', adminLogin.status, '| Role in token payload:', adminLogin.body?.user?.role);
  const adminToken = adminLogin.body?.token;

  // 4. Create a Tender Record
  console.log('\n4. Creating a Tender Record...');
  const recordRes = await request('POST', '/api/records', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  }, {
    tenderNumber: `CEB/WPS2/2026/DOC-E2E-${Date.now().toString().slice(-4)}`,
    category: 'Goods',
    relevantTo: 'Commercial Division',
    description: 'Procurement of Distribution Switchgear',
    status: 'In Progress'
  });
  console.log('Record Create Status:', recordRes.status, '| Record ID:', recordRes.body?._id || recordRes.body?.id);
  const recordId = recordRes.body?._id || recordRes.body?.id;

  // 5. As Clerk, upload a PDF and an Image file
  console.log('\n5. As Clerk, uploading a PDF and an Image file...');
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Tender Proposal Scan) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  const imgBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xFF, 0xD9]); // Valid JPEG SOI/EOI

  const multipartBody = buildMultipartFormData(boundary, [
    { fieldname: 'files', filename: 'proposal_scan.pdf', mimeType: 'application/pdf', content: pdfBuffer },
    { fieldname: 'files', filename: 'site_survey_photo.jpg', mimeType: 'image/jpeg', content: imgBuffer }
  ]);

  const uploadRes = await request('POST', `/api/records/${recordId}/documents`, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': multipartBody.length,
    'Authorization': `Bearer ${clerkToken}`
  }, multipartBody);

  console.log('Clerk Upload Status:', uploadRes.status);
  console.log('Uploaded Documents in Response:', uploadRes.body?.documents?.map(d => ({
    name: d.originalName,
    mime: d.mimeType,
    size: d.size,
    by: d.uploadedByName
  })));

  const uploadedDocs = uploadRes.body?.documents || [];
  const pdfDoc = uploadedDocs.find(d => d.originalName === 'proposal_scan.pdf');
  const imgDoc = uploadedDocs.find(d => d.originalName === 'site_survey_photo.jpg');

  // 6. As Clerk, list documents
  console.log('\n6. As Clerk, listing documents for record...');
  const listRes = await request('GET', `/api/records/${recordId}/documents`, {
    'Authorization': `Bearer ${clerkToken}`
  });
  console.log('List Status:', listRes.status, '| Total count:', listRes.body?.length);

  // 7. As Clerk, download document
  console.log('\n7. As Clerk, downloading uploaded PDF document...');
  const downloadRes = await request('GET', `/api/records/${recordId}/documents/${pdfDoc._id}/download`, {
    'Authorization': `Bearer ${clerkToken}`
  });
  console.log('Download Status:', downloadRes.status);
  console.log('Content-Disposition Header:', downloadRes.headers['content-disposition']);
  console.log('Content-Type Header:', downloadRes.headers['content-type']);
  console.log('Downloaded Byte Length:', Buffer.isBuffer(downloadRes.body) ? downloadRes.body.length : 'N/A');

  // 8. As Clerk, attempt to delete document (MUST FAIL with 403 Forbidden)
  console.log('\n8. As Clerk, attempting to delete document (Expect 403 Forbidden)...');
  const clerkDeleteRes = await request('DELETE', `/api/records/${recordId}/documents/${imgDoc._id}`, {
    'Authorization': `Bearer ${clerkToken}`
  });
  console.log('Clerk Delete Status (Expected 403):', clerkDeleteRes.status);
  console.log('Clerk Delete Response Message:', clerkDeleteRes.body?.message);

  // 9. As Admin, delete document (MUST SUCCEED with 200 OK)
  console.log('\n9. As Admin, deleting document (Expect 200 OK)...');
  const adminDeleteRes = await request('DELETE', `/api/records/${recordId}/documents/${imgDoc._id}`, {
    'Authorization': `Bearer ${adminToken}`
  });
  console.log('Admin Delete Status (Expected 200):', adminDeleteRes.status);
  console.log('Remaining Documents Count:', adminDeleteRes.body?.documents?.length);

  // 10. Check Audit Log
  console.log('\n10. Checking Audit Log for document actions...');
  const auditRes = await request('GET', '/api/audits', {
    'Authorization': `Bearer ${adminToken}`
  });
  const docUploadLogs = Array.isArray(auditRes.body) ? auditRes.body.filter(l => l.type === 'document_upload' || l.type === 'document_delete') : [];
  console.log('Audit Log Count for Documents:', docUploadLogs.length);
  docUploadLogs.forEach(l => {
    console.log(`  [${l.type}] user: ${l.user} -> ${l.message}`);
  });

  console.log('\n=====================================================');
  console.log('  E2E TEST COMPLETED SUCCESSFULLY                    ');
  console.log('=====================================================');
}

runE2E().catch(console.error);
