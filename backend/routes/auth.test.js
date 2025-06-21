// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('./auth');
const User = require('../models/User');

let mongoServer;
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeTruthy();
  });

  it('should reject duplicate email', async () => {
    await new User({
      email: 'test@example.com',
      password: 'password123',
    }).save();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already exists');
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
  });
});

describe('POST /api/auth/login', () => {
  it('should login a user with valid credentials', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
    });
    await user.save();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject invalid credentials', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
    });
    await user.save();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
  });
});

describe('GET /api/auth/validate', () => {
  it('should validate a valid token', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    const res = await request(app)
      .get('/api/auth/validate')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('userId', user._id.toString());
  });

  it('should reject missing token', async () => {
    const res = await request(app).get('/api/auth/validate');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/validate')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });
});
