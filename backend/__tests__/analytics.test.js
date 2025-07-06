require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

const analyticsRoutes = require('../routes/analytics');
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

  const user = new User({ email: 'analytics@example.com', password: 'abc' });
  await user.save();
  userId = user._id;
  token = jwt.sign({ userId }, process.env.JWT_SECRET);

  app = express();
  app.use(express.json());
  app.use('/api/boards', boardRoutes);
  app.use('/api/analytics', analyticsRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Board.deleteMany({});
});

describe('GET /api/analytics', () => {
  it('should return 0 counts when user has no boards', async () => {
    const res = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
    });
  });

  it('should calculate totals, completed, and overdue tasks correctly', async () => {
    // Build a board with various tasks
    const now = new Date();

    const board = new Board({
      userId,
      title: 'Analytics Board',
      lists: [
        {
          id: 'todo',
          title: 'To Do',
          tasks: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Task 1',
              createdAt: now,
            },
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Task 2',
              createdAt: now,
            },
          ],
        },
        {
          id: 'inprogress',
          title: 'In Progress',
          tasks: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Task 3',
              createdAt: now,
            },
          ],
        },
        {
          id: 'done',
          title: 'Done',
          tasks: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Task 4',
              createdAt: now,
            }, // completed
          ],
        },
      ],
    });
    await board.save();

    const res = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBe(4);
    expect(res.body.completedTasks).toBe(1);
    expect(res.body.overdueTasks).toBe(0);
  });
});
