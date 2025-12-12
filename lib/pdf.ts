// Option A: with esModuleInterop enabled
import pdfParse from "pdf-parse";

// console.log(pdf);
// Option B instead:
// import pdf = require("pdf-parse");

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const pdfData = await pdfParse(pdfBuffer);
  //   const data = await pdf(pdfBuffer);
  return pdfData.text;
  return "hi";
}
