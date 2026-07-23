const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup HTTP server and Socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io globally available for controllers
global.io = io;

io.on('connection', (socket) => {
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
  });
});

const clientRoutes = require('./routes/clientRoutes');
const taskRoutes = require('./routes/taskRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const sowRoutes = require('./routes/sowRoutes');
const reportRoutes = require('./routes/reportRoutes');
const escalationRoutes = require('./routes/escalationRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const chatRoutes = require('./routes/chatRoutes');
const trackerRoutes = require('./routes/trackerRoutes');
const attendanceTrackerRoutes = require('./routes/attendanceTrackerRoutes');
const logRoutes = require('./routes/logRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const workRequestRoutes = require('./routes/workRequestRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const socialRoutes = require('./routes/socialRoutes');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'RDS Dashboard API is running!' });
});

// Root route
app.get('/', (req, res) => {
  res.send('RDS Dashboard Backend is running. Please access the frontend application.');
});

const assetRoutes = require('./routes/assetRoutes');
const path = require('path');

// Mount Routes
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/sows', sowRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/attendance', attendanceTrackerRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/work-requests', workRequestRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/social', socialRoutes);

const healthRoutes = require('./routes/healthRoutes');
app.use('/api/client-health', healthRoutes);

const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// TEMPORARY ROUTE TO FIX ROLES
app.get('/api/setup-roles', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.role.upsert({
      where: { role_name: 'Team Member' },
      update: {},
      create: { role_name: 'Team Member', description: 'General access for team members' }
    });
    res.send('Team Member role has been successfully added to your database! You can now close this tab and refresh your dashboard.');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // Initialize cron jobs
  const cronService = require('./services/cronService');
  cronService.startCronJobs();
  
  // Initialize WhatsApp Bot (Non-blocking)
  setImmediate(() => {
    try {
      require('./services/whatsappService');
    } catch (e) {
      console.warn('WhatsApp service init skipped:', e.message);
    }
  });
});
