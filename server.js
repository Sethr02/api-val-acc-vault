const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const app = express();
const port = process.env.PORT || 3000;

// Initialize cache with a TTL (time to live) of 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 600 });

// Use CORS to allow requests from your Netlify frontend
app.use(cors({
    origin: 'https://val-acc-vault.netlify.app'
}));

// Middleware to handle JSON requests
app.use(express.json());

// API Key (consider using environment variables for sensitive info)
const apiKey = 'HDEV-bf3ea3ae-86ae-4b39-877d-1ef3806fef8a';

// Root route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// API route for fetching Valorant account data
app.get('/api/fetch-data/:name/:tagline', async (req, res) => {
    const { name, tagline } = req.params;
    const cacheKey = `fetch-data-${name}-${tagline}`;

    // Check if the data is in the cache
    if (cache.has(cacheKey)) {
        return res.json(cache.get(cacheKey));
    }

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v2/account/${name}/${tagline}`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        // Check if data exists
        if (response.data.data) {
            cache.set(cacheKey, response.data.data); // Cache the response
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
    const cacheKey = `mmr-${region}-${puuid}`;

    // Check if the data is in the cache
    if (cache.has(cacheKey)) {
        return res.json(cache.get(cacheKey));
    }

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/${region}/${puuid}`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        // Check if current_data exists
        if (response.data.data && response.data.data.current_data) {
            cache.set(cacheKey, response.data.data.current_data); // Cache the response
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
    const cacheKey = `rr-gains-losses-${region}-${puuid}`;

    // Check if the data is in the cache
    if (cache.has(cacheKey)) {
        return res.json(cache.get(cacheKey));
    }

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/stored-mmr-history/${region}/${puuid}?page=1&size=5`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        if (response.data.data) {
            cache.set(cacheKey, response.data.data); // Cache the response
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
    const cacheKey = `match-history-${region}-${puuid}`;

    // Check if the data is in the cache
    if (cache.has(cacheKey)) {
        return res.json(cache.get(cacheKey));
    }

    try {
        const response = await axios.get(`https://api.henrikdev.xyz/valorant/v1/by-puuid/stored-matches/${region}/${puuid}?mode=competitive&page=1&size=5`, {
            headers: {
                'accept': 'application/json',
                'Authorization': apiKey
            }
        });

        if (response.data.data) {
            cache.set(cacheKey, response.data.data); // Cache the response
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