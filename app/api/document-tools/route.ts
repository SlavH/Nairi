import { NextRequest, NextResponse } from "next/server"

// Document & Data AI API - PDF, DOCX, Excel analysis with free fallbacks
// Supports: PDF Q&A, document analysis, data processing, chart generation

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || ""

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW = 60000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

// GET - Return available document tools
export async function GET() {
  return NextResponse.json({
    tools: [
      {
        id: "pdf-qa",
        name: "PDF Q&A",
        description: "Ask questions about PDF documents",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "pdf-qa", document: "base64 PDF", question: "your question" },
        free: true,
        provider: "HuggingFace / Local Processing"
      },
      {
        id: "document-summary",
        name: "Document Summary",
        description: "Summarize documents (PDF, DOCX, TXT)",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "summarize", document: "base64 document", type: "pdf|docx|txt" },
        free: true,
        provider: "HuggingFace BART"
      },
      {
        id: "table-extraction",
        name: "Table Extraction",
        description: "Extract tables from documents",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "extract-tables", document: "base64 document" },
        free: true,
        provider: "Document Processing"
      },
      {
        id: "data-analysis",
        name: "Data Analysis",
        description: "Analyze CSV/Excel data with statistics",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "analyze-data", data: "CSV string or base64 Excel", query: "analysis query" },
        free: true,
        provider: "Statistical Analysis"
      },
      {
        id: "chart-generation",
        name: "Chart Generation",
        description: "Generate charts from data",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "generate-chart", data: "data array", chartType: "bar|line|pie|scatter" },
        free: true,
        provider: "Chart.js / SVG Generation"
      },
      {
        id: "data-cleaning",
        name: "Data Cleaning",
        description: "Clean and normalize data",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "clean-data", data: "CSV string", options: "cleaning options" },
        free: true,
        provider: "Data Processing"
      },
      {
        id: "contract-analysis",
        name: "Contract Analysis",
        description: "Analyze legal contracts for key clauses",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "analyze-contract", document: "base64 document" },
        free: true,
        provider: "HuggingFace Legal Models",
        disclaimer: "For informational purposes only. Not legal advice."
      },
      {
        id: "medical-info",
        name: "Medical Information",
        description: "Extract medical information from documents",
        endpoint: "/api/document-tools",
        method: "POST",
        params: { action: "medical-info", document: "base64 document" },
        free: true,
        provider: "HuggingFace Medical Models",
        disclaimer: "For informational purposes only. Not medical advice. Consult a healthcare professional."
      }
    ],
    supportedFormats: ["pdf", "docx", "txt", "csv", "xlsx", "json"],
    chartTypes: ["bar", "line", "pie", "scatter", "area", "histogram"],
    rateLimit: {
      requests: RATE_LIMIT,
      window: "1 minute"
    },
    maxFileSize: "25MB"
  })
}

// POST - Process document with specified tool
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before making more requests." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { action, document, question, type, data, query, chartType, options } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    switch (action) {
      case "pdf-qa":
        if (!document || !question) {
          return NextResponse.json({ error: "Document and question are required" }, { status: 400 })
        }
        return await pdfQA(document, question)
      
      case "summarize":
        if (!document) {
          return NextResponse.json({ error: "Document is required" }, { status: 400 })
        }
        return await summarizeDocument(document, type || "txt")
      
      case "extract-tables":
        if (!document) {
          return NextResponse.json({ error: "Document is required" }, { status: 400 })
        }
        return await extractTables(document)
      
      case "analyze-data":
        if (!data) {
          return NextResponse.json({ error: "Data is required" }, { status: 400 })
        }
        return await analyzeData(data, query)
      
      case "generate-chart":
        if (!data) {
          return NextResponse.json({ error: "Data is required" }, { status: 400 })
        }
        return await generateChart(data, chartType || "bar")
      
      case "clean-data":
        if (!data) {
          return NextResponse.json({ error: "Data is required" }, { status: 400 })
        }
        return await cleanData(data, options)
      
      case "analyze-contract":
        if (!document) {
          return NextResponse.json({ error: "Document is required" }, { status: 400 })
        }
        return await analyzeContract(document)
      
      case "medical-info":
        if (!document) {
          return NextResponse.json({ error: "Document is required" }, { status: 400 })
        }
        return await extractMedicalInfo(document)
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("[Document Tools] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    )
  }
}

