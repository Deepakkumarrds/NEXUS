const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Groq = require('groq-sdk');
const axios = require('axios');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

exports.generateCalendar = async (req, res) => {
    try {
        const { clientId, platforms, campaignTheme, promotions, topics, targetAudience, toneOfVoice, brandUSP, creativeGuidelines, postCount } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required.' });
        }

        // Fetch client details to contextualize the prompt
        const client = await prisma.client.findUnique({
            where: { id: clientId }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found.' });
        }

        // Fetch live trends using Serper API
        let liveTrends = "";
        try {
            if (process.env.SERPER_API_KEY) {
                const searchQuery = `latest social media trends for ${client.industry || 'marketing'} ${new Date().getFullYear()}`;
                const serperRes = await axios.post('https://google.serper.dev/search', {
                    q: searchQuery,
                    num: 5
                }, {
                    headers: {
                        'X-API-KEY': process.env.SERPER_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                if (serperRes.data && serperRes.data.organic) {
                    const trends = serperRes.data.organic.slice(0, 4).map((res, idx) => `${idx + 1}. ${res.title}: ${res.snippet}`).join('\n');
                    liveTrends = `\nLIVE INTERNET TRENDS (Incorporate these into the content ideas where relevant):\n${trends}\n`;
                }
            }
        } catch (serperError) {
            console.error('Failed to fetch live trends from Serper:', serperError.message);
            // Continue without live trends if it fails
        }

        // Build the prompt using the dashboard data + the user's form input
        const prompt = `
You are an expert Social Media Manager for a digital agency.
Your task is to generate a comprehensive social media content calendar for a client.

CLIENT CONTEXT:
- Company Name: ${client.company_name || 'N/A'}
- Industry: ${client.industry || 'N/A'}
- Primary Objective: ${client.objective || 'Brand Awareness and Engagement'}
- Target Audience/Mindset: ${client.customer_mindset || 'General audience'}
- Services Provided: ${client.service_type || 'N/A'}

MONTHLY REQUIREMENTS:
- Target Platforms: ${platforms || 'Instagram, Facebook, LinkedIn'}
- Campaign Theme/Focus: ${campaignTheme || 'General Brand Building'}
- Key Promotional Offers: ${promotions || 'None specifically'}
- Specific Topics to Include: ${topics || 'None specifically'}
- Target Audience Focus: ${targetAudience || 'General Audience'}
- Tone of Voice: ${toneOfVoice || 'Professional and engaging'}
- Brand Unique Selling Proposition: ${brandUSP || 'Standard industry offering'}
- Creative Guidelines & Formats: ${creativeGuidelines || 'Standard mix of images and videos'}
- Total Number of Posts Needed: ${postCount || 15}
${liveTrends}
INSTRUCTIONS:
Create exactly ${postCount || 15} engaging and diverse social media posts based strictly on the client context and monthly requirements.
Ensure the tone matches the industry.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact structure, with no markdown, no backticks, and no extra text outside the JSON:
{
  "calendar": [
    {
      "date_offset": 1, 
      "platform": "Instagram",
      "content_type": "Image",
      "caption": "Your highly engaging caption here including emojis.",
      "hashtags": ["#Tag1", "#Tag2"],
      "visual_idea": "Description of the image/video to be created."
    }
  ]
}
Note: "date_offset" is the day of the month (1 to 30) for the post. Ensure you generate exactly the number of posts requested.
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: "json_object" }
        });

        let resultJson;
        try {
            resultJson = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
        } catch (e) {
            console.error("Failed to parse Groq response:", chatCompletion.choices[0]?.message?.content);
            return res.status(500).json({ error: 'AI returned invalid JSON format.' });
        }

        res.json({ success: true, data: resultJson });
    } catch (error) {
        console.error('Error generating AI calendar:', error);
        res.status(500).json({ error: 'Failed to generate calendar.', details: error.message });
    }
};
