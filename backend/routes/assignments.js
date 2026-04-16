const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const Submission = require("../models/Submission");
const requireAuth = require("../middleware/auth");

router.use(requireAuth);


function deriveStatus(rawStatus, deadline) {
  if (rawStatus === "Submitted") return "Submitted";
  if (deadline && new Date(deadline).getTime() < Date.now()) return "Missed";
  return "Pending";
}


// ================= GET ONE ASSIGNMENT (role-aware) =================
// Teacher (owner): assignment + all submissions table
// Student (enrolled): assignment + own submission
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("classId", "name subject teacherId")
      .lean();
    if (!assignment) return res.status(404).json({ message: "Not found" });

    const cls = assignment.classId;
    const isTeacher = req.user.role === "teacher" && String(cls.teacherId) === req.user.id;

    if (isTeacher) {
      const enrollments = await Enrollment.find({ classId: cls._id })
        .populate("studentId", "name email")
        .lean();
      const submissions = await Submission.find({ assignmentId: assignment._id }).lean();
      const subByStudent = new Map(submissions.map(s => [String(s.studentId), s]));

      const rows = enrollments.map(e => {
        const sub = subByStudent.get(String(e.studentId._id));
        const rawStatus = sub ? sub.status : "Pending";
        return {
          studentId: e.studentId._id,
          name: e.studentId.name,
          email: e.studentId.email,
          status: deriveStatus(rawStatus, assignment.deadline),
          submittedAt: sub?.submittedAt || null,
          content: sub?.content || "",
          linkUrl: sub?.linkUrl || ""
        };
      });

      const total = rows.length;
      const submitted = rows.filter(r => r.status === "Submitted").length;

      return res.json({
        ...assignment,
        viewerRole: "teacher",
        submissions: rows,
        stats: { total, submitted, pctSubmitted: total ? Math.round((submitted / total) * 100) : 0 }
      });
    }

    if (req.user.role === "student") {
      const enrollment = await Enrollment.findOne({
        classId: cls._id,
        studentId: req.user.id
      }).lean();
      if (!enrollment) return res.status(403).json({ message: "Forbidden" });

      const sub = await Submission.findOne({
        assignmentId: assignment._id,
        studentId: req.user.id
      }).lean();

      const rawStatus = sub ? sub.status : "Pending";
      return res.json({
        ...assignment,
        viewerRole: "student",
        status: deriveStatus(rawStatus, assignment.deadline),
        submission: sub
          ? { status: sub.status, content: sub.content, linkUrl: sub.linkUrl, submittedAt: sub.submittedAt }
          : { status: "Pending", content: "", linkUrl: "", submittedAt: null }
      });
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= UPSERT MY SUBMISSION (student) =================
router.put("/:id/submission", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Students only" });
    }

    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).json({ message: "Not found" });

    const enrollment = await Enrollment.findOne({
      classId: assignment.classId,
      studentId: req.user.id
    }).lean();
    if (!enrollment) return res.status(403).json({ message: "Forbidden" });

    const { status, content, linkUrl } = req.body;
    const normalizedStatus = status === "Submitted" ? "Submitted" : "Pending";

    const update = {
      status: normalizedStatus,
      content: content || "",
      linkUrl: linkUrl || "",
      submittedAt: normalizedStatus === "Submitted" ? new Date() : null
    };

    const submission = await Submission.findOneAndUpdate(
      { assignmentId: assignment._id, studentId: req.user.id },
      { $set: update, $setOnInsert: { assignmentId: assignment._id, studentId: req.user.id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});


module.exports = router;
