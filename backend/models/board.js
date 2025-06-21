const mongoose = require('mongoose');

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
    },
    lists: [
      {
        id: String,
        title: String,
        tasks: [
          {
            id: String,
            title: String,
            description: String,
            dueDate: Date,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
