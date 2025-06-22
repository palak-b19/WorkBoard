const express = require('express');
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific board by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.status(200).json(board);
  } catch (err) {
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
