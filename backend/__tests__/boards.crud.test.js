// Load env vars
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

const boardRoutes = require('../routes/boards');
const Board = require('../models/board');
const User = require('../models/User');

let mongoServer;
let app;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test user and JWT
  const user = new User({ email: 'boarduser@example.com', password: 'pw123' });
  await user.save();
  userId = user._id;
  token = jwt.sign({ userId }, process.env.JWT_SECRET);

  app = express();
  app.use(express.json());
  app.use('/api/boards', boardRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Board.deleteMany({});
});

describe('Boards CRUD endpoints', () => {
  it('POST /api/boards creates a board', async () => {
    const res = await request(app)
      .post('/api/boards')
      .send({ title: 'My Board' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My Board');
    const inDb = await Board.findById(res.body._id);
    expect(inDb).toBeTruthy();
  });

  it('GET /api/boards returns user boards', async () => {
    // seed two boards
    await Board.create([
      { userId, title: 'A', lists: [] },
      { userId, title: 'B', lists: [] },
    ]);

    const res = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('title');
  });

  it('GET /api/boards/:id returns a specific board', async () => {
    const board = await Board.create({ userId, title: 'Solo', lists: [] });

    const res = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Solo');
  });

  it('PATCH /api/boards/:id updates lists', async () => {
    const board = await Board.create({ userId, title: 'Patch', lists: [] });
    const newLists = [
      { id: 'todo', title: 'To Do', tasks: [] },
      { id: 'done', title: 'Done', tasks: [] },
    ];

    const res = await request(app)
      .patch(`/api/boards/${board._id}`)
      .send({ lists: newLists })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.lists.length).toBe(2);
  });
});
