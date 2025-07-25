const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const analyticsRoutes = require('./routes/analytics');
const rateLimit = require('./middleware/rateLimit');
require('dotenv').config();

console.log('Starting server...');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://task-mvp-backend.herokuapp.com',
  'https://task-mvp.netlify.app',
];
app.use(cors({ origin: allowedOrigins }));
app.use(rateLimit);
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
