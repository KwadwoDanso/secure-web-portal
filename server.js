// DEPENDENCIES
require("dotenv").config();
const express = require("express");
const app = express();
const passport = require("./config/passport");
const connectDB = require("./config/connection");
const userRoutes = require("./routes/userRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");

// Local Environmental Variables
const PORT = process.env.PORT || 3001;

// DATABASE
connectDB();

// MIDDLEWARE
app.use(express.json());
app.use(passport.initialize());

// ROUTES
app.get("/", (req, res) => {
    res.send("Innovate Inc. Portal API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

// PORT
app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});