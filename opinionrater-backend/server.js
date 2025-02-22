// Fully updated server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require("path");
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for Supabase on Render
    },
});

// Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Submit an Opinion
app.post('/submit-opinion', async (req, res) => {
    const { opinion } = req.body;
    if (!opinion) return res.status(400).json({ error: "Opinion is required" });
    try {
        const { data, error } = await supabase.from('opinions').insert([{ text: opinion }]).select();
        if (error) throw error;
        res.json({ success: true, opinion: data[0] });
    } catch (error) {
        console.error("Error submitting opinion:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Get a Random Opinion
app.get('/get-opinion', async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_random_opinion');

        if (error) {
            console.error("Supabase Query Error:", error);
            return res.status(500).json({ error: "Supabase error", details: error });
        }
        if (!data || data.length === 0) {
            console.log("No opinions found in Supabase.");
            return res.status(404).json({ error: "No opinions found" });
        }

        res.json(data[0]);
    } catch (error) {
        console.error("Error fetching opinion:", error);
        res.status(500).json({ error: "Supabase API error" });
    }
});

// Submit a Rating
app.post('/submit-rating', async (req, res) => {
    const { opinionId, rating } = req.body;
    if (!opinionId || !rating) return res.status(400).json({ error: "Opinion ID and rating are required" });
    try {
        const { data, error } = await supabase.from('ratings').insert([{ opinion_id: opinionId, rating }]);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error("Error submitting rating:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Get Ratings for an Opinion
app.get("/get-ratings/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching ratings for opinion ID: ${id}`); // Log request ID

        const { data, error } = await supabase
            .from("ratings")
            .select("*")
            .eq("opinion_id", id);

        if (error) {
            console.error("Supabase Error:", error);
            return res.status(500).json({ error: "Supabase query error", details: error.message });
        }

        if (!data.length) {
            return res.status(404).json({ error: "No ratings found for this opinion" });
        }

        res.json({ ratings: data });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});