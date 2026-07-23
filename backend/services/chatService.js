const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Groq = require('groq-sdk');
const { HfInference } = require('@huggingface/inference');

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
} else {
  console.warn("WARNING: GROQ_API_KEY is not set. Chat features will be disabled.");
}

let hf = null;
if (process.env.HF_TOKEN) {
  hf = new HfInference(process.env.HF_TOKEN);
} else {
  console.warn("WARNING: HF_TOKEN is not set. Vector search features will be disabled.");
}

// ─────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────
const tools = [
  {
    type: 'function',
    function: {
      name: 'searchKnowledgeBase',
      description: 'Search the internal RDS Knowledge Base for SOPs, templates, guidelines, checklists, and playbooks. Use this whenever the user asks about "how to" do something, company policies, processes, or best practices.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query or question to find in the knowledge base. Be specific.'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getClients',
      description: 'Get a list of clients from the database. Useful for finding out how many clients exist, their names, status, industry, retainer value, and renewal dates.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional status filter (e.g., Active, Hold, Lost)'
          },
          industry: {
            type: 'string',
            description: 'Optional industry filter (e.g., Real Estate, Healthcare, Education)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getTasks',
      description: 'Get a list of tasks with their status, priority, due date, assigned team member, and associated client.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional status filter (e.g., Pending, In Progress, Review, Completed)'
          },
          priority: {
            type: 'string',
            description: 'Optional priority filter (e.g., High, Medium, Low)'
          },
          searchTerm: {
            type: 'string',
            description: 'Optional search term to filter tasks by title or description'
          },
          clientName: {
            type: 'string',
            description: 'Optional client company name to filter tasks for a specific client'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getEscalations',
      description: 'Get a list of escalations or client issues, including severity level and resolution status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional status filter (e.g., Open, In Progress, Resolved)'
          },
          severity: {
            type: 'string',
            description: 'Optional severity filter (e.g., Low, Medium, High, Critical)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getMeetings',
      description: 'Get a list of client meetings including agenda, discussion points, and action items.',
      parameters: {
        type: 'object',
        properties: {
          clientName: {
            type: 'string',
            description: 'Optional client company name to filter meetings'
          },
          limit: {
            type: 'string',
            description: 'Number of recent meetings to return (default 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getCommunications',
      description: 'Get communication logs (calls, emails, WhatsApp messages) with clients including summaries and follow-up actions.',
      parameters: {
        type: 'object',
        properties: {
          clientName: {
            type: 'string',
            description: 'Optional client company name to filter communications'
          },
          type: {
            type: 'string',
            description: 'Optional communication type filter (e.g., Call, Email, WhatsApp, Meeting)'
          },
          limit: {
            type: 'string',
            description: 'Number of recent communications to return (default 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getCampaignPerformance',
      description: 'Get campaign performance data including impressions, clicks, leads, cost per lead, and spend for clients.',
      parameters: {
        type: 'object',
        properties: {
          clientName: {
            type: 'string',
            description: 'Optional client company name to filter campaigns'
          },
          limit: {
            type: 'string',
            description: 'Number of campaigns to return (default 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getClientHealthScores',
      description: 'Get client health scores showing overall performance, risk level, and scores across communication, task completion, escalations, and report timeliness. Useful for identifying at-risk clients.',
      parameters: {
        type: 'object',
        properties: {
          riskLevel: {
            type: 'string',
            description: 'Optional risk level filter (e.g., Excellent, Stable, Risk, Critical)'
          },
          clientName: {
            type: 'string',
            description: 'Optional client company name to get health score for a specific client'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getSowStatus',
      description: 'Get Statement of Work (SOW) deliverables status for clients, including completed and pending deliverables.',
      parameters: {
        type: 'object',
        properties: {
          clientName: {
            type: 'string',
            description: 'Optional client company name to filter SOWs'
          },
          status: {
            type: 'string',
            description: 'Optional deliverable status filter (e.g., Pending, In Progress, Completed)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getReports',
      description: 'Get uploaded reports for clients (SEO, Ads, Social Media reports) with upload dates and report months.',
      parameters: {
        type: 'object',
        properties: {
          clientName: {
            type: 'string',
            description: 'Optional client company name to filter reports'
          },
          reportType: {
            type: 'string',
            description: 'Optional report type filter (e.g., SEO, Ads, Social)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getDashboardSummary',
      description: 'Get an overall business summary including total clients, active clients, pending tasks, open escalations, and team overview. Use this for general business health queries.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

// ─────────────────────────────────────────
// TOOL EXECUTION
// ─────────────────────────────────────────
async function executeTool(toolCall) {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments || '{}');

  try {
    // ── getClients ──
    if (functionName === 'getClients') {
      const where = {};
      if (args.status) where.client_status = args.status;
      if (args.industry) where.industry = { contains: args.industry, mode: 'insensitive' };
      const clients = await prisma.client.findMany({
        where,
        select: {
          company_name: true,
          brand_name: true,
          client_status: true,
          industry: true,
          retainer_value: true,
          renewal_date: true,
          service_type: true,
          onboarding_date: true
        },
        orderBy: { created_at: 'desc' }
      });
      return JSON.stringify(clients);
    }

    // ── getTasks ──
    if (functionName === 'getTasks') {
      const where = {};
      if (args.status) where.status = args.status;
      if (args.priority) where.priority = args.priority;
      if (args.searchTerm) {
        where.OR = [
          { title: { contains: args.searchTerm, mode: 'insensitive' } },
          { description: { contains: args.searchTerm, mode: 'insensitive' } }
        ];
      }
      if (args.clientName) {
        where.client = { company_name: { contains: args.clientName, mode: 'insensitive' } };
      }
      const tasks = await prisma.task.findMany({
        where,
        select: {
          title: true,
          description: true,
          status: true,
          priority: true,
          due_date: true,
          completion_percentage: true,
          delay_reason: true,
          client: { select: { company_name: true } },
          assignee: { select: { name: true } }
        },
        orderBy: { due_date: 'asc' },
        take: 20
      });
      return JSON.stringify(tasks);
    }

    // ── getEscalations ──
    if (functionName === 'getEscalations') {
      const where = {};
      if (args.status) where.status = args.status;
      if (args.severity) where.severity = args.severity;
      const escalations = await prisma.escalation.findMany({
        where,
        select: {
          title: true,
          issue_description: true,
          status: true,
          severity: true,
          resolution_notes: true,
          created_at: true,
          resolved_at: true,
          client: { select: { company_name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: 15
      });
      return JSON.stringify(escalations);
    }

    // ── getMeetings ──
    if (functionName === 'getMeetings') {
      const where = {};
      if (args.clientName) {
        where.client = { company_name: { contains: args.clientName, mode: 'insensitive' } };
      }
      const meetings = await prisma.meeting.findMany({
        where,
        select: {
          meeting_title: true,
          meeting_date: true,
          attendees: true,
          agenda: true,
          discussion_points: true,
          client: { select: { company_name: true } },
          action_items: {
            select: { action_item: true, status: true, deadline: true }
          }
        },
        orderBy: { meeting_date: 'desc' },
        take: args.limit ? parseInt(args.limit, 10) : 10
      });
      return JSON.stringify(meetings);
    }

    // ── getCommunications ──
    if (functionName === 'getCommunications') {
      const where = {};
      if (args.clientName) {
        where.client = { company_name: { contains: args.clientName, mode: 'insensitive' } };
      }
      if (args.type) where.communication_type = args.type;
      const comms = await prisma.communicationLog.findMany({
        where,
        select: {
          communication_type: true,
          subject: true,
          summary: true,
          next_action: true,
          follow_up_date: true,
          created_at: true,
          client: { select: { company_name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: args.limit ? parseInt(args.limit, 10) : 10
      });
      return JSON.stringify(comms);
    }

    // ── getCampaignPerformance ──
    if (functionName === 'getCampaignPerformance') {
      const where = {};
      if (args.clientName) {
        where.client = { company_name: { contains: args.clientName, mode: 'insensitive' } };
      }
      const campaigns = await prisma.campaignPerformance.findMany({
        where,
        select: {
          campaign_name: true,
          impressions: true,
          clicks: true,
          leads_conversions: true,
          cost_per_lead_inr: true,
          spend_inr: true,
          start_date: true,
          client: { select: { company_name: true } }
        },
        orderBy: { start_date: 'desc' },
        take: args.limit ? parseInt(args.limit, 10) : 10
      });
      return JSON.stringify(campaigns);
    }

    // ── getClientHealthScores ──
    if (functionName === 'getClientHealthScores') {
      const where = {};
      if (args.riskLevel) where.risk_level = args.riskLevel;
      if (args.clientName) {
        where.client = { company_name: { contains: args.clientName, mode: 'insensitive' } };
      }
      const scores = await prisma.clientHealthScore.findMany({
        where,
        select: {
          overall_score: true,
          risk_level: true,
          communication_score: true,
          task_completion_score: true,
          escalation_score: true,
          report_timeliness_score: true,
          calculated_at: true,
          client: { select: { company_name: true } }
        },
        orderBy: { overall_score: 'asc' },
        take: 20
      });
      return JSON.stringify(scores);
    }

    // ── getSowStatus ──
    if (functionName === 'getSowStatus') {
      const where = {};
      if (args.clientName) {
        where.client = { company_name: { contains: args.clientName, mode: 'insensitive' } };
      }
      const sows = await prisma.sow.findMany({
        where,
        select: {
          sow_name: true,
          status: true,
          start_date: true,
          end_date: true,
          total_value: true,
          client: { select: { company_name: true } },
          items: {
            where: args.status ? { status: args.status } : undefined,
            select: {
              deliverable_name: true,
              status: true,
              frequency: true,
              due_date: true,
              tracking_month: true
            },
            take: 15
          }
        },
        take: 10
      });
      return JSON.stringify(sows);
    }

    // ── getReports ──
    if (functionName === 'getReports') {
      const where = {};
      if (args.clientName) {
        where.client = { company_name: { contains: args.clientName, mode: 'insensitive' } };
      }
      if (args.reportType) where.report_type = args.reportType;
      const reports = await prisma.report.findMany({
        where,
        select: {
          report_name: true,
          report_type: true,
          report_month: true,
          created_at: true,
          client: { select: { company_name: true } },
          uploader: { select: { name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: 15
      });
      return JSON.stringify(reports);
    }

    // ── getDashboardSummary ──
    if (functionName === 'getDashboardSummary') {
      const [
        totalClients,
        activeClients,
        holdClients,
        lostClients,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        openEscalations,
        criticalEscalations,
        totalUsers
      ] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { client_status: 'Active' } }),
        prisma.client.count({ where: { client_status: 'Hold' } }),
        prisma.client.count({ where: { client_status: 'Lost' } }),
        prisma.task.count({ where: { status: 'Pending' } }),
        prisma.task.count({ where: { status: 'In Progress' } }),
        prisma.task.count({
          where: {
            due_date: { lt: new Date() },
            status: { not: 'Completed' }
          }
        }),
        prisma.escalation.count({ where: { status: { not: 'Resolved' } } }),
        prisma.escalation.count({ where: { severity: 'Critical', status: { not: 'Resolved' } } }),
        prisma.user.count({ where: { status: 'Active' } })
      ]);

      return JSON.stringify({
        clients: { total: totalClients, active: activeClients, hold: holdClients, lost: lostClients },
        tasks: { pending: pendingTasks, inProgress: inProgressTasks, overdue: overdueTasks },
        escalations: { open: openEscalations, critical: criticalEscalations },
        team: { activeMembers: totalUsers }
      });
    }

    if (functionName === 'searchKnowledgeBase') {
      try {
        if (!hf) {
          return JSON.stringify({ message: 'Vector search is currently disabled because the HF_TOKEN is not configured on the server.' });
        }
        // 1. Generate embedding for the search query
        const queryEmbedding = await hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: args.query,
        });

        // 2. Perform Vector Search using MongoDB aggregateRaw
        const rawResults = await prisma.knowledgeArticle.aggregateRaw({
          pipeline: [
            {
              $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector: queryEmbedding,
                numCandidates: 10,
                limit: 3
              }
            },
            {
              $project: {
                _id: 0,
                title: 1,
                content: 1,
                category: 1,
                department: 1,
                score: { $meta: 'vectorSearchScore' }
              }
            }
          ]
        });

        // Prisma aggregateRaw returns an array of objects
        if (!rawResults || rawResults.length === 0) {
          return JSON.stringify({ message: 'No relevant articles found in the knowledge base.' });
        }

        return JSON.stringify(rawResults);
      } catch (err) {
        console.error('Vector search error:', err);
        return JSON.stringify({ error: 'Failed to search knowledge base' });
      }
    }

    return JSON.stringify({ error: `Function ${functionName} not found` });
  } catch (error) {
    console.error('Error executing tool:', error);
    return JSON.stringify({ error: error.message });
  }
}

// ─────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────
const SYSTEM_PROMPT = `You are the RDS Intelligence Assistant — an internal AI for RDS Digital, a digital marketing and growth agency.

You have access to real-time data from the RDS dashboard and the internal Knowledge Base. You can answer questions about:
- Clients (status, industry, retainer, renewals)
- Tasks (pending, overdue, high priority)
- Campaigns (impressions, clicks, leads, CPL, spend)
- Meetings (recent discussions, action items)
- Communications (calls, emails, WhatsApp logs)
- Escalations (open issues, severity)
- Client Health Scores (risk levels, scores)
- SOW Deliverables (completed, pending items)
- Reports (uploaded reports per client)
- Business Overview (totals, summaries)
- Internal Knowledge (SOPs, processes, guidelines, templates) -> USE searchKnowledgeBase for this!

STRICT FORMATTING AND GROUNDING RULES:
1. STRICT GROUNDING: You MUST ONLY use the data returned by your tools (from the database or vector DB) to answer questions. DO NOT hallucinate, guess, or make up data. DO NOT use your pre-trained knowledge for any agency or client data.
2. If your tools return no information or an empty list, you MUST reply "I do not have data on this in the system." Do not attempt to answer anyway.
3. NEVER use markdown symbols like **, *, #, or backticks in your responses.
4. Use plain numbered lists (1. 2. 3.) when listing items.
5. Keep responses EXTREMELY short and summarized. Do not dump large amounts of data.
6. Never output raw JSON, code, or XML tags.
7. When showing numbers (money, percentages), format them clearly (e.g., "Rs. 25,000" or "42%").
8. Always be helpful, professional, and get straight to the point.
9. For business summaries, organize information in clear sections but keep them brief.
10. When citing knowledge base articles, mention the title of the article.
11. CRITICAL: If a tool returns many items (e.g., many tasks, clients, or escalations), DO NOT list all of them. Summarize the total count and only list the top 3 most important ones.`;


// ─────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────
const handleChat = async (messages) => {
  // Inject system prompt if not present
  if (!messages.find(m => m.role === 'system')) {
    messages.unshift({
      role: 'system',
      content: SYSTEM_PROMPT
    });
  }

  try {
    if (!groq) {
      return { role: 'assistant', content: 'AI Chat is currently disabled because the GROQ_API_KEY is not configured on the server.' };
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      tools: tools,
      tool_choice: 'auto'
    });

    let message = response.choices[0].message;

    // Handle tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const functionResult = await executeTool(toolCall);
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: functionResult
        });
      }

      // Get final response with tool data
      const finalResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages
      });

      let finalMsg = finalResponse.choices[0].message;
      if (finalMsg && finalMsg.content) {
        finalMsg.content = finalMsg.content
          .replace(/<function[^>]*>.*?<\/function>/gi, '')
          .trim();
      }
      return finalMsg;
    }

    if (message && message.content) {
      message.content = message.content
        .replace(/<function[^>]*>.*?<\/function>/gi, '')
        .trim();
    }
    return message;
  } catch (error) {
    console.error('Groq chat error:', error);

    // Fallback if tool generation fails on LLM side
    if (error.message && (error.message.includes('tool_use_failed') || error.message.includes('Failed to call a function'))) {
      try {
        console.log('🔄 Attempting tool fallback completion...');
        const fallbackResponse = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: messages.filter(m => m.role !== 'tool' && !m.tool_calls)
        });
        const msg = fallbackResponse.choices[0].message;
        if (msg && msg.content) {
          msg.content = msg.content.replace(/<function[^>]*>.*?<\/function>/gi, '').trim();
        }
        return msg;
      } catch (fbErr) {
        console.error('Fallback chat error:', fbErr);
      }
    }

    throw new Error(`Groq API Error: ${error.message}`);
  }
};


module.exports = { handleChat };
