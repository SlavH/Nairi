'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Copy, Presentation, ChevronLeft, ChevronRight, Edit, Save, X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Slide {
  id: number
  title: string
  content: string[]
  notes?: string
  layout?: string
  imagePrompt?: string
  imageUrl?: string
}

export default function PresentationGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState('8')
  const [style, setStyle] = useState('professional')
  const [theme, setTheme] = useState('dark')
  const [loading, setLoading] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState<string[]>([])
  const [editedNotes, setEditedNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)


  const generatePresentation = async () => {
    if (!prompt.trim()) {
      setError('Please enter a presentation topic')
      return
    }

    setLoading(true)
    setError('')
    setSlides([])
    setCurrentSlide(0)

    try {
      const response = await fetch('/api/generate-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          slideCount: parseInt(slideCount),
          style,
          theme,
          includeImages: true,
          format: 'json',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate presentation')
      }

      setSlides(data.slides || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate presentation')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    const text = slides.map(s => `# ${s.title}\n${s.content.join('\n')}`).join('\n\n---\n\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied!', { description: 'Presentation copied to clipboard as markdown' })
    } catch (err) {
      // Fallback for browsers without clipboard permissions
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        toast.success('Copied!', { description: 'Presentation copied to clipboard as markdown' })
      } catch (fallbackErr) {
        toast.error('Copy failed', { description: 'Could not copy to clipboard. Please try selecting and copying manually.' })
      }
      document.body.removeChild(textArea)
    }
  }

  const enterEditMode = () => {
    if (slides.length > 0) {
      setEditMode(true)
      setEditedTitle(slides[currentSlide].title)
      setEditedContent([...slides[currentSlide].content])
      setEditedNotes(slides[currentSlide].notes || '')
    }
  }

  const saveEdit = () => {
    const updatedSlides = [...slides]
    updatedSlides[currentSlide] = {
      ...updatedSlides[currentSlide],
      title: editedTitle,
      content: editedContent,
      notes: editedNotes
    }
    setSlides(updatedSlides)
    setEditMode(false)
    toast.success('Slide updated', { description: 'Your changes have been saved.' })
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditedTitle('')
    setEditedContent([])
    setEditedNotes('')
  }

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      toast.error('Cannot delete', { description: 'You must have at least one slide' })
      return
    }
    const updatedSlides = slides.filter((_, idx) => idx !== index)
    setSlides(updatedSlides)
    if (currentSlide >= updatedSlides.length) {
      setCurrentSlide(updatedSlides.length - 1)
    }
    toast.success('Slide deleted', { description: 'The slide has been removed' })
  }

  const duplicateSlide = (index: number) => {
    const slideToDuplicate = { ...slides[index], id: Date.now() }
    const updatedSlides = [...slides]
    updatedSlides.splice(index + 1, 0, slideToDuplicate)
    setSlides(updatedSlides)
    setCurrentSlide(index + 1)
    toast.success('Slide duplicated', { description: 'A copy of the slide has been created' })
  }

  const updateContentItem = (index: number, value: string) => {
    const newContent = [...editedContent]
    newContent[index] = value
    setEditedContent(newContent)
  }

  const addContentItem = () => {
    setEditedContent([...editedContent, ''])
  }

  const removeContentItem = (index: number) => {
    const newContent = editedContent.filter((_, idx) => idx !== index)
    setEditedContent(newContent)
  }

  const downloadPPTX = async () => {
    try {
      const response = await fetch('/api/export-pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides,
          title: prompt,
          style,
          theme,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export PPTX')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `presentation-${Date.now()}.pptx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Success!', { description: 'Presentation exported as PowerPoint' })
    } catch (err) {
      toast.error('Export failed', { description: 'Could not export to PowerPoint format' })
    }
  }

  const downloadPresentation = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Presentation</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 0; background: ${theme === 'dark' ? '#1a1a2e' : '#ffffff'}; color: ${theme === 'dark' ? '#ffffff' : '#1a1a2e'}; }
    .slide { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 4rem; box-sizing: border-box; page-break-after: always; }
    h1 { font-size: 3rem; margin-bottom: 2rem; }
    ul { font-size: 1.5rem; line-height: 2; }
    li { margin-bottom: 1rem; }
  </style>
