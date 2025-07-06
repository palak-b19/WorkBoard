// Load test environment variables (ensure JWT_SECRET available)
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
let userToken;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create a dummy user and JWT
  const user = new User({ email: 'owner@example.com', password: 'secret123' });
  await user.save();
  userId = user._id;
  userToken = jwt.sign({ userId }, process.env.JWT_SECRET);

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

describe('DELETE /api/boards/:id', () => {
  it('should delete a board owned by the user', async () => {
    // Create board belonging to user
    const board = new Board({
      userId,
      title: 'My Board',
      lists: [
        { id: 'todo', title: 'To Do', tasks: [] },
        { id: 'inprogress', title: 'In Progress', tasks: [] },
        { id: 'done', title: 'Done', tasks: [] },
      ],
    });
    await board.save();

    const res = await request(app)
      .delete(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Board deleted');

    const inDb = await Board.findById(board._id);
    expect(inDb).toBeNull();
  });

  it('should return 404 when board does not belong to user', async () => {
    // Create another user & board
    const otherUser = new User({ email: 'other@example.com', password: 'abc' });
    await otherUser.save();

    const board = new Board({
      userId: otherUser._id,
      title: 'Foreign Board',
      lists: [
        { id: 'todo', title: 'To Do', tasks: [] },
        { id: 'inprogress', title: 'In Progress', tasks: [] },
        { id: 'done', title: 'Done', tasks: [] },
      ],
    });
    await board.save();

    const res = await request(app)
      .delete(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Board not found');
    const stillExists = await Board.findById(board._id);
    expect(stillExists).not.toBeNull();
  });

  it('should return 404 for invalid board id', async () => {
    const res = await request(app)
      .delete('/api/boards/invalidid')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Invalid board ID');
  });
});
