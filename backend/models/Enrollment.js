const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    index: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

EnrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
