"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type SubmitState =
  | { type: "idle" }
  | { type: "success"; evaluationId: string }
  | { type: "error"; message: string };

export default function UploadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "idle" });
  const [score, setScore] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ type: "idle" });
    setScore(null);
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/evaluations", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to submit evaluation");
      }

      setSubmitState({
        type: "success",
        evaluationId: data.evaluation_id,
      });
      form.reset();
    } catch (error) {
      setSubmitState({
        type: "error",
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (submitState.type !== "success") {
      return;
    }
    const evaluationId = submitState.evaluationId;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function checkStatus() {
      const response = await fetch(`/api/evaluations/${evaluationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to check evaluation status");
      }

      if (cancelled) {
        return;
      }

      if (data.status === "completed" && data.result?.score !== undefined) {
        setScore(data.result.score);
        setStatusMessage("Evaluation completed");
        if (intervalId) {
          clearInterval(intervalId);
        }
        return;
      }

      if (data.status === "failed") {
        setStatusMessage(data.error ?? "Evaluation failed");
        if (intervalId) {
          clearInterval(intervalId);
        }
        return;
      }

      setStatusMessage(`Current status: ${data.status}`);
    }

    checkStatus().catch((error) => {
      setStatusMessage(error instanceof Error ? error.message : "Status check failed");
    });

    intervalId = setInterval(() => {
      checkStatus().catch((error) => {
        setStatusMessage(error instanceof Error ? error.message : "Status check failed");
      });
    }, 2500);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [submitState]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6">
      <main className="w-full max-w-2xl rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Upload Resume</h1>
          <Link href="/" className="text-sm text-zinc-900 underline">
            Back Home
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          method="post"
          action="/api/evaluations"
          encType="multipart/form-data"
          className="space-y-4"
        >
          <div>
            <label htmlFor="resume" className="mb-1 block text-zinc-900 text-sm font-medium">
              Resume (PDF)
            </label>
            <input
              id="resume"
              name="resume"
              type="file"
              accept="application/pdf"
              required
              className="block w-full text-zinc-900 rounded border p-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="job_description"
              className="mb-1 block text-zinc-900 text-sm font-medium"
            >
              Job Description
            </label>
            <textarea
              id="job_description"
              name="job_description"
              required
              rows={8}
              className="block w-full text-zinc-900 rounded border p-2 text-sm"
              placeholder="Paste the job description here..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Evaluation"}
          </button>
        </form>

        {submitState.type === "success" && (
          <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">
            Submitted successfully. Evaluation ID: {submitState.evaluationId}
          </p>
        )}

        {statusMessage && (
          <p className="mt-4 rounded bg-zinc-100 p-3 text-sm text-zinc-700">
            {statusMessage}
          </p>
        )}

        {score !== null && (
          <p className="mt-4 rounded bg-blue-50 p-3 text-sm font-semibold text-blue-700">
            Score: {score}
          </p>
        )}

        {submitState.type === "error" && (
          <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {submitState.message}
          </p>
        )}
      </main>
    </div>
  );
}
