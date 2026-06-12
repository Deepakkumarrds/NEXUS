const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const clientRoutes = require('./routes/clientRoutes');
const taskRoutes = require('./routes/taskRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const sowRoutes = require('./routes/sowRoutes');
const reportRoutes = require('./routes/reportRoutes');
const escalationRoutes = require('./routes/escalationRoutes');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'RDS Dashboard API is running!' });
});

// Mount Routes
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/sows', sowRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/escalations', escalationRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
