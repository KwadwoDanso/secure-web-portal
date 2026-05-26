// DEPENDENCIES
const mongoose = require("mongoose");

// DATABASE CONNECTION
function connectDB() {
    mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection;
    db.on("error", (err) => console.log(err.message + " is mongo not running?"));
    db.on("connected", () => console.log("mongo connected"));
    db.on("disconnected", () => console.log("mongo disconnected"));
}

module.exports = connectDB;