import { Queue } from "bullmq";
import IORedis from "ioredis";
import { EvaluationQueueJob } from "@/lib/queue/types";

const REDIS_URL = process.env.REDIS_URL ?? "";
const EVALUATION_QUEUE_NAME =
  process.env.BULLMQ_QUEUE_NAME ?? "resume-evaluation-queue";

let redisConnection: IORedis | null = null;
let evaluationQueue: Queue<EvaluationQueueJob> | null = null;

function getRedisConnection(): IORedis {
  if (!REDIS_URL) {
    throw new Error("Missing REDIS_URL in environment variables");
  }

  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return redisConnection;
}

export function getEvaluationQueue(): Queue<EvaluationQueueJob> {
  if (!evaluationQueue) {
    evaluationQueue = new Queue<EvaluationQueueJob>(EVALUATION_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1500,
        },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    });
  }

  return evaluationQueue;
}

export async function enqueueEvaluationJob(payload: EvaluationQueueJob) {
  const queue = getEvaluationQueue();
  return queue.add("evaluate-resume", payload, {
    jobId: payload.evaluationId,
  });
}

