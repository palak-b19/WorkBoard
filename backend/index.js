const express = require('express');
const cors = require('cors'); // Add this line
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const analyticsRoutes = require('./routes/analytics');
require('dotenv').config();

console.log('Starting server...');

const app = express();
app.use(cors()); // Add this line
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
