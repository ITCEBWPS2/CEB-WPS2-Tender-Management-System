const request = require('supertest');
const { setupDatabase, createTestApp, generateTestToken } = require('./setup');
const supabase = require('../src/config/supabase');

describe('Records Endpoints', () => {
  setupDatabase();
  const app = createTestApp();
  const adminToken = generateTestToken({ role: 'Admin', email: 'admin@ceb.lk' });

  const validRecord = {
    tenderNumber: 'CEB/WPS2/2026/TEST-001',
    relevantTo: 'Distribution Division',
    category: 'Electrical Equipment',
    description: 'Procurement of Distribution Transformers',
    status: 'In Progress'
  };

  beforeEach(async () => {
    await supabase.from('records').delete().eq('tender_number', validRecord.tenderNumber);
  });

  afterAll(async () => {
    await supabase.from('records').delete().eq('tender_number', validRecord.tenderNumber);
  });

  describe('POST /api/records', () => {
    it('should create a record successfully when authenticated as Admin (happy path)', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRecord);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.tenderNumber).toBe(validRecord.tenderNumber);
      expect(res.body.category).toBe(validRecord.category);
    });

    it('should return 400 when missing required tenderNumber field', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Record without tender number',
          category: 'Hardware'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/tenderNumber/i);
    });

    it('should return 401 when attempting to create a record without a valid auth token', async () => {
      const res = await request(app)
        .post('/api/records')
        .send(validRecord);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/records', () => {
    it('should fetch the list of records after creating one and include the created record', async () => {
      // Create a record first
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRecord);

      // Fetch the records list
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const found = res.body.find(r => r.tenderNumber === validRecord.tenderNumber);
      expect(found).toBeDefined();
      expect(found.tenderNumber).toBe(validRecord.tenderNumber);
    });
  });
});
