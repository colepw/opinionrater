require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for Supabase on Render
    },
});

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
    if (!opinion) {
        return res.status(400).json({ error: "Opinion is required" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO opinions (text) VALUES ($1) RETURNING *",
            [opinion]
        );
        res.json({ success: true, opinion: result.rows[0] });
    } catch (error) {
        console.error("Error submitting opinion:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Get a Random Opinion
app.get('/get-opinion', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM opinions ORDER BY RANDOM() LIMIT 1"
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No opinions found" });
        }

        res.json({ id: result.rows[0].id, opinion: result.rows[0].text });
    } catch (error) {
        console.error("Error fetching random opinion:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Submit a Rating
app.post('/submit-rating', async (req, res) => {
    const { opinionId, rating } = req.body;
    if (!opinionId || !rating) {
        return res.status(400).json({ error: "Opinion ID and rating are required" });
    }

    try {
        await pool.query(
            "INSERT INTO ratings (opinion_id, rating) VALUES ($1, $2)",
            [opinionId, rating]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error submitting rating:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Get Ratings for an Opinion
app.get('/get-ratings/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const ratingCounts = await pool.query(`
            SELECT rating, COUNT(*) as count 
            FROM ratings WHERE opinion_id = $1 
            GROUP BY rating ORDER BY rating
        `, [id]);

        const avgRating = await pool.query(`
            SELECT AVG(rating) as average 
            FROM ratings WHERE opinion_id = $1
        `, [id]);

        const ratingsArray = [0, 0, 0, 0, 0];
        ratingCounts.rows.forEach(row => {
            ratingsArray[row.rating - 1] = parseInt(row.count);
        });

        res.json({ ratings: ratingsArray, average: avgRating.rows[0].average || 0 });
    } catch (error) {
        console.error("Error fetching ratings:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
