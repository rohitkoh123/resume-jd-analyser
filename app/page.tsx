"use client";

import React, { useState } from "react";

type AnalysisResult = {
  match_score?: number;
  job_summary?: string[];
  resume_summary?: string[];
  matched_points?: string[];
  missing_skills?: string[];
  suggested_resume_bullets?: string[];
};

export default function HomePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyse = async () => {
    setError(null);
    setResult(null);

    if (!jobDescription.trim() || !resumeFile) {
      setError("Please paste a job description and upload a resume PDF.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("resume", resumeFile); // <-- PDF file

      const res = await fetch("/api/analyse", {
        method: "POST",
        body: formData, // <-- no JSON headers, sending multipart/form-data
      });

      if (!res.ok) {
        // try to read error from server if available
        let message = "Analysis failed";
        try {
          const errJson = await res.json();
          if (errJson?.error) message = errJson.error;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Resume vs Job Description Analyser
        </h1>
        <p className="text-sm text-gray-600">
          Paste a job description and upload your resume PDF to see how well
          they match, what&apos;s missing, and suggested improvements.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {/* Job Description textarea (unchanged) */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm">Job Description</label>
          <textarea
            className="border rounded-md p-2 min-h-[220px] text-sm"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
          />
        </div>

        {/* Resume PDF upload */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm">Resume (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setResumeFile(file);
            }}
            className="border rounded-md p-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            Upload a single PDF file. The server will extract the text for
            analysis.
          </p>
          {resumeFile && (
            <p className="text-xs text-gray-700">
              Selected: <span className="font-medium">{resumeFile.name}</span>
            </p>
          )}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="px-4 py-2 rounded-md border font-medium disabled:opacity-60"
        >
          {loading ? "Analysing..." : "Analyse Match"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <section className="space-y-4 border rounded-md p-4">
          <h2 className="text-lg font-semibold">Analysis Result</h2>

          <div>
            <p className="text-3xl font-bold">
              {result.match_score ?? "-"}{" "}
              <span className="text-base">/ 100</span>
            </p>
            <p className="text-xs text-gray-500">Overall match score</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-sm mb-1">Job Summary</h3>
              <ul className="text-sm list-disc list-inside space-y-1">
                {result.job_summary?.length ? (
                  result.job_summary.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>No summary</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Resume Summary</h3>
              <ul className="text-sm list-disc list-inside space-y-1">
                {result.resume_summary?.length ? (
                  result.resume_summary.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>No summary</li>
                )}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-sm mb-1">Matched Points</h3>
              <ul className="text-sm list-disc list-inside space-y-1">
                {result.matched_points?.length ? (
                  result.matched_points.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Missing Skills</h3>
              <ul className="text-sm list-disc list-inside space-y-1">
                {result.missing_skills?.length ? (
                  result.missing_skills.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-1">
              Suggested Resume Bullets
            </h3>
            <ul className="text-sm list-disc list-inside space-y-1">
              {result.suggested_resume_bullets?.length ? (
                result.suggested_resume_bullets.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))
              ) : (
                <li>—</li>
              )}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
