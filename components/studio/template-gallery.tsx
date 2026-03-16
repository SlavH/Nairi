'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Star, Clock, TrendingUp, Briefcase, GraduationCap, Rocket, Heart, BarChart3, Users, Lightbulb, Target } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  slides: number
  thumbnail: string
  colors: string[]
  popular?: boolean
  new?: boolean
  icon: React.ReactNode
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void
  onClose?: () => void
}

const templates: Template[] = [
  {
    id: 'business-pitch',
    name: 'Business Pitch',
    description: 'Professional pitch deck for investors and stakeholders',
    category: 'Business',
    slides: 12,
    thumbnail: 'from-blue-600 to-blue-800',
    colors: ['#1e40af', '#3b82f6', '#60a5fa'],
    popular: true,
    icon: <Briefcase className="h-5 w-5" />
  },
  {
    id: 'startup-deck',
    name: 'Startup Deck',
    description: 'Modern template for startup presentations',
    category: 'Business',
    slides: 15,
    thumbnail: 'from-purple-600 to-pink-600',
    colors: ['#9333ea', '#ec4899', '#f472b6'],
    popular: true,
    icon: <Rocket className="h-5 w-5" />
  },
  {
    id: 'academic-research',
    name: 'Academic Research',
    description: 'Clean template for research presentations',
    category: 'Education',
    slides: 10,
    thumbnail: 'from-green-600 to-teal-600',
    colors: ['#059669', '#14b8a6', '#5eead4'],
    icon: <GraduationCap className="h-5 w-5" />
  },
  {
    id: 'sales-report',
    name: 'Sales Report',
    description: 'Data-driven template for sales presentations',
    category: 'Business',
    slides: 8,
    thumbnail: 'from-orange-500 to-red-600',
    colors: ['#f97316', '#ef4444', '#fca5a5'],
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    id: 'team-intro',
    name: 'Team Introduction',
    description: 'Introduce your team members professionally',
    category: 'Corporate',
    slides: 6,
    thumbnail: 'from-cyan-500 to-blue-600',
    colors: ['#06b6d4', '#3b82f6', '#93c5fd'],
    new: true,
    icon: <Users className="h-5 w-5" />
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Showcase creative work with style',
    category: 'Creative',
    slides: 10,
    thumbnail: 'from-pink-500 to-violet-600',
    colors: ['#ec4899', '#8b5cf6', '#c4b5fd'],
    icon: <Heart className="h-5 w-5" />
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Announce new products with impact',
    category: 'Marketing',
    slides: 12,
    thumbnail: 'from-yellow-500 to-orange-600',
    colors: ['#eab308', '#ea580c', '#fdba74'],
    popular: true,
    icon: <Lightbulb className="h-5 w-5" />
  },
  {
    id: 'quarterly-review',
    name: 'Quarterly Review',
    description: 'Present quarterly results and metrics',
    category: 'Corporate',
    slides: 10,
    thumbnail: 'from-slate-600 to-slate-800',
    colors: ['#475569', '#1e293b', '#94a3b8'],
    icon: <Target className="h-5 w-5" />
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple and elegant minimalist design',
    category: 'Minimal',
    slides: 8,
    thumbnail: 'from-gray-100 to-gray-300',
    colors: ['#f3f4f6', '#d1d5db', '#6b7280'],
    new: true,
    icon: <Star className="h-5 w-5" />
  }
]

const categories = ['All', 'Business', 'Education', 'Corporate', 'Creative', 'Marketing', 'Minimal']

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Template Gallery
            </CardTitle>
            <CardDescription>Choose a template to get started quickly</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {templates.filter(t => t.popular).length} Popular
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {templates.filter(t => t.new).length} New
          </span>
          <span>{filteredTemplates.length} templates</span>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="group relative rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary"
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              onClick={() => onSelectTemplate(template)}
            >
              {/* Thumbnail */}
              <div className={`aspect-[16/10] bg-gradient-to-br ${template.thumbnail} p-4 flex items-center justify-center`}>
                <div className="text-white/80 transform group-hover:scale-110 transition-transform">
                  {template.icon}
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-2 right-2 flex gap-1">
                {template.popular && (
                  <Badge variant="secondary" className="bg-yellow-500/90 text-white text-[10px]">
                    Popular
                  </Badge>
                )}
                {template.new && (
                  <Badge variant="secondary" className="bg-green-500/90 text-white text-[10px]">
                    New
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <span className="text-xs text-muted-foreground">{template.slides} slides</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                
                {/* Color palette */}
                <div className="flex items-center gap-1">
                  {template.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {template.category}
                  </Badge>
                </div>
              </div>

              {/* Hover overlay */}
              {hoveredTemplate === template.id && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                    Use Template
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No templates found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
