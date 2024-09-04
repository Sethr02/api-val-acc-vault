const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors
const app = express();
const port = process.env.PORT || 3000;

// Use CORS to allow requests from your Netlify frontend
app.use(cors({
    origin: 'https://val-acc-vault.netlify.app' // Replace with your Netlify domain
}));

// Middleware to handle JSON requests
app.use(express.json());

// API Key (consider using environment variables for sensitive info)
const apiKey = 'HDEV-bf3ea3ae-86ae-4b39-877d-1ef3806fef8a';
//8a5c11e4-40a7-5450-bce2-c854f807ba37
//https://api-val-acc-vault-production.up.railway.app/api/rr-gains-losses/eu/8a5c11e4-40a7-5450-bce2-c854f807ba37
//https://api-val-acc-vault-production.up.railway.app/api/fetch-data/Seth/VNG0
// Root route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// API route for fetching Valorant account data
app.get('/api/fetch-data/:name/:tagline', async (req, res) => {
    const { name, tagline } = req.params;

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v2/account/${name}/${tagline}`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        // Check if data exists
        if (response.data.data) {
            res.json(response.data.data);
        } else {
            res.status(404).json({ message: 'Account data not found' });
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/mmr/:region/:puuid', async (req, res) => {
    const { region, puuid } = req.params;

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/${region}/${puuid}`, {
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


// API route for fetching RR gains/losses in recent matches
app.get('/api/rr-gains-losses/:region/:puuid', async (req, res) => {
    const { region, puuid } = req.params;

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/stored-mmr-history/${region}/${puuid}?page=1&size=5`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        if (response.data.data) {
            res.json(response.data.data);
        } else {
            res.status(404).json({ message: 'RR data not found' });
        }
    } catch (error) {
        console.error('Error fetching RR data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API route for fetching match history
app.get('/api/match-history/:region/:puuid', async (req, res) => {
    const { region, puuid } = req.params;

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/stored-matches/${region}/${puuid}?page=1&size=5`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        if (response.data.data) {
            res.json(response.data.data);
        } else {
            res.status(404).json({ message: 'Match history not found' });
        }
    } catch (error) {
        console.error('Error fetching match history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});