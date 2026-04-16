const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const requireAuth = require("../middleware/auth");

router.use(requireAuth);


// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= ADD =================
router.post("/", async (req, res) => {
  try {
    const newAssignment = new Assignment({ ...req.body, user: req.user.id });
    const saved = await newAssignment.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ================= UPDATE =================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Assignment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


module.exports = router;
