import mongoose, { Model, Schema } from "mongoose";

export type EvaluationStatus = "queued" | "processing" | "completed" | "failed";
export type EvaluationVerdict = "strong_fit" | "moderate_fit" | "weak_fit";

export interface Evaluation {
  evaluationId: string;
  status: EvaluationStatus;
  resumeFileName: string;
  resumeMimeType: string;
  resumeText: string;
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
    resumeFileName: { type: String, required: true },
    resumeMimeType: { type: String, required: true },
    resumeText: { type: String, required: true },
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
