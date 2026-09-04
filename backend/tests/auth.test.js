const request = require('supertest');
const bcrypt = require('bcryptjs');
const { setupDatabase, createTestApp } = require('./setup');
const supabase = require('../src/config/supabase');

describe('Auth Endpoints', () => {
  setupDatabase();
  const app = createTestApp();

  const validUser = {
    name: 'Test Engineer',
    email: 'engineer@ceb.lk',
    epfNumber: '12345',
    password: 'SecurePassword123!',
    role: 'Admin'
  };

  beforeEach(async () => {
    await supabase.from('users').delete().eq('email', validUser.email);
    await supabase.from('users').delete().eq('epf_number', validUser.epfNumber);
  });

  afterAll(async () => {
    await supabase.from('users').delete().eq('email', validUser.email);
    await supabase.from('users').delete().eq('epf_number', validUser.epfNumber);
  });

  describe('POST /api/auth/register (Removed)', () => {
    it('should return 404 as public register endpoint is removed for security', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hash = bcrypt.hashSync(validUser.password, 10);
      await supabase.from('users').insert([{
        name: validUser.name,
        email: validUser.email,
        epf_number: validUser.epfNumber,
        password: hash,
        role: validUser.role,
        status: 'Active'
      }]);
    });

    it('should login successfully with valid credentials and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('should fail with 401 when logging in with a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'IncorrectPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/invalid/i);
    });
  });
});
