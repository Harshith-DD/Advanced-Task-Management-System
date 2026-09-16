import mongoose from "mongoose";
import crypto from "crypto";

const jobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomUUID(),
  },

  type: {
    type: String,
    required: true,
    enum: ["activity", "notification", "report"],
  },

  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  status: {
    type: String,
    required: true,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
    index: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  startedAt: {
    type: Date,
    default: null,
  },

  leaseId: {
    type: String,
    default: null,
  },

  completedAt: {
    type: Date,
    default: null,
  },

  failedAt: {
    type: Date,
    default: null,
  },

  error: {
    type: String,
    default: null,
  },

  attempts: {
    type: Number,
    default: 0,
  },

  maxAttempts: {
    type: Number,
    default: 3,
  },

  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
});

jobSchema.index({
  status: 1,
  createdAt: 1,
});

jobSchema.index({
  status: 1,
  startedAt: 1,
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
