'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, Type, Image, Save, Plus, Trash2, Upload, Check, X } from 'lucide-react'

interface BrandColor {
  id: string
  name: string
  hex: string
}

interface BrandFont {
  id: string
  name: string
  family: string
  weight: string
  usage: 'heading' | 'body' | 'accent'
}

interface BrandAsset {
  id: string
  name: string
  type: 'logo' | 'icon' | 'background'
  url: string
}

interface BrandKit {
  id: string
  name: string
  colors: BrandColor[]
  fonts: BrandFont[]
  assets: BrandAsset[]
}

interface BrandKitManagerProps {
  onApplyBrandKit?: (brandKit: BrandKit) => void
  onClose?: () => void
}

const defaultBrandKit: BrandKit = {
  id: 'default',
  name: 'My Brand Kit',
  colors: [
    { id: '1', name: 'Primary', hex: '#6366f1' },
    { id: '2', name: 'Secondary', hex: '#8b5cf6' },
    { id: '3', name: 'Accent', hex: '#ec4899' },
    { id: '4', name: 'Background', hex: '#1e1b4b' },
    { id: '5', name: 'Text', hex: '#ffffff' }
  ],
  fonts: [
    { id: '1', name: 'Heading Font', family: 'Inter', weight: '700', usage: 'heading' },
    { id: '2', name: 'Body Font', family: 'Inter', weight: '400', usage: 'body' },
    { id: '3', name: 'Accent Font', family: 'Poppins', weight: '600', usage: 'accent' }
  ],
  assets: [
    { id: '1', name: 'Company Logo', type: 'logo', url: '/placeholder-logo.png' }
  ]
}

const fontOptions = [
  'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
  'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Raleway'
]

const weightOptions = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' }
]

export function BrandKitManager({ onApplyBrandKit, onClose }: BrandKitManagerProps) {
  const [brandKit, setBrandKit] = useState<BrandKit>(defaultBrandKit)
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const updateColor = (id: string, field: 'name' | 'hex', value: string) => {
    setBrandKit(prev => ({
      ...prev,
      colors: prev.colors.map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
    setHasChanges(true)
  }

  const addColor = () => {
    const newColor: BrandColor = {
      id: Date.now().toString(),
      name: 'New Color',
      hex: '#000000'
    }
    setBrandKit(prev => ({ ...prev, colors: [...prev.colors, newColor] }))
    setHasChanges(true)
  }

  const removeColor = (id: string) => {
    setBrandKit(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c.id !== id)
    }))
    setHasChanges(true)
  }

  const updateFont = (id: string, field: keyof BrandFont, value: string) => {
    setBrandKit(prev => ({
      ...prev,
      fonts: prev.fonts.map(f => f.id === id ? { ...f, [field]: value } : f)
    }))
    setHasChanges(true)
  }

  const addFont = () => {
    const newFont: BrandFont = {
      id: Date.now().toString(),
      name: 'New Font',
      family: 'Inter',
      weight: '400',
      usage: 'body'
    }
    setBrandKit(prev => ({ ...prev, fonts: [...prev.fonts, newFont] }))
    setHasChanges(true)
  }

  const removeFont = (id: string) => {
    setBrandKit(prev => ({
      ...prev,
      fonts: prev.fonts.filter(f => f.id !== id)
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Saving brand kit:', brandKit)
    setHasChanges(false)
    if (onApplyBrandKit) {
      onApplyBrandKit(brandKit)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Brand Kit Manager
            </CardTitle>
            <CardDescription>Manage your brand colors, fonts, and assets</CardDescription>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="fonts" className="flex items-center gap-1">
              <Type className="h-4 w-4" />
              Fonts
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              Assets
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Brand Colors</Label>
              <Button size="sm" variant="outline" onClick={addColor}>
                <Plus className="h-4 w-4 mr-1" />
                Add Color
              </Button>
            </div>
            
            <div className="grid gap-3">
              {brandKit.colors.map(color => (
                <div key={color.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  {/* Color preview */}
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-white/20 shadow-inner cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setEditingColor(editingColor === color.id ? null : color.id)}
                  />
                  
                  {/* Color details */}
                  <div className="flex-1 space-y-1">
                    <Input
                      value={color.name}
                      onChange={(e) => updateColor(color.id, 'name', e.target.value)}
                      className="h-8 text-sm font-medium"
                      placeholder="Color name"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={color.hex}
                        onChange={(e) => updateColor(color.id, 'hex', e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                      <Input
                        value={color.hex}
                        onChange={(e) => updateColor(color.id, 'hex', e.target.value)}
                        className="h-8 text-xs font-mono uppercase"
                        placeholder="#000000"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeColor(color.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Color palette preview */}
            <div className="mt-4 p-4 rounded-lg border">
              <Label className="text-xs text-muted-foreground mb-2 block">Palette Preview</Label>
              <div className="flex gap-1 h-8 rounded overflow-hidden">
                {brandKit.colors.map(color => (
                  <div
                    key={color.id}
                    className="flex-1 transition-all hover:flex-[2]"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name}: ${color.hex}`}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Fonts Tab */}
          <TabsContent value="fonts" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Brand Fonts</Label>
              <Button size="sm" variant="outline" onClick={addFont}>
                <Plus className="h-4 w-4 mr-1" />
                Add Font
              </Button>
            </div>
            
            <div className="grid gap-3">
              {brandKit.fonts.map(font => (
                <div key={font.id} className="p-3 rounded-lg border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={font.name}
                      onChange={(e) => updateFont(font.id, 'name', e.target.value)}
                      className="h-8 text-sm font-medium max-w-[200px]"
                      placeholder="Font name"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFont(font.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Font Family</Label>
                      <select
                        value={font.family}
                        onChange={(e) => updateFont(font.id, 'family', e.target.value)}
                        className="w-full h-8 text-sm rounded border bg-background px-2"
                      >
                        {fontOptions.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Weight</Label>
                      <select
                        value={font.weight}
                        onChange={(e) => updateFont(font.id, 'weight', e.target.value)}
                        className="w-full h-8 text-sm rounded border bg-background px-2"
                      >
                        {weightOptions.map(w => (
                          <option key={w.value} value={w.value}>{w.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Usage</Label>
                      <select
                        value={font.usage}
                        onChange={(e) => updateFont(font.id, 'usage', e.target.value as 'heading' | 'body' | 'accent')}
                        className="w-full h-8 text-sm rounded border bg-background px-2"
                      >
                        <option value="heading">Heading</option>
                        <option value="body">Body</option>
                        <option value="accent">Accent</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Font preview */}
                  <div 
                    className="p-2 rounded bg-muted/50 text-center"
                    style={{ fontFamily: font.family, fontWeight: font.weight }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Brand Assets</Label>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                Upload Asset
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {brandKit.assets.map(asset => (
                <div key={asset.id} className="p-3 rounded-lg border bg-card">
                  <div className="aspect-video bg-muted rounded flex items-center justify-center mb-2">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Upload placeholder */}
              <div className="p-3 rounded-lg border-2 border-dashed bg-muted/20 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:bg-muted/40 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drop files here</p>
                <p className="text-xs text-muted-foreground">or click to upload</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Apply button */}
        {onApplyBrandKit && (
          <div className="mt-6 pt-4 border-t">
            <Button onClick={() => onApplyBrandKit(brandKit)} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Apply Brand Kit to Presentation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
