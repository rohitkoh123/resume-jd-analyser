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
    // const resumeText = "This is mock parsed PDF text";

    // 🔥 REAL KESTRA CALL (Ping Test)
    const kestraUrl = process.env.KESTRA_URL!;
    // console.log("hiiiii", kestraUrl);
    const webhookKey = process.env.KESTRA_WEBHOOK_KEY!;

    const webhookUrl = `${kestraUrl}/api/v1/main/executions/webhook/hackathon.test/ping/${webhookKey}`;

    console.log("Calling Kestra Webhook:", webhookUrl);

    // For ping test you don't need any body, but you can send an empty object too
    const kestraResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ test: "hello-from-frontend" }), // optional
    });

    // // Kestra returns execution details
    const result = await kestraResponse.json();

    console.log("Kestra Ping Response:", result);

    // // Return directly back to frontend
    return NextResponse.json(result);

    // TODO: Replace this mock with a real call to your AI/Kestra workflow
  } catch (err: any) {
    console.error("Error analysing resume:", err);
    return NextResponse.json(
      { error: "Failed to analyse resume" },
      { status: 500 }
    );
  }
}
