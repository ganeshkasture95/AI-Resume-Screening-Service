import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { connectToDatabase } from "@/lib/db/mongoose";
import { evaluateWithGemini } from "@/lib/llm/gemini";
import { EvaluationModel } from "@/lib/models/Evaluation";
import { EvaluationQueueJob } from "@/lib/queue/types";

const REDIS_URL = process.env.REDIS_URL;
const EVALUATION_QUEUE_NAME =
  process.env.BULLMQ_QUEUE_NAME ?? "resume-evaluation-queue";
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? "2");

if (!REDIS_URL) {
  throw new Error("Missing REDIS_URL in environment variables");
}

const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

async function processEvaluationJob(jobData: EvaluationQueueJob) {
  await connectToDatabase();

  const evaluation = await EvaluationModel.findOne({
    evaluationId: jobData.evaluationId,
  });

  if (!evaluation) {
    throw new Error(`Evaluation not found: ${jobData.evaluationId}`);
  }

  if (evaluation.status === "completed") {
    return;
  }

  evaluation.status = "processing";
  evaluation.error = undefined;
  await evaluation.save();

  try {
    const resumeText = evaluation.resumeText?.trim();
    if (!resumeText) {
      throw new Error("Resume text is empty. Cannot evaluate candidate.");
    }

    const result = await evaluateWithGemini({
      resumeText,
      jobDescription: evaluation.jobDescription,
    });

    evaluation.status = "completed";
    evaluation.score = result.score;
    evaluation.verdict = result.verdict;
    evaluation.missingRequirements = result.missing_requirements;
    evaluation.justification = result.justification;
    evaluation.error = undefined;
    await evaluation.save();
  } catch (error) {
    evaluation.status = "failed";
    evaluation.error = error instanceof Error ? error.message : String(error);
    await evaluation.save();
    throw error;
  }
}

const worker = new Worker<EvaluationQueueJob>(
  EVALUATION_QUEUE_NAME,
  async (job) => processEvaluationJob(job.data),
  {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY,
  },
);

worker.on("ready", () => {
  console.log(`Worker ready on queue: ${EVALUATION_QUEUE_NAME}`);
});

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Job failed: ${job?.id ?? "unknown"} - ${error.message}`);
});

