/**
 * Component generation utilities for Builder V2
 */

import { searchWeb } from '../utils/web-search'
import { analyzePrompt } from '../utils/prompt-analysis'

interface ExtractedColors {
  isDark: boolean
  background: string
  backgroundAlt: string
  text: string
  textSecondary: string
  border: string
  accent: string
}

/**
 * Generate a placeholder component for missing components
 */
export function generatePlaceholderComponent(componentName: string): string {
  return `function ${componentName}({ children, className = '', ...props }: { children?: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <div className={\`p-4 border border-gray-300 rounded \${className}\`} {...props}>
      {children || <span className="text-gray-500">${componentName} Component</span>}
    </div>
  );
}`;
}

/**
 * Inject missing component definitions into code
 */
export function injectMissingComponents(code: string): string {
  const usedComponents = new Set<string>();
  let match;
  
  // Pattern 1: Self-closing tags
  const selfClosingRegex = /<([A-Z][a-zA-Z0-9]*)[^>]*\/>/g;
  while ((match = selfClosingRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Pattern 2: Components with children
  const componentWithChildrenRegex = /<([A-Z][a-zA-Z0-9]*)[^>]*>[\s\S]*?<\/\1>/g;
  while ((match = componentWithChildrenRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Pattern 3: Opening tags
  const openingTagRegex = /<([A-Z][a-zA-Z0-9]*)\s+[^>]*[^\/]>/g;
  while ((match = openingTagRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Find defined components
  const definedComponents = new Set<string>();
  const functionDefRegex = /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
  while ((match = functionDefRegex.exec(code)) !== null) {
    definedComponents.add(match[1]);
  }
  const constDefRegex = /const\s+([A-Z][a-zA-Z0-9]*)\s*=/g;
  while ((match = constDefRegex.exec(code)) !== null) {
    definedComponents.add(match[1]);
  }
  
  // Check for Lucide icon imports
  const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  const lucideIcons = new Set<string>();
  while ((match = lucideImportRegex.exec(code)) !== null) {
    match[1].split(',').forEach(icon => {
      lucideIcons.add(icon.trim());
    });
  }
  
  // Find missing components
  const missingComponents: string[] = [];
  usedComponents.forEach(comp => {
    const skipList = ['React', 'Fragment', 'Suspense', 'ErrorBoundary'];
    if (!definedComponents.has(comp) && !skipList.includes(comp) && !lucideIcons.has(comp)) {
      missingComponents.push(comp);
    }
  });
  
  if (missingComponents.length === 0) {
    return code;
  }
  
  console.log("Injecting missing components:", missingComponents);
  
  const placeholders = missingComponents.map(comp => generatePlaceholderComponent(comp)).join('\n\n');
  
  // Find best place to inject
  const importEndMatch = code.match(/^(import[\s\S]*?(?:\n\n|\n(?=[^i])))/m);
  if (importEndMatch) {
    const importSection = importEndMatch[0];
    const restOfCode = code.slice(importSection.length);
    return importSection + '\n' + placeholders + '\n\n' + restOfCode;
  }
  
  return placeholders + '\n\n' + code;
}

/**
 * Extract colors from design analysis
 */
export function extractColors(analysis: string): ExtractedColors {
  const colors: ExtractedColors = {
    isDark: false,
    background: '#ffffff',
    backgroundAlt: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    accent: '#3b82f6'
  };
  
  console.log('🎨 Analyzing colors from reference (fully dynamic, no hardcode)...');
  
  const hexMatches = analysis.match(/#[0-9a-fA-F]{6}/g) || [];
  const uniqueColors = [...new Set(hexMatches.map(c => c.toLowerCase()))];
  
  console.log('🎨 Found colors in analysis:', uniqueColors.slice(0, 10));
  
  if (uniqueColors.length === 0) {
    const analysisLower = analysis.toLowerCase();
    if (analysisLower.includes('dark theme') || 
        analysisLower.includes('dark mode') || 
        analysisLower.includes('dark background') ||
        analysisLower.includes('black background')) {
      console.log('🎨 Detected dark theme from keywords');
      colors.isDark = true;
      colors.background = '#0f0f0f';
      colors.backgroundAlt = '#1a1a1a';
      colors.text = '#f1f1f1';
      colors.textSecondary = '#a0a0a0';
      colors.border = '#333333';
    }
    return colors;
  }
  
  // Analyze color brightness
  const colorData = uniqueColors.map(hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return { hex, brightness, saturation, r, g, b };
  });
  
  const sortedByBrightness = [...colorData].sort((a, b) => a.brightness - b.brightness);
  const veryDarkColors = colorData.filter(c => c.brightness < 30);
  const veryLightColors = colorData.filter(c => c.brightness > 220);
  
  const analysisLower = analysis.toLowerCase();
  const hasDarkKeywords = analysisLower.includes('dark') || 
                          analysisLower.includes('#0f0f0f') || 
                          analysisLower.includes('#000000') ||
                          analysisLower.includes('#121212') ||
                          analysisLower.includes('#0d1117');
  
  if (veryDarkColors.length >= 2 || hasDarkKeywords) {
    console.log('🎨 Detected DARK theme from color analysis');
    colors.isDark = true;
    colors.background = sortedByBrightness[0]?.hex || '#0f0f0f';
    
    const altBgCandidates = colorData.filter(c => c.brightness > 15 && c.brightness < 60);
    colors.backgroundAlt = altBgCandidates[0]?.hex || '#1a1a1a';
    colors.text = sortedByBrightness[sortedByBrightness.length - 1]?.hex || '#f1f1f1';
    
    const secondaryTextCandidates = colorData.filter(c => c.brightness > 100 && c.brightness < 200);
    colors.textSecondary = secondaryTextCandidates[0]?.hex || '#aaaaaa';
    
    const borderCandidates = colorData.filter(c => c.brightness > 30 && c.brightness < 80);
    colors.border = borderCandidates[0]?.hex || '#333333';
    
    const accentCandidates = colorData.filter(c => c.saturation > 0.4).sort((a, b) => b.saturation - a.saturation);
    colors.accent = accentCandidates[0]?.hex || '#3b82f6';
  } else if (veryLightColors.length >= 2) {
    console.log('🎨 Detected LIGHT theme from color analysis');
    colors.isDark = false;
    colors.background = sortedByBrightness[sortedByBrightness.length - 1]?.hex || '#ffffff';
    
    const altBgCandidates = colorData.filter(c => c.brightness > 200 && c.brightness < 250);
    colors.backgroundAlt = altBgCandidates[0]?.hex || '#f3f4f6';
    colors.text = sortedByBrightness[0]?.hex || '#111827';
    
    const secondaryTextCandidates = colorData.filter(c => c.brightness > 80 && c.brightness < 150);
    colors.textSecondary = secondaryTextCandidates[0]?.hex || '#6b7280';
    
    const borderCandidates = colorData.filter(c => c.brightness > 180 && c.brightness < 230);
    colors.border = borderCandidates[0]?.hex || '#e5e7eb';
    
    const accentCandidates = colorData.filter(c => c.saturation > 0.4).sort((a, b) => b.saturation - a.saturation);
    colors.accent = accentCandidates[0]?.hex || '#3b82f6';
  }
  
  console.log('🎨 Extracted colors (fully dynamic):', colors);
  return colors;
}

/**
 * Apply dynamic color replacement for dark themes
 */
export function applyDynamicColorReplacement(code: string, colors: ExtractedColors): string {
  if (!colors.isDark) {
    return code;
  }
  
  console.log('🎨 Applying dynamic color replacement for dark theme...');
  
  let replaced = code;
  
  // Replace common light theme colors with dark equivalents
  const replacements: Record<string, string> = {
    '#ffffff': colors.background,
    '#fff': colors.background,
    'bg-white': `bg-[${colors.background}]`,
    'text-gray-900': `text-[${colors.text}]`,
    'text-black': `text-[${colors.text}]`,
    '#f3f4f6': colors.backgroundAlt,
    '#f9fafb': colors.backgroundAlt,
    'bg-gray-50': `bg-[${colors.backgroundAlt}]`,
    'bg-gray-100': `bg-[${colors.backgroundAlt}]`,
    '#e5e7eb': colors.border,
    'border-gray-200': `border-[${colors.border}]`,
    'border-gray-300': `border-[${colors.border}]`,
    '#6b7280': colors.textSecondary,
    'text-gray-600': `text-[${colors.textSecondary}]`,
    'text-gray-500': `text-[${colors.textSecondary}]`
  };
  
  for (const [oldColor, newColor] of Object.entries(replacements)) {
    replaced = replaced.replace(new RegExp(oldColor, 'g'), newColor);
  }
  
  return replaced;
}
