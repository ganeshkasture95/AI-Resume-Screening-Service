import { connectToDatabase } from "@/lib/db/mongoose";
import { EvaluationModel } from "@/lib/models/Evaluation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await connectToDatabase();
    const evaluation = await EvaluationModel.findOne({ evaluationId: id }).lean();

    if (!evaluation) {
      return Response.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return Response.json({
      evaluation_id: evaluation.evaluationId,
      status: evaluation.status,
      result:
        evaluation.status === "completed"
          ? {
              score: evaluation.score,
              verdict: evaluation.verdict,
              missing_requirements: evaluation.missingRequirements,
              justification: evaluation.justification,
            }
          : null,
      error: evaluation.status === "failed" ? evaluation.error : null,
      created_at: evaluation.createdAt,
      updated_at: evaluation.updatedAt,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}

