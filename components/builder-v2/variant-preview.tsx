"use client";

import React, { useState } from 'react';
import { Check, X, Heart, Copy, Maximize2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DesignVariant {
  id: string;
  name: string;
  description: string;
  code: string;
  style: string;
  thumbnail?: string;
}

interface VariantPreviewProps {
  variants: DesignVariant[];
  onSelect: (variant: DesignVariant) => void;
  onReject?: (variant: DesignVariant) => void;
  onFavorite?: (variant: DesignVariant) => void;
  onCombine?: (variants: DesignVariant[]) => void;
  isLoading?: boolean;
}

export function VariantPreview({
  variants,
  onSelect,
  onReject,
  onFavorite,
  onCombine,
  isLoading = false
}: VariantPreviewProps) {
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const toggleSelection = (variantId: string) => {
    const newSelection = new Set(selectedVariants);
    if (newSelection.has(variantId)) {
      newSelection.delete(variantId);
    } else {
      newSelection.add(variantId);
    }
    setSelectedVariants(newSelection);
  };

  const toggleFavorite = (variant: DesignVariant) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(variant.id)) {
      newFavorites.delete(variant.id);
    } else {
      newFavorites.add(variant.id);
      onFavorite?.(variant);
    }
    setFavorites(newFavorites);
  };

  const handleCombine = () => {
    const selected = variants.filter(v => selectedVariants.has(v.id));
    if (selected.length >= 2) {
      onCombine?.(selected);
    }
  };

  const navigateVariant = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : variants.length - 1));
    } else {
      setCurrentIndex(prev => (prev < variants.length - 1 ? prev + 1 : 0));
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="aspect-[4/3] rounded-xl bg-slate-800/50 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-violet-500/50 mx-auto mb-2 animate-pulse" />
              <div className="text-sm text-slate-500">Generating variant {i}...</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  // Expanded single variant view
  if (expandedVariant) {
    const variant = variants.find(v => v.id === expandedVariant);
    if (!variant) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
        <div className="relative w-full max-w-6xl bg-slate-900 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div>
              <h3 className="text-lg font-semibold text-white">{variant.name}</h3>
              <p className="text-sm text-slate-400">{variant.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(variant)}
                className={cn(favorites.has(variant.id) && "text-pink-500")}
              >
                <Heart className={cn("w-5 h-5", favorites.has(variant.id) && "fill-current")} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setExpandedVariant(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="aspect-video bg-white">
            <iframe
              srcDoc={generatePreviewHtml(variant.code)}
              className="w-full h-full border-0"
              title={variant.name}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigateVariant('prev')}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button variant="outline" onClick={() => navigateVariant('next')}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(variant.code)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <Button
                className="bg-gradient-to-r from-violet-600 to-purple-600"
                onClick={() => {
                  onSelect(variant);
                  setExpandedVariant(null);
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Design
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Design Variants</h3>
          <p className="text-sm text-slate-400">Choose your favorite or combine multiple</p>
        </div>
        {selectedVariants.size >= 2 && onCombine && (
          <Button onClick={handleCombine} variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Combine Selected ({selectedVariants.size})
          </Button>
        )}
      </div>

      {/* Variant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variants.map((variant, index) => (
          <div
            key={variant.id}
            className={cn(
              "group relative rounded-xl border-2 overflow-hidden transition-all",
              selectedVariants.has(variant.id)
                ? "border-violet-500 ring-2 ring-violet-500/20"
                : "border-slate-700 hover:border-slate-600"
            )}
          >
            {/* Selection Checkbox */}
            {onCombine && (
              <button
                onClick={() => toggleSelection(variant.id)}
                className={cn(
                  "absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                  selectedVariants.has(variant.id)
                    ? "bg-violet-600 border-violet-600"
                    : "bg-slate-900/80 border-slate-500 hover:border-violet-500"
                )}
              >
                {selectedVariants.has(variant.id) && <Check className="w-4 h-4 text-white" />}
              </button>
            )}

            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(variant)}
              className={cn(
                "absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                favorites.has(variant.id)
                  ? "bg-pink-500 text-white"
                  : "bg-slate-900/80 text-slate-400 hover:text-pink-500"
              )}
            >
              <Heart className={cn("w-4 h-4", favorites.has(variant.id) && "fill-current")} />
            </button>

            {/* Preview */}
            <div className="aspect-[4/3] bg-white relative overflow-hidden">
              <iframe
                srcDoc={generatePreviewHtml(variant.code)}
                className="w-full h-full border-0 pointer-events-none scale-50 origin-top-left"
                style={{ width: '200%', height: '200%' }}
                title={variant.name}
              />
              
              {/* Expand Button */}
              <button
                onClick={() => setExpandedVariant(variant.id)}
                className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Preview</span>
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="p-4 bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{variant.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {variant.style}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{variant.description}</p>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                  onClick={() => onSelect(variant)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Select
                </Button>
                {onReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(variant)}
                    className="text-slate-400 hover:text-red-400 hover:border-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Carousel Navigation for Mobile */}
      <div className="flex items-center justify-center gap-2 md:hidden">
        {variants.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex ? "bg-violet-500" : "bg-slate-600"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Generate preview HTML for iframe
 */
function generatePreviewHtml(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root">${extractJSXContent(code)}</div>
</body>
</html>
  `;
}

/**
 * Extract JSX content from React component code
 */
function extractJSXContent(code: string): string {
  // Simple extraction - in production would use proper parsing
  const returnMatch = code.match(/return\s*\(([\s\S]*?)\);?\s*\}/);
  if (returnMatch) {
    let jsx = returnMatch[1];
    // Remove React-specific attributes
    jsx = jsx.replace(/className=/g, 'class=');
    jsx = jsx.replace(/\{[^}]+\}/g, ''); // Remove JS expressions
    jsx = jsx.replace(/onClick=[^\s>]+/g, '');
    jsx = jsx.replace(/onChange=[^\s>]+/g, '');
    return jsx;
  }
  return '<div class="p-8 text-center text-gray-500">Preview not available</div>';
}

export default VariantPreview;
