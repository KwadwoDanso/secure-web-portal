// DEPENDENCIES
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

// GITHUB STRATEGY
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
            scope: ["user:email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if user exists by githubId
                let user = await User.findOne({ githubId: profile.id });
                if (user) {
                    return done(null, user);
                }

                // 2. Check if user exists by email (link accounts)
                const email =
                    profile.emails && profile.emails[0]
                        ? profile.emails[0].value
                        : null;

                if (email) {
                    user = await User.findOne({ email });
                    if (user) {
                        // Link GitHub to existing local account
                        user.githubId = profile.id;
                        await user.save();
                        return done(null, user);
                    }
                }

                // 3. Create new user
                const newUser = await User.create({
                    githubId: profile.id,
                    username: profile.username || profile.displayName,
                    email: email || profile.id + "@github.placeholder",
                });

                done(null, newUser);
            } catch (err) {
                done(err);
            }
        }
    )
);

module.exports = passport;