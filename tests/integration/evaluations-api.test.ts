import { GET as getEvaluationById } from "@/app/api/evaluations/[id]/route";
import { POST as createEvaluation } from "@/app/api/evaluations/route";
import { connectToDatabase } from "@/lib/db/mongoose";
import { EvaluationModel } from "@/lib/models/Evaluation";
import { enqueueEvaluationJob } from "@/lib/queue/bull";
import { PDFParse } from "pdf-parse";

jest.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock("@/lib/models/Evaluation", () => ({
  EvaluationModel: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock("@/lib/queue/bull", () => ({
  enqueueEvaluationJob: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: () => "test-evaluation-id",
}));

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn(),
}));

describe("Evaluations API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates evaluation and returns 202", async () => {
    const mockParserInstance = {
      getText: jest.fn().mockResolvedValue({ text: "resume text sample" }),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    (PDFParse as unknown as jest.Mock).mockImplementation(
      () => mockParserInstance,
    );

    const formData = new FormData();
    const file = new File(
      [new Uint8Array([37, 80, 68, 70])],
      "resume.pdf",
      { type: "application/pdf" },
    );
    formData.append("resume", file);
    formData.append("job_description", "Looking for Node.js backend engineer");

    const request = new Request("http://localhost/api/evaluations", {
      method: "POST",
      body: formData,
    });

    const response = await createEvaluation(request);
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({
      evaluation_id: "test-evaluation-id",
      status: "queued",
    });
    expect(connectToDatabase).toHaveBeenCalledTimes(1);
    expect(EvaluationModel.create).toHaveBeenCalledTimes(1);
    expect(enqueueEvaluationJob).toHaveBeenCalledWith({
      evaluationId: "test-evaluation-id",
    });
    expect(mockParserInstance.destroy).toHaveBeenCalledTimes(1);
  });

  it("returns completed evaluation details by id", async () => {
    (EvaluationModel.findOne as unknown as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        evaluationId: "eval-123",
        status: "completed",
        score: 88,
        verdict: "strong_fit",
        missingRequirements: ["AWS"],
        justification: "Solid backend match.",
        error: null,
        createdAt: "2026-04-14T10:00:00.000Z",
        updatedAt: "2026-04-14T10:05:00.000Z",
      }),
    });

    const request = new Request("http://localhost/api/evaluations/eval-123");
    const response = await getEvaluationById(request, {
      params: Promise.resolve({ id: "eval-123" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("completed");
    expect(payload.result.score).toBe(88);
    expect(payload.result.verdict).toBe("strong_fit");
    expect(payload.result.missing_requirements).toEqual(["AWS"]);
  });
});