</head>
<body>
${slides.map(s => `
  <div class="slide">
    <h1>${s.title}</h1>
    <ul>
      ${s.content.map(c => `<li>${c}</li>`).join('\n      ')}
    </ul>
  </div>
`).join('')}
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `presentation-${Date.now()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  return (
    <div className="h-full w-full p-4 sm:p-6 md:p-8 overflow-auto">
      <div className="mb-10">
        <div className="section-badge mb-4">
          <Presentation className="h-4 w-4 text-[#e879f9]" />
          <span>AI-Powered Slides</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
          <span className="gradient-text">Presentation Generator</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Create professional presentations with AI-powered slide generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel - main page card style */}
        <div className="lg:col-span-1">
          <Card className="section-card border-border">
            <CardHeader>
              <CardTitle>Presentation Settings</CardTitle>
              <CardDescription>Configure your presentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Topic / Description *</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., Introduction to Machine Learning for business executives"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Slides</Label>
                <Select value={slideCount} onValueChange={setSlideCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 slides</SelectItem>
                    <SelectItem value="8">8 slides</SelectItem>
                    <SelectItem value="10">10 slides</SelectItem>
                    <SelectItem value="15">15 slides</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generatePresentation}
                disabled={loading}
                className="w-full btn-primary-gradient"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Presentation className="mr-2 h-4 w-4" />
                    Generate Presentation
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {slides.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex-1">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPresentation} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      HTML
                    </Button>
                  </div>
                  <Button variant="default" size="sm" onClick={downloadPPTX} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export to PowerPoint
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full section-card border-border">
            <CardHeader>
              <CardTitle>Slide Preview</CardTitle>
              <CardDescription>
                {slides.length > 0 
                  ? `Slide ${currentSlide + 1} of ${slides.length}`
                  : 'Your presentation will appear here'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slides.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                  <Presentation className="h-16 w-16 mb-4 opacity-50" />
                  <p>Generate a presentation to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Slide Actions */}
                  {!editMode && (
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => duplicateSlide(currentSlide)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteSlide(currentSlide)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" onClick={enterEditMode}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Slide
                      </Button>
                    </div>
                  )}

                  {/* Slide Display or Edit Mode */}
                  {editMode ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Slide Title</Label>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Content Points</Label>
                        {editedContent.map((item, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateContentItem(idx, e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-md"
                              placeholder="Content point"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeContentItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addContentItem}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Point
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Speaker Notes</Label>
                        <Textarea
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          placeholder="Add speaker notes for this slide..."
                          rows={3}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} className="flex-1">
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={cancelEdit} className="flex-1">
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`rounded-lg p-8 min-h-[400px] flex flex-col justify-center ${
                        theme === 'dark' 
                          ? 'bg-slate-900 text-white' 
                          : theme === 'gradient'
                          ? 'bg-gradient-to-br from-purple-600 to-blue-500 text-white'
                          : 'bg-white text-slate-900 border'
                      }`}
                    >
                      <h2 className="text-3xl font-bold mb-6">
                        {slides[currentSlide]?.title}
                      </h2>
                      <ul className="space-y-3 text-lg">
                        {slides[currentSlide]?.content.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-3">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={prevSlide}
                      disabled={currentSlide === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentSlide 
                              ? 'bg-primary' 
                              : 'bg-muted hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={nextSlide}
                      disabled={currentSlide === slides.length - 1}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  {/* Slide Thumbnails */}
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {slides.map((slide, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`p-2 rounded border text-left text-xs truncate ${
                          idx === currentSlide 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="font-medium truncate">{slide.title}</div>
                      </button>
                    ))}
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
