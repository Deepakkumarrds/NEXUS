const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new SOW with deliverables
exports.createSow = async (req, res) => {
  try {
    const { client_id, title, value, start_date, end_date, sow_items } = req.body;
    
    // Dummy user for created_by
    let user = await prisma.user.findFirst();

    const sow = await prisma.sow.create({
      data: {
        client_id,
        title,
        value: parseFloat(value),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        created_by: user.id,
        sow_items: {
          create: sow_items && Array.isArray(sow_items) ? sow_items.map(item => ({
            item_name: item.item_name,
            description: item.description,
            status: 'Pending'
          })) : []
        }
      },
      include: {
        sow_items: true
      }
    });

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
        creator: { select: { name: true } },
        sow_items: true
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
