const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let isReady = false;

const whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "session-v2" }), // Bypasses the locked folder!
    puppeteer: { 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
});

// Generate QR Code for Authentication
whatsappClient.on('qr', (qr) => {
    console.log('========================================================================');
    console.log('🚨 SCAN THIS QR CODE WITH YOUR WHATSAPP TO ENABLE AUTOMATION 🚨');
    console.log('========================================================================');
    qrcode.generate(qr, { small: true });
});

// Successful Authentication
whatsappClient.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp Automation Bot is Ready!');
});

// Authenticated but something went wrong
whatsappClient.on('auth_failure', msg => {
    console.error('❌ WhatsApp Authentication failure:', msg);
});

// Initialize the client
whatsappClient.initialize();

/**
 * Send a WhatsApp Message
 * @param {string} phoneNumber - The phone number (with country code, e.g., '919876543210')
 * @param {string} message - The message text
 */
const sendMessage = async (phoneNumber, message) => {
    if (!isReady) {
        console.error('WhatsApp client is not ready. Message not sent.');
        return false;
    }
    try {
        // Formatting the number to what whatsapp-web.js expects
        // It appends @c.us for individuals
        const chatId = `${phoneNumber}@c.us`;
        await whatsappClient.sendMessage(chatId, message);
        console.log(`WhatsApp message sent successfully to ${phoneNumber}`);
        return true;
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        return false;
    }
};

module.exports = {
    whatsappClient,
    sendMessage
};

// Graceful Shutdown to prevent Puppeteer lock errors
process.on('SIGINT', async () => {
    console.log('\nGracefully shutting down WhatsApp Client...');
    if (isReady) {
        await whatsappClient.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (isReady) {
        await whatsappClient.destroy();
    }
    process.exit(0);
});
