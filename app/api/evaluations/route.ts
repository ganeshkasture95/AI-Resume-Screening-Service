import { connectToDatabase } from "@/lib/db/mongoose";
import { EvaluationModel } from "@/lib/models/Evaluation";
import { enqueueEvaluationJob } from "@/lib/queue/bull";
import { PDFParse } from "pdf-parse";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

async function extractResumeText(file: File): Promise<string> {
    if (file.size === 0) {
        throw new Error("uploaded PDF is empty");
    }

    const bytes = await file.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(bytes) });
    const result = await parser.getText();
    await parser.destroy();

    const text = result.text?.trim() ?? "";

    if (!text) {
        throw new Error("no readable text found in PDF");
    }

    return text;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const resume = formData.get("resume");
        const jobDescription = formData.get("job_description");

        if (!(resume instanceof File)) {
            return Response.json({ error: "resume file is required" }, { status: 400 });
        }

        if (resume.type !== "application/pdf") {
            return Response.json({ error: "only PDF files are allowed" }, { status: 400 });
        }

        if (typeof jobDescription !== "string" || !jobDescription.trim()) {
            return Response.json({ error: "job_description is required" }, { status: 400 });
        }

        const resumeText = await extractResumeText(resume);
        if (!resumeText) {
            return Response.json({ error: "could not read resume text" }, { status: 400 });
        }

        await connectToDatabase();

        const evaluationId = uuidv4();
        await EvaluationModel.create({
            evaluationId,
            status: "queued",
            resumeFileMeta: {
                fileName: resume.name,
                mimeType: resume.type || "application/pdf",
                storageRef: `uploads/${evaluationId}.pdf`,
            },
            resumeText,
            jobDescription: jobDescription.trim(),
            missingRequirements: [],
        });

        await enqueueEvaluationJob({ evaluationId });

        return Response.json(
            { evaluation_id: evaluationId, status: "queued" },
            { status: 202 },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "unexpected error";
        console.error("POST /api/evaluations failed:", error);
        return Response.json({ error: message }, { status: 500 });
    }
}