const prisma = require('../config/prisma');
const { calculateClientHealth } = require('../utils/healthScoreEngine');

// Create a new client
exports.createClient = async (req, res) => {
  try {
    const { company_name, brand_name, industry, website, email, phone, client_status, health_status, service_type, retainer_value, primary_contact_name, spoc_name, brand_shortcode, logo, objective, focused_area, customer_mindset, onboarding_date } = req.body;
    
    const client = await prisma.client.create({
      data: {
        company_name,
        brand_name,
        industry,
        website,
        email,
        phone,
        client_status: client_status || "Active",
        health_status: health_status || "Green",
        service_type,
        retainer_value: retainer_value ? parseFloat(retainer_value) : null,
        primary_contact_name,
        spoc_name,
        brand_shortcode,
        logo,
        objective,
        focused_area,
        customer_mindset,
        onboarding_date: onboarding_date ? new Date(onboarding_date) : null
      },
    });

    res.status(201).json({ status: 'success', data: client });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create client' });
  }
};

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const whereClause = activeOnly === 'true' ? { client_status: 'Active' } : {};

    const clients = await prisma.client.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch clients' });
  }
};

// Get a single client by ID
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Auto-recalculate health score on fetch removed as it is now manual

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        spocs: true,
        tasks: { orderBy: { created_at: 'desc' }, take: 5 },
        sows: { orderBy: { created_at: 'desc' }, take: 5, include: { months: { include: { items: { include: { tasks: true } } } } } },
        meetings: { orderBy: { meeting_date: 'desc' }, take: 5 },
        communications: { orderBy: { created_at: 'desc' }, take: 5 },
        reports: { orderBy: { created_at: 'desc' }, take: 5 },
        escalations: { orderBy: { created_at: 'desc' }, take: 5 },
        health_scores: { orderBy: { calculated_at: 'desc' }, take: 1 },
        onboarding_checklist: true,
        social_handles: true,
        seo_accesses: true,
        paid_media_accesses: true,
        campaign_performances: true,
        monthly_plans: true
      }
    });

    if (!client) {
      return res.status(404).json({ status: 'error', message: 'Client not found' });
    }

    // Compute SOW Defined / Delivered / Pending summary
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all completed tasks for this client this month
    const completedTasksThisMonth = await prisma.task.findMany({
      where: {
        client_id: id,
        status: 'Completed',
        completed_at: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const pendingTasksThisMonth = await prisma.task.findMany({
      where: {
        client_id: id,
        status: { in: ['Pending', 'In Progress', 'Review'] }
      }
    });

    let totalDefined = 0;
    let totalDelivered = completedTasksThisMonth.length;
    let totalPending = pendingTasksThisMonth.length;

    const sowDeliverablesSummary = [];

    if (client.sows && client.sows.length > 0) {
      client.sows.forEach(sow => {
        if (sow.months) {
          sow.months.forEach(m => {
            if (m.items) {
              m.items.forEach(item => {
                const qty = item.committed_qty || 1;
                totalDefined += qty;

                // Match tasks for this item
                const deliveredForItem = item.tasks ? item.tasks.filter(t => t.status === 'Completed').length : 0;

                sowDeliverablesSummary.push({
                  id: item.id,
                  deliverable_name: item.deliverable_name,
                  defined_qty: qty,
                  delivered_qty: deliveredForItem,
                  pending_qty: Math.max(0, qty - deliveredForItem),
                  status: deliveredForItem > qty ? 'SOW Exceeded' : (deliveredForItem / qty) >= 0.8 ? 'Approaching Limit' : 'In Scope'
                });
              });
            }
          });
        }
      });
    }

    const clientWithSowSummary = {
      ...client,
      sow_summary: {
        total_defined: totalDefined,
        total_delivered: totalDelivered,
        total_pending: totalPending,
        deliverables: sowDeliverablesSummary
      }
    };

    res.status(200).json({ status: 'success', data: clientWithSowSummary });

  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch client' });
  }
};

// Update a client
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.onboarding_date) {
      updateData.onboarding_date = new Date(updateData.onboarding_date);
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ status: 'success', data: client });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update client' });
  }
};

// Delete a client
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: { id },
    });

    res.status(200).json({ status: 'success', message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete client' });
  }
};

// Add a contact to a client
exports.addContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_name, designation, title, department, email, phone, is_primary, birth_date, anniversary_date, festival_greetings } = req.body;

    const contact = await prisma.clientContact.create({
      data: {
        client_id: id,
        name: name || contact_name || "Unnamed Contact",
        designation: designation || title,
        department,
        email,
        phone,
        is_primary: is_primary || false,
        birth_date: birth_date ? new Date(birth_date) : null,
        anniversary_date: anniversary_date ? new Date(anniversary_date) : null,
        festival_greetings: festival_greetings || []
      }
    });

    res.status(201).json({ status: 'success', data: contact });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add contact' });
  }
};

// Add an internal SPOC to a client
exports.addSpoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role_type } = req.body; // updated for schema relation field name 'role_type'

    const spoc = await prisma.clientSpoc.create({
      data: {
        client_id: id,
        user_id,
        role_type: role_type || 'Account Manager'
      }
    });

    res.status(201).json({ status: 'success', data: spoc });
  } catch (error) {
    console.error('Error adding SPOC:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add SPOC' });
  }
};

// --- ONBOARDING CHECKLIST CONTROLLERS ---

exports.getOnboardingChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const checklist = await prisma.onboardingChecklist.findMany({
      where: { client_id: id }
    });
    res.status(200).json({ status: 'success', data: checklist });
  } catch (error) {
    console.error('Error fetching onboarding checklist:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch onboarding checklist' });
  }
};