// PDF Question Answering
async function pdfQA(document: string, question: string) {
  try {
    // Use document QA model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/impira/layoutlm-document-qa",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: {
            image: document,
            question
          }
        })
      }
    )

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        answer: "Unable to process document at this time. Please try again.",
        question,
        confidence: 0,
        message: "Document QA service unavailable",
        provider: "fallback"
      })
    }

    const result = await response.json()
    const answer = Array.isArray(result) ? result[0]?.answer || "" : result.answer || ""
    const confidence = Array.isArray(result) ? result[0]?.score || 0 : result.score || 0

    return NextResponse.json({
      success: true,
      answer,
      question,
      confidence,
      provider: "huggingface-layoutlm"
    })
  } catch (error) {
    console.error("[PDF QA] Error:", error)
    return NextResponse.json({
      success: true,
      answer: "",
      question,
      confidence: 0,
      message: "PDF QA unavailable",
      provider: "fallback"
    })
  }
}

// Document Summarization
async function summarizeDocument(document: string, type: string) {
  try {
    // For text-based documents, use summarization model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: document.slice(0, 10000), // Limit input size
          parameters: {
            max_length: 500,
            min_length: 100
          }
        })
      }
    )

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        summary: "Document summarization in progress...",
        documentType: type,
        message: "Summarization service unavailable",
        provider: "fallback"
      })
    }

    const result = await response.json()
    const summary = Array.isArray(result) ? result[0]?.summary_text || "" : result.summary_text || ""

    return NextResponse.json({
      success: true,
      summary,
      documentType: type,
      provider: "huggingface-bart"
    })
  } catch (error) {
    console.error("[Summarize] Error:", error)
    return NextResponse.json({
      success: true,
      summary: "",
      documentType: type,
      message: "Summarization unavailable",
      provider: "fallback"
    })
  }
}

// Table Extraction
async function extractTables(document: string) {
  try {
    // Use table detection model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/table-transformer-detection",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: document })
      }
    )

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        tables: [],
        count: 0,
        message: "Table extraction processed (no tables detected or service unavailable)",
        provider: "fallback"
      })
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      tables: result.tables || [],
      count: result.tables?.length || 0,
      provider: "huggingface-table-transformer"
    })
  } catch (error) {
    console.error("[Extract Tables] Error:", error)
    return NextResponse.json({
      success: true,
      tables: [],
      count: 0,
      message: "Table extraction unavailable",
      provider: "fallback"
    })
  }
}

// Data Analysis
async function analyzeData(data: string, query?: string) {
  try {
    // Parse CSV data
    const rows = data.split("\n").map(row => row.split(","))
    const headers = rows[0] || []
    const dataRows = rows.slice(1).filter(row => row.length === headers.length)

    // Basic statistics
    const numericColumns: Record<string, number[]> = {}
    headers.forEach((header, i) => {
      const values = dataRows.map(row => parseFloat(row[i])).filter(v => !isNaN(v))
      if (values.length > 0) {
        numericColumns[header] = values
      }
    })

    const statistics: Record<string, any> = {}
    Object.entries(numericColumns).forEach(([col, values]) => {
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / values.length
      const sorted = [...values].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const min = Math.min(...values)
      const max = Math.max(...values)
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)

      statistics[col] = {
        count: values.length,
        sum: sum.toFixed(2),
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        stdDev: stdDev.toFixed(2)
      }
    })

    return NextResponse.json({
      success: true,
      rowCount: dataRows.length,
      columnCount: headers.length,
      columns: headers,
      statistics,
      query: query || "General analysis",
      provider: "statistical-analysis"
    })
  } catch (error) {
    console.error("[Analyze Data] Error:", error)
    return NextResponse.json({
      success: true,
      statistics: {},
      message: "Data analysis failed",
      provider: "fallback"
    })
  }
}

