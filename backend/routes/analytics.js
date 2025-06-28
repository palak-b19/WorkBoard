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
    const now = new Date();

    // Use MongoDB aggregation for efficiency on large data sets
    const [result] = await Board.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
      { $unwind: '$lists' },
      {
        $unwind: {
          path: '$lists.tasks',
          preserveNullAndEmptyArrays: true, // handle empty task arrays
        },
      },
      {
        $group: {
          _id: null,
          totalTasks: {
            $sum: {
              $cond: [{ $gt: ['$lists.tasks', null] }, 1, 0],
            },
          },
          completedTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$lists.id', 'done'] },
                    { $gt: ['$lists.tasks', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$lists.id', 'done'] },
                    { $gt: ['$lists.tasks.dueDate', null] },
                    { $lt: ['$lists.tasks.dueDate', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalTasks: 1,
          completedTasks: 1,
          overdueTasks: 1,
        },
      },
    ]);

    // If user has no boards/tasks, aggregation returns undefined
    if (!result) {
      return res
        .status(200)
        .json({ totalTasks: 0, completedTasks: 0, overdueTasks: 0 });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('GET analytics error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
