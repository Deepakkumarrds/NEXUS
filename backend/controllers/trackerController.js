const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get the tracker data matrix for a specific department and date range
exports.getTrackerData = async (req, res) => {
  try {
    const { department, startDate, endDate } = req.query;

    if (!department || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters: department, startDate, endDate' });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set to start of day and end of day respectively
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    // Fetch all active clients to form the rows of our grid
    const clients = await prisma.client.findMany({
      where: { client_status: 'Active' },
      select: {
        id: true,
        company_name: true,
        brand_name: true
      },
      orderBy: { company_name: 'asc' }
    });

    const trackerWhere = {
      date: {
        gte: start,
        lte: end
      }
    };
    if (department !== 'All Departments' && department !== 'All') {
      trackerWhere.department = department;
    }

    // Fetch all trackers within the date range
    const trackers = await prisma.dailyTracker.findMany({
      where: trackerWhere
    });

    // Group trackers by client_id and date for easy frontend rendering
    // Expected structure:
    // { client_id: { "YYYY-MM-DD": { summary_text, status_color, id } } }
    
    const taskWhere = {
      due_date: {
        gte: start,
        lte: end
      }
    };
    if (department !== 'All Departments' && department !== 'All') {
      taskWhere.department = department;
    }
    
    // Fetch all tasks within the date range
    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        client_id: true,
        title: true,
        status: true,
        due_date: true
      }
    });

    const trackerMap = {};
    clients.forEach(client => {
      trackerMap[client.id] = {};
    });

    trackers.forEach(t => {
      if (!trackerMap[t.client_id]) trackerMap[t.client_id] = {};
      const dateKey = t.date.toISOString().split('T')[0];
      
      if (!trackerMap[t.client_id][dateKey]) {
        trackerMap[t.client_id][dateKey] = {
          id: t.id,
          summary_text: '',
          status_color: null,
          tasks: []
        };
      }
      
      const cell = trackerMap[t.client_id][dateKey];
      if (t.summary_text) {
        const prefix = department === 'All Departments' ? `[${t.department}]\n` : '';
        cell.summary_text += (cell.summary_text ? '\n\n' : '') + prefix + t.summary_text;
      }
      
      // Keep the most severe status color: Red > Yellow > Green
      if (t.status_color) {
        if (!cell.status_color) {
          cell.status_color = t.status_color;
        } else if (t.status_color === 'Red') {
          cell.status_color = 'Red';
        } else if (t.status_color === 'Yellow' && cell.status_color !== 'Red') {
          cell.status_color = 'Yellow';
        }
      }
    });

    // Add tasks to the respective cells
    tasks.forEach(task => {
      if (!task.due_date) return;
      if (!trackerMap[task.client_id]) return; // if client isn't active or tracked
      const dateKey = task.due_date.toISOString().split('T')[0];
      if (!trackerMap[task.client_id][dateKey]) {
        trackerMap[task.client_id][dateKey] = {
          summary_text: null,
          status_color: null,
          tasks: []
        };
      }
      if (!trackerMap[task.client_id][dateKey].tasks) {
        trackerMap[task.client_id][dateKey].tasks = [];
      }
      trackerMap[task.client_id][dateKey].tasks.push(task);
    });

    res.json({
      success: true,
      clients,
      trackerMap
    });
  } catch (error) {
    console.error('Error fetching tracker data:', error);
    res.status(500).json({ error: 'Server error fetching tracker data' });
  }
};

// Update or create a tracker cell
exports.updateTrackerCell = async (req, res) => {
  try {
    const { client_id, department, date, summary_text, status_color } = req.body;

    if (!client_id || !department || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure the date is stored as midnight UTC
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const tracker = await prisma.dailyTracker.upsert({
      where: {
        client_id_department_date: {
          client_id,
          department,
          date: targetDate
        }
      },
      update: {
        summary_text,
        status_color
      },
      create: {
        client_id,
        department,
        date: targetDate,
        summary_text,
        status_color
      }
    });

    res.json({
      success: true,
      tracker
    });
  } catch (error) {
    console.error('Error updating tracker cell:', error);
    res.status(500).json({ error: 'Server error updating tracker cell' });
  }
};