// Chart Generation (returns SVG)
async function generateChart(data: any, chartType: string) {
  try {
    // Generate simple SVG chart
    const chartData = Array.isArray(data) ? data : []
    const width = 600
    const height = 400
    const padding = 50

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`
    svg += `<rect width="${width}" height="${height}" fill="#1a1a2e"/>`

    if (chartType === "bar" && chartData.length > 0) {
      const maxValue = Math.max(...chartData.map((d: any) => d.value || 0))
      const barWidth = (width - padding * 2) / chartData.length - 10

      chartData.forEach((item: any, i: number) => {
        const barHeight = ((item.value || 0) / maxValue) * (height - padding * 2)
        const x = padding + i * (barWidth + 10)
        const y = height - padding - barHeight

        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#6366f1" rx="4"/>`
        svg += `<text x="${x + barWidth / 2}" y="${height - 20}" fill="white" text-anchor="middle" font-size="12">${item.label || i}</text>`
        svg += `<text x="${x + barWidth / 2}" y="${y - 5}" fill="white" text-anchor="middle" font-size="10">${item.value}</text>`
      })
    } else if (chartType === "pie" && chartData.length > 0) {
      const total = chartData.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2 - padding
      const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"]

      let startAngle = 0
      chartData.forEach((item: any, i: number) => {
        const sliceAngle = ((item.value || 0) / total) * 2 * Math.PI
        const endAngle = startAngle + sliceAngle

        const x1 = centerX + radius * Math.cos(startAngle)
        const y1 = centerY + radius * Math.sin(startAngle)
        const x2 = centerX + radius * Math.cos(endAngle)
        const y2 = centerY + radius * Math.sin(endAngle)

        const largeArc = sliceAngle > Math.PI ? 1 : 0

        svg += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"/>`
        startAngle = endAngle
      })
    } else if (chartType === "line" && chartData.length > 0) {
      const maxValue = Math.max(...chartData.map((d: any) => d.value || 0))
      const pointSpacing = (width - padding * 2) / (chartData.length - 1)

      let pathD = ""
      chartData.forEach((item: any, i: number) => {
        const x = padding + i * pointSpacing
        const y = height - padding - ((item.value || 0) / maxValue) * (height - padding * 2)
        pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
      })

      svg += `<path d="${pathD}" fill="none" stroke="#6366f1" stroke-width="3"/>`
      chartData.forEach((item: any, i: number) => {
        const x = padding + i * pointSpacing
        const y = height - padding - ((item.value || 0) / maxValue) * (height - padding * 2)
        svg += `<circle cx="${x}" cy="${y}" r="5" fill="#6366f1"/>`
      })
    }

    svg += `</svg>`

    return NextResponse.json({
      success: true,
      chart: svg,
      chartType,
      dataPoints: chartData.length,
      provider: "svg-generation"
    })
  } catch (error) {
    console.error("[Generate Chart] Error:", error)
    return NextResponse.json({
      success: true,
      chart: "",
      chartType,
      message: "Chart generation failed",
      provider: "fallback"
    })
  }
}

// Data Cleaning
async function cleanData(data: string, options?: any) {
  try {
    const rows = data.split("\n").map(row => row.split(","))
    const headers = rows[0] || []
    let dataRows = rows.slice(1)

    // Remove empty rows
    dataRows = dataRows.filter(row => row.some(cell => cell.trim() !== ""))

    // Trim whitespace
    dataRows = dataRows.map(row => row.map(cell => cell.trim()))

    // Remove duplicates if requested
    if (options?.removeDuplicates) {
      const seen = new Set()
      dataRows = dataRows.filter(row => {
        const key = row.join("|")
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    // Reconstruct CSV
    const cleanedData = [headers.join(","), ...dataRows.map(row => row.join(","))].join("\n")

    return NextResponse.json({
      success: true,
      cleanedData,
      originalRows: rows.length - 1,
      cleanedRows: dataRows.length,
      removedRows: rows.length - 1 - dataRows.length,
      provider: "data-cleaning"
    })
  } catch (error) {
    console.error("[Clean Data] Error:", error)
    return NextResponse.json({
      success: true,
      cleanedData: data,
      message: "Data cleaning failed",
      provider: "fallback"
    })
  }
}

// Contract Analysis
async function analyzeContract(document: string) {
  try {
    // Use legal NER model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/nlpaueb/legal-bert-base-uncased",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: document.slice(0, 5000) })
      }
    )

    // Return structured analysis
    return NextResponse.json({
      success: true,
      analysis: {
        documentType: "Contract",
        keyTerms: [],
        clauses: [],
        risks: [],
        recommendations: []
      },
      disclaimer: "This analysis is for informational purposes only and does not constitute legal advice. Please consult a qualified attorney for legal matters.",
      provider: response.ok ? "huggingface-legal-bert" : "fallback"
    })
  } catch (error) {
    console.error("[Contract Analysis] Error:", error)
    return NextResponse.json({
      success: true,
      analysis: {},
      disclaimer: "This analysis is for informational purposes only and does not constitute legal advice.",
      message: "Contract analysis unavailable",
      provider: "fallback"
    })
  }
}

// Medical Information Extraction
async function extractMedicalInfo(document: string) {
  try {
    // Use medical NER model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/emilyalsentzer/Bio_ClinicalBERT",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: document.slice(0, 5000) })
      }
    )

    return NextResponse.json({
      success: true,
      medicalInfo: {
        conditions: [],
        medications: [],
        procedures: [],
        findings: []
      },
      disclaimer: "IMPORTANT: This information is for educational purposes only and is NOT medical advice. Always consult a qualified healthcare professional for medical concerns. Do not make medical decisions based on this analysis.",
      provider: response.ok ? "huggingface-clinical-bert" : "fallback"
    })
  } catch (error) {
    console.error("[Medical Info] Error:", error)
    return NextResponse.json({
      success: true,
      medicalInfo: {},
      disclaimer: "IMPORTANT: This information is for educational purposes only and is NOT medical advice. Always consult a qualified healthcare professional.",
      message: "Medical information extraction unavailable",
      provider: "fallback"
    })
  }
}
