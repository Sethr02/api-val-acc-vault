const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Root route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// API route for fetching Valorant account data
app.get('/fetch-data/:name/:tagline', async (req, res) => {
    const { name, tagline } = req.params;
    const apiUrl = `https://api.henrikdev.xyz/valorant/v2/account/${name}/${tagline}?force=false`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'accept': 'application/json',
                'Authorization': 'HDEV-bf3ea3ae-86ae-4b39-877d-1ef3806fef8a'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account data' });
    }
});

app.get('/fetch-mmr-data/:puuid', async (req, res) => {
    const { puuid } = req.params;

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/eu/${puuid}?season=e9a1`, {
            headers: {
                'accept': 'application/json',
                'Authorization': 'HDEV-bf3ea3ae-86ae-4b39-877d-1ef3806fef8a'
            }
        });

        const data = response.data;

        // Log the fetched MMR data to the console
        console.log('Fetched MMR Data:', data);

        res.json(data.data.current_data);
    } catch (error) {
        console.error('Error fetching MMR data:', error);
        res.status(500).json({ error: 'Failed to fetch MMR data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});