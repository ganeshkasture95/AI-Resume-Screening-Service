import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6">
      <main className="w-full max-w-2xl rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900">
          AI Resume Screening Service
        </h1>
        <p className="mt-3 text-zinc-600">
          Upload a PDF resume and a job description to create an asynchronous
          evaluation.
        </p>
        <div className="mt-6">
          <Link
            href="/upload"
            className="inline-flex rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
          >
            Go To Upload Page
          </Link>
        </div>
      </main>
    </div>
  );
}
