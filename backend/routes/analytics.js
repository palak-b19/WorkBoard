const express = require('express');
const mongoose = require('mongoose');
const Board = require('../models/board');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/analytics
 *
 * Returns aggregated task statistics for the authenticated user:
 * {
 *   totalTasks: number,
 *   completedTasks: number,
 *   overdueTasks: number
 * }
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Fetch all boards for the current user using lean() for performance
    const boards = await Board.find({ userId: req.user.userId }).lean();

    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;

    const now = new Date();

    boards.forEach((board) => {
      (board.lists || []).forEach((list) => {
        const tasks = Array.isArray(list.tasks) ? list.tasks : [];
        totalTasks += tasks.length;

        if (list.id === 'done') {
          completedTasks += tasks.length;
        } else {
          // Only non-completed tasks can be overdue
          overdueTasks += tasks.filter(
            (task) => task.dueDate && new Date(task.dueDate) < now
          ).length;
        }
      });
    });

    res.status(200).json({ totalTasks, completedTasks, overdueTasks });
  } catch (err) {
    console.error('GET analytics error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
