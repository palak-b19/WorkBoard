// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

const boardRoutes = require('../routes/boards');
const analyticsRoutes = require('../routes/analytics');
const Board = require('../models/board');
const User = require('../models/User');

let mongoServer;
let app;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const user = new User({ email: 'tasker@example.com', password: 'abc' });
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

describe('Task endpoints', () => {
  const createBoard = async () => {
    const board = new Board({
      userId,
      title: 'Test Board',
      lists: [
        { id: 'todo', title: 'To Do', tasks: [] },
        { id: 'inprogress', title: 'In Progress', tasks: [] },
        { id: 'done', title: 'Done', tasks: [] },
      ],
    });
    await board.save();
    return board;
  };

  it('creates a task successfully', async () => {
    const board = await createBoard();

    const res = await request(app)
      .post(`/api/boards/${board._id}/tasks`)
      .send({ listId: 'todo', title: 'New Task' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.lists[0].tasks.length).toBe(1);
  });

  it('rejects task creation with missing title', async () => {
    const board = await createBoard();

    const res = await request(app)
      .post(`/api/boards/${board._id}/tasks`)
      .send({ listId: 'todo', title: '' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Task title is required');
  });

  it('updates a task title', async () => {
    const board = await createBoard();

    // First create task
    const createRes = await request(app)
      .post(`/api/boards/${board._id}/tasks`)
      .send({ listId: 'todo', title: 'Old Title' })
      .set('Authorization', `Bearer ${token}`);

    const taskId = createRes.body.lists[0].tasks[0]._id;

    const res = await request(app)
      .patch(`/api/boards/${board._id}/tasks/${taskId}`)
      .send({ listId: 'todo', title: 'Updated Title' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const updatedTask = res.body.lists[0].tasks.find((t) => t._id === taskId);
    expect(updatedTask.title).toBe('Updated Title');
  });

  it('deletes a task', async () => {
    const board = await createBoard();

    const createRes = await request(app)
      .post(`/api/boards/${board._id}/tasks`)
      .send({ listId: 'todo', title: 'Delete Me' })
      .set('Authorization', `Bearer ${token}`);

    const taskId = createRes.body.lists[0].tasks[0]._id;

    const delRes = await request(app)
      .delete(`/api/boards/${board._id}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.lists[0].tasks.length).toBe(0);
  });
});
