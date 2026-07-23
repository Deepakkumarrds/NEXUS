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

module.exports = {
  sendCliqNotification,
};

