import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/pdf";

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

    // console.log(">>>>>>>>", jobDescription);

    // File -> ArrayBuffer -> Buffer

    console.log("resumeFile", resumeFile);
    const arrayBuffer = await resumeFile.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const resumeText = await extractTextFromPdf(pdfBuffer);

    // Convert PDF file to Buffer so we can process it

    // TODO: Extract text from PDF using pdf-parse, pdfjs, etc.
    // Example:
    // const resumeText = await extractTextFromPdf(pdfBytes);

    // For now, pretend
    // const resumeText = "mock text";

    // 🔥 REAL KESTRA CALL (Ping Test)
    const kestraUrl = process.env.KESTRA_URL!;
    // console.log("hiiiii", kestraUrl);
    const webhookKey = process.env.KESTRA_WEBHOOK_KEY!;

    if (!kestraUrl || !webhookKey) {
      console.error("Missing KESTRA_URL or KESTRA_WEBHOOK_KEY env vars");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }
    const webhookUrl = `${kestraUrl}/api/v1/main/executions/webhook/hackathon.ai/resume_jd_gemini_echo/${webhookKey}?wait=true`;
    console.log("Calling Kestra Webhook:", webhookUrl);

    // For ping test you don't need any body, but you can send an empty object too
    const kestraResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resume: resumeText,
        jobDescription: jobDescription,
      }),
    });

    // // Kestra returns execution details
    if (!kestraResponse.ok) {
      const text = await kestraResponse.text();
      console.error("Kestra error:", kestraResponse.status, text);
      return NextResponse.json(
        { error: "Kestra call failed", details: text },
        { status: 502 }
      );
    }

    const execution = await kestraResponse.json();
    console.log("Kestra execution:>>>>>>>", execution);

    // extraction left
    return NextResponse.json(execution);
  } catch (err: any) {
    console.error("Error analysing resume:", err);
    return NextResponse.json(
      { error: "Failed to analyse resume" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const execId = searchParams.get("id");

    if (!execId) {
      return NextResponse.json(
        { error: "Missing execution ID" },
        { status: 400 }
      );
    }

    const kestraUrl = process.env.KESTRA_URL;
    const kestraUser = process.env.KESTRA_USERNAME;
    const kestraPass = process.env.KESTRA_PASSWORD;

    if (!kestraUrl || !kestraUser || !kestraPass) {
      return NextResponse.json(
        { error: "Missing Kestra config on server" },
        { status: 500 }
      );
    }

    const resultUrl = `${kestraUrl}/api/v1/main/executions/${execId}`;

    const authHeader =
      "Basic " + Buffer.from(`${kestraUser}:${kestraPass}`).toString("base64");

    const resExec = await fetch(resultUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!resExec.ok) {
      const text = await resExec.text();
      return NextResponse.json(
        {
          error: "Kestra GET failed",
          status: resExec.status,
          body: text,
        },
        { status: 502 }
      );
    }

    const exec = await resExec.json();

    // Not finished yet
    if (exec.state?.current !== "SUCCESS") {
      return NextResponse.json({
        done: false,
        status: exec.state?.current,
      });
    }

    // Find return_result output
    const returnTask = exec.taskRunList?.find(
      (t: any) => t.taskId === "return_result"
    );

    if (!returnTask?.outputs?.value) {
      return NextResponse.json(
        {
          done: true,
          error: "No return_result output found on execution",
          rawExecution: exec,
        },
        { status: 500 }
      );
    }

    const gemini = JSON.parse(returnTask.outputs.value);

    return NextResponse.json({
      done: true,
      result: gemini,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch Kestra execution result",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
