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

// NEW: Update a board's lists (PATCH endpoint)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { lists } = req.body;

    // Validate that lists is provided and is an array
    if (!lists || !Array.isArray(lists)) {
      return res.status(400).json({ error: 'Invalid lists data' });
    }

    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Find the board and ensure it belongs to the authenticated user
    const board = await Board.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Update the board's lists
    board.lists = lists;
    await board.save();

    // Return the updated board
    res.status(200).json(board);
  } catch (err) {
    console.error('PATCH board error:', err);
    // Check if it's a MongoDB CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
