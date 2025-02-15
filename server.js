const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const app = express();
const port = process.env.PORT || 3000;
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update, get } = require('firebase/database');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cron = require('node-cron');

// Initialize cache with a TTL (time to live) of 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 600 });

// Use CORS to allow requests from your Netlify frontend
app.use(cors({
    origin: ['https://val-acc-vault.netlify.app', 'http://localhost:5173']
}));

// Middleware to handle JSON requests
app.use(express.json());

// API Key (consider using environment variables for sensitive info)
const apiKey = 'HDEV-bf3ea3ae-86ae-4b39-877d-1ef3806fef8a';

// Root route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

const firebaseConfig = {
    apiKey: "AIzaSyAllLgyGhxcx_zdnvRGp36gcejs-4nfeNY",
    authDomain: "account-vault-bb1e9.firebaseapp.com",
    databaseURL: "https://account-vault-bb1e9-default-rtdb.firebaseio.com",
    projectId: "account-vault-bb1e9",
    storageBucket: "account-vault-bb1e9.appspot.com",
    messagingSenderId: "792643476423",
    appId: "1:792643476423:web:284b4207cd51ccb10f97e2",
    measurementId: "G-LCBXHB3C1S",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Add new endpoint
app.post('/api/update-accounts', async (req, res) => {
    const { accounts } = req.body;

    if (!accounts || !Array.isArray(accounts)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        // Process accounts in batches
        const batchSize = 5;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < accounts.length; i += batchSize) {
            const batch = accounts.slice(i, i + batchSize);

            // Process batch
            await Promise.all(batch.map(async account => {
                const { region, puuid } = account;
                const response = await axios.get(
                    `https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/${region}/${puuid}`,
                    { headers: { 'Authorization': apiKey } }
                );
                return response.data;
            }));

            // Wait 60s between batches to respect rate limit
            if (i + batchSize < accounts.length) {
                await delay(60000);
            }
        }

        res.json({ message: 'Accounts updated successfully' });
    } catch (error) {
        console.error('Error updating accounts:', error);
        res.status(500).json({ error: 'Failed to update accounts' });
    }
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

// Leaderboard update cron job - runs every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running leaderboard update...');
    try {
        // Get all accounts from leaderboard
        const leaderboardRef = ref(db, 'leaderboard');
        const snapshot = await get(leaderboardRef);

        if (!snapshot.exists()) {
            console.log('No leaderboard accounts found');
            return;
        }

        const accounts = Object.entries(snapshot.val());

        // Process accounts in batches to respect rate limits
        const batchSize = 15;

        for (let i = 0; i < accounts.length; i += batchSize) {
            const batch = accounts.slice(i, i + batchSize);

            // Process batch
            await Promise.all(batch.map(async ([puuid, account]) => {
                try {
                    const response = await axios.get(
                        `https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/${account.region}/${puuid}`,
                        { headers: { 'Authorization': apiKey } }
                    );

                    if (response.data.data && response.data.data.current_data) {
                        const mmrData = response.data.data.current_data;
                        const currentAccount = account;

                        // Check if there are meaningful changes
                        const hasRankChange = mmrData.currenttierpatched !== currentAccount.rank;
                        const hasRRChange = mmrData.ranking_in_tier !== currentAccount.rr;
                        const hasNameChange = response.data.data.name !== currentAccount.name;
                        const hasTagChange = response.data.data.tag !== currentAccount.tag;

                        // Only update if there are meaningful changes
                        if (hasRankChange || hasRRChange || hasNameChange || hasTagChange) {
                            const logEntry = {
                                timestamp: new Date().toISOString(),
                                oldRank: currentAccount.rank || 'Unknown',
                                newRank: mmrData.currenttierpatched,
                                oldRR: currentAccount.rr || 0,
                                newRR: mmrData.ranking_in_tier,
                                oldName: currentAccount.name || 'Unknown',
                                newName: response.data.data.name,
                                oldTag: currentAccount.tag || 'Unknown',
                                newTag: response.data.data.tag
                            };

                            // Update the account's data in Firebase
                            await update(ref(db, `leaderboard/${puuid}`), {
                                rank: mmrData.currenttierpatched,
                                rr: mmrData.ranking_in_tier,
                                name: response.data.data.name,
                                tag: response.data.data.tag,
                                lastUpdated: new Date().toISOString(),
                                updatesCounter: (currentAccount.updatesCounter || 0) + 1,
                                [`logs/${Date.now()}`]: logEntry
                            });

                            console.log(`Updated leaderboard account: ${response.data.data.name}#${response.data.data.tag}`);
                        } else {
                            console.log(`No meaningful changes for account: ${currentAccount.riotId}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error updating leaderboard account ${account.riotId}:`, error.message);
                }
            }));

            // Wait 60s between batches to respect rate limit
            if (i + batchSize < accounts.length) {
                await sleep(60000);
            }
        }

        // Calculate and update next scheduled update time (1 hour from now)
        const nextUpdate = Date.now() + (60 * 60 * 1000); // Current time + 1 hour in milliseconds
        await update(ref(db), {
            nextScheduledUpdate: nextUpdate.toString()
        });

        console.log('Leaderboard update completed. Next update scheduled for:', new Date(nextUpdate).toISOString());
    } catch (error) {
        console.error('Error in leaderboard update:', error);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
