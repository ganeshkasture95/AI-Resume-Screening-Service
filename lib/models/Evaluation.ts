import mongoose, { Model, Schema } from "mongoose";

export type EvaluationStatus = "queued" | "processing" | "completed" | "failed";
export type EvaluationVerdict = "strong_fit" | "moderate_fit" | "weak_fit";

export interface ResumeFileMeta {
  fileName: string;
  mimeType: string;
  storageRef: string;
}

export interface Evaluation {
  evaluationId: string;
  status: EvaluationStatus;
  resumeFileMeta: ResumeFileMeta;
  // Kept for current API compatibility while worker/storage pipeline evolves.
  resumeText?: string;
  jobDescription: string;
  score?: number;
  verdict?: EvaluationVerdict;
  missingRequirements: string[];
  justification?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationSchema = new Schema<Evaluation>(
  {
    evaluationId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      required: true,
      default: "queued",
    },
    resumeFileMeta: {
      fileName: { type: String, required: true, trim: true },
      mimeType: { type: String, required: true, trim: true },
      storageRef: { type: String, required: true, trim: true },
    },
    resumeText: { type: String },
    jobDescription: { type: String, required: true },
    score: { type: Number, min: 0, max: 100 },
    verdict: { type: String, enum: ["strong_fit", "moderate_fit", "weak_fit"] },
    missingRequirements: { type: [String], default: [] },
    justification: { type: String },
    error: { type: String },
  },
  {
    timestamps: true,
  },
);

export const EvaluationModel: Model<Evaluation> =
  (mongoose.models.Evaluation as Model<Evaluation>) ||
  mongoose.model<Evaluation>("Evaluation", evaluationSchema);
