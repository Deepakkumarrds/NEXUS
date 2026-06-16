const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all campaign performance logs (with optional client filtering)
exports.getAllCampaigns = async (req, res) => {
  try {
    const { client_id } = req.query;
    let whereClause = {};
    if (client_id) {
      whereClause.client_id = client_id;
    }

    const campaigns = await prisma.campaignPerformance.findMany({
      where: whereClause,
      include: {
        client: { select: { company_name: true } }
      },
      orderBy: { start_date: 'desc' }
    });
    res.status(200).json({ status: 'success', data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch campaigns' });
  }
};

// Log a new campaign performance report
exports.logCampaignPerformance = async (req, res) => {
  try {
    const { client_id, campaign_name, impressions, clicks, leads_conversions, spend_inr, start_date } = req.body;

    const spendVal = spend_inr ? parseFloat(spend_inr) : 0.0;
    const leadsVal = leads_conversions ? parseInt(leads_conversions) : 0;
    
    // Auto-calculate CPL (Cost Per Lead) in Rupees: spend / leads
    const cost_per_lead_inr = leadsVal > 0 ? (spendVal / leadsVal) : 0.0;

    const campaign = await prisma.campaignPerformance.create({
      data: {
        client_id,
        campaign_name,
        impressions: impressions ? parseInt(impressions) : 0,
        clicks: clicks ? parseInt(clicks) : 0,
        leads_conversions: leadsVal,
        cost_per_lead_inr,
        spend_inr: spendVal,
        start_date: new Date(start_date)
      }
    });

    res.status(201).json({ status: 'success', data: campaign });
  } catch (error) {
    console.error('Error logging campaign performance:', error);
    res.status(500).json({ status: 'error', message: 'Failed to log campaign performance' });
  }
};

// Delete a campaign log
exports.deleteCampaignLog = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.campaignPerformance.delete({
      where: { id }
    });
    res.status(200).json({ status: 'success', message: 'Campaign log deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete campaign log' });
  }
};
