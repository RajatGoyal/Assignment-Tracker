const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

router.use(requireAuth);


// Derived status: a submission is "Missed" if pending and past deadline
function deriveStatus(rawStatus, deadline) {
  if (rawStatus === "Submitted") return "Submitted";
  if (deadline && new Date(deadline).getTime() < Date.now()) return "Missed";
  return "Pending";
}


// ================= CURRENT USER =================
// Used by the frontend to hydrate role/name after login (the token cookie is
// httpOnly, so JS can't read the JWT payload itself).
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "name email role").lean();
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= LIST MY CLASSES =================
// Teacher: classes I own
// Student: classes I'm enrolled in
router.get("/classes", async (req, res) => {
  try {
    if (req.user.role === "teacher") {
      const classes = await Class.find({ teacherId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();
      return res.json(classes);
    }

    const enrollments = await Enrollment.find({ studentId: req.user.id })
      .populate("classId")
      .lean();
    const classes = enrollments
      .filter(e => e.classId)
      .map(e => ({ ...e.classId, joinedAt: e.joinedAt }));

    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= JOIN CLASS BY CODE (student) =================
router.post("/classes/join", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can join classes" });
    }

    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ message: "Join code required" });

    const cls = await Class.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!cls) return res.status(404).json({ message: "Invalid join code" });

    const existing = await Enrollment.findOne({
      studentId: req.user.id,
      classId: cls._id
    });
    if (existing) {
      return res.status(200).json({ message: "Already enrolled", classId: cls._id });
    }

    await Enrollment.create({ studentId: req.user.id, classId: cls._id });
    res.status(201).json({ message: "Joined", classId: cls._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= MY ASSIGNMENTS (student) =================
// Returns all assignments in classes I'm enrolled in, joined with my submission state.
router.get("/assignments", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Students only" });
    }

    const enrollments = await Enrollment.find({ studentId: req.user.id }).lean();
    const classIds = enrollments.map(e => e.classId);
    if (classIds.length === 0) return res.json([]);

    const assignments = await Assignment.find({ classId: { $in: classIds } })
      .populate("classId", "name subject")
      .sort({ deadline: 1 })
      .lean();

    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId: req.user.id
    }).lean();
    const subByAssignment = new Map(submissions.map(s => [String(s.assignmentId), s]));

    const result = assignments.map(a => {
      const sub = subByAssignment.get(String(a._id));
      const rawStatus = sub ? sub.status : "Pending";
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        deadline: a.deadline,
        priority: a.priority,
        classId: a.classId?._id,
        className: a.classId?.name,
        subject: a.classId?.subject,
        status: deriveStatus(rawStatus, a.deadline),
        submission: sub
          ? { content: sub.content, linkUrl: sub.linkUrl, submittedAt: sub.submittedAt }
          : null
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
