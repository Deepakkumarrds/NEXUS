const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.postToInstagram = async (req, res) => {
    try {
        const { imageUrl, caption, socialHandleId } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ status: 'error', message: 'Image URL is required' });
        }
        
        if (!socialHandleId) {
            return res.status(400).json({ status: 'error', message: 'Instagram Account (Social Handle ID) is required' });
        }

        // Fetch the social handle from DB to get the token
        const handle = await prisma.socialHandle.findUnique({
            where: { id: socialHandleId }
        });

        if (!handle || handle.platform !== 'Instagram' || !handle.access_token) {
            return res.status(400).json({ status: 'error', message: 'Invalid or missing Instagram connection credentials for this account.' });
        }

        const ACCESS_TOKEN = handle.access_token;
        const IG_USER_ID = handle.platform_account_id || 'me';

        console.log(`Attempting to post to Instagram. Image: ${imageUrl}`);

        // Step 1: Create Media Container
        const containerRes = await axios.post(`https://graph.instagram.com/v20.0/${IG_USER_ID}/media`, {
            image_url: imageUrl,
            caption: caption || '',
            access_token: ACCESS_TOKEN
        });

        const creationId = containerRes.data.id;
        
        if (!creationId) {
            throw new Error('Failed to create media container. No ID returned.');
        }

        console.log(`Media container created: ${creationId}. Waiting 5 seconds for Instagram to process the image...`);

        // Wait 5 seconds to give Instagram time to process the image container
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 2: Publish the Container
        console.log(`Publishing container...`);
        const publishRes = await axios.post(`https://graph.instagram.com/v20.0/${IG_USER_ID}/media_publish`, {
            creation_id: creationId,
            access_token: ACCESS_TOKEN
        });

        const postId = publishRes.data.id;
        
        res.status(200).json({
            status: 'success',
            message: 'Successfully posted to Instagram!',
            postId: postId
        });

    } catch (error) {
        console.error('Error posting to Instagram:', error.response ? error.response.data : error.message);
        const errorMsg = error.response?.data?.error?.message || error.message || 'Unknown error occurred';
        res.status(500).json({ status: 'error', message: `Failed to post: ${errorMsg}` });
    }
};
