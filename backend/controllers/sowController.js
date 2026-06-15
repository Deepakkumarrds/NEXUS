const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationHelper');

// Create a new SOW with deliverables
exports.createSow = async (req, res) => {
  try {
    const { client_id, sow_name, total_value, start_date, end_date, items } = req.body;
    
    // Dummy user for created_by
    let user = await prisma.user.findFirst();

    const sow = await prisma.sow.create({
      data: {
        client_id,
        sow_name,
        total_value: total_value ? parseFloat(total_value) : null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        items: {
          create: items && Array.isArray(items) ? items.map(item => ({
            deliverable_name: item.deliverable_name || 'Deliverable',
            status: 'Pending'
          })) : []
        }
      },
      include: {
        items: true
      }
    });

    await createNotification('New Contract (SOW) Drafted', `SOW: ${sow_name} (${items?.length || 0} Deliverables)`);

    res.status(201).json({ status: 'success', data: sow });
  } catch (error) {
    console.error('Error creating SOW:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create SOW' });
  }
};

// Get all SOWs
exports.getAllSows = async (req, res) => {
  try {
    const sows = await prisma.sow.findMany({
      include: {
        client: { select: { company_name: true } },
        items: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: sows });
  } catch (error) {
    console.error('Error fetching SOWs:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch SOWs' });
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
