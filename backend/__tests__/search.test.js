// Load env
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

const boardRoutes = require('../routes/boards');
const Board = require('../models/board');
const User = require('../models/User');

let app;
let mongoServer;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const user = new User({ email: 'searcher@example.com', password: 'abc' });
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

describe('GET /api/boards/:id/tasks?query', () => {
  it('returns tasks matching query', async () => {
    const board = new Board({
      userId,
      title: 'Search Board',
      lists: [
        {
          id: 'todo',
          title: 'To Do',
          tasks: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Urgent fix',
              createdAt: new Date(),
            },
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Refactor code',
              createdAt: new Date(),
            },
          ],
        },
        {
          id: 'done',
          title: 'Done',
          tasks: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Review urgent PR',
              createdAt: new Date(),
            },
          ],
        },
      ],
    });
    await board.save();

    const res = await request(app)
      .get(`/api/boards/${board._id}/tasks?query=urgent`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Expect only tasks containing 'urgent'
    const combinedTasks = res.body.flatMap((l) => l.tasks);
    expect(combinedTasks.length).toBe(2);
    expect(
      combinedTasks.every((t) => t.title.toLowerCase().includes('urgent'))
    ).toBe(true);
  });
});
