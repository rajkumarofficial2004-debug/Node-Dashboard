const https = require('https');

const API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyBpQfcquO8J7pebpyGgfa-0yhnqSx-Iy24';
const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${API_KEY}`,
    method: 'GET'
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Available models:");
                json.models.filter(m => m.name.includes('embedding')).forEach(m => console.log(m.name));
            } else {
                console.log("Response:", json);
            }
        } catch (e) {
            console.log("Error parsing:", data);
        }
    });
});

req.on('error', error => { console.error(error); });
req.end();
