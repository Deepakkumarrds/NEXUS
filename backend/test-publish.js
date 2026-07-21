const axios = require('axios');
const ACCESS_TOKEN = 'IGAAOyZB1JfMbZABZAGFBUUVILXpHcGt0dE1tdnJrbVZAGOUwxLUZAPdVh2MmE3OUdoUExDM0FSUkUwd2ZALYVloenFqQlJJM2luZAWdNc1NyOWZAZAMkxBWHVmcmlsMDBicXpiUkpLaUdVQy1uX3gydVQxMHU1OEFJWXhSUU1zRFJTN0cwdwZDZD';

async function testPostAndPublish() {
    try {
        console.log('1. Creating media container...');
        const res = await axios.post(`https://graph.instagram.com/v20.0/me/media`, {
            image_url: 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?auto=format&fit=crop&q=80&w=1000',
            caption: 'test publish',
            access_token: ACCESS_TOKEN
        });
        const creationId = res.data.id;
        console.log('Container created! ID:', creationId);

        console.log('2. Waiting 5 seconds for processing...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('3. Publishing container...');
        const publishRes = await axios.post(`https://graph.instagram.com/v20.0/me/media_publish`, {
            creation_id: creationId,
            access_token: ACCESS_TOKEN
        });
        console.log('Success!', publishRes.data);
    } catch (e) {
        console.log('Error:', e.response ? e.response.data : e.message);
    }
}
testPostAndPublish();
