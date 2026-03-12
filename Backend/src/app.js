const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const scanRoutes = require("./routes/scan.routes");

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Serve Frontend static files ─────────────────────────────
// This allows the app to be opened via http://localhost:5000
// which is required for ES module imports to work correctly.
app.use(express.static(path.join(__dirname, "../../Frontend")));

// ── API Routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);   // /api/auth/send-code, /api/auth/verify-code
app.use("/api/scan", scanRoutes);   // /api/scan

// ── Catch-all: serve index.html for SPA routing ─────────────
app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(__dirname, "../../Frontend/index.html"));
    }
});

module.exports = app;
