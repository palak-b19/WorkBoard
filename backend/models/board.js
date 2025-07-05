const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: mongoose.Types.ObjectId,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: [1, 'Task title cannot be empty'],
    maxLength: [100, 'Task title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters'],
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function (v) {
        return !v || v > new Date();
      },
      message: 'Due date must be in the future',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const listSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    enum: ['todo', 'inprogress', 'done'],
  },
  title: {
    type: String,
    required: true,
  },
  tasks: {
    type: [taskSchema],
    validate: {
      validator: function (tasks) {
        return tasks.length <= 100; // Maximum 100 tasks per list
      },
      message: 'Maximum tasks limit (100) reached for this list',
    },
  },
});

const boardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: [100, 'Board title cannot exceed 100 characters'],
    },
    lists: [listSchema],
  },
  { timestamps: true }
);

// Enable text search on task titles and descriptions
boardSchema.index(
  {
    'lists.tasks.title': 'text',
    'lists.tasks.description': 'text',
  },
  {
    name: 'TaskTextIndex',
    default_language: 'english',
  }
);

module.exports = mongoose.model('Board', boardSchema);
