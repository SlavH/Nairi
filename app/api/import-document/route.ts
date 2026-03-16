import { NextRequest, NextResponse } from "next/server"

// Document Import API - Extract text from Word, PDF, and other documents
// For use with presentation generator

export const runtime = 'nodejs'
export const maxDuration = 30

// Simple text extraction from various document formats
async function extractTextFromDocument(buffer: Buffer, mimeType: string): Promise<{ text: string; title: string }> {
  let text = ''
  let title = ''
  
  try {
    if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
      // PDF extraction using pdf-parse pattern
      // For now, use basic text extraction
      const content = buffer.toString('utf-8')
      
      // Try to extract readable text from PDF
      // PDFs contain text streams that can be partially extracted
      const textMatches = content.match(/\(([^)]+)\)/g) || []
      const extractedParts = textMatches
        .map(m => m.slice(1, -1))
        .filter(t => t.length > 2 && /[a-zA-Z]/.test(t))
      
      if (extractedParts.length > 0) {
        text = extractedParts.join(' ')
        title = extractedParts[0]?.substring(0, 100) || 'Imported PDF'
      } else {
        // Fallback: try to find any readable ASCII text
        const asciiText = content.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim()
        text = asciiText.substring(0, 10000)
        title = 'Imported PDF Document'
      }
    } 
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             mimeType.includes('docx') || mimeType.includes('word')) {
      // DOCX is a ZIP file containing XML
      // Extract text from document.xml
      const content = buffer.toString('utf-8')
      
      // Look for text content in the XML
      const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []
      const extractedText = textMatches
        .map(m => m.replace(/<[^>]+>/g, ''))
        .join(' ')
      
      if (extractedText.length > 0) {
        text = extractedText
        // Try to get title from first paragraph
        title = extractedText.split(/[.!?\n]/)[0]?.substring(0, 100) || 'Imported Word Document'
      } else {
        // Try JSZip-style extraction
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(buffer)
        const docXml = await zip.file('word/document.xml')?.async('string')
        
        if (docXml) {
          const xmlTextMatches = docXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []
          text = xmlTextMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ')
          title = text.split(/[.!?\n]/)[0]?.substring(0, 100) || 'Imported Word Document'
        }
      }
    }
    else if (mimeType === 'text/plain' || mimeType.includes('text')) {
      text = buffer.toString('utf-8')
      title = text.split('\n')[0]?.substring(0, 100) || 'Imported Text'
    }
    else if (mimeType === 'text/markdown' || mimeType.includes('markdown')) {
      text = buffer.toString('utf-8')
      // Extract title from first heading
      const headingMatch = text.match(/^#\s+(.+)$/m)
      title = headingMatch?.[1] || text.split('\n')[0]?.substring(0, 100) || 'Imported Markdown'
    }
    else if (mimeType === 'application/rtf' || mimeType.includes('rtf')) {
      // RTF extraction - strip RTF control codes
      const content = buffer.toString('utf-8')
      text = content
        .replace(/\\[a-z]+\d*\s?/gi, '')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      title = text.split(/[.!?\n]/)[0]?.substring(0, 100) || 'Imported RTF'
    }
    else {
      // Try as plain text
      text = buffer.toString('utf-8')
      title = 'Imported Document'
    }
  } catch (error) {
    console.error('Document extraction error:', error)
    // Fallback to raw text
    text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').substring(0, 10000)
    title = 'Imported Document'
  }
  
  return { text: text.trim(), title: title.trim() }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }
    
    // Get file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Extract text based on file type
    const mimeType = file.type || 'application/octet-stream'
    const { text, title } = await extractTextFromDocument(buffer, mimeType)
    
    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from document. Please try a different format.' },
        { status: 400 }
      )
    }
    
    // Return extracted content
    return NextResponse.json({
      success: true,
      title,
      content: text,
      filename: file.name,
      mimeType,
      characterCount: text.length,
      wordCount: text.split(/\s+/).length
    })
    
  } catch (error) {
    console.error('Import document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import document' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/import-document',
    method: 'POST',
    description: 'Import and extract text from documents for presentation generation',
    supportedFormats: [
      { extension: '.pdf', mimeType: 'application/pdf', description: 'PDF documents' },
      { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Word documents' },
      { extension: '.doc', mimeType: 'application/msword', description: 'Legacy Word documents (limited support)' },
      { extension: '.txt', mimeType: 'text/plain', description: 'Plain text files' },
      { extension: '.md', mimeType: 'text/markdown', description: 'Markdown files' },
      { extension: '.rtf', mimeType: 'application/rtf', description: 'Rich Text Format' }
    ],
    maxFileSize: '10MB',
    usage: {
      curl: "curl -X POST -F 'file=@document.pdf' http://localhost:3000/api/import-document"
    }
  })
}
