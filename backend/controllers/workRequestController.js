const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new work request (ticket)
const createWorkRequest = async (req, res) => {
  try {
    const { title, description, department, due_date, client_id } = req.body;
    
    // In a real app, requested_by comes from req.user (auth middleware)
    // For now, we'll extract it from the body or use a dummy
    const requested_by = req.user ? req.user.userId : req.body.requested_by;
    
    if (!requested_by) {
      return res.status(400).json({ status: 'error', message: 'requested_by is required' });
    }

    const workRequest = await prisma.workRequest.create({
      data: {
        title,
        description,
        department,
        due_date: due_date ? new Date(due_date) : null,
        requested_by,
        client_id: client_id || null,
        status: 'Pending Acceptance'
      }
    });

    res.status(201).json({ status: 'success', data: workRequest });
  } catch (error) {
    console.error('Error creating work request:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get all work requests
const getWorkRequests = async (req, res) => {
  try {
    const { department, status, requested_by, assigned_to } = req.query;
    
    let filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (requested_by) filter.requested_by = requested_by;
    if (assigned_to) filter.assigned_to = assigned_to;

    const requests = await prisma.workRequest.findMany({
      where: filter,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, company_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ status: 'success', data: requests });
  } catch (error) {
    console.error('Error fetching work requests:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get single work request
const getWorkRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.workRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, company_name: true } }
      }
    });

    if (!request) return res.status(404).json({ status: 'error', message: 'Work request not found' });

    res.status(200).json({ status: 'success', data: request });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Accept a work request (assignee flow)
const acceptWorkRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimated_hours } = req.body;
    const assigned_to = req.user ? req.user.userId : req.body.assigned_to;

    if (!assigned_to) {
      return res.status(400).json({ status: 'error', message: 'assigned_to is required' });
    }

    if (!estimated_hours) {
      return res.status(400).json({ status: 'error', message: 'estimated_hours is required' });
    }

    const request = await prisma.workRequest.update({
      where: { id },
      data: {
        status: 'Accepted',
        assigned_to,
        estimated_hours: parseFloat(estimated_hours)
      }
    });

    res.status(200).json({ status: 'success', data: request });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Update work request status
const updateWorkRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = { status };
    if (status === 'Completed') {
      data.completed_at = new Date();
    }

    const request = await prisma.workRequest.update({
      where: { id },
      data
    });

    res.status(200).json({ status: 'success', data: request });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Update work request general details
const updateWorkRequest = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, department, due_date, client_id, estimated_hours } = req.body;
  
      const request = await prisma.workRequest.update({
        where: { id },
        data: {
          title,
          description,
          department,
          due_date: due_date ? new Date(due_date) : undefined,
          client_id,
          estimated_hours: estimated_hours ? parseFloat(estimated_hours) : undefined
        }
      });
  
      res.status(200).json({ status: 'success', data: request });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };

// Delete a work request
const deleteWorkRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workRequest.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Work request deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createWorkRequest,
  getWorkRequests,
  getWorkRequestById,
  acceptWorkRequest,
  updateWorkRequestStatus,
  updateWorkRequest,
  deleteWorkRequest
};
