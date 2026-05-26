// DEPENDENCIES
const router = require("express").Router();
const User = require("../models/User");
const { signToken } = require("../utils/auth");

// REGISTER - POST /api/users/register
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "A user with this email already exists" });
        }

        // Create new user - pre-save hook hashes password
        const user = await User.create({ username, email, password });
        const token = signToken(user);

        // Respond without password
        res.status(201).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error registering user: ", error);
        res.status(400).json({ message: error.message });
    }
});

// LOGIN - POST /api/users/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Incorrect email or password." });
        }

        // Check if user has a password (GitHub-only users won't)
        if (!user.password) {
            return res.status(400).json({ message: "This account uses GitHub login." });
        }

        const correctPw = await user.isCorrectPassword(password);
        if (!correctPw) {
            return res.status(400).json({ message: "Incorrect email or password." });
        }

        const token = signToken(user);

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error logging in: ", error);
        res.status(500).json({ message: error.message });
    }
});

// GITHUB OAUTH - GET /api/users/auth/github
const passport = require("../config/passport");

router.get(
    "/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
);

// GITHUB CALLBACK - GET /api/users/auth/github/callback
router.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/", session: false }),
    (req, res) => {
        // req.user is set by Passport after successful GitHub auth
        const token = signToken(req.user);
        // Return token to the client via redirect with query parameter
        res.redirect("http://localhost:3001/?token=" + token);
    }
);

module.exports = router;