// DEPENDENCIES
require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/connection");

// Local Environmental Variables
const PORT = process.env.PORT || 3001;

// DATABASE
connectDB();

// MIDDLEWARE
app.use(express.json());

// ROUTES
app.get("/", (req, res) => {
    res.send("Innovate Inc. Portal API is running...");
});

// PORT
app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});