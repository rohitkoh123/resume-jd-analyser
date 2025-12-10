import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Read multipart/form-data
    const formData = await req.formData();

    const jobDescription = formData.get("jobDescription") as string;
    const resumeFile = formData.get("resume") as File;

    if (!jobDescription || !resumeFile) {
      return NextResponse.json(
        { error: "Missing jobDescription or resume PDF" },
        { status: 400 }
      );
    }

    // Convert PDF file to Buffer so we can process it
    const arrayBuffer = await resumeFile.arrayBuffer();
    const pdfBytes = Buffer.from(arrayBuffer);

    // TODO: Extract text from PDF using pdf-parse, pdfjs, etc.
    // Example:
    // const resumeText = await extractTextFromPdf(pdfBytes);

    // For now, pretend resumeText = "mock text"
    const resumeText = "This is mock parsed PDF text";

    // TODO: Replace this mock with a real call to your AI/Kestra workflow
    const mockResult = {
      match_score: 72,
      job_summary: [
        "Hiring for a QA engineer in a modern SaaS environment.",
        "Requires experience with test automation tools and CI/CD pipelines.",
      ],
      resume_summary: [
        "Candidate has experience with automated testing and scripting.",
        "Some exposure to cloud-native tools and version control.",
      ],
      matched_points: [
        "Automation testing experience.",
        "Comfortable working in agile teams.",
      ],
      missing_skills: ["Playwright", "SSRS", "Advanced CI/CD configuration"],
      suggested_resume_bullets: [
        "Implemented automated end-to-end tests for core product workflows.",
        "Collaborated with developers to integrate automated tests into CI pipelines.",
        "Documented test cases and contributed to improving QA coverage reporting.",
      ],
    };

    return NextResponse.json(mockResult);
  } catch (err: any) {
    console.error("Error analysing resume:", err);
    return NextResponse.json(
      { error: "Failed to analyse resume" },
      { status: 500 }
    );
  }
}
