// DEPENDENCIES
const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

// SCHEMA - supports both local auth and GitHub OAuth
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+@.+\..+/, "Must match an email address!"],
    },
    password: {
        type: String,
        minlength: 5,
        // NOT required — GitHub users won't have a password
    },
    githubId: {
        type: String,
        // NOT required — local users won't have a githubId
    },
});

// PRE-SAVE HOOK - hash password only if it exists
userSchema.pre("save", async function () {
    if (this.isNew || this.isModified("password")) {
        if (this.password) {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }
    //next();
});

// INSTANCE METHOD - compare password
userSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// MODEL
const User = model("User", userSchema);
module.exports = User;