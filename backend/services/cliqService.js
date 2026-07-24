const axios = require('axios');

/**
 * Send a notification message to Zoho Cliq via Webhook
 * @param {string|object} payload - Message text string OR object payload { text, channel, user_email }
 */
const sendCliqNotification = async (payload) => {
  const webhookUrl = process.env.ZOHO_CLIQ_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('⚠️ ZOHO_CLIQ_WEBHOOK_URL is not configured in .env');
    return false;
  }

  try {
    const data = typeof payload === 'string' ? { text: payload } : payload;
    const response = await axios.post(webhookUrl, data);
    console.log('✅ Zoho Cliq notification sent:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error sending Zoho Cliq notification:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Send an individual direct message to a specific user on Zoho Cliq by email
 * @param {string} userEmail - The user's email registered in Zoho Cliq
 * @param {string} message - The message body
 */
const sendCliqDirectMessage = async (userEmail, message) => {
  const webhookUrl = process.env.ZOHO_CLIQ_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('⚠️ ZOHO_CLIQ_WEBHOOK_URL is not configured in .env');
    return false;
  }

  try {
    // Zoho Cliq Incoming Webhooks support routing messages to a direct user chat via bot/user_email parameter
    const payload = {
      text: message,
      user_email: userEmail
    };
    const response = await axios.post(webhookUrl, payload);
    console.log(`✅ Zoho Cliq direct message sent to ${userEmail}:`, response.data);
    return true;
  } catch (error) {
    console.error(`❌ Error sending Zoho Cliq direct message to ${userEmail}:`, error.response?.data || error.message);
    return false;
  }
};

module.exports = {
  sendCliqNotification,
  sendCliqDirectMessage,
};


