const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle JSON requests
app.use(express.json());

// API Key (consider using environment variables for sensitive info)
const apiKey = 'HDEV-bf3ea3ae-86ae-4b39-877d-1ef3806fef8a';

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
                'Authorization': apiKey
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account data' });
    }
});

app.get('/api/mmr/:puuid', async (req, res) => {
    const { puuid } = req.params;

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/eu/${puuid}?season=e9a1`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        // Check if current_data exists
        if (response.data.data && response.data.data.current_data) {
            res.json(response.data.data.current_data);
        } else {
            res.status(404).json({ message: 'current_data is missing in the response' });
        }
    } catch (error) {
        console.error('Error fetching MMR data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});