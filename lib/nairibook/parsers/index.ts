import type { BookFormat, ParsedDocument } from "../types"

import { parseEpub } from "./epub-parser"
import { parsePdf, NoTextLayerError } from "./pdf-parser"
import { parseText } from "./text-parser"

export { NoTextLayerError }

const EXT_FORMAT: Record<string, BookFormat> = {
  pdf: "pdf",
  epub: "epub",
  txt: "text",
  md: "markdown",
  markdown: "markdown",
}

// Single entry point. Picks a parser based on the file type / extension and
// returns a structured ParsedDocument. Runs entirely client-side.
export async function parseDocument(file: File, onProgress?: (msg: string) => void): Promise<ParsedDocument> {
  const name = file.name.toLowerCase()
  const ext = name.includes(".") ? name.split(".").pop()! : ""
  const format = EXT_FORMAT[ext] ?? guessFromMime(file.type)

  onProgress?.(`Reading ${format.toUpperCase()} document…`)

  switch (format) {
    case "pdf":
      return parsePdf(file)
    case "epub":
      return parseEpub(file)
    case "markdown": {
      const text = await file.text()
      return parseText(text, file.name.replace(/\.m?arkdown$/i, ""), "markdown")
    }
    case "text":
    default: {
      const text = await file.text()
      return parseText(text, file.name.replace(/\.txt$/i, ""), "text")
    }
  }
}

function guessFromMime(mime: string): BookFormat {
  if (mime.includes("pdf")) return "pdf"
  if (mime.includes("epub")) return "epub"
  if (mime.includes("markdown")) return "markdown"
  return "text"
}
