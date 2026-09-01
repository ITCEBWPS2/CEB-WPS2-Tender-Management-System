const request = require('supertest');
const { setupDatabase, createTestApp } = require('./setup');
const supabase = require('../src/config/supabase');

describe('Auth Endpoints', () => {
  setupDatabase();
  const app = createTestApp();

  const validUser = {
    name: 'Test Engineer',
    email: 'engineer@ceb.lk',
    epfNumber: 'EPF12345',
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

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(validUser.name);
      expect(res.body.email).toBe(validUser.email);
      expect(res.body.epfNumber).toBe(validUser.epfNumber);
      expect(res.body.role).toBe(validUser.role);
    });

    it('should return 400 when missing required fields (e.g. missing epfNumber & email)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Incomplete User',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser);
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
