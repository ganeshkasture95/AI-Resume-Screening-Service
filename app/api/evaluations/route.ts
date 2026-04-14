import { connectToDatabase } from "@/lib/db/mongoose";
import { EvaluationModel } from "@/lib/models/Evaluation";
import { PDFParse } from "pdf-parse";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

async function extractResumeText(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text?.trim() ?? "";
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const resume = formData.get("resume");
        const jobDescription = formData.get("job_description");

        if (!(resume instanceof File)) {
            return Response.json(
                { error: "Missing resume file. Use form-data key 'resume'." },
                { status: 400 },
            );
        }

        if (resume.type !== "application/pdf") {
            return Response.json(
                { error: "Invalid resume file type. Only PDF is allowed." },
                { status: 400 },
            );
        }

        if (typeof jobDescription !== "string" || !jobDescription.trim()) {
            return Response.json(
                { error: "Missing job description. Use form-data key 'job_description'." },
                { status: 400 },
            );
        }

        const resumeText = await extractResumeText(resume);
        if (!resumeText) {
            return Response.json(
                { error: "Could not extract text from the PDF resume." },
                { status: 400 },
            );
        }

        await connectToDatabase();

        const evaluationId = uuidv4();
        await EvaluationModel.create({
            evaluationId,
            status: "queued",
            resumeFileMeta: {
                fileName: resume.name,
                mimeType: resume.type,
                storageRef: `uploads/${evaluationId}.pdf`,
            },
            resumeText,
            jobDescription: jobDescription.trim(),
            missingRequirements: [],
        });

        return Response.json(
            { evaluation_id: evaluationId, status: "queued" },
            { status: 202 },
        );
    } catch (error) {
        return Response.json(
            {
                error:
                    error instanceof Error ? error.message : "Unexpected server error",
            },
            { status: 500 },
        );
    }
}