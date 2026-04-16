const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["Pending", "Submitted"],
    default: "Pending"
  },
  content: {
    type: String,
    default: ""
  },
  linkUrl: {
    type: String,
    default: ""
  },
  submittedAt: {
    type: Date,
    default: null
  }
});

SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Submission", SubmissionSchema);
