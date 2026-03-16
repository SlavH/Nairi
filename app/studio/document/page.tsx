'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Download, FileText, Copy, Check } from 'lucide-react'

export default function DocumentGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [documentType, setDocumentType] = useState('article')
  const [length, setLength] = useState('medium')
  const [tone, setTone] = useState('professional')
  const [format, setFormat] = useState('markdown')
  const [loading, setLoading] = useState(false)
  const [document, setDocument] = useState('')
  const [metadata, setMetadata] = useState<any>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const generateDocument = async () => {
    if (!prompt.trim()) {
      setError('Please enter a document topic or description')
      return
    }

    setLoading(true)
    setError('')
    setDocument('')
    setMetadata(null)

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          documentType,
          length,
          tone,
          format,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate document')
      }

      setDocument(data.document)
      setMetadata(data.metadata)
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the document')
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = () => {
    if (!document) return

    const blob = new Blob([document], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `document-${Date.now()}.${format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'txt'}`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    if (!document) return
    await navigator.clipboard.writeText(document)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = async () => {
    if (!document) return

    try {
      // Create a simple HTML wrapper for PDF conversion
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }
    h1, h2, h3 { color: #333; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
  ${format === 'html' ? document : `<pre>${document}</pre>`}
</body>
</html>
      `

      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `document-${Date.now()}.html`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      setError('Download failed. Please try again.')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Document Generator</h1>
        <p className="text-muted-foreground">
          Generate professional documents with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Document Settings</CardTitle>
            <CardDescription>Configure your document parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Topic / Description *</Label>
              <Textarea
                id="prompt"
                placeholder="Describe what you want the document to be about..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="resume">Resume</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger id="length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (500-800 words)</SelectItem>
                    <SelectItem value="medium">Medium (1000-1500 words)</SelectItem>
                    <SelectItem value="long">Long (2000-3000 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="plain">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateDocument}
              disabled={loading || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Document
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Document</CardTitle>
                {metadata && (
                  <CardDescription>
                    {metadata.wordCount} words • {metadata.readingTime} min read
                  </CardDescription>
                )}
              </div>
              {document && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadDocument}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!document && !loading && (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your generated document will appear here</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating your document...</p>
                </div>
              </div>
            )}

            {document && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="bg-muted/50 p-6 rounded-lg max-h-[600px] overflow-y-auto">
                  {format === 'html' ? (
                    <div dangerouslySetInnerHTML={{ __html: document }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">{document}</pre>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
