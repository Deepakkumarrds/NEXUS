const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationHelper');

// Create a new SOW with deliverables
exports.createSow = async (req, res) => {
  try {
    const { client_id, sow_name, total_value, start_date, end_date, items } = req.body;
    
    // Dummy user for created_by
    let user = await prisma.user.findFirst();

    // Determine the months between start_date and end_date
    let trackingMonths = [];
    if (start_date && end_date) {
      let start = new Date(start_date);
      let end = new Date(end_date);
      
      // Ensure start is before end
      if (start <= end) {
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
          trackingMonths.push(
            current.toLocaleString('en-US', { month: 'long', year: 'numeric' })
          );
          current.setMonth(current.getMonth() + 1);
        }
      }
    }
    
    // If no valid dates, default to a single generic month group or none
    if (trackingMonths.length === 0) {
      trackingMonths.push('Unspecified Month');
    }

    // Clone base items for each tracking month
    const sowItemsData = [];
    if (items && Array.isArray(items)) {
      trackingMonths.forEach(month => {
        items.forEach(item => {
          sowItemsData.push({
            deliverable_name: item.deliverable_name || 'Deliverable',
            status: 'Pending',
            tracking_month: month
          });
        });
      });
    }

    const sow = await prisma.sow.create({
      data: {
        client_id,
        sow_name,
        total_value: total_value ? parseFloat(total_value) : null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        items: {
          create: sowItemsData
        }
      },
      include: {
        items: true
      }
    });

    await createNotification('New Contract (SOW) Drafted', `SOW: ${sow_name} (${sowItemsData.length} Deliverables)`);

    res.status(201).json({ status: 'success', data: sow });
  } catch (error) {
    console.error('Error creating SOW:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create SOW' });
  }
};

// Get all SOWs
exports.getAllSows = async (req, res) => {
  try {
    let sows = await prisma.sow.findMany({
      include: {
        client: { select: { company_name: true } },
        items: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Role-based Financial Privacy
    if (req.query.role === 'Team Member') {
      sows = sows.map(sow => {
        return {
          ...sow,
          total_value: null // Strip out the financial value
        };
      });
    }

    res.status(200).json({ status: 'success', data: sows });
  } catch (error) {
    console.error('Error fetching SOWs:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch SOWs' });
  }
};

// Get SOW by ID
exports.getSowById = async (req, res) => {
  try {
    const { id } = req.params;
    const sow = await prisma.sow.findUnique({
      where: { id },
      include: {
        client: { select: { company_name: true } },
        items: true
      }
    });
    if (!sow) return res.status(404).json({ status: 'error', message: 'SOW not found' });
    
    // Role-based Financial Privacy
    if (req.query.role === 'Team Member') {
      sow.total_value = null;
    }
    
    res.status(200).json({ status: 'success', data: sow });
  } catch (error) {
    console.error('Error fetching SOW:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch SOW' });
  }
};

// Update SOW
exports.updateSow = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_id, sow_name, total_value, start_date, end_date } = req.body;
    
    const sow = await prisma.sow.update({
      where: { id },
      data: {
        client_id,
        sow_name,
        total_value: total_value !== undefined ? parseFloat(total_value) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
      }
    });
    res.status(200).json({ status: 'success', data: sow });
  } catch (error) {
    console.error('Error updating SOW:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update SOW' });
  }
};

// Delete SOW
exports.deleteSow = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.sowItem.deleteMany({ where: { sow_id: id } });
    await prisma.sow.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'SOW deleted successfully' });
  } catch (error) {
    console.error('Error deleting SOW:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete SOW' });
  }
};

// Update SOW Item Status
exports.updateSowItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const item = await prisma.sowItem.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error updating SOW item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update item status' });
  }
};

// Add new SOW Item
exports.addSowItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliverable_name, tracking_month } = req.body;

    const item = await prisma.sowItem.create({
      data: {
        sow_id: id,
        deliverable_name,
        tracking_month: tracking_month || 'Unspecified Month',
        status: 'Pending'
      }
    });

    res.status(201).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error adding SOW item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add item' });
  }
};
