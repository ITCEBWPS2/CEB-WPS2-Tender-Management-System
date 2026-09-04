const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_automated_testing_12345';
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

const setupDatabase = () => {
  // No-op for Supabase tests (individual test suites manage dynamic record seeding/cleaning)
};

const createTestApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const apiRouter = require('../src/routes');
  const errorHandler = require('../src/middleware/errorHandler');

  app.use('/api', apiRouter);
  app.use(errorHandler);
  return app;
};

const generateTestToken = (payload = {}) => {
  const defaultPayload = {
    id: crypto.randomUUID(),
    email: 'admin@ceb.lk',
    epfNumber: 'EPF0001',
    role: 'Admin',
    ...payload
  };
  return jwt.sign(defaultPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = {
  setupDatabase,
  createTestApp,
  generateTestToken
};
