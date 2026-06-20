const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Define tools that Groq can use
const tools = [
  {
    type: 'function',
    function: {
      name: 'getClients',
      description: 'Get a list of clients from the database. Useful for finding out how many clients exist or their names.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional status filter (e.g., Active, Hold, Lost)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getTasks',
      description: 'Get a list of tasks. Useful for finding pending or completed tasks.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional status filter (e.g., Pending, In Progress, Completed)'
          },
          priority: {
            type: 'string',
            description: 'Optional priority filter (e.g., High, Medium, Low)'
          },
          searchTerm: {
            type: 'string',
            description: 'Optional search term to filter tasks by title or description'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getEscalations',
      description: 'Get a list of escalations or issues.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Optional status filter (e.g., Open, Resolved)'
          }
        }
      }
    }
  }
];

// Execute the appropriate tool function
async function executeTool(toolCall) {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments || '{}');

  try {
    if (functionName === 'getClients') {
      const query = {};
      if (args.status) query.client_status = args.status;
      const clients = await prisma.client.findMany({
        where: query,
        select: { company_name: true, client_status: true, industry: true }
      });
      return JSON.stringify(clients);
    }

    if (functionName === 'getTasks') {
      const query = {};
      if (args.status) query.status = args.status;
      if (args.priority) query.priority = args.priority;
      if (args.searchTerm) {
        query.OR = [
          { title: { contains: args.searchTerm, mode: 'insensitive' } },
          { description: { contains: args.searchTerm, mode: 'insensitive' } }
        ];
      }
      const tasks = await prisma.task.findMany({
        where: query,
        select: {
          title: true,
          description: true,
          status: true,
          priority: true,
          due_date: true,
          client: { select: { company_name: true } },
          assignee: { select: { name: true } }
        },
        take: 20 // limit to avoid token overflow
      });
      return JSON.stringify(tasks);
    }

    if (functionName === 'getEscalations') {
      const query = {};
      if (args.status) query.status = args.status;
      const escalations = await prisma.escalation.findMany({
        where: query,
        select: { title: true, status: true, severity: true },
        take: 10
      });
      return JSON.stringify(escalations);
    }

    return JSON.stringify({ error: `Function ${functionName} not found` });
  } catch (error) {
    console.error('Error executing tool:', error);
    return JSON.stringify({ error: error.message });
  }
}

const handleChat = async (messages) => {
    // Add a system prompt if it doesn't exist
  if (!messages.find(m => m.role === 'system')) {
    messages.unshift({
      role: 'system',
      content: `You are a helpful, non-technical AI assistant for the RDS Dashboard (also known as Nexus). 
You access backend database queries via tools to answer user questions about clients, tasks, and escalations.
CRITICAL RULES:
1. NEVER output raw <function> tags, XML tags, or JSON syntax.
2. NEVER output programming code snippets (like Python, JavaScript, SQL) to show the user how to query. The user is a business user, not a developer.
3. If a tool returns an empty list [], simply tell the user "I couldn't find any results matching your request" and stop.
4. Format lists nicely using markdown bullet points or bold text. Be concise.`
    });
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Using latest supported 8b model
      messages: messages,
      tools: tools,
      tool_choice: 'auto'
    });

    let message = response.choices[0].message;

    // Check if Groq wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message); // append the assistant's tool call request

      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        const functionResult = await executeTool(toolCall);
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: functionResult
        });
      }

      // Get the final response from Groq with the tool data
      const finalResponse = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: messages
      });

      let finalMsg = finalResponse.choices[0].message;
      if (finalMsg && finalMsg.content) {
        finalMsg.content = finalMsg.content.replace(/<function[^>]*>.*?<\/function>/gi, '').trim();
      }
      return finalMsg;
    }

    if (message && message.content) {
      message.content = message.content.replace(/<function[^>]*>.*?<\/function>/gi, '').trim();
    }
    return message;
  } catch (error) {
    console.error('Groq chat error:', error);
    throw new Error(`Groq API Error: ${error.message}`);
  }
};

module.exports = {
  handleChat
};
