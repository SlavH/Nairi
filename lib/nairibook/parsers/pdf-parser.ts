import type { ParsedDocument } from "../types"

import { parseText } from "./text-parser"

export class NoTextLayerError extends Error {
  constructor(message = "This PDF has no extractable text layer (likely a scanned document). Text-based processing is not supported for scanned PDFs at this stage.\n\nTo continue, run the PDF through a free OCR tool first — upload to Google Drive, open with Google Docs (it OCRs automatically), then export as .txt or .docx and upload the result here.\n\nYou can also use online OCR services like:\n• Google Drive (built-in OCR)\n• OnlineOCR.net\n• OCR2ED (https://ocr2ed.com)\n• Tesseract.js (if you have technical skills)\n\nAfter OCR processing, rename the output file and upload it here.") {
    super(message)
    this.name = "NoTextLayerError"
  }
}

async function renderPageToCanvas(page: any, scale = 2): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")!
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: context, viewport }).promise
  return canvas
}

export async function parsePdfWithOcr(file: File): Promise<ParsedDocument> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendored/pdf.worker.min.mjs"

  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise

  const { createWorker } = await import("tesseract.js")
  const worker = await createWorker("eng")

  let totalText = ""
  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const canvas = await renderPageToCanvas(page, 2)
    const { data: { text } } = await worker.recognize(canvas)
    pageTexts.push(text.trim())
    totalText += text + "\n"
  }

  await worker.terminate()

  if (totalText.trim().length < 50) {
    throw new NoTextLayerError()
  }

  return parseText(totalText, file.name.replace(/\.pdf$/i, "") || "PDF Document", "pdf")
}

export async function parsePdf(file: File): Promise<ParsedDocument> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendored/pdf.worker.min.mjs"

  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise

  let totalText = ""
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const strings = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ")
    totalText += strings + "\n"
  }

  if (totalText.trim().length < 50) {
    return parsePdfWithOcr(file)
  }

  return parseText(totalText, file.name.replace(/\.pdf$/i, "") || "PDF Document", "pdf")
}