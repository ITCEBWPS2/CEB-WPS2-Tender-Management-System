const request = require('supertest');
const { setupDatabase, createTestApp, generateTestToken } = require('./setup');
const supabase = require('../src/config/supabase');

describe('Categories Endpoints', () => {
  setupDatabase();
  const app = createTestApp();
  const adminToken = generateTestToken({ role: 'Admin' });

  const newCategory = {
    name: 'High Voltage Cables',
    description: 'Underground and aerial transmission cables',
    status: 'Active'
  };

  beforeEach(async () => {
    await supabase.from('categories').delete().eq('name', newCategory.name);
  });

  afterAll(async () => {
    await supabase.from('categories').delete().eq('name', newCategory.name);
  });

  describe('POST /api/categories', () => {
    it('should create a category successfully when authenticated with valid data', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(newCategory.name);
      expect(res.body.description).toBe(newCategory.description);
    });

    it('should return 400 when missing the required name field', async () => {
      const invalidCategory = {
        description: 'Category missing its mandatory name',
        status: 'Active'
      };

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidCategory);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/name/i);
    });
  });
});
