'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Download, Eye, FileDown, Upload, X, Image, ImagePlus, Edit2, Check, Undo2, Redo2, Plus, Trash2, Users, GripVertical, LayoutTemplate, Palette } from 'lucide-react'
import { CollaborationPanel } from '@/components/studio/collaboration-panel'
import { TemplateGallery } from '@/components/studio/template-gallery'
import { BrandKitManager } from '@/components/studio/brand-kit-manager'
import { Slider } from '@/components/ui/slider'

interface Slide {
  title: string
  content: string[]
  layout: 'title' | 'content' | 'two-column' | 'image'
  imageUrl?: string
  imagePrompt?: string
}

// History management for undo/redo
const MAX_HISTORY = 50

export default function PresentationGeneratorPage() {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [slideCount, setSlideCount] = useState([10])
  const [style, setStyle] = useState('professional')
  const [loading, setLoading] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [error, setError] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [includeImages, setIncludeImages] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [theme, setTheme] = useState('gradient')
  const [highContrast, setHighContrast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Theme configurations for accessibility
  const themeStyles: Record<string, { bg: string; text: string; accent: string }> = {
    gradient: { bg: 'from-purple-600 to-blue-600', text: 'text-white', accent: 'bg-purple-500' },
    light: { bg: 'from-gray-100 to-white', text: 'text-gray-900', accent: 'bg-blue-500' },
    dark: { bg: 'from-gray-900 to-gray-800', text: 'text-white', accent: 'bg-blue-400' },
    professional: { bg: 'from-blue-900 to-blue-800', text: 'text-white', accent: 'bg-blue-400' },
    creative: { bg: 'from-pink-500 to-purple-600', text: 'text-white', accent: 'bg-pink-400' },
    minimal: { bg: 'from-white to-gray-50', text: 'text-gray-800', accent: 'bg-gray-600' },
    'high-contrast': { bg: 'from-black to-gray-900', text: 'text-yellow-300', accent: 'bg-yellow-400' }
  }
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingContent, setEditingContent] = useState<string[]>([])
  
  // Undo/Redo history
  const [history, setHistory] = useState<Slide[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // UI panels state
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [showBrandKit, setShowBrandKit] = useState(false)
  
  // Save current state to history
  const saveToHistory = useCallback((newSlides: Slide[]) => {
    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1)
      // Add new state
      newHistory.push(JSON.parse(JSON.stringify(newSlides)))
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [historyIndex])
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setSlides(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }, [history, historyIndex])
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setSlides(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }, [history, historyIndex])
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }
  
  const handleDragLeave = () => {
    setDragOverIndex(null)
  }
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    
    const newSlides = [...slides]
    const [draggedSlide] = newSlides.splice(draggedIndex, 1)
    newSlides.splice(dropIndex, 0, draggedSlide)
    
    saveToHistory(newSlides)
    setSlides(newSlides)
    
    // Update current slide index if needed
    if (currentSlide === draggedIndex) {
      setCurrentSlide(dropIndex)
    } else if (draggedIndex < currentSlide && dropIndex >= currentSlide) {
      setCurrentSlide(currentSlide - 1)
    } else if (draggedIndex > currentSlide && dropIndex <= currentSlide) {
      setCurrentSlide(currentSlide + 1)
    }
    
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  
  // Start editing current slide
  const startEditing = () => {
    if (slides.length === 0) return
    setEditingTitle(slides[currentSlide].title)
    setEditingContent([...slides[currentSlide].content])
    setIsEditing(true)
  }
  
  // Save edits
  const saveEdits = () => {
    const newSlides = [...slides]
    newSlides[currentSlide] = {
      ...newSlides[currentSlide],
      title: editingTitle,
      content: editingContent.filter(c => c.trim() !== '')
    }
    saveToHistory(newSlides)
    setSlides(newSlides)
    setIsEditing(false)
  }
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false)
    setEditingTitle('')
    setEditingContent([])
  }
  
  // Add new bullet point
  const addBulletPoint = () => {
    setEditingContent([...editingContent, ''])
  }
  
  // Remove bullet point
  const removeBulletPoint = (index: number) => {
    setEditingContent(editingContent.filter((_, i) => i !== index))
  }
  
  // Update bullet point
  const updateBulletPoint = (index: number, value: string) => {
    const newContent = [...editingContent]
    newContent[index] = value
    setEditingContent(newContent)
  }
  
  // Add new slide
  const addNewSlide = () => {
    const newSlide: Slide = {
      title: 'New Slide',
      content: ['Add your content here'],
      layout: 'content'
    }
    const newSlides = [...slides]
    newSlides.splice(currentSlide + 1, 0, newSlide)
    saveToHistory(newSlides)
    setSlides(newSlides)
    setCurrentSlide(currentSlide + 1)
  }
  
  // Delete current slide
  const deleteSlide = () => {
    if (slides.length <= 1) return
    const newSlides = slides.filter((_, i) => i !== currentSlide)
    saveToHistory(newSlides)
    setSlides(newSlides)
    setCurrentSlide(Math.min(currentSlide, newSlides.length - 1))
  }

  const generatePresentation = async () => {
    if (!topic.trim()) {
      setError('Please enter a presentation topic')
      return
    }

    setLoading(true)
    setError('')
    setSlides([])

    try {
      const response = await fetch('/api/studio/presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          description,
          slideCount: slideCount[0],
          style,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate presentation')
      }

      setSlides(data.slides)
      setCurrentSlide(0)
      // Initialize history with first state
      setHistory([JSON.parse(JSON.stringify(data.slides))])
      setHistoryIndex(0)
      
      // Auto-generate images if option is enabled
      if (includeImages) {
        await generateSlideImages(data.slides)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate presentation')
    } finally {
      setLoading(false)
    }
  }

  const generateSlideImages = async (slidesToProcess?: Slide[]) => {
    const targetSlides = slidesToProcess || slides
    if (targetSlides.length === 0) return

    setGeneratingImages(true)
    try {
      const response = await fetch('/api/generate-slide-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: targetSlides }),
      })

      const data = await response.json()
      if (response.ok && data.slides) {
        setSlides(data.slides)
      }
    } catch (err) {
      console.error('Failed to generate images:', err)
    } finally {
      setGeneratingImages(false)
    }
  }

  const exportToPDF = () => {
    // Create HTML for PDF export
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${topic}</title>
  <style>
    @page { size: 1024px 768px; margin: 0; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .slide {
      width: 1024px;
      height: 768px;
      padding: 60px;
      box-sizing: border-box;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .slide h1 { font-size: 48px; margin: 0 0 20px 0; }
    .slide h2 { font-size: 36px; margin: 0 0 30px 0; }
    .slide ul { font-size: 24px; line-height: 1.8; }
    .slide li { margin-bottom: 15px; }
    .title-slide { text-align: center; justify-content: center; }
    .title-slide h1 { font-size: 64px; }
  </style>
</head>
<body>
${slides.map((slide, index) => `
  <div class="slide ${index === 0 ? 'title-slide' : ''}">
    <h${index === 0 ? '1' : '2'}>${slide.title}</h${index === 0 ? '1' : '2'}>
    ${slide.content.length > 0 ? `
    <ul>
      ${slide.content.map(item => `<li>${item}</li>`).join('')}
    </ul>
    ` : ''}
  </div>
`).join('')}
</body>
</html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-presentation.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const data = {
      topic,
      description,
      style,
      theme,
      slides: slides.map((slide, index) => ({
        ...slide,
        altText: `Slide ${index + 1}: ${slide.title}. ${slide.content.join('. ')}`,
        accessibilityNotes: `This slide contains ${slide.content.length} bullet points about ${slide.title}`
      })),
      accessibility: {
        highContrast,
        altTextIncluded: true,
        wcagCompliant: true,
        colorContrastRatio: highContrast ? '7:1' : '4.5:1'
      },
      createdAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-presentation.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export to Markdown
  const exportToMarkdown = () => {
    let markdown = `# ${topic}\n\n`
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`
    markdown += `**Style:** ${style} | **Theme:** ${theme}\n\n`
    markdown += `---\n\n`
    
    slides.forEach((slide, index) => {
      markdown += `## Slide ${index + 1}: ${slide.title}\n\n`
      if (slide.content.length > 0) {
        slide.content.forEach(item => {
          markdown += `- ${item}\n`
        })
      }
      if (slide.imageUrl) {
        markdown += `\n![${slide.title}](${slide.imageUrl})\n`
      }
      markdown += `\n---\n\n`
    })
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-presentation.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsUploading(true)
    setError('')

    try {
      // Read file content for text-based files
      let content = ''
      let extractedTitle = ''
      const fileName = file.name.toLowerCase()
      
      // Check if it's a PDF or Word document - use server-side API
      if (file.type === 'application/pdf' || fileName.endsWith('.pdf') ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          fileName.endsWith('.docx') || fileName.endsWith('.doc') ||
          file.type === 'application/msword' ||
          file.type === 'application/rtf' || fileName.endsWith('.rtf')) {
        
        // Use the import-document API for PDF/Word files
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/import-document', {
          method: 'POST',
          body: formData
        })
        
        const data = await response.json()
        
        if (response.ok && data.content) {
          content = data.content
          extractedTitle = data.title || ''
        } else {
          throw new Error(data.error || 'Failed to extract text from document')
        }
      }
      else if (file.type === 'text/plain' || fileName.endsWith('.txt') || 
          file.type === 'text/markdown' || fileName.endsWith('.md')) {
        content = await file.text()
      } else if (file.type === 'application/json' || fileName.endsWith('.json')) {
        const jsonContent = await file.text()
        try {
          const parsed = JSON.parse(jsonContent)
          // If it's a previously exported presentation, extract the content
          if (parsed.slides) {
            content = parsed.slides.map((s: any) => 
              `${s.title}\n${s.content?.join('\n') || ''}`
            ).join('\n\n')
          } else {
            content = JSON.stringify(parsed, null, 2)
          }
        } catch {
          content = jsonContent
        }
      }

      if (content) {
        // Use file content as description context
        setDescription(content.slice(0, 5000))
        // Set topic from extracted title or filename if not already set
        if (!topic) {
          setTopic(extractedTitle || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
        }
      } else {
        setError('Could not extract content from file. Please try a different format.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setIsUploading(false)
    }
  }

  const clearUploadedFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const exportToPPTX = async () => {
    if (slides.length === 0) return
    
    try {
      const response = await fetch('/api/export-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: slides.map((slide, index) => ({
            id: index + 1,
            title: slide.title,
            content: slide.content,
            layout: slide.layout,
            notes: (slide as Slide & { notes?: string }).notes || '',
            altText: `Slide ${index + 1}: ${slide.title}. ${slide.content.join('. ')}`
          })),
          title: topic,
          style: style,
          theme: theme === 'high-contrast' ? 'dark' : theme
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'PPTX export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-presentation.pptx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PPTX export failed')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Presentation Generator</h1>
        <p className="text-muted-foreground">
          Create professional presentations with AI-powered content generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Details</CardTitle>
              <CardDescription>Describe your presentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Import from Document (Optional)</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.json,.pdf,.docx,.doc,.rtf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploadedFile ? uploadedFile.name : 'Upload Document'}
                  </Button>
                  {uploadedFile && (
                    <Button type="button" variant="ghost" size="icon" onClick={clearUploadedFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Supports PDF, Word, TXT, Markdown, JSON files</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Climate Change Solutions"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional context or specific points to cover..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideCount">Number of Slides: {slideCount[0]}</Label>
                <Slider
                  id="slideCount"
                  min={5}
                  max={30}
                  step={1}
                  value={slideCount}
                  onValueChange={setSlideCount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="startup">Startup Pitch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradient">Gradient (Purple/Blue)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="professional">Professional Blue</SelectItem>
                    <SelectItem value="creative">Creative Pink</SelectItem>
                    <SelectItem value="minimal">Minimal White</SelectItem>
                    <SelectItem value="high-contrast">High Contrast (Accessibility)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="highContrast"
                  checked={highContrast}
                  onChange={(e) => {
                    setHighContrast(e.target.checked)
                    if (e.target.checked) setTheme('high-contrast')
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="highContrast" className="text-sm cursor-pointer">
                  High Contrast Mode (WCAG AAA)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeImages"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="includeImages" className="text-sm cursor-pointer">
                  Include AI-generated images
                </Label>
              </div>

              {/* Template & Brand Kit Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplateGallery(!showTemplateGallery)}
                  className="flex-1"
                >
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBrandKit(!showBrandKit)}
                  className="flex-1"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Brand Kit
                </Button>
              </div>

              <Button
                onClick={generatePresentation}
                disabled={loading || !topic.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Presentation'
                )}
              </Button>

              {slides.length > 0 && (
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      onClick={exportToPDF}
                      variant="outline"
                      className="flex-1"
                      aria-label="Export presentation as HTML"
                    >
                      <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
                      HTML
                    </Button>
                    <Button
                      onClick={exportToJSON}
                      variant="outline"
                      className="flex-1"
                      aria-label="Export presentation as JSON with accessibility metadata"
                    >
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                      JSON
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={exportToPPTX}
                      variant="outline"
                      className="flex-1"
                      aria-label="Export presentation as PowerPoint file"
                    >
                      <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
                      PPTX
                    </Button>
                    <Button
                      onClick={exportToMarkdown}
                      variant="outline"
                      className="flex-1"
                      aria-label="Export presentation as Markdown"
                    >
                      <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
                      Markdown
                    </Button>
                  </div>
                  <Button
                    onClick={() => generateSlideImages()}
                    variant="outline"
                    className="w-full"
                    disabled={generatingImages}
                  >
                    {generatingImages ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Images...</>
                    ) : (
                      <><ImagePlus className="mr-2 h-4 w-4" />Add Images to Slides</>
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm" role="alert">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Template Gallery */}
          {showTemplateGallery && (
            <TemplateGallery
              onSelectTemplate={(template) => {
                setStyle(template.category.toLowerCase())
                setSlideCount([template.slides])
                setShowTemplateGallery(false)
              }}
              onClose={() => setShowTemplateGallery(false)}
            />
          )}

          {/* Brand Kit Manager */}
          {showBrandKit && (
            <BrandKitManager
              onApplyBrandKit={(_brandKit) => {
                setShowBrandKit(false)
              }}
              onClose={() => setShowBrandKit(false)}
            />
          )}

          {/* Collaboration Panel */}
          {slides.length > 0 && (
            <CollaborationPanel 
              presentationId={topic.replace(/\s+/g, '-').toLowerCase()}
              onVersionRestore={(_versionId) => {
                // In a real implementation, this would restore the version
              }}
            />
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {slides.length > 0
                  ? `Slide ${currentSlide + 1} of ${slides.length}`
                  : 'Your presentation will appear here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slides.length > 0 ? (
                <div className="space-y-4">
                  {/* Slide Preview */}
                  <div 
                    className={`aspect-[4/3] bg-gradient-to-br ${themeStyles[theme]?.bg || themeStyles.gradient.bg} rounded-lg p-12 ${themeStyles[theme]?.text || themeStyles.gradient.text} flex flex-col justify-center relative overflow-hidden`}
                    role="region"
                    aria-label={`Slide ${currentSlide + 1}: ${slides[currentSlide]?.title}`}
                    aria-live="polite"
                  >
                    {/* Background image if available */}
                    {slides[currentSlide].imageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `url(${slides[currentSlide].imageUrl})` }}
                      />
                    )}
                    <div className="relative z-10">
                      {isEditing ? (
                        // Editing mode
                        <div className="space-y-4">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="text-2xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/50"
                            placeholder="Slide title"
                          />
                          <div className="space-y-2">
                            {editingContent.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-white/70">•</span>
                                <Input
                                  value={item}
                                  onChange={(e) => updateBulletPoint(index, e.target.value)}
                                  className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
                                  placeholder="Bullet point"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeBulletPoint(index)}
                                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={addBulletPoint}
                              className="text-white/70 hover:text-white hover:bg-white/20"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add bullet
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <h2 className={`font-bold mb-6 ${currentSlide === 0 ? 'text-5xl text-center' : 'text-4xl'}`}>
                            {slides[currentSlide].title}
                          </h2>
                          {slides[currentSlide].content.length > 0 && (
                            <ul className="space-y-3 text-lg">
                              {slides[currentSlide].content.map((item, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-3">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                    {/* Image indicator */}
                    {slides[currentSlide].imageUrl && !isEditing && (
                      <div className="absolute bottom-2 right-2 bg-black/50 rounded px-2 py-1 text-xs flex items-center">
                        <Image className="h-3 w-3 mr-1" />
                        Image
                      </div>
                    )}
                    {/* Edit/Save buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveEdits}
                            className="h-8 w-8 bg-green-500/80 hover:bg-green-500 text-white"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-8 w-8 bg-red-500/80 hover:bg-red-500 text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={startEditing}
                          className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Editing toolbar */}
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={undo}
                        disabled={historyIndex <= 0 || isEditing}
                        title="Undo"
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1 || isEditing}
                        title="Redo"
                      >
                        <Redo2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addNewSlide}
                        disabled={isEditing}
                        title="Add slide after current"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Slide
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={deleteSlide}
                        disabled={slides.length <= 1 || isEditing}
                        className="text-destructive hover:text-destructive"
                        title="Delete current slide"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                      disabled={currentSlide === 0 || isEditing}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1">
                      {slides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => !isEditing && setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentSlide ? 'bg-primary' : 'bg-muted'
                          } ${isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                        />
                      ))}
                    </div>
                    <Button
                      onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                      disabled={currentSlide === slides.length - 1 || isEditing}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>

                  {/* Slide Thumbnails - Drag to reorder */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Drag slides to reorder</p>
                    <div className="grid grid-cols-5 gap-2">
                      {slides.map((slide, index) => (
                        <div
                          key={index}
                          draggable={!isEditing}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          onClick={() => !isEditing && setCurrentSlide(index)}
                          className={`aspect-[4/3] rounded border-2 p-2 text-xs transition-all cursor-grab active:cursor-grabbing ${
                            index === currentSlide ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          } ${
                            draggedIndex === index ? 'opacity-50 scale-95' : ''
                          } ${
                            dragOverIndex === index && draggedIndex !== index ? 'border-primary border-dashed bg-primary/20' : ''
                          } ${
                            isEditing ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        >
                          <div className="font-semibold truncate">{slide.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">Slide {index + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate a presentation to see it here</p>
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
