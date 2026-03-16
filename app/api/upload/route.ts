import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60

// Supported file types
const SUPPORTED_TYPES = {
  // Documents
  'application/pdf': { ext: 'pdf', category: 'document' },
  'application/msword': { ext: 'doc', category: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', category: 'document' },
  'text/plain': { ext: 'txt', category: 'document' },
  'text/markdown': { ext: 'md', category: 'document' },
  'text/csv': { ext: 'csv', category: 'document' },
  // Images
  'image/jpeg': { ext: 'jpg', category: 'image' },
  'image/png': { ext: 'png', category: 'image' },
  'image/gif': { ext: 'gif', category: 'image' },
  'image/webp': { ext: 'webp', category: 'image' },
  // Code
  'text/javascript': { ext: 'js', category: 'code' },
  'text/typescript': { ext: 'ts', category: 'code' },
  'application/json': { ext: 'json', category: 'code' },
  'text/html': { ext: 'html', category: 'code' },
  'text/css': { ext: 'css', category: 'code' },
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const fileType = SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES]
    if (!fileType) {
      return NextResponse.json({ 
        error: "Unsupported file type",
        supported: Object.keys(SUPPORTED_TYPES)
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File too large",
        maxSize: MAX_FILE_SIZE
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${user.id}/${timestamp}-${file.name}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename)

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        filename: file.name,
        storage_path: filename,
        mime_type: file.type,
        size: file.size,
        category: fileType.category,
        url: publicUrl
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // File uploaded but metadata failed - still return success
    }

    // Extract text content for documents (for AI context)
    let extractedText = null
    if (fileType.category === 'document' && file.type === 'text/plain') {
      extractedText = await file.text()
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord?.id || timestamp.toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        category: fileType.category,
        url: publicUrl,
        extractedText: extractedText?.slice(0, 10000) // Limit text for context
      }
    })

  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - List user's uploaded files
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const conversationId = url.searchParams.get('conversationId')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    let query = supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    }

    const { data: files, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
    }

    return NextResponse.json({ files })

  } catch (error) {
    console.error("Files API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
