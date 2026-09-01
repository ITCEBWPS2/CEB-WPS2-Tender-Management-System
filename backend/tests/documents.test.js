const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { setupDatabase, createTestApp, generateTestToken } = require('./setup');
const Record = require('../src/models/Record');
const AuditLog = require('../src/models/AuditLog');

describe('Record Documents Management', () => {
  setupDatabase();
  const app = createTestApp();

  const clerkToken = generateTestToken({ role: 'Clerk', email: 'clerk@ceb-tms.local', name: 'Clerk User' });
  const adminToken = generateTestToken({ role: 'Admin', email: 'abc@gmail.com', name: 'Admin User' });
  const procurementToken = generateTestToken({ role: 'Procurement', email: 'procurement@ceb.lk', name: 'Procurement Officer' });

  let testRecord;
  const testUploadDir = path.join(__dirname, '../uploads/records');

  beforeEach(async () => {
    testRecord = await Record.create({
      tenderNumber: `CEB/WPS2/2026/DOC-${Date.now()}`,
      category: 'Equipment',
      description: 'Document upload test record',
      status: 'In Progress'
    });
  });

  afterAll(() => {
    // Clean up test uploads directory if created
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  describe('POST /api/records/:id/documents (Upload)', () => {
    it('should allow a Clerk to upload valid PDF and image documents', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test dummy pdf content');
      const imgBuffer = Buffer.from('\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR dummy png content');

      const res = await request(app)
        .post(`/api/records/${testRecord._id}/documents`)
        .set('Authorization', `Bearer ${clerkToken}`)
        .attach('files', pdfBuffer, 'proposal_scanned.pdf')
        .attach('files', imgBuffer, 'site_inspection.png');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('documents');
      expect(res.body.documents.length).toBe(2);

      const pdfDoc = res.body.documents.find(d => d.originalName === 'proposal_scanned.pdf');
      expect(pdfDoc).toBeDefined();
      expect(pdfDoc.mimeType).toBe('application/pdf');
      expect(pdfDoc.uploadedByName).toBe('Clerk User');

      // Verify AuditLog was recorded
      const log = await AuditLog.findOne({ type: 'document_upload', user: 'clerk@ceb-tms.local' });
      expect(log).toBeDefined();
      expect(log.message).toContain('Uploaded 2 document(s)');
    });

    it('should reject upload with 400 when file type is not allowed (e.g. .txt or .exe)', async () => {
      const invalidBuffer = Buffer.from('console.log("disallowed script");');

      const res = await request(app)
        .post(`/api/records/${testRecord._id}/documents`)
        .set('Authorization', `Bearer ${clerkToken}`)
        .attach('files', invalidBuffer, 'malicious_script.exe');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/invalid file type/i);
    });

    it('should reject unauthenticated upload requests with 401', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 dummy content');

      const res = await request(app)
        .post(`/api/records/${testRecord._id}/documents`)
        .attach('files', pdfBuffer, 'unauthorized_file.pdf');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/records/:id/documents (List)', () => {
    it('should list all uploaded documents for a record', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test document');

      await request(app)
        .post(`/api/records/${testRecord._id}/documents`)
        .set('Authorization', `Bearer ${clerkToken}`)
        .attach('files', pdfBuffer, 'meeting_minutes.pdf');

      const res = await request(app)
        .get(`/api/records/${testRecord._id}/documents`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].originalName).toBe('meeting_minutes.pdf');
    });
  });

  describe('GET /api/records/:id/documents/:docId/download (Download)', () => {
    it('should stream the file back for download when authenticated', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 stream download content');

      const uploadRes = await request(app)
        .post(`/api/records/${testRecord._id}/documents`)
        .set('Authorization', `Bearer ${clerkToken}`)
        .attach('files', pdfBuffer, 'specifications.pdf');

      const docId = uploadRes.body.documents[0]._id;

      const res = await request(app)
        .get(`/api/records/${testRecord._id}/documents/${docId}/download`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('specifications.pdf');
      expect(res.body.toString()).toContain('%PDF-1.4 stream download content');
    });
  });

  describe('DELETE /api/records/:id/documents/:docId (Delete authorization)', () => {
    let docId;

    beforeEach(async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test document for deletion');
      const uploadRes = await request(app)
        .post(`/api/records/${testRecord._id}/documents`)
        .set('Authorization', `Bearer ${clerkToken}`)
        .attach('files', pdfBuffer, 'doc_to_delete.pdf');

      docId = uploadRes.body.documents[0]._id;
    });

    it('should reject document deletion by Clerk with 403 (no hard delete permission)', async () => {
      const res = await request(app)
        .delete(`/api/records/${testRecord._id}/documents/${docId}`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should allow document deletion by Admin role with 200', async () => {
      const res = await request(app)
        .delete(`/api/records/${testRecord._id}/documents/${docId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Verify doc removed from Record model
      const updatedRecord = await Record.findById(testRecord._id);
      expect(updatedRecord.documents.length).toBe(0);

      // Verify AuditLog entry
      const log = await AuditLog.findOne({ type: 'document_delete', user: 'abc@gmail.com' });
      expect(log).toBeDefined();
    });

    it('should allow document deletion by Procurement role with 200', async () => {
      const res = await request(app)
        .delete(`/api/records/${testRecord._id}/documents/${docId}`)
        .set('Authorization', `Bearer ${procurementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });
  });
});
