const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendWeeklyReportsNow, generateReportHtmlForClient } = require('../services/cronService');

exports.getGlobalSettings = async (req, res) => {
  try {
    let settings = await prisma.globalSettings.findFirst();
    
    // If no settings exist yet, create default
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          weekly_report_day: 5, // Friday
          weekly_report_time: "17:00"
        }
      });
    }
    
    res.json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch global settings' });
  }
};

exports.updateGlobalSettings = async (req, res) => {
  try {
    const { 
      weekly_report_day, 
      weekly_report_time,
      email_subject_template,
      email_intro_message,
      include_campaigns,
      include_tasks,
      include_communications
    } = req.body;
    
    let settings = await prisma.globalSettings.findFirst();
    
    const updateData = {
      weekly_report_day: parseInt(weekly_report_day),
      weekly_report_time,
      email_subject_template,
      email_intro_message,
      include_campaigns: include_campaigns !== undefined ? include_campaigns : true,
      include_tasks: include_tasks !== undefined ? include_tasks : true,
      include_communications: include_communications !== undefined ? include_communications : true,
    };

    if (settings) {
      settings = await prisma.globalSettings.update({
        where: { id: settings.id },
        data: updateData
      });
    } else {
      settings = await prisma.globalSettings.create({
        data: updateData
      });
    }
    
    res.json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Error updating global settings:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update global settings' });
  }
};

exports.triggerWeeklyReports = async (req, res) => {
  try {
    const { clientIds } = req.body || {};
    const result = await sendWeeklyReportsNow(clientIds);
    res.json({ status: 'success', message: `Reports successfully sent to ${result.count} active clients.` });
  } catch (error) {
    console.error('Error triggering reports manually:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send reports' });
  }
};

exports.previewWeeklyReport = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res.status(400).json({ status: 'error', message: 'Client ID is required' });
    }
    const html = await generateReportHtmlForClient(clientId);
    res.send(html);
  } catch (error) {
    console.error('Error previewing report:', error);
    res.status(500).send('<h1>Failed to generate preview</h1><p>' + error.message + '</p>');
  }
};

exports.getDeliveryLogs = async (req, res) => {
  try {
    const logs = await prisma.reportDeliveryLog.findMany({
      orderBy: { sent_at: 'desc' },
      take: 50,
      include: {
        client: {
          select: {
            company_name: true,
            email: true
          }
        }
      }
    });
    res.json({ status: 'success', data: logs });
  } catch (error) {
    console.error('Error fetching delivery logs:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch delivery logs' });
  }
};
