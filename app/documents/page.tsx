'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Download, Copy, FileText } from 'lucide-react'
import { toast } from 'sonner'

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

  const generateDocument = async () => {
    if (!prompt.trim()) {
      setError('Please enter a document description')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate document')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(document)
    toast.success('Copied!', { description: 'Document copied to clipboard' })
  }

  const downloadDocument = () => {
    const extension = format === 'markdown' ? 'md' : format === 'html' ? 'html' : 'txt'
    const blob = new Blob([document], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `document-${Date.now()}.${extension}`
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Document Generator</h1>
        <p className="text-muted-foreground">
          Generate professional documents with AI-powered writing assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Document Settings</CardTitle>
              <CardDescription>Configure your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Topic / Description *</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., Write a business proposal for a sustainable energy startup"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
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

              {document && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={downloadDocument}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              {metadata && (
                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Word Count:</span>
                    <span className="font-medium">{metadata.wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reading Time:</span>
                    <span className="font-medium">{metadata.readingTime} min</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                {document ? 'Your generated document' : 'Your document will appear here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {document ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {format === 'markdown' && (
                    <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                      {document}
                    </div>
                  )}
                  {format === 'html' && (
                    <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                      <div dangerouslySetInnerHTML={{ __html: document }} />
                    </div>
                  )}
                  {format === 'plain' && (
                    <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                      {document}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate a document to see it here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
