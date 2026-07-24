const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationHelper');

// Create a new SOW with deliverables
exports.createSow = async (req, res) => {
  try {
    const { client_id, client_ids, sow_name, total_value, start_date, end_date, months } = req.body;
    const targetClientIds = client_ids && client_ids.length > 0 ? client_ids : [client_id];

    if (!targetClientIds || targetClientIds.length === 0 || !targetClientIds[0]) {
      return res.status(400).json({ status: 'error', message: 'Client ID is required' });
    }

    const createdSows = [];

    for (const cid of targetClientIds) {
      const sow = await prisma.sow.create({
        data: {
          client_id: cid,
          sow_name,
          total_value: total_value ? parseFloat(total_value) : null,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null
        }
      });

      if (months && months.length > 0) {
        for (const month of months) {
          const createdMonth = await prisma.sowMonth.create({
            data: {
              sow_id: sow.id,
              month_year: month.month_year,
              value: month.value ? parseFloat(month.value) : 0,
              approval_status: month.approval_status || 'Pending Approval'
            }
          });

          if (month.items && month.items.length > 0) {
            await prisma.sowItem.createMany({
              data: month.items.map(item => ({
                sow_id: sow.id,
                sow_month_id: createdMonth.id,
                deliverable_name: item.deliverable_name || 'Deliverable',
                committed_qty: item.committed_qty ? parseInt(item.committed_qty) : 1,
                status: 'Pending',
                tracking_month: month.month_year
              }))
            });
          }
        }
      }

      const createdSow = await prisma.sow.findUnique({
        where: { id: sow.id },
        include: {
          months: { include: { items: true } },
          items: true
        }
      });
      createdSows.push(createdSow);
    }

    let totalItems = 0;
    if (months) {
      months.forEach(m => totalItems += (m.items || []).length);
    }
    await createNotification('New Contract (SOW) Drafted', `SOW: ${sow_name} for ${targetClientIds.length} Brand(s) (${totalItems} Deliverables)`);

    res.status(201).json({ status: 'success', data: createdSows.length === 1 ? createdSows[0] : createdSows });
  } catch (error) {
    console.error('Error creating SOW:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create SOW' });
  }
};

// Get all SOWs
exports.getAllSows = async (req, res) => {
  try {
    const { approval_status } = req.query;
    
    let queryOptions = {
      include: {
        client: { select: { company_name: true } },
        months: {
          include: { items: { include: { tasks: true } } }
        },
        items: { include: { tasks: true } }
      },
      orderBy: { created_at: 'desc' }
    };

    if (approval_status) {
      queryOptions.where = {
        months: {
          some: {
            approval_status: approval_status
          }
        }
      };
      
      // Also filter the nested months
      queryOptions.include.months.where = {
        approval_status: approval_status
      };
    }

    let sows = await prisma.sow.findMany(queryOptions);

    // Strict Financial Privacy: Strip values ONLY for non-admin Team Members
    const requesterRole = req.query.role || '';
    const requesterEmail = (req.query.email || '').toLowerCase();
    const isRestrictedUser = requesterRole === 'Team Member' && !requesterEmail.includes('utkarsh') && !requesterEmail.includes('gowtham');

    if (isRestrictedUser) {
      sows = sows.map(sow => {
        return {
          ...sow,
          total_value: null,
          months: (sow.months || []).map(m => ({ ...m, value: 0 }))
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
        months: {
          include: { items: { include: { tasks: true } } }
        },
        items: { include: { tasks: true } }
      }
    });
    if (!sow) return res.status(404).json({ status: 'error', message: 'SOW not found' });
    
    // Strict Financial Privacy: Strip values ONLY for non-admin Team Members
    const requesterRole = req.query.role || '';
    const requesterEmail = (req.query.email || '').toLowerCase();
    const isRestrictedUser = requesterRole === 'Team Member' && !requesterEmail.includes('utkarsh') && !requesterEmail.includes('gowtham');

    if (isRestrictedUser) {
      sow.total_value = null;
      if (sow.months) {
        sow.months = sow.months.map(m => ({ ...m, value: 0 }));
      }
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
    const { client_id, sow_name, total_value, start_date, end_date, months } = req.body;
    
    // Simplest way to handle nested updates: delete old months/items and recreate
    if (months && Array.isArray(months)) {
      await prisma.sowItem.deleteMany({ where: { sow_id: id } });
      await prisma.sowMonth.deleteMany({ where: { sow_id: id } });
    }

    const sow = await prisma.sow.update({
      where: { id },
      data: {
        client_id,
        sow_name,
        total_value: total_value !== undefined ? parseFloat(total_value) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined
      }
    });

    if (months && Array.isArray(months)) {
      for (const month of months) {
        const createdMonth = await prisma.sowMonth.create({
          data: {
            sow_id: id,
            month_year: month.month_year,
            value: month.value ? parseFloat(month.value) : 0,
          }
        });

        if (month.items && month.items.length > 0) {
          await prisma.sowItem.createMany({
            data: month.items.map(item => ({
              sow_id: id,
              sow_month_id: createdMonth.id,
              deliverable_name: item.deliverable_name || 'Deliverable',
              status: 'Pending',
              tracking_month: month.month_year
            }))
          });
        }
      }
    }
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
    const { status, remarks } = req.body;

    const data = {};
    if (status !== undefined) data.status = status;
    if (remarks !== undefined) data.remarks = remarks;

    const item = await prisma.sowItem.update({
      where: { id },
      data
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

// Submit SOW Month for Approval
exports.submitSowMonthForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const month = await prisma.sowMonth.update({
      where: { id },
      data: {
        approval_status: 'Pending Approval',
        submitted_by: user_id
      }
    });

    const sow = await prisma.sow.findUnique({ where: { id: month.sow_id } });
    await createNotification('SOW Pending Approval', `A new SOW month (${month.month_year}) requires your approval.`);

    res.status(200).json({ status: 'success', data: month });
  } catch (error) {
    console.error('Error submitting SOW month:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit SOW month' });
  }
};

// Approve SOW Month
exports.approveSowMonth = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const month = await prisma.sowMonth.update({
      where: { id },
      data: {
        approval_status: 'Approved',
        approved_by: user_id
      }
    });

    const sow = await prisma.sow.findUnique({ where: { id: month.sow_id } });
    await createNotification('SOW Approved', `SOW month (${month.month_year}) has been approved.`);

    res.status(200).json({ status: 'success', data: month });
  } catch (error) {
    console.error('Error approving SOW month:', error);
    res.status(500).json({ status: 'error', message: 'Failed to approve SOW month' });
  }
};

// Reject SOW Month
exports.rejectSowMonth = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const month = await prisma.sowMonth.update({
      where: { id },
      data: {
        approval_status: 'Rejected',
        approved_by: user_id
      }
    });

    await createNotification('SOW Rejected', `SOW month (${month.month_year}) was rejected.`);

    res.status(200).json({ status: 'success', data: month });
  } catch (error) {
    console.error('Error rejecting SOW month:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reject SOW month' });
  }
};


