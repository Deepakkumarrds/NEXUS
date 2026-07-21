const axios = require('axios');

const ACCESS_TOKEN = 'IGAAOyZB1JfMbZABZAGFBUUVILXpHcGt0dE1tdnJrbVZAGOUwxLUZAPdVh2MmE3OUdoUExDM0FSUkUwd2ZALYVloenFqQlJJM2luZAWdNc1NyOWZAZAMkxBWHVmcmlsMDBicXpiUkpLaUdVQy1uX3gydVQxMHU1OEFJWXhSUU1zRFJTN0cwdwZDZD';
const IG_USER_ID = '27366207476408055'; 

async function testInstagramAPI() {
    try {
        console.log('Testing Instagram API connection...');
        
        // 1. Fetch user details to verify token (using the endpoint from your screenshot)
        const userRes = await axios.get(`https://graph.instagram.com/v20.0/me?fields=id,name,username&access_token=${ACCESS_TOKEN}`);
        console.log('✅ Connection successful!');
        console.log('--- User Details ---');
        console.log(userRes.data);

        // 2. Fetch recent media (optional, just to show it works)
        const mediaRes = await axios.get(`https://graph.instagram.com/v20.0/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${ACCESS_TOKEN}`);
        console.log('\n--- Recent Media (Top 3) ---');
        console.log(mediaRes.data.data ? mediaRes.data.data.slice(0, 3) : 'No media found.');

        console.log('\n--- Posting & Scheduling Info ---');
        console.log('NOTE: To actually post or schedule, you usually need to use the Instagram Graph API via `graph.facebook.com/{ig_user_id}/media`.');
        console.log('Below is the commented-out code for how you would create a post once you have a public image URL.');
        
        /*
        // --- HOW TO POST AN IMAGE ---
        const imageUrl = 'https://example.com/your-image.jpg'; // Must be a public URL
        const caption = 'Test post from RDS Dashboard!';
        
        // Step A: Create Media Container
        console.log('Creating media container...');
        const containerRes = await axios.post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media`, {
            image_url: imageUrl,
            caption: caption,
            access_token: ACCESS_TOKEN
        });
        const creationId = containerRes.data.id;
        console.log('Media Container ID:', creationId);
        
        // Step B: Publish the container
        console.log('Publishing media...');
        const publishRes = await axios.post(`https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`, {
            creation_id: creationId,
            access_token: ACCESS_TOKEN
        });
        console.log('Published! Post ID:', publishRes.data.id);
        */

    } catch (error) {
        console.error('❌ Error testing Instagram API:', error.response ? error.response.data : error.message);
    }
}

testInstagramAPI();
