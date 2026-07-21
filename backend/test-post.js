const axios = require('axios');
const ACCESS_TOKEN = 'IGAAOyZB1JfMbZABZAGFBUUVILXpHcGt0dE1tdnJrbVZAGOUwxLUZAPdVh2MmE3OUdoUExDM0FSUkUwd2ZALYVloenFqQlJJM2luZAWdNc1NyOWZAZAMkxBWHVmcmlsMDBicXpiUkpLaUdVQy1uX3gydVQxMHU1OEFJWXhSUU1zRFJTN0cwdwZDZD';

async function testPost() {
    try {
        console.log('Trying to POST to graph.instagram.com...');
        const res = await axios.post(`https://graph.instagram.com/v20.0/me/media`, {
            image_url: 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?auto=format&fit=crop&q=80&w=1000',
            caption: 'test',
            access_token: ACCESS_TOKEN
        });
        console.log('Success!', res.data);
    } catch (e) {
        console.log('Error:', e.response ? e.response.data : e.message);
    }
}
testPost();
