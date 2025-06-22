const express = require('express');
const sanitizeHtml = require('sanitize-html');
const Board = require('../models/Board');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Create a new board
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Board title is required' });
    }
    const board = new Board({
      userId: req.user.userId,
      title,
      lists: [
        { id: 'todo', title: 'To Do', tasks: [] },
        { id: 'inprogress', title: 'In Progress', tasks: [] },
        { id: 'done', title: 'Done', tasks: [] },
      ],
    });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    console.error('POST board error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all boards for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const boards = await Board.find({ userId: req.user.userId }).select(
      'title createdAt'
    );
    res.status(200).json(boards);
  } catch (err) {
    console.error('GET boards error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific board by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const board = await Board.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.status(200).json(board);
  } catch (err) {
    console.error('GET board error:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a board's lists
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { lists } = req.body;
    if (!lists || !Array.isArray(lists)) {
      return res.status(400).json({ error: 'Invalid lists data' });
    }
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const board = await Board.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    board.lists = lists;
    await board.save();
    res.status(200).json(board);
  } catch (err) {
    console.error('PATCH board error:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a task in a specific list
router.post('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const { listId, title, description, dueDate } = req.body;
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: 'Board not found' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (!listId || !['todo', 'inprogress', 'done'].includes(listId)) {
      return res.status(400).json({ error: 'Invalid list ID' });
    }
    const board = await Board.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const list = board.lists.find((l) => l.id === listId);
    if (!list) {
      return res.status(400).json({ error: 'List not found' });
    }
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      title: sanitizeHtml(title, { allowedTags: [], allowedAttributes: {} }),
      description: description
        ? sanitizeHtml(description, { allowedTags: [], allowedAttributes: {} })
        : undefined,
      dueDate: dueDate
        ? new Date(dueDate).toISOString().split('T')[0]
        : undefined,
    };
    list.tasks.push(task);
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    console.error('POST task error:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
