const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");


// ================= GET ALL =================
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= ADD =================
router.post("/", async (req, res) => {
  try {
    const newAssignment = new Assignment(req.body);
    const saved = await newAssignment.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ================= UPDATE =================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


module.exports = router;