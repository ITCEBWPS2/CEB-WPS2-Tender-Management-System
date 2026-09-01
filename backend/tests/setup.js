process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_automated_testing_12345';
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

let mongoServer;

const setupDatabase = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
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
    id: new mongoose.Types.ObjectId().toString(),
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
