const express = require('express');
const sanitizeHtml = require('sanitize-html');
const mongoose = require('mongoose');
const Board = require('../models/board');
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

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Invalid board ID format' });
    }

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!listId || !['todo', 'inprogress', 'done'].includes(listId)) {
      return res.status(400).json({ error: 'Invalid list ID' });
    }

    // Validate title length
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 100) {
      return res
        .status(400)
        .json({ error: 'Task title cannot exceed 100 characters' });
    }

    // Validate description length if provided
    if (description && description.length > 500) {
      return res
        .status(400)
        .json({ error: 'Description cannot exceed 500 characters' });
    }

    // Validate due date if provided
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid due date format' });
      }
      if (dueDateObj <= new Date()) {
        return res
          .status(400)
          .json({ error: 'Due date must be in the future' });
      }
    }

    // Find board and validate ownership
    const board = await Board.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Find the target list
    const list = board.lists.find((l) => l.id === listId);
    if (!list) {
      return res.status(400).json({ error: 'List not found' });
    }

    // Check if list has reached maximum tasks
    if (list.tasks.length >= 100) {
      return res
        .status(400)
        .json({ error: 'Maximum tasks limit reached for this list' });
    }

    // Create new task
    const task = {
      _id: new mongoose.Types.ObjectId(),
      title: sanitizeHtml(trimmedTitle, {
        allowedTags: [],
        allowedAttributes: {},
      }),
      description: description
        ? sanitizeHtml(description, { allowedTags: [], allowedAttributes: {} })
        : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: new Date(),
    };

    // Add task to list
    list.tasks.push(task);

    // Save board with new task
    await board.save();

    // Return updated board
    res.status(201).json(board);
  } catch (err) {
    console.error('POST task error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing task
router.patch('/:id/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { listId, title, description, dueDate } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Invalid board ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(404).json({ error: 'Invalid task ID format' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 100) {
      return res
        .status(400)
        .json({ error: 'Task title cannot exceed 100 characters' });
    }

    if (description && description.length > 500) {
      return res
        .status(400)
        .json({ error: 'Description cannot exceed 500 characters' });
    }

    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid due date format' });
      }
      if (dueDateObj <= new Date()) {
        return res
          .status(400)
          .json({ error: 'Due date must be in the future' });
      }
    }

    if (!listId || !['todo', 'inprogress', 'done'].includes(listId)) {
      return res.status(400).json({ error: 'Invalid list ID' });
    }

    // Find board
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

    const task = list.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update fields
    task.title = sanitizeHtml(trimmedTitle, {
      allowedTags: [],
      allowedAttributes: {},
    });
    task.description = description
      ? sanitizeHtml(description, { allowedTags: [], allowedAttributes: {} })
      : undefined;
    task.dueDate = dueDate ? new Date(dueDate) : undefined;

    await board.save();

    res.status(200).json(board);
  } catch (err) {
    console.error('PATCH task error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
