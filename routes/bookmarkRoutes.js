// DEPENDENCIES
const router = require("express").Router();
const Bookmark = require("../models/Bookmark");
const { authMiddleware } = require("../utils/auth");

// Apply authMiddleware to ALL bookmark routes
router.use(authMiddleware);

// CREATE - POST /api/bookmarks
router.post("/", async (req, res) => {
    try {
        const bookmark = await Bookmark.create({
            ...req.body,
            user: req.user._id,
        });
        res.status(201).json(bookmark);
    } catch (err) {
        console.error("Error creating bookmark: ", err);
        res.status(400).json({ message: err.message });
    }
});

// READ ALL - GET /api/bookmarks (only user's own)
router.get("/", async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ user: req.user._id });
        res.json(bookmarks);
    } catch (err) {
        console.error("Error fetching bookmarks: ", err);
        res.status(500).json({ message: err.message });
    }
});

// READ ONE - GET /api/bookmarks/:id (owner only)
router.get("/:id", async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            return res.status(404).json({ message: "No bookmark found with this id!" });
        }

        if (bookmark.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "User is not authorized to view this bookmark." });
        }

        res.json(bookmark);
    } catch (err) {
        console.error("Error fetching bookmark: ", err);
        res.status(500).json({ message: err.message });
    }
});

// UPDATE - PUT /api/bookmarks/:id (owner only)
router.put("/:id", async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            return res.status(404).json({ message: "No bookmark found with this id!" });
        }

        if (bookmark.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "User is not authorized to update this bookmark." });
        }

        const updatedBookmark = await Bookmark.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedBookmark);
    } catch (err) {
        console.error("Error updating bookmark: ", err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE - DELETE /api/bookmarks/:id (owner only)
router.delete("/:id", async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            return res.status(404).json({ message: "No bookmark found with this id!" });
        }

        if (bookmark.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "User is not authorized to delete this bookmark." });
        }

        await Bookmark.findByIdAndDelete(req.params.id);

        res.json({ message: "Bookmark deleted!" });
    } catch (err) {
        console.error("Error deleting bookmark: ", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;