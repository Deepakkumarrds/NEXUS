require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const reportGenerator = require('../utils/reportGenerator');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

async function runTest() {
  console.log('🔄 Starting Report Test...');

  try {
    // 1. Find or create the test client
    let client = await prisma.client.findFirst({
      where: { company_name: 'RDS DIGITAL' }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          company_name: 'RDS DIGITAL',
          email: 'ktgowtham864@gmail.com',
          client_status: 'Active',
          primary_contact_name: 'Gowtham'
        }
      });
      console.log('✅ Created new client: RDS DIGITAL');
    } else {
      await prisma.client.update({
        where: { id: client.id },
        data: { email: 'ktgowtham864@gmail.com' }
      });
      console.log('✅ Updated existing client (RDS DIGITAL) with test email.');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const now = new Date();

    // 1.5 Seed Dummy Data if needed
    const existingCampaigns = await prisma.campaignPerformance.count({ where: { client_id: client.id } });
    if (existingCampaigns === 0) {
      await prisma.campaignPerformance.create({
        data: {
          client_id: client.id,
          campaign_name: 'Q3 Brand Awareness - Meta Ads',
          spend_inr: 45000,
          clicks: 3420,
          leads_conversions: 112,
          cost_per_lead_inr: 401.78,
          start_date: sevenDaysAgo
        }
      });
      
      const someUser = await prisma.user.findFirst();
      if (someUser) {
        await prisma.task.create({
          data: {
            client_id: client.id,
            title: 'Design Social Media Creatives',
            description: 'Created 5 carousel posts for Instagram.',
            assigned_by: someUser.id,
            status: 'Completed',
            updated_at: now
          }
        });
        await prisma.task.create({
          data: {
            client_id: client.id,
            title: 'Draft Monthly SEO Report',
            description: 'Review keyword rankings and traffic.',
            assigned_by: someUser.id,
            status: 'Pending',
            updated_at: now
          }
        });
      }
    }

    // 2. Fetch the client with all relations
    const populatedClient = await prisma.client.findUnique({
      where: { id: client.id },
      include: {
        tasks: { 
          where: { 
            OR: [
              { status: 'Completed', updated_at: { gte: sevenDaysAgo } },
              { status: { in: ['Pending', 'In Progress', 'Review'] } }
            ]
          } 
        },
        communications: { where: { created_at: { gte: sevenDaysAgo } } },
        meetings: { where: { meeting_date: { gte: sevenDaysAgo, lte: now } } },
        escalations: { where: { status: 'Resolved', resolved_at: { gte: sevenDaysAgo } } },
        sows: { where: { created_at: { gte: sevenDaysAgo } } },
        campaign_performances: true
      }
    });

    const completedTasks = (populatedClient.tasks || []).filter(t => t.status === 'Completed');
    const pendingTasks = (populatedClient.tasks || []).filter(t => t.status !== 'Completed');

    // 3. Generate HTML
    const reportHtml = reportGenerator.generateWeeklyReportHtml(
      populatedClient, 
      completedTasks,
      pendingTasks,
      populatedClient.campaign_performances || [],
      populatedClient.communications || [], 
      populatedClient.meetings || [], 
      populatedClient.escalations || []
    );

    // 4. Save to local file so we can view it
    const outputPath = path.join(__dirname, '..', '..', 'test_report_preview.html');
    fs.writeFileSync(outputPath, reportHtml);
    console.log(`✅ Saved a visual preview of the email to: ${outputPath}`);

    // 5. Send via Email Service (Will log to console unless SMTP is configured)
    console.log('📨 Sending email to ktgowtham864@gmail.com...');
    await emailService.sendWeeklyReportEmail('ktgowtham864@gmail.com', 'RDS DIGITAL', reportHtml);
    
    console.log('🎉 Test Complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
