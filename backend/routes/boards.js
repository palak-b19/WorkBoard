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

// Delete an existing task
router.delete('/:id/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { id, taskId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Invalid board ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(404).json({ error: 'Invalid task ID format' });
    }

    // Find board and verify ownership
    const board = await Board.findOne({ _id: id, userId: req.user.userId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Locate the list containing the task and the task itself
    const listContainingTask = board.lists.find((l) => l.tasks.id(taskId));
    if (!listContainingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Locate the task sub-document
    const taskDoc = listContainingTask.tasks.id(taskId);
    if (!taskDoc) {
      return res.status(404).json({ error: 'Task not found' });
    }

    /*
     * In some Mongoose versions deeply-nested sub-documents (i.e. an array of
     * sub-documents inside another sub-document) do not inherit the `.remove()`
     * helper. Attempting to call it can therefore throw
     * `TypeError: taskDoc.remove is not a function`.
     *
     * Instead of calling `taskDoc.remove()` we safely remove the task using the
     * parent array's `.pull()` helper, which works regardless of sub-document
     * prototype inheritance.
     */

    // Remove the task from the list
    listContainingTask.tasks.pull({ _id: taskId });

    // Ensure Mongoose detects the change to the nested array
    board.markModified('lists');

    await board.save();

    res.status(200).json(board);
  } catch (err) {
    console.error('DELETE task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a board
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Invalid board ID' });
    }

    console.log('Attempting delete', id, 'for user', req.user.userId);

    // Attempt to delete the board owned by the authenticated user
    const result = await Board.deleteOne({ _id: id, userId: req.user.userId });
    console.log('deletedCount =', result.deletedCount);

    const boardInDb = await Board.findById(id);
    console.log(
      'still in DB?',
      !!boardInDb,
      'board.userId =',
      boardInDb?.userId
    );

    if (result.deletedCount === 0) {
      // Either board does not exist or does not belong to user
      return res.status(404).json({ error: 'Board not found' });
    }

    return res.status(200).json({ message: 'Board deleted' });
  } catch (err) {
    console.error('DELETE board error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Search tasks within a board by title or description (case-insensitive)
router.get('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { query } = req.query; // search term

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Invalid board ID' });
    }

    // Find board owned by user
    const board = await Board.findOne({ _id: id, userId: req.user.userId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // If no query provided, return full lists
    if (!query || query.trim() === '') {
      return res.status(200).json(board.lists);
    }

    const term = query.toLowerCase();
    const filteredLists = board.lists.map((list) => {
      const filteredTasks = list.tasks.filter((task) => {
        const tTitle = task.title.toLowerCase();
        const tDesc = task.description ? task.description.toLowerCase() : '';
        return tTitle.includes(term) || tDesc.includes(term);
      });
      return { ...list.toObject(), tasks: filteredTasks };
    });

    return res.status(200).json(filteredLists);
  } catch (err) {
    console.error('GET board tasks search error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