exports.addOnboardingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { step_name } = req.body;
    const item = await prisma.onboardingChecklist.create({
      data: {
        client_id: id,
        step_name,
        is_completed: false
      }
    });
    res.status(201).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error adding onboarding item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add onboarding item' });
  }
};

exports.updateOnboardingItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { is_completed } = req.body;
    const item = await prisma.onboardingChecklist.update({
      where: { id: itemId },
      data: {
        is_completed,
        completed_at: is_completed ? new Date() : null
      }
    });
    res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    console.error('Error updating onboarding item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update onboarding item' });
  }
};

exports.deleteOnboardingItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await prisma.onboardingChecklist.delete({
      where: { id: itemId }
    });
    res.status(200).json({ status: 'success', message: 'Onboarding item deleted successfully' });
  } catch (error) {
    console.error('Error deleting onboarding item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete onboarding item' });
  }
};

// --- SOCIAL MEDIA HANDLES CONTROLLERS ---

exports.getSocialHandles = async (req, res) => {
  try {
    const { id } = req.params;
    const handles = await prisma.socialHandle.findMany({
      where: { client_id: id }
    });
    res.status(200).json({ status: 'success', data: handles });
  } catch (error) {
    console.error('Error fetching social handles:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch social handles' });
  }
};

exports.addSocialHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, profile_url, access_provided, username, password, access_token, platform_account_id } = req.body;
    const handle = await prisma.socialHandle.create({
      data: {
        client_id: id,
        platform,
        profile_url,
        username: username || null,
        password: password || null,
        access_provided: access_provided || 'None',
        access_token: access_token || null,
        platform_account_id: platform_account_id || null
      }
    });
    res.status(201).json({ status: 'success', data: handle });
  } catch (error) {
    console.error('Error adding social handle:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add social handle' });
  }
};

exports.deleteSocialHandle = async (req, res) => {
  try {
    const { handleId } = req.params;
    await prisma.socialHandle.delete({
      where: { id: handleId }
    });
    res.status(200).json({ status: 'success', message: 'Social handle deleted successfully' });
  } catch (error) {
    console.error('Error deleting social handle:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete social handle' });
  }
};

// --- SEO ACCESS CONTROLLERS ---

exports.getSeoAccesses = async (req, res) => {
  try {
    const { id } = req.params;
    const accesses = await prisma.seoAccess.findMany({
      where: { client_id: id }
    });
    res.status(200).json({ status: 'success', data: accesses });
  } catch (error) {
    console.error('Error fetching SEO accesses:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch SEO accesses' });
  }
};

exports.addSeoAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, profile_url, access_provided, username, password } = req.body;
    const access = await prisma.seoAccess.create({
      data: {
        client_id: id,
        platform,
        profile_url,
        username: username || null,
        password: password || null,
        access_provided: access_provided || 'None'
      }
    });
    res.status(201).json({ status: 'success', data: access });
  } catch (error) {
    console.error('Error adding SEO access:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add SEO access' });
  }
};

exports.deleteSeoAccess = async (req, res) => {
  try {
    const { accessId } = req.params;
    await prisma.seoAccess.delete({
      where: { id: accessId }
    });
    res.status(200).json({ status: 'success', message: 'SEO access deleted successfully' });
  } catch (error) {
    console.error('Error deleting SEO access:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete SEO access' });
  }
};

// --- PAID MEDIA ACCESS CONTROLLERS ---

exports.getPaidMediaAccesses = async (req, res) => {
  try {
    const { id } = req.params;
    const accesses = await prisma.paidMediaAccess.findMany({
      where: { client_id: id }
    });
    res.status(200).json({ status: 'success', data: accesses });
  } catch (error) {
    console.error('Error fetching Paid Media accesses:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch Paid Media accesses' });
  }
};

exports.addPaidMediaAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, profile_url, access_provided, username, password, ad_account_id } = req.body;
    const access = await prisma.paidMediaAccess.create({
      data: {
        client_id: id,
        platform,
        profile_url,
        username: username || null,
        password: password || null,
        ad_account_id: ad_account_id || null,
        access_provided: access_provided || 'None'
      }
    });
    res.status(201).json({ status: 'success', data: access });
  } catch (error) {
    console.error('Error adding Paid Media access:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add Paid Media access' });
  }
};

exports.deletePaidMediaAccess = async (req, res) => {
  try {
    const { accessId } = req.params;
    await prisma.paidMediaAccess.delete({
      where: { id: accessId }
    });
    res.status(200).json({ status: 'success', message: 'Paid Media access deleted successfully' });
  } catch (error) {
    console.error('Error deleting Paid Media access:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete Paid Media access' });
  }
};

// --- MONTHLY PLANS CONTROLLERS ---

exports.getMonthlyPlans = async (req, res) => {
  try {
    const { id } = req.params;
    const plans = await prisma.clientMonthlyPlan.findMany({
      where: { client_id: id }
    });
    res.status(200).json({ status: 'success', data: plans });
  } catch (error) {
    console.error('Error fetching Monthly Plans:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch Monthly Plans' });
  }
};

exports.addMonthlyPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, month_year, document_link } = req.body;
    const plan = await prisma.clientMonthlyPlan.create({
      data: {
        client_id: id,
        department,
        month_year,
        document_link
      }
    });
    res.status(201).json({ status: 'success', data: plan });
  } catch (error) {
    console.error('Error adding Monthly Plan:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add Monthly Plan' });
  }
};

exports.deleteMonthlyPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    await prisma.clientMonthlyPlan.delete({
      where: { id: planId }
    });
    res.status(200).json({ status: 'success', message: 'Monthly Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting Monthly Plan:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete Monthly Plan' });
  }
};
