const request = require('supertest');
const { setupDatabase, createTestApp, generateTestToken } = require('./setup');

describe('Role Authorization', () => {
  setupDatabase();
  const app = createTestApp();

  describe('GET /api/users (Admin-only endpoint)', () => {
    it('should reject access with 403 when authenticated as a non-Admin role (e.g. Clerk / Commercial User)', async () => {
      const nonAdminToken = generateTestToken({ role: 'Clerk', email: 'clerk@ceb.lk' });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should reject access with 403 when authenticated as Procurement role', async () => {
      const procurementToken = generateTestToken({ role: 'Procurement', email: 'procurement@ceb.lk' });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${procurementToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should allow access with 200 when authenticated as Admin role', async () => {
      const adminToken = generateTestToken({ role: 'Admin', email: 'superadmin@ceb.lk' });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
