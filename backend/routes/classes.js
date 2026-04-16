const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

router.use(requireAuth);

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateJoinCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function generateUniqueJoinCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateJoinCode();
    const existing = await Class.findOne({ joinCode: code }).lean();
    if (!existing) return code;
  }
  throw new Error("Could not generate unique join code");
}


// ================= CREATE CLASS (teacher) =================
router.post("/", requireRole("teacher"), async (req, res) => {
  try {
    const { name, subject } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ message: "Name and subject required" });
    }

    const joinCode = await generateUniqueJoinCode();
    const created = await Class.create({
      name: name.trim(),
      subject: subject.trim(),
      teacherId: req.user.id,
      joinCode
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET CLASS DETAIL =================
// Teacher (owner): full detail with roster + assignments
// Student (enrolled): assignments only
router.get("/:id", async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).lean();
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const isTeacher = req.user.role === "teacher" && String(cls.teacherId) === req.user.id;

    let isStudent = false;
    if (!isTeacher && req.user.role === "student") {
      const enrollment = await Enrollment.findOne({
        classId: cls._id,
        studentId: req.user.id
      }).lean();
      isStudent = !!enrollment;
    }

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const assignments = await Assignment.find({ classId: cls._id })
      .sort({ deadline: 1 })
      .lean();

    let roster = [];
    if (isTeacher) {
      const enrollments = await Enrollment.find({ classId: cls._id })
        .populate("studentId", "name email")
        .lean();
      roster = enrollments.map(e => ({
        _id: e.studentId._id,
        name: e.studentId.name,
        email: e.studentId.email,
        joinedAt: e.joinedAt
      }));
    }

    res.json({
      ...cls,
      assignments,
      roster,
      viewerRole: isTeacher ? "teacher" : "student"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= CREATE ASSIGNMENT IN CLASS (teacher) =================
router.post("/:id/assignments", requireRole("teacher"), async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).lean();
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (String(cls.teacherId) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, description, deadline, priority } = req.body;
    if (!title || !deadline) {
      return res.status(400).json({ message: "Title and deadline required" });
    }

    const created = await Assignment.create({
      classId: cls._id,
      createdBy: req.user.id,
      title: title.trim(),
      description: description || "",
      deadline,
      priority: priority || "Medium"
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});


module.exports = router;
